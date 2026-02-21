from datetime import datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class MaterialCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    description: Optional[str] = None
    unit: str = Field(..., min_length=1, max_length=50)
    quantity: Decimal = Field(default=Decimal("0"), ge=0)
    min_quantity: Decimal = Field(default=Decimal("0"), ge=0)


class MaterialUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    description: Optional[str] = None
    unit: Optional[str] = Field(None, min_length=1, max_length=50)
    min_quantity: Optional[Decimal] = Field(None, ge=0)


class MaterialAdjust(BaseModel):
    quantity: Decimal = Field(..., description="Valor positivo para entrada, negativo para saída")
    reason: Optional[str] = None


class MaterialResponse(BaseModel):
    id: UUID
    tenant_id: UUID
    name: str
    description: Optional[str]
    unit: str
    quantity: Decimal
    min_quantity: Decimal
    low_stock: bool = False
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

    @classmethod
    def model_validate(cls, obj, **kwargs):
        instance = super().model_validate(obj, **kwargs)
        instance.low_stock = instance.quantity <= instance.min_quantity
        return instance
