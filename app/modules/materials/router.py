from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User, UserRole
from app.database.connection import get_db
from app.modules.materials import schemas, service
from app.rbac.dependencies import require_roles
from app.utils.responses import success

router = APIRouter()

_staff_up = require_roles(UserRole.STAFF, UserRole.MANAGER, UserRole.ADMIN, UserRole.MASTER)
_manager_up = require_roles(UserRole.MANAGER, UserRole.ADMIN, UserRole.MASTER)


@router.post("/", status_code=201)
async def create_material(
    data: schemas.MaterialCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(_manager_up),
):
    material = await service.create_material(db, current_user.tenant_id, data)
    return success("Material criado.", schemas.MaterialResponse.model_validate(material))


@router.get("/")
async def list_materials(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    low_stock_only: bool = Query(False),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(_staff_up),
):
    materials, total = await service.list_materials(db, current_user.tenant_id, page, per_page, low_stock_only)
    return success("Lista de materiais.", {
        "results": [schemas.MaterialResponse.model_validate(m) for m in materials],
        "total": total,
        "page": page,
        "per_page": per_page,
    })


@router.get("/{material_id}")
async def get_material(
    material_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(_staff_up),
):
    material = await service.get_material(db, current_user.tenant_id, material_id)
    return success("Dados do material.", schemas.MaterialResponse.model_validate(material))


@router.put("/{material_id}")
async def update_material(
    material_id: UUID,
    data: schemas.MaterialUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(_manager_up),
):
    material = await service.update_material(db, current_user.tenant_id, material_id, data)
    return success("Material atualizado.", schemas.MaterialResponse.model_validate(material))


@router.post("/{material_id}/adjust")
async def adjust_stock(
    material_id: UUID,
    data: schemas.MaterialAdjust,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(_manager_up),
):
    material = await service.adjust_stock(db, current_user.tenant_id, material_id, data.quantity)
    return success("Estoque ajustado.", schemas.MaterialResponse.model_validate(material))
