from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User, UserRole
from app.database.connection import get_db
from app.modules.catalogo.materiais import crud, schemas
from app.rbac.dependencies import require_roles
from app.utils.responses import success

router = APIRouter()

# Dependências de RBAC reutilizáveis (assumindo que já estão definidas globalmente ou em catalogo/__init__.py)
# Para este contexto, vamos importá-las diretamente do módulo LPU como um exemplo
_staff_up = require_roles(UserRole.STAFF, UserRole.MANAGER, UserRole.ADMIN, UserRole.MASTER)
_admin_up = require_roles(UserRole.ADMIN, UserRole.MASTER)


# ===========================================================================
# MATERIAL
# ===========================================================================

@router.post("/", status_code=201, tags=["Catalogo: Materiais"])
async def create_material(
    data: schemas.MaterialCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(_admin_up),
):
    material = await crud.create_material(db, data)
    return success("Material criado.", schemas.MaterialResponse.model_validate(material))


@router.get("/", tags=["Catalogo: Materiais"])
async def list_materiais(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    ativo: Optional[bool] = None,
    unidade_id: Optional[UUID] = None,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(_staff_up),
):
    materiais, total = await crud.list_materiais(db, page, per_page, ativo, unidade_id)
    return success("Lista de materiais.", {
        "results": [schemas.MaterialResponse.model_validate(m) for m in materiais],
        "total": total,
        "page": page,
        "per_page": per_page,
    })


@router.get("/{material_id}", tags=["Catalogo: Materiais"])
async def get_material(
    material_id: UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(_staff_up),
):
    material = await crud.get_material(db, material_id)
    return success("Dados do material.", schemas.MaterialResponse.model_validate(material))


@router.put("/{material_id}", tags=["Catalogo: Materiais"])
async def update_material(
    material_id: UUID,
    data: schemas.MaterialUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(_admin_up),
):
    material = await crud.update_material(db, material_id, data)
    return success("Material atualizado.", schemas.MaterialResponse.model_validate(material))
