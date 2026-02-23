from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field

from app.modules.catalogo.lpu.schemas import UnidadeResponse # Para o relacionamento da Unidade

# ---------------------------------------------------------------------------
# MATERIAL
# ---------------------------------------------------------------------------
class MaterialCreate(BaseModel):
    codigo: str = Field(..., min_length=1, max_length=50)
    descricao: str = Field(..., min_length=2, max_length=255)
    unidade_id: UUID
    ativo: bool = True

class MaterialUpdate(BaseModel):
    codigo: Optional[str] = Field(None, min_length=1, max_length=50)
    descricao: Optional[str] = Field(None, min_length=2, max_length=255)
    unidade_id: Optional[UUID] = None
    ativo: Optional[bool] = None

class MaterialResponse(BaseModel):
    id: UUID
    codigo: str
    descricao: str
    unidade_id: UUID
    ativo: bool
    created_at: datetime
    updated_at: datetime
    unidade: Optional[UnidadeResponse] = None # Relacionamento

    model_config = {"from_attributes": True}
