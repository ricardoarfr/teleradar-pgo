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
