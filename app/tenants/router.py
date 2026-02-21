from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import UserRole
from app.database.connection import get_db
from app.rbac.dependencies import require_roles
from app.tenants import schemas, service
from app.utils.responses import success

router = APIRouter()

_admin_master = require_roles(UserRole.ADMIN, UserRole.MASTER)


@router.post("/", status_code=201)
async def create_tenant(data: schemas.TenantCreate, db: AsyncSession = Depends(get_db), admin=Depends(_admin_master)):
    tenant = await service.create_tenant(db, data)
    return success("Tenant criado.", schemas.TenantResponse.model_validate(tenant))


@router.get("/")
async def list_tenants(page: int = 1, per_page: int = 20, db: AsyncSession = Depends(get_db), admin=Depends(_admin_master)):
    tenants, total = await service.list_tenants(db, page, per_page)
    return success("Lista de tenants.", {
        "results": [schemas.TenantResponse.model_validate(t) for t in tenants],
        "total": total,
        "page": page,
        "per_page": per_page,
    })


@router.get("/{tenant_id}")
async def get_tenant(tenant_id: UUID, db: AsyncSession = Depends(get_db), admin=Depends(_admin_master)):
    tenant = await service.get_tenant(db, tenant_id)
    return success("Dados do tenant.", schemas.TenantResponse.model_validate(tenant))


@router.put("/{tenant_id}")
async def update_tenant(tenant_id: UUID, data: schemas.TenantUpdate, db: AsyncSession = Depends(get_db), admin=Depends(_admin_master)):
    tenant = await service.update_tenant(db, tenant_id, data)
    return success("Tenant atualizado.", schemas.TenantResponse.model_validate(tenant))
