from fastapi import APIRouter, Depends, HTTPException, status

from app.database.connection import get_db
from app.auth.models import User, UserRole
from app.rbac.dependencies import require_roles
from app.rbac.schemas import (
    ScreenPermissionUpdate,
    AllProfilesPermissionsResponse,
    MyPermissionsResponse,
    ScreenActionSet,
)
from app.rbac.service import (
    get_all_screen_permissions,
    get_screen_permissions_for_role,
    update_screen_permissions_for_role,
)
from app.auth.dependencies import get_current_user
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()

_master_only = require_roles(UserRole.MASTER)


@router.get(
    "/permissions",
    response_model=AllProfilesPermissionsResponse,
    summary="Lista permissões de tela de todos os perfis (MASTER)",
)
async def list_all_permissions(
    _: User = Depends(_master_only),
    db: AsyncSession = Depends(get_db),
):
    perms = await get_all_screen_permissions(db)
    return AllProfilesPermissionsResponse(permissions=perms)


@router.get(
    "/my-permissions",
    response_model=MyPermissionsResponse,
    summary="Retorna as permissões de tela do usuário autenticado",
)
async def get_my_permissions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    perms = await get_screen_permissions_for_role(db, current_user.role)
    return MyPermissionsResponse(permissions=perms)


@router.put(
    "/permissions/{role}",
    response_model=MyPermissionsResponse,
    summary="Atualiza permissões de tela de um perfil (MASTER)",
)
async def update_role_permissions(
    role: UserRole,
    payload: ScreenPermissionUpdate,
    _: User = Depends(_master_only),
    db: AsyncSession = Depends(get_db),
):
    if role == UserRole.MASTER:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="As permissões do perfil MASTER não podem ser alteradas.",
        )
    updated = await update_screen_permissions_for_role(db, role, payload.screens)
    return MyPermissionsResponse(permissions=updated)
