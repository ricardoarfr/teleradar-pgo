from datetime import datetime
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.tenants.models import Tenant, TenantStatus
from app.tenants.schemas import TenantCreate, TenantUpdate


async def create_tenant(db: AsyncSession, data: TenantCreate) -> Tenant:
    tenant = Tenant(name=data.name)
    db.add(tenant)
    await db.commit()
    await db.refresh(tenant)
    return tenant


async def list_tenants(db: AsyncSession, page: int = 1, per_page: int = 20) -> tuple[list[Tenant], int]:
    from sqlalchemy import func
    total = (await db.execute(select(func.count()).select_from(Tenant))).scalar()
    tenants = (await db.execute(
        select(Tenant).order_by(Tenant.name).offset((page - 1) * per_page).limit(per_page)
    )).scalars().all()
    return tenants, total


async def get_tenant(db: AsyncSession, tenant_id: UUID) -> Tenant:
    result = await db.execute(select(Tenant).where(Tenant.id == tenant_id))
    tenant = result.scalar_one_or_none()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant não encontrado")
    return tenant


async def update_tenant(db: AsyncSession, tenant_id: UUID, data: TenantUpdate) -> Tenant:
    tenant = await get_tenant(db, tenant_id)
    if data.name is not None:
        tenant.name = data.name
    if data.status is not None:
        tenant.status = data.status
    tenant.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(tenant)
    return tenant
