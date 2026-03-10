import logging
import secrets
import string
from datetime import datetime, timedelta, timezone
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import func, select, delete
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth.models import AuditLog, Token, TokenType, User, UserRole, UserStatus, user_tenants as user_tenants_table
from app.auth.service import hash_password
from app.config.settings import settings
from app.tenants.models import Tenant
from app.utils.email import send_account_approved, send_approval_code

logger = logging.getLogger(__name__)


async def get_user_by_id(db: AsyncSession, user_id: UUID) -> User:
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    return user


async def list_pending_users(db: AsyncSession, admin: User) -> list[User]:
    query = select(User).where(User.status == UserStatus.PENDING, User.is_active == True)

    if admin.role != UserRole.MASTER:
        tenant_ids = [t.id for t in admin.tenants]
        if tenant_ids:
            # Filtrar pela tabela N:N (user_tenants) para capturar todos os vínculos,
            # não apenas o tenant_id primário do usuário.
            member_ids = select(user_tenants_table.c.user_id).where(
                user_tenants_table.c.tenant_id.in_(tenant_ids)
            )
            query = query.where(User.id.in_(member_ids))
        else:
            return []

    result = await db.execute(query.order_by(User.created_at))
    return result.scalars().all()


async def list_users(
    db: AsyncSession,
    admin: User,
    role: UserRole | None = None,
    user_status: UserStatus | None = None,
    page: int = 1,
    per_page: int = 20,
) -> tuple[list[User], int]:
    query = select(User).where(User.is_active == True)
    count_query = select(func.count()).select_from(User).where(User.is_active == True)

    # MASTER vê todos; demais roles filtram pela tabela N:N (user_tenants)
    # para garantir que usuários com tenant secundário também sejam visíveis.
    if admin.role != UserRole.MASTER:
        tenant_ids = [t.id for t in admin.tenants]
        if tenant_ids:
            member_ids = select(user_tenants_table.c.user_id).where(
                user_tenants_table.c.tenant_id.in_(tenant_ids)
            )
            query = query.where(User.id.in_(member_ids))
            count_query = count_query.where(User.id.in_(member_ids))
        else:
            return [], 0

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
        expires_at=datetime.utcnow() + timedelta(minutes=15),
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


async def change_user_password(db: AsyncSession, user_id: UUID, new_password: str, admin: User) -> User:
    user = await get_user_by_id(db, user_id)
    if user.role == UserRole.MASTER and admin.role != UserRole.MASTER:
        raise HTTPException(status_code=403, detail="Apenas MASTER pode alterar a senha de outro MASTER")

    user.password_hash = hash_password(new_password)
    user.updated_at = datetime.utcnow()
    db.add(AuditLog(user_id=admin.id, action="CHANGE_PASSWORD", details={"target": str(user_id)}))
    await db.commit()
    await db.refresh(user)
    return user


async def change_user_tenant(db: AsyncSession, user_id: UUID, tenant_id: UUID | None, admin: User) -> User:
    user = await get_user_by_id(db, user_id)

    if tenant_id is not None:
        result = await db.execute(select(Tenant).where(Tenant.id == tenant_id))
        tenant = result.scalar_one_or_none()
        if not tenant:
            raise HTTPException(status_code=404, detail="Empresa não encontrada")
        # Sync to user_tenants N:N table
        await db.execute(
            pg_insert(user_tenants_table)
            .values(user_id=user_id, tenant_id=tenant_id)
            .on_conflict_do_nothing()
        )
    else:
        # Clear all N:N associations when removing primary tenant
        await db.execute(
            delete(user_tenants_table).where(user_tenants_table.c.user_id == user_id)
        )

    user.tenant_id = tenant_id
    user.updated_at = datetime.utcnow()
    db.add(AuditLog(
        user_id=admin.id,
        action="CHANGE_TENANT",
        details={"target": str(user_id), "tenant_id": str(tenant_id) if tenant_id else None},
    ))
    await db.commit()
    await db.refresh(user)
    return user


async def get_user_tenants(db: AsyncSession, user_id: UUID) -> list[Tenant]:
    result = await db.execute(
        select(User).where(User.id == user_id).options(selectinload(User.tenants))
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    return user.tenants


async def add_user_to_tenant(db: AsyncSession, user_id: UUID, tenant_id: UUID, admin: User) -> None:
    user = await get_user_by_id(db, user_id)
    result = await db.execute(select(Tenant).where(Tenant.id == tenant_id))
    tenant = result.scalar_one_or_none()
    if not tenant:
        raise HTTPException(status_code=404, detail="Empresa não encontrada")

    await db.execute(
        pg_insert(user_tenants_table)
        .values(user_id=user_id, tenant_id=tenant_id)
        .on_conflict_do_nothing()
    )
    # Set as primary if the user has no primary tenant yet
    if user.tenant_id is None:
        user.tenant_id = tenant_id
        user.updated_at = datetime.utcnow()

    db.add(AuditLog(
        user_id=admin.id,
        action="ADD_USER_TENANT",
        details={"target": str(user_id), "tenant_id": str(tenant_id)},
    ))
    await db.commit()


async def remove_user_from_tenant(db: AsyncSession, user_id: UUID, tenant_id: UUID, admin: User) -> None:
    user = await get_user_by_id(db, user_id)

    await db.execute(
        delete(user_tenants_table).where(
            user_tenants_table.c.user_id == user_id,
            user_tenants_table.c.tenant_id == tenant_id,
        )
    )
    # If primary tenant was removed, clear users.tenant_id
    if user.tenant_id == tenant_id:
        user.tenant_id = None
        user.updated_at = datetime.utcnow()

    db.add(AuditLog(
        user_id=admin.id,
        action="REMOVE_USER_TENANT",
        details={"target": str(user_id), "tenant_id": str(tenant_id)},
    ))
    await db.commit()
