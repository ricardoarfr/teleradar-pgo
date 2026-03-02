from datetime import date, datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field

from app.modules.contracts.models import ContractStatus


class ServicoInfo(BaseModel):
    id: UUID
    codigo: str
    atividade: str

    model_config = {"from_attributes": True}


class LogEntry(BaseModel):
    id: UUID
    user_id: Optional[UUID]
    acao: str
    descricao: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class ContractCreate(BaseModel):
    client_id: Optional[UUID] = None
    estado: Optional[str] = Field(None, max_length=2)
    cidade: Optional[str] = Field(None, max_length=100)
    servico_ids: list[UUID] = Field(..., min_length=1)
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    notes: Optional[str] = None


class ContractUpdate(BaseModel):
    client_id: Optional[UUID] = None
    estado: Optional[str] = Field(None, max_length=2)
    cidade: Optional[str] = Field(None, max_length=100)
    servico_ids: Optional[list[UUID]] = Field(None, min_length=1)
    status: Optional[ContractStatus] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    notes: Optional[str] = None


class ContractResponse(BaseModel):
    id: UUID
    tenant_id: UUID
    numero: Optional[int]
    client_id: Optional[UUID]
    estado: Optional[str]
    cidade: Optional[str]
    status: ContractStatus
    start_date: Optional[date]
    end_date: Optional[date]
    notes: Optional[str]
    created_by: Optional[UUID]
    created_at: datetime
    updated_at: datetime
    servicos: list[ServicoInfo] = []
    logs: list[LogEntry] = []

    model_config = {"from_attributes": True}
