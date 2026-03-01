from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional

from app.auth.models import UserRole


class PermissionResponse(BaseModel):
    id: UUID
    name: str
    description: Optional[str]
    module: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class RolePermissionResponse(BaseModel):
    role: UserRole
    permission: PermissionResponse

    model_config = {"from_attributes": True}


# --- Screen Permissions ---

class ScreenActionSet(BaseModel):
    view: bool = False
    create: bool = False
    edit: bool = False
    delete: bool = False


class ScreenPermissionUpdate(BaseModel):
    """Payload para atualizar permissões de tela de um perfil."""
    # chave: screen_key, valor: ações permitidas
    screens: dict[str, ScreenActionSet]


class AllProfilesPermissionsResponse(BaseModel):
    """Retorna permissões de todas as telas para todos os perfis."""
    # chave: role name, valor: { screen_key: ScreenActionSet }
    permissions: dict[str, dict[str, ScreenActionSet]]


class MyPermissionsResponse(BaseModel):
    """Retorna permissões do usuário autenticado."""
    # chave: screen_key, valor: ScreenActionSet
    permissions: dict[str, ScreenActionSet]
