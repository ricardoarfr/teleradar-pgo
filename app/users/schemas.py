from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime
from typing import Optional

from app.auth.models import UserRole, UserStatus


class UpdateProfile(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=255)


class UserProfileResponse(BaseModel):
    id: UUID
    name: str
    email: str
    role: UserRole
    status: UserStatus
    tenant_id: Optional[UUID]
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
