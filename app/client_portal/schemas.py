from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional

from app.auth.models import UserRole, UserStatus


class PartnerProfile(BaseModel):
    id: UUID
    name: str
    email: str
    role: UserRole
    status: UserStatus
    tenant_id: Optional[UUID]
    created_at: datetime

    model_config = {"from_attributes": True}


class PartnerOverview(BaseModel):
    tenant_id: Optional[UUID]
    message: str = "Portal do parceiro — módulos em desenvolvimento"
