from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User, UserRole
from app.database.connection import get_db
from app.modules.reports import service
from app.rbac.dependencies import require_roles
from app.utils.responses import success

router = APIRouter()

_manager_up = require_roles(UserRole.MANAGER, UserRole.ADMIN, UserRole.MASTER)


@router.get("/dashboard")
async def dashboard(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(_manager_up),
):
    data = await service.dashboard(db, current_user.tenant_id)
    return success("Dashboard gerencial.", data)


@router.get("/contracts")
async def contracts_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(_manager_up),
):
    data = await service.contracts_summary(db, current_user.tenant_id)
    return success("Resumo de contratos.", data)


@router.get("/payments")
async def payments_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(_manager_up),
):
    data = await service.payments_summary(db, current_user.tenant_id)
    return success("Resumo financeiro.", data)


@router.get("/projects")
async def projects_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(_manager_up),
):
    data = await service.projects_summary(db, current_user.tenant_id)
    return success("Resumo de projetos.", data)


@router.get("/materials")
async def materials_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(_manager_up),
):
    data = await service.materials_summary(db, current_user.tenant_id)
    return success("Resumo de estoque.", data)
