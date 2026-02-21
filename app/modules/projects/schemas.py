from datetime import date, datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field

from app.modules.projects.models import ProjectStatus


class ProjectCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    description: Optional[str] = None
    responsible_id: Optional[UUID] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class ProjectUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    description: Optional[str] = None
    status: Optional[ProjectStatus] = None
    responsible_id: Optional[UUID] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class ProjectResponse(BaseModel):
    id: UUID
    tenant_id: UUID
    name: str
    description: Optional[str]
    status: ProjectStatus
    responsible_id: Optional[UUID]
    start_date: Optional[date]
    end_date: Optional[date]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
