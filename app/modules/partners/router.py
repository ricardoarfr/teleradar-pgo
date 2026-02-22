from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User, UserRole, UserStatus
from app.database.connection import get_db
from app.modules.partners import schemas, service
from app.rbac.dependencies import require_roles
from app.utils.responses import success

router = APIRouter()

_admin_or_master = require_roles(UserRole.ADMIN, UserRole.MASTER)


@router.get("/", response_model=None)
async def list_partners(
    page: int = 1,
    per_page: int = 20,
    search: Optional[str] = None,
    status: Optional[UserStatus] = None,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(_admin_or_master),
):
    partners, total = await service.list_partners(db, admin, page, per_page, search, status)

    results = []
    for u in partners:
        profile = u.partner_profile
        results.append(schemas.PartnerListItem(
            id=u.id,
            name=u.name,
            email=u.email,
            status=u.status,
            tenant_id=u.tenant_id,
            is_active=u.is_active,
            created_at=u.created_at,
            phone=profile.phone if profile else None,
            cpf_cnpj=profile.cpf_cnpj if profile else None,
            address_city=profile.address_city if profile else None,
        ))

    return success("Lista de parceiros.", {
        "results": results,
        "total": total,
        "page": page,
        "per_page": per_page,
    })


@router.post("/", response_model=None)
async def create_partner(
    data: schemas.PartnerCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(_admin_or_master),
):
    user = await service.create_partner(db, data, admin)
    return success("Parceiro cadastrado com sucesso.", schemas.PartnerDetail.model_validate(user))


@router.get("/{partner_id}", response_model=None)
async def get_partner(
    partner_id: UUID,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(_admin_or_master),
):
    user = await service.get_partner(db, partner_id, admin)
    profile = user.partner_profile
    detail = schemas.PartnerDetail(
        id=user.id,
        name=user.name,
        email=user.email,
        status=user.status,
        tenant_id=user.tenant_id,
        is_active=user.is_active,
        created_at=user.created_at,
        updated_at=user.updated_at,
        profile=schemas.PartnerProfileDetail.model_validate(profile) if profile else None,
    )
    return success("Dados do parceiro.", detail)


@router.put("/{partner_id}", response_model=None)
async def update_partner(
    partner_id: UUID,
    data: schemas.PartnerUpdate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(_admin_or_master),
):
    user = await service.update_partner(db, partner_id, data, admin)
    profile = user.partner_profile
    detail = schemas.PartnerDetail(
        id=user.id,
        name=user.name,
        email=user.email,
        status=user.status,
        tenant_id=user.tenant_id,
        is_active=user.is_active,
        created_at=user.created_at,
        updated_at=user.updated_at,
        profile=schemas.PartnerProfileDetail.model_validate(profile) if profile else None,
    )
    return success("Parceiro atualizado.", detail)


@router.post("/{partner_id}/block", response_model=None)
async def block_partner(
    partner_id: UUID,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(_admin_or_master),
):
    user = await service.block_partner(db, partner_id, admin)
    return success("Parceiro bloqueado.", schemas.PartnerDetail.model_validate(user))


@router.post("/{partner_id}/unblock", response_model=None)
async def unblock_partner(
    partner_id: UUID,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(_admin_or_master),
):
    user = await service.unblock_partner(db, partner_id, admin)
    return success("Parceiro desbloqueado.", schemas.PartnerDetail.model_validate(user))
