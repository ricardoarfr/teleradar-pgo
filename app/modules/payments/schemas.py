from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field

from app.modules.payments.models import PaymentStatus


class PaymentCreate(BaseModel):
    contract_id: UUID
    amount: Decimal = Field(..., gt=0)
    due_date: date
    reference: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = None


class PaymentUpdate(BaseModel):
    amount: Optional[Decimal] = Field(None, gt=0)
    due_date: Optional[date] = None
    reference: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = None


class PaymentMarkPaid(BaseModel):
    paid_at: Optional[datetime] = None   # se None, usa datetime.utcnow()


class PaymentResponse(BaseModel):
    id: UUID
    tenant_id: UUID
    contract_id: UUID
    amount: Decimal
    due_date: date
    paid_at: Optional[datetime]
    status: PaymentStatus
    reference: Optional[str]
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
