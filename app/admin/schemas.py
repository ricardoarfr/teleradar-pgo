from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime
from typing import Optional, List

from app.auth.models import UserRole, UserStatus


class UserDetail(BaseModel):
    id: UUID
    name: str
    email: str
    role: UserRole
    status: UserStatus
    tenant_id: Optional[UUID]
    is_active: bool
    login_attempts: int
    locked_until: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class UserListResponse(BaseModel):
    results: List[UserDetail]
    total: int
    page: int
    per_page: int


class ApproveRequest(BaseModel):
    user_id: UUID


class ConfirmApprovalRequest(BaseModel):
    user_id: UUID
    code: str


class ChangeRoleRequest(BaseModel):
    role: UserRole


class BlockRequest(BaseModel):
    reason: Optional[str] = None


class ChangePasswordRequest(BaseModel):
    new_password: str = Field(..., min_length=8, max_length=128)


class ChangeTenantRequest(BaseModel):
    tenant_id: Optional[UUID] = None
