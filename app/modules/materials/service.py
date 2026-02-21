from datetime import datetime
from decimal import Decimal
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.materials.models import Material
from app.modules.materials.schemas import MaterialCreate, MaterialUpdate


async def create_material(db: AsyncSession, tenant_id: UUID, data: MaterialCreate) -> Material:
    material = Material(
        tenant_id=tenant_id,
        name=data.name,
        description=data.description,
        unit=data.unit,
        quantity=data.quantity,
        min_quantity=data.min_quantity,
    )
    db.add(material)
    await db.commit()
    await db.refresh(material)
    return material


async def list_materials(
    db: AsyncSession,
    tenant_id: UUID,
    page: int = 1,
    per_page: int = 20,
    low_stock_only: bool = False,
) -> tuple[list[Material], int]:
    query = select(Material).where(Material.tenant_id == tenant_id)
    count_query = select(func.count()).select_from(Material).where(Material.tenant_id == tenant_id)

    if low_stock_only:
        query = query.where(Material.quantity <= Material.min_quantity)
        count_query = count_query.where(Material.quantity <= Material.min_quantity)

    total = (await db.execute(count_query)).scalar()
    materials = (
        await db.execute(
            query.order_by(Material.name).offset((page - 1) * per_page).limit(per_page)
        )
    ).scalars().all()
    return materials, total


async def get_material(db: AsyncSession, tenant_id: UUID, material_id: UUID) -> Material:
    result = await db.execute(
        select(Material).where(Material.id == material_id, Material.tenant_id == tenant_id)
    )
    material = result.scalar_one_or_none()
    if not material:
        raise HTTPException(status_code=404, detail="Material não encontrado")
    return material


async def update_material(
    db: AsyncSession, tenant_id: UUID, material_id: UUID, data: MaterialUpdate
) -> Material:
    material = await get_material(db, tenant_id, material_id)

    if data.name is not None:
        material.name = data.name
    if data.description is not None:
        material.description = data.description
    if data.unit is not None:
        material.unit = data.unit
    if data.min_quantity is not None:
        material.min_quantity = data.min_quantity

    material.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(material)
    return material


async def adjust_stock(
    db: AsyncSession, tenant_id: UUID, material_id: UUID, delta: Decimal
) -> Material:
    material = await get_material(db, tenant_id, material_id)
    new_qty = material.quantity + delta
    if new_qty < 0:
        raise HTTPException(status_code=422, detail="Estoque não pode ficar negativo")
    material.quantity = new_qty
    material.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(material)
    return material
