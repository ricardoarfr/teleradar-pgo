"""
Schemas Pydantic — Módulo LPU

Organização:
  ClasseCreate / ClasseUpdate / ClasseResponse
  UnidadeCreate / UnidadeUpdate / UnidadeResponse
  ServicoCreate / ServicoUpdate / ServicoResponse (sem campo de preço)
  LPUCreate / LPUUpdate / LPUResponse
  LPUItemCreate / LPUItemUpdate / LPUItemResponse
"""
from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# CLASSE
# ---------------------------------------------------------------------------
class ClasseCreate(BaseModel):
    nome: str = Field(..., min_length=2, max_length=100)
    descricao: Optional[str] = None
    ativa: bool = True


class ClasseUpdate(BaseModel):
    nome: Optional[str] = Field(None, min_length=2, max_length=100)
    descricao: Optional[str] = None
    ativa: Optional[bool] = None


class ClasseResponse(BaseModel):
    id: UUID
    nome: str
    descricao: Optional[str]
    ativa: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# UNIDADE
# ---------------------------------------------------------------------------
class UnidadeCreate(BaseModel):
    nome: str = Field(..., min_length=2, max_length=100)
    sigla: str = Field(..., min_length=1, max_length=20)
    ativa: bool = True


class UnidadeUpdate(BaseModel):
    nome: Optional[str] = Field(None, min_length=2, max_length=100)
    sigla: Optional[str] = Field(None, min_length=1, max_length=20)
    ativa: Optional[bool] = None


class UnidadeResponse(BaseModel):
    id: UUID
    nome: str
    sigla: str
    ativa: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# SERVICO — sem nenhum campo de preço/valor
# ---------------------------------------------------------------------------
class ServicoCreate(BaseModel):
    """
    Criação de serviço.
    REGRA: Não possui campo de preço sob nenhuma hipótese.
    O preço vive exclusivamente em LPUItem.
    """
    codigo: str = Field(..., min_length=1, max_length=50)
    atividade: str = Field(..., min_length=2, max_length=255)
    classe_id: UUID
    unidade_id: UUID
    ativo: bool = True


class ServicoUpdate(BaseModel):
    codigo: Optional[str] = Field(None, min_length=1, max_length=50)
    atividade: Optional[str] = Field(None, min_length=2, max_length=255)
    classe_id: Optional[UUID] = None
    unidade_id: Optional[UUID] = None
    ativo: Optional[bool] = None


class ServicoResponse(BaseModel):
    """
    Resposta de serviço — sem campo de preço.
    Os preços estão em LPUItemResponse, vinculados por LPU.
    """
    id: UUID
    codigo: str
    atividade: str
    classe_id: UUID
    unidade_id: UUID
    ativo: bool
    created_at: datetime
    updated_at: datetime
    # Relacionamentos opcionais (populados com selectinload quando disponíveis)
    classe: Optional[ClasseResponse] = None
    unidade: Optional[UnidadeResponse] = None

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# LPU
# ---------------------------------------------------------------------------
class LPUCreate(BaseModel):
    nome: str = Field(..., min_length=2, max_length=255)
    parceiro_id: UUID
    ativa: bool = True
    # Campos de vigência opcionais — preparados para controle futuro
    data_inicio: Optional[date] = None
    data_fim: Optional[date] = None


class LPUUpdate(BaseModel):
    nome: Optional[str] = Field(None, min_length=2, max_length=255)
    parceiro_id: Optional[UUID] = None
    ativa: Optional[bool] = None
    data_inicio: Optional[date] = None
    data_fim: Optional[date] = None


class LPUResponse(BaseModel):
    id: UUID
    nome: str
    parceiro_id: UUID
    tenant_id: UUID
    ativa: bool
    data_inicio: Optional[date]
    data_fim: Optional[date]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# LPU ITEM — onde o preço vive
# ---------------------------------------------------------------------------
class LPUItemCreate(BaseModel):
    """
    Adiciona um Serviço a uma LPU com seu preço.
    Regras:
    - servico_id não pode estar duplicado na mesma LPU (validado no banco e na service).
    - valor_unitario >= 0 (validado no banco e no schema).
    - valor_classe >= 0 quando preenchido.
    """
    servico_id: UUID
    valor_unitario: Decimal = Field(..., ge=0, decimal_places=2)
    valor_classe: Optional[Decimal] = Field(None, ge=0, decimal_places=2)


class LPUItemUpdate(BaseModel):
    valor_unitario: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    valor_classe: Optional[Decimal] = Field(None, ge=0, decimal_places=2)


class LPUItemResponse(BaseModel):
    id: UUID
    lpu_id: UUID
    servico_id: UUID
    valor_unitario: Decimal
    valor_classe: Optional[Decimal]
    created_at: datetime
    updated_at: datetime
    # Relacionamento opcional — populado com selectinload quando disponível
    servico: Optional[ServicoResponse] = None

    model_config = {"from_attributes": True}
