from typing import Optional
from datetime import datetime
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.modules.catalogo.materiais.models import Material
from app.modules.catalogo.materiais.schemas import MaterialCreate, MaterialUpdate
from app.modules.catalogo.lpu.models import Unidade # Para validar a FK da Unidade

# ===========================================================================
# MATERIAL
# ===========================================================================

async def create_material(db: AsyncSession, data: MaterialCreate) -> Material:
    # Verifica unicidade do código
    existing = (await db.execute(
        select(Material).where(Material.codigo == data.codigo)
    )).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=409, detail="Material com este código já existe.")

    # Valida FK: unidade deve existir
    unidade = (await db.execute(
        select(Unidade).where(Unidade.id == data.unidade_id)
    )).scalar_one_or_none()
    if not unidade:
        raise HTTPException(status_code=404, detail="Unidade não encontrada.")

    material = Material(
        codigo=data.codigo,
        descricao=data.descricao,
        unidade_id=data.unidade_id,
        ativo=data.ativo,
    )
    db.add(material)
    await db.commit()
    await db.refresh(material)
    return material


async def list_materiais(
    db: AsyncSession,
    page: int = 1,
    per_page: int = 20,
    ativo: Optional[bool] = None,
    unidade_id: Optional[UUID] = None,
) -> tuple[list[Material], int]:
    query = select(Material).options(
        selectinload(Material.unidade),
    )
    count_query = select(func.count()).select_from(Material)

    if ativo is not None:
        query = query.where(Material.ativo == ativo)
        count_query = count_query.where(Material.ativo == ativo)
    if unidade_id is not None:
        query = query.where(Material.unidade_id == unidade_id)
        count_query = count_query.where(Material.unidade_id == unidade_id)

    total = (await db.execute(count_query)).scalar()
    materiais = (
        await db.execute(
            query.order_by(Material.codigo).offset((page - 1) * per_page).limit(per_page)
        )
    ).scalars().all()
    return materiais, total


async def get_material(db: AsyncSession, material_id: UUID) -> Material:
    result = await db.execute(
        select(Material)
        .where(Material.id == material_id)
        .options(selectinload(Material.unidade))
    )
    material = result.scalar_one_or_none()
    if not material:
        raise HTTPException(status_code=404, detail="Material não encontrado.")
    return material


async def update_material(db: AsyncSession, material_id: UUID, data: MaterialUpdate) -> Material:
    material = await get_material(db, material_id)

    if data.codigo is not None and data.codigo != material.codigo:
        existing = (await db.execute(
            select(Material).where(Material.codigo == data.codigo)
        )).scalar_one_or_none()
        if existing:
            raise HTTPException(status_code=409, detail="Material com este código já existe.")
        material.codigo = data.codigo

    if data.descricao is not None:
        material.descricao = data.descricao
    if data.unidade_id is not None:
        # Valida FK: unidade deve existir
        unidade = (await db.execute(
            select(Unidade).where(Unidade.id == data.unidade_id)
        )).scalar_one_or_none()
        if not unidade:
            raise HTTPException(status_code=404, detail="Unidade não encontrada.")
        material.unidade_id = data.unidade_id
    if data.ativo is not None:
        material.ativo = data.ativo

    material.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(material)
    return material