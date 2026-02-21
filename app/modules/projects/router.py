from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User, UserRole
from app.database.connection import get_db
from app.modules.projects import schemas, service
from app.modules.projects.models import ProjectStatus
from app.rbac.dependencies import require_roles
from app.utils.responses import success

router = APIRouter()

_staff_up = require_roles(UserRole.STAFF, UserRole.MANAGER, UserRole.ADMIN, UserRole.MASTER)
_manager_up = require_roles(UserRole.MANAGER, UserRole.ADMIN, UserRole.MASTER)


@router.post("/", status_code=201)
async def create_project(
    data: schemas.ProjectCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(_manager_up),
):
    project = await service.create_project(db, current_user.tenant_id, data)
    return success("Projeto criado.", schemas.ProjectResponse.model_validate(project))


@router.get("/")
async def list_projects(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    status: Optional[ProjectStatus] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(_staff_up),
):
    projects, total = await service.list_projects(db, current_user.tenant_id, page, per_page, status)
    return success("Lista de projetos.", {
        "results": [schemas.ProjectResponse.model_validate(p) for p in projects],
        "total": total,
        "page": page,
        "per_page": per_page,
    })


@router.get("/{project_id}")
async def get_project(
    project_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(_staff_up),
):
    project = await service.get_project(db, current_user.tenant_id, project_id)
    return success("Dados do projeto.", schemas.ProjectResponse.model_validate(project))


@router.put("/{project_id}")
async def update_project(
    project_id: UUID,
    data: schemas.ProjectUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(_manager_up),
):
    project = await service.update_project(db, current_user.tenant_id, project_id, data)
    return success("Projeto atualizado.", schemas.ProjectResponse.model_validate(project))
