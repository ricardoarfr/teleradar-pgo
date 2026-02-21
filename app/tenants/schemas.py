from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime
from typing import Optional, List

from app.tenants.models import TenantStatus


class TenantCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)


class TenantUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    status: Optional[TenantStatus] = None


class TenantResponse(BaseModel):
    id: UUID
    name: str
    status: TenantStatus
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
