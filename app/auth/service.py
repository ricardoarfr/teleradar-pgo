import secrets
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional
from uuid import UUID

from fastapi import HTTPException, Request, status
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.jwt import create_access_token, create_refresh_token, decode_token
from app.auth.models import AuditLog, Token, TokenType, User, UserRole, UserStatus
from app.auth.schemas import MasterBootstrap, UserLogin, UserRegister
from app.config.settings import settings
from app.utils.email import (
    send_account_approved,
    send_approval_notification,
    send_password_reset,
)

logger = logging.getLogger(__name__)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=12)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


async def _log(
    db: AsyncSession,
    action: str,
    user_id: Optional[UUID] = None,
    request: Optional[Request] = None,
    details: Optional[dict] = None,
) -> None:
    log = AuditLog(
        user_id=user_id,
        action=action,
        ip=request.client.host if request and request.client else None,
        user_agent=request.headers.get("user-agent") if request else None,
        details=details,
    )
    db.add(log)


async def register_user(db: AsyncSession, data: UserRegister, request: Request) -> User:
    existing = await db.execute(select(User).where(User.email == data.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="E-mail já cadastrado")

    user = User(
        name=data.name,
        email=data.email,
        password_hash=hash_password(data.password),
        role=UserRole.STAFF,
        status=UserStatus.PENDING,
    )
    db.add(user)
    await db.flush()
    await _log(db, "REGISTER", user.id, request, {"method": "email"})
    await db.commit()
    await db.refresh(user)

    if settings.ADMIN_MASTER_EMAIL:
        try:
            await send_approval_notification(settings.ADMIN_MASTER_EMAIL, user.name, user.email)
        except Exception as exc:
            logger.warning("Falha ao notificar admin: %s", exc)

    return user


async def login_user(db: AsyncSession, data: UserLogin, request: Request) -> dict:
    result = await db.execute(select(User).where(User.email == data.email, User.is_active == True))
    user = result.scalar_one_or_none()

    if not user or not user.password_hash:
        await _log(db, "LOGIN_FAILED", None, request, {"email": data.email})
        await db.commit()
        raise HTTPException(status_code=401, detail="Credenciais inválidas")

    now = datetime.now(timezone.utc)

    if user.locked_until and user.locked_until.replace(tzinfo=timezone.utc) > now:
        raise HTTPException(status_code=429, detail=f"Conta bloqueada até {user.locked_until.isoformat()}")

    if not verify_password(data.password, user.password_hash):
        user.login_attempts += 1
        if user.login_attempts >= settings.MAX_LOGIN_ATTEMPTS:
            user.locked_until = datetime.utcnow() + timedelta(minutes=settings.LOCK_DURATION_MINUTES)
            await _log(db, "ACCOUNT_LOCKED", user.id, request)
        await db.commit()
        raise HTTPException(status_code=401, detail="Credenciais inválidas")

    if user.status != UserStatus.APPROVED:
        await _log(db, "LOGIN_BLOCKED", user.id, request, {"status": user.status.value})
        await db.commit()
        raise HTTPException(status_code=403, detail="Conta aguardando aprovação ou bloqueada")

    user.login_attempts = 0
    user.locked_until = None

    token_payload = {
        "sub": str(user.id),
        "role": user.role.value,
        "tenant_id": str(user.tenant_id) if user.tenant_id else None,
    }
    access_token = create_access_token(token_payload)
    refresh_token_str = create_refresh_token(token_payload)

    db.add(Token(
        user_id=user.id,
        type=TokenType.REFRESH,
        token=refresh_token_str,
        expires_at=datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
    ))
    await _log(db, "LOGIN", user.id, request)
    await db.commit()

    return {"access_token": access_token, "refresh_token": refresh_token_str, "token_type": "bearer"}


async def refresh_tokens(db: AsyncSession, refresh_token_str: str) -> dict:
    result = await db.execute(
        select(Token).where(Token.token == refresh_token_str, Token.type == TokenType.REFRESH, Token.used == False)
    )
    token_obj = result.scalar_one_or_none()

    if not token_obj:
        raise HTTPException(status_code=401, detail="Refresh token inválido")

    now = datetime.now(timezone.utc)
    if token_obj.expires_at.replace(tzinfo=timezone.utc) < now:
        raise HTTPException(status_code=401, detail="Refresh token expirado")

    payload = decode_token(refresh_token_str)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Token inválido")

    token_obj.used = True

    user_result = await db.execute(select(User).where(User.id == payload["sub"]))
    user = user_result.scalar_one_or_none()
    if not user or user.status != UserStatus.APPROVED:
        raise HTTPException(status_code=401, detail="Usuário inativo")

    token_payload = {
        "sub": str(user.id),
        "role": user.role.value,
        "tenant_id": str(user.tenant_id) if user.tenant_id else None,
    }
    new_access = create_access_token(token_payload)
    new_refresh = create_refresh_token(token_payload)

    db.add(Token(
        user_id=user.id,
        type=TokenType.REFRESH,
        token=new_refresh,
        expires_at=datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
    ))
    await db.commit()
    return {"access_token": new_access, "refresh_token": new_refresh, "token_type": "bearer"}


async def logout_user(db: AsyncSession, refresh_token_str: str, user: User, request: Request) -> None:
    result = await db.execute(select(Token).where(Token.token == refresh_token_str, Token.user_id == user.id))
    token_obj = result.scalar_one_or_none()
    if token_obj:
        token_obj.used = True
    await _log(db, "LOGOUT", user.id, request)
    await db.commit()


async def forgot_password(db: AsyncSession, email: str) -> None:
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user:
        return  # Silencioso — não revelar se e-mail existe

    reset_token = secrets.token_urlsafe(32)
    db.add(Token(
        user_id=user.id,
        type=TokenType.RESET_PASSWORD,
        token=reset_token,
        expires_at=datetime.utcnow() + timedelta(minutes=15),
    ))
    await db.commit()

    try:
        await send_password_reset(user.email, user.name, reset_token)
    except Exception as exc:
        logger.error("Falha ao enviar e-mail de reset: %s", exc)


async def reset_password(db: AsyncSession, token_str: str, new_password: str) -> None:
    result = await db.execute(
        select(Token).where(Token.token == token_str, Token.type == TokenType.RESET_PASSWORD, Token.used == False)
    )
    token_obj = result.scalar_one_or_none()
    if not token_obj:
        raise HTTPException(status_code=400, detail="Token inválido")

    if token_obj.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Token expirado")

    token_obj.used = True
    user_result = await db.execute(select(User).where(User.id == token_obj.user_id))
    user = user_result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    user.password_hash = hash_password(new_password)
    user.updated_at = datetime.utcnow()
    await db.commit()


async def change_password(db: AsyncSession, user: User, current_password: str, new_password: str) -> None:
    if not user.password_hash or not verify_password(current_password, user.password_hash):
        raise HTTPException(status_code=400, detail="Senha atual incorreta")
    user.password_hash = hash_password(new_password)
    user.updated_at = datetime.utcnow()
    await db.commit()


async def bootstrap_master(db: AsyncSession, data: MasterBootstrap, request: Request) -> User:
    if not settings.BOOTSTRAP_SECRET:
        raise HTTPException(status_code=403, detail="Bootstrap desabilitado — configure BOOTSTRAP_SECRET no .env")

    if data.bootstrap_secret != settings.BOOTSTRAP_SECRET:
        raise HTTPException(status_code=401, detail="Bootstrap secret inválido")

    master_exists = await db.execute(select(User).where(User.role == UserRole.MASTER))
    if master_exists.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="Sistema já inicializado — MASTER já existe")

    existing = await db.execute(select(User).where(User.email == data.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="E-mail já cadastrado")

    master = User(
        name=data.name,
        email=data.email,
        password_hash=hash_password(data.password),
        role=UserRole.MASTER,
        status=UserStatus.APPROVED,
    )
    db.add(master)
    await db.flush()
    await _log(db, "MASTER_BOOTSTRAP", master.id, request)
    await db.commit()
    await db.refresh(master)

    logger.info("MASTER criado com sucesso: %s", master.email)
    return master
