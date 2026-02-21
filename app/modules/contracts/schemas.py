from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field

from app.modules.contracts.models import ContractStatus


class ContractCreate(BaseModel):
    client_id: Optional[UUID] = None
    plan_name: str = Field(..., min_length=2, max_length=255)
    plan_value: Decimal = Field(..., gt=0)
    start_date: date
    end_date: Optional[date] = None
    notes: Optional[str] = None


class ContractUpdate(BaseModel):
    client_id: Optional[UUID] = None
    plan_name: Optional[str] = Field(None, min_length=2, max_length=255)
    plan_value: Optional[Decimal] = Field(None, gt=0)
    status: Optional[ContractStatus] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    notes: Optional[str] = None


class ContractResponse(BaseModel):
    id: UUID
    tenant_id: UUID
    client_id: Optional[UUID]
    plan_name: str
    plan_value: Decimal
    status: ContractStatus
    start_date: date
    end_date: Optional[date]
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
