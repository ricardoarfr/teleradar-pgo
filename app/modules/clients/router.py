from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User, UserRole, UserStatus
from app.database.connection import get_db
from app.modules.clients import schemas, service
from app.rbac.dependencies import require_roles
from app.utils.responses import success

router = APIRouter()

_admin_or_master = require_roles(UserRole.ADMIN, UserRole.MASTER)


@router.get("/", response_model=None)
async def list_clients(
    page: int = 1,
    per_page: int = 20,
    search: Optional[str] = None,
    status: Optional[UserStatus] = None,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(_admin_or_master),
):
    clients, total = await service.list_clients(db, admin, page, per_page, search, status)

    results = []
    for u in clients:
        profile = u.client_profile
        results.append(schemas.ClientListItem(
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

    return success("Lista de clientes.", {
        "results": results,
        "total": total,
        "page": page,
        "per_page": per_page,
    })


@router.post("/", response_model=None)
async def create_client(
    data: schemas.ClientCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(_admin_or_master),
):
    user = await service.create_client(db, data, admin)
    return success("Cliente cadastrado com sucesso.", schemas.ClientDetail.model_validate(user))


@router.get("/{client_id}", response_model=None)
async def get_client(
    client_id: UUID,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(_admin_or_master),
):
    user = await service.get_client(db, client_id, admin)
    profile = user.client_profile
    detail = schemas.ClientDetail(
        id=user.id,
        name=user.name,
        email=user.email,
        status=user.status,
        tenant_id=user.tenant_id,
        is_active=user.is_active,
        created_at=user.created_at,
        updated_at=user.updated_at,
        profile=schemas.ClientProfileDetail.model_validate(profile) if profile else None,
    )
    return success("Dados do cliente.", detail)


@router.put("/{client_id}", response_model=None)
async def update_client(
    client_id: UUID,
    data: schemas.ClientUpdate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(_admin_or_master),
):
    user = await service.update_client(db, client_id, data, admin)
    profile = user.client_profile
    detail = schemas.ClientDetail(
        id=user.id,
        name=user.name,
        email=user.email,
        status=user.status,
        tenant_id=user.tenant_id,
        is_active=user.is_active,
        created_at=user.created_at,
        updated_at=user.updated_at,
        profile=schemas.ClientProfileDetail.model_validate(profile) if profile else None,
    )
    return success("Cliente atualizado.", detail)


@router.post("/{client_id}/block", response_model=None)
async def block_client(
    client_id: UUID,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(_admin_or_master),
):
    user = await service.block_client(db, client_id, admin)
    return success("Cliente bloqueado.", schemas.ClientDetail.model_validate(user))


@router.post("/{client_id}/unblock", response_model=None)
async def unblock_client(
    client_id: UUID,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(_admin_or_master),
):
    user = await service.unblock_client(db, client_id, admin)
    return success("Cliente desbloqueado.", schemas.ClientDetail.model_validate(user))
