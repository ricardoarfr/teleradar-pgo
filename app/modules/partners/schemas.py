from pydantic import BaseModel, EmailStr
from uuid import UUID
from datetime import datetime
from typing import Optional

from app.auth.models import UserStatus


class PartnerProfileDetail(BaseModel):
    id: UUID
    user_id: UUID
    tenant_id: UUID
    person_type: Optional[str] = None
    cpf_cnpj: Optional[str] = None
    phone: Optional[str] = None
    address_street: Optional[str] = None
    address_number: Optional[str] = None
    address_complement: Optional[str] = None
    address_neighborhood: Optional[str] = None
    address_city: Optional[str] = None
    address_state: Optional[str] = None
    address_cep: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PartnerDetail(BaseModel):
    id: UUID
    name: str
    email: str
    status: UserStatus
    tenant_id: Optional[UUID] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime
    profile: Optional[PartnerProfileDetail] = None

    model_config = {"from_attributes": True}


class PartnerListItem(BaseModel):
    id: UUID
    profile_id: Optional[UUID] = None
    name: str
    email: str
    status: UserStatus
    tenant_id: Optional[UUID] = None
    is_active: bool
    created_at: datetime
    phone: Optional[str] = None
    cpf_cnpj: Optional[str] = None
    address_city: Optional[str] = None

    model_config = {"from_attributes": True}


class PartnerCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    tenant_id: UUID
    person_type: Optional[str] = None
    cpf_cnpj: Optional[str] = None
    phone: Optional[str] = None
    address_street: Optional[str] = None
    address_number: Optional[str] = None
    address_complement: Optional[str] = None
    address_neighborhood: Optional[str] = None
    address_city: Optional[str] = None
    address_state: Optional[str] = None
    address_cep: Optional[str] = None
    notes: Optional[str] = None


class PartnerUpdate(BaseModel):
    name: Optional[str] = None
    person_type: Optional[str] = None
    cpf_cnpj: Optional[str] = None
    phone: Optional[str] = None
    address_street: Optional[str] = None
    address_number: Optional[str] = None
    address_complement: Optional[str] = None
    address_neighborhood: Optional[str] = None
    address_city: Optional[str] = None
    address_state: Optional[str] = None
    address_cep: Optional[str] = None
    notes: Optional[str] = None
