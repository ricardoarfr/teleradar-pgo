import logging
from datetime import datetime
from uuid import UUID

from fastapi import HTTPException
from passlib.context import CryptContext
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth.models import AuditLog, User, UserRole, UserStatus
from app.modules.partners.models import PartnerProfile
from app.modules.partners.schemas import PartnerCreate, PartnerUpdate

logger = logging.getLogger(__name__)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=12)


async def create_partner(db: AsyncSession, data: PartnerCreate, admin: User) -> User:
    if admin.role == UserRole.ADMIN:
        if admin.tenant_id is None:
            raise HTTPException(status_code=400, detail="Administrador sem tenant associado")
        if data.tenant_id != admin.tenant_id:
            raise HTTPException(status_code=403, detail="ADMIN só pode criar parceiros no próprio tenant")

    existing = await db.execute(select(User).where(User.email == data.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="E-mail já cadastrado")

    user = User(
        name=data.name,
        email=data.email,
        password_hash=pwd_context.hash(data.password),
        role=UserRole.PARTNER,
        status=UserStatus.APPROVED,
        tenant_id=data.tenant_id,
        is_active=True,
    )
    db.add(user)
    await db.flush()

    profile = PartnerProfile(
        user_id=user.id,
        tenant_id=data.tenant_id,
        person_type=data.person_type,
        cpf_cnpj=data.cpf_cnpj,
        phone=data.phone,
        address_street=data.address_street,
        address_number=data.address_number,
        address_complement=data.address_complement,
        address_neighborhood=data.address_neighborhood,
        address_city=data.address_city,
        address_state=data.address_state,
        address_cep=data.address_cep,
        notes=data.notes,
    )
    db.add(profile)

    db.add(AuditLog(
        user_id=admin.id,
        action="CREATE_PARTNER",
        details={"partner_email": data.email, "tenant_id": str(data.tenant_id)},
    ))
    await db.commit()
    await db.refresh(user)
    return user


async def list_partners(
    db: AsyncSession,
    admin: User,
    page: int = 1,
    per_page: int = 20,
    search: str | None = None,
    status: UserStatus | None = None,
) -> tuple[list[User], int]:
    query = (
        select(User)
        .options(selectinload(User.partner_profile))
        .where(User.role == UserRole.PARTNER, User.is_active == True)
    )
    count_query = (
        select(func.count())
        .select_from(User)
        .where(User.role == UserRole.PARTNER, User.is_active == True)
    )

    if admin.role == UserRole.ADMIN and admin.tenant_id:
        query = query.where(User.tenant_id == admin.tenant_id)
        count_query = count_query.where(User.tenant_id == admin.tenant_id)

    if status:
        query = query.where(User.status == status)
        count_query = count_query.where(User.status == status)

    if search:
        like = f"%{search}%"
        query = query.where(User.name.ilike(like) | User.email.ilike(like))
        count_query = count_query.where(User.name.ilike(like) | User.email.ilike(like))

    total = (await db.execute(count_query)).scalar()
    users = (await db.execute(
        query.order_by(User.created_at.desc()).offset((page - 1) * per_page).limit(per_page)
    )).scalars().all()

    return users, total


async def get_partner(db: AsyncSession, partner_id: UUID, admin: User) -> User:
    result = await db.execute(
        select(User)
        .options(selectinload(User.partner_profile))
        .where(User.id == partner_id, User.role == UserRole.PARTNER)
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Parceiro não encontrado")

    if admin.role == UserRole.ADMIN and admin.tenant_id and user.tenant_id != admin.tenant_id:
        raise HTTPException(status_code=403, detail="Acesso negado")

    return user


async def update_partner(db: AsyncSession, partner_id: UUID, data: PartnerUpdate, admin: User) -> User:
    user = await get_partner(db, partner_id, admin)

    if data.name is not None:
        user.name = data.name
        user.updated_at = datetime.utcnow()

    profile = user.partner_profile
    if profile is None:
        profile = PartnerProfile(user_id=user.id, tenant_id=user.tenant_id)
        db.add(profile)

    update_fields = {
        "person_type", "cpf_cnpj", "phone", "address_street", "address_number",
        "address_complement", "address_neighborhood", "address_city",
        "address_state", "address_cep", "notes",
    }
    for field in update_fields:
        value = getattr(data, field)
        if value is not None:
            setattr(profile, field, value)

    profile.updated_at = datetime.utcnow()

    db.add(AuditLog(
        user_id=admin.id,
        action="UPDATE_PARTNER",
        details={"partner_id": str(partner_id)},
    ))
    await db.commit()
    await db.refresh(user)
    return user


async def block_partner(db: AsyncSession, partner_id: UUID, admin: User, reason: str | None = None) -> User:
    user = await get_partner(db, partner_id, admin)
    user.status = UserStatus.BLOCKED
    user.updated_at = datetime.utcnow()
    db.add(AuditLog(
        user_id=admin.id,
        action="BLOCK_PARTNER",
        details={"partner_id": str(partner_id), "reason": reason},
    ))
    await db.commit()
    await db.refresh(user)
    return user


async def unblock_partner(db: AsyncSession, partner_id: UUID, admin: User) -> User:
    user = await get_partner(db, partner_id, admin)
    user.status = UserStatus.APPROVED
    user.login_attempts = 0
    user.locked_until = None
    user.updated_at = datetime.utcnow()
    db.add(AuditLog(
        user_id=admin.id,
        action="UNBLOCK_PARTNER",
        details={"partner_id": str(partner_id)},
    ))
    await db.commit()
    await db.refresh(user)
    return user
