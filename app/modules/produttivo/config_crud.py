from datetime import datetime
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.produttivo.config_models import ProduttivoConfig


async def get_or_create_config(db: AsyncSession, tenant_id: UUID) -> ProduttivoConfig:
    result = await db.execute(select(ProduttivoConfig).where(ProduttivoConfig.tenant_id == tenant_id))
    config = result.scalar_one_or_none()
    if not config:
        config = ProduttivoConfig(tenant_id=tenant_id)
        db.add(config)
        await db.commit()
        await db.refresh(config)
    return config


async def save_cookie(db: AsyncSession, tenant_id: UUID, cookie: str) -> ProduttivoConfig:
    config = await get_or_create_config(db, tenant_id)
    config.cookie = cookie
    config.cookie_updated_at = datetime.utcnow()
    config.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(config)
    return config


async def save_account_id(db: AsyncSession, tenant_id: UUID, account_id: str) -> ProduttivoConfig:
    config = await get_or_create_config(db, tenant_id)
    config.account_id = account_id
    config.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(config)
    return config


async def get_config_or_404(db: AsyncSession, tenant_id: UUID) -> ProduttivoConfig:
    config = await get_or_create_config(db, tenant_id)
    if not config.cookie:
        raise HTTPException(
            status_code=400,
            detail="Cookie do Produttivo não configurado. Acesse Configurações → Produttivo.",
        )
    return config
