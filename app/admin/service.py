import logging
import secrets
import string
from datetime import datetime, timedelta, timezone
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import AuditLog, Token, TokenType, User, UserRole, UserStatus
from app.config.settings import settings
from app.utils.email import send_account_approved, send_approval_code

logger = logging.getLogger(__name__)


async def get_user_by_id(db: AsyncSession, user_id: UUID) -> User:
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    return user


async def list_pending_users(db: AsyncSession) -> list[User]:
    result = await db.execute(
        select(User).where(User.status == UserStatus.PENDING, User.is_active == True).order_by(User.created_at)
    )
    return result.scalars().all()


async def list_users(
    db: AsyncSession,
    role: UserRole | None = None,
    user_status: UserStatus | None = None,
    page: int = 1,
    per_page: int = 20,
) -> tuple[list[User], int]:
    query = select(User).where(User.is_active == True)
    count_query = select(func.count()).select_from(User).where(User.is_active == True)

    if role:
        query = query.where(User.role == role)
        count_query = count_query.where(User.role == role)
    if user_status:
        query = query.where(User.status == user_status)
        count_query = count_query.where(User.status == user_status)

    total = (await db.execute(count_query)).scalar()
    users = (await db.execute(
        query.order_by(User.created_at.desc()).offset((page - 1) * per_page).limit(per_page)
    )).scalars().all()
    return users, total


async def initiate_approval(db: AsyncSession, user_id: UUID, admin: User) -> None:
    user = await get_user_by_id(db, user_id)
    if user.status != UserStatus.PENDING:
        raise HTTPException(status_code=400, detail="Usuário não está pendente")

    code = "".join(secrets.choice(string.digits) for _ in range(6))
    db.add(Token(
        user_id=user.id,
        type=TokenType.APPROVAL_CODE,
        token=f"approval:{user_id}:{code}",
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=15),
    ))
    await db.commit()

    if settings.ADMIN_MASTER_EMAIL:
        try:
            await send_approval_code(settings.ADMIN_MASTER_EMAIL, code, user.name)
        except Exception as exc:
            logger.error("Falha ao enviar código: %s", exc)


async def confirm_approval(db: AsyncSession, user_id: UUID, code: str, admin: User) -> User:
    token_value = f"approval:{user_id}:{code}"
    result = await db.execute(
        select(Token).where(Token.token == token_value, Token.type == TokenType.APPROVAL_CODE, Token.used == False)
    )
    token_obj = result.scalar_one_or_none()
    if not token_obj:
        raise HTTPException(status_code=400, detail="Código inválido")
    if token_obj.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Código expirado")

    token_obj.used = True
    user = await get_user_by_id(db, user_id)
    user.status = UserStatus.APPROVED
    user.updated_at = datetime.utcnow()

    db.add(AuditLog(user_id=admin.id, action="APPROVE_USER", details={"approved_user_id": str(user_id)}))
    await db.commit()
    await db.refresh(user)

    try:
        await send_account_approved(user.email, user.name)
    except Exception as exc:
        logger.warning("Falha ao notificar usuário aprovado: %s", exc)

    return user


async def block_user(db: AsyncSession, user_id: UUID, admin: User, reason: str | None = None) -> User:
    user = await get_user_by_id(db, user_id)
    if user.role == UserRole.MASTER:
        raise HTTPException(status_code=403, detail="Não é possível bloquear o MASTER")
    if admin.role == UserRole.ADMIN and user.role == UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="ADMIN não pode bloquear outro ADMIN")

    user.status = UserStatus.BLOCKED
    user.updated_at = datetime.utcnow()
    db.add(AuditLog(user_id=admin.id, action="BLOCK_USER", details={"blocked_user_id": str(user_id), "reason": reason}))
    await db.commit()
    await db.refresh(user)
    return user


async def unblock_user(db: AsyncSession, user_id: UUID, admin: User) -> User:
    user = await get_user_by_id(db, user_id)
    user.status = UserStatus.APPROVED
    user.login_attempts = 0
    user.locked_until = None
    user.updated_at = datetime.utcnow()
    db.add(AuditLog(user_id=admin.id, action="UNBLOCK_USER", details={"unblocked_user_id": str(user_id)}))
    await db.commit()
    await db.refresh(user)
    return user


async def change_user_role(db: AsyncSession, user_id: UUID, new_role: UserRole, admin: User) -> User:
    if new_role == UserRole.MASTER:
        raise HTTPException(status_code=403, detail="Não é possível promover a MASTER via API")
    if new_role == UserRole.ADMIN and admin.role != UserRole.MASTER:
        raise HTTPException(status_code=403, detail="Apenas MASTER pode promover a ADMIN")

    user = await get_user_by_id(db, user_id)
    user.role = new_role
    user.updated_at = datetime.utcnow()
    db.add(AuditLog(user_id=admin.id, action="CHANGE_ROLE", details={"target": str(user_id), "new_role": new_role.value}))
    await db.commit()
    await db.refresh(user)
    return user
