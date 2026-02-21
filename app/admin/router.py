from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.admin import schemas, service
from app.auth.models import User, UserRole, UserStatus
from app.database.connection import get_db
from app.rbac.dependencies import require_roles
from app.utils.responses import success

router = APIRouter()

_admin_or_master = require_roles(UserRole.ADMIN, UserRole.MASTER)
_master_only = require_roles(UserRole.MASTER)


@router.get("/users", response_model=None)
async def list_users(
    role: Optional[UserRole] = None,
    user_status: Optional[UserStatus] = None,
    page: int = 1,
    per_page: int = 20,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(_admin_or_master),
):
    users, total = await service.list_users(db, role, user_status, page, per_page)
    return success("Lista de usuários.", {
        "results": [schemas.UserDetail.model_validate(u) for u in users],
        "total": total,
        "page": page,
        "per_page": per_page,
    })


@router.get("/users/pending")
async def list_pending(db: AsyncSession = Depends(get_db), admin: User = Depends(_admin_or_master)):
    users = await service.list_pending_users(db)
    return success("Usuários pendentes.", [schemas.UserDetail.model_validate(u) for u in users])


@router.get("/users/{user_id}")
async def get_user(user_id: UUID, db: AsyncSession = Depends(get_db), admin: User = Depends(_admin_or_master)):
    user = await service.get_user_by_id(db, user_id)
    return success("Dados do usuário.", schemas.UserDetail.model_validate(user))


@router.post("/users/{user_id}/approve")
async def approve_user(user_id: UUID, db: AsyncSession = Depends(get_db), admin: User = Depends(_admin_or_master)):
    await service.initiate_approval(db, user_id, admin)
    return success("Código de aprovação enviado ao e-mail do administrador.")


@router.post("/users/confirm-approval")
async def confirm_approval(
    data: schemas.ConfirmApprovalRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(_admin_or_master),
):
    user = await service.confirm_approval(db, data.user_id, data.code, admin)
    return success("Usuário aprovado com sucesso.", schemas.UserDetail.model_validate(user))


@router.post("/users/{user_id}/block")
async def block_user(
    user_id: UUID,
    data: schemas.BlockRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(_admin_or_master),
):
    user = await service.block_user(db, user_id, admin, data.reason)
    return success("Usuário bloqueado.", schemas.UserDetail.model_validate(user))


@router.post("/users/{user_id}/unblock")
async def unblock_user(user_id: UUID, db: AsyncSession = Depends(get_db), admin: User = Depends(_admin_or_master)):
    user = await service.unblock_user(db, user_id, admin)
    return success("Usuário desbloqueado.", schemas.UserDetail.model_validate(user))


@router.put("/users/{user_id}/role")
async def change_role(
    user_id: UUID,
    data: schemas.ChangeRoleRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(_admin_or_master),
):
    user = await service.change_user_role(db, user_id, data.role, admin)
    return success("Role atualizado.", schemas.UserDetail.model_validate(user))
