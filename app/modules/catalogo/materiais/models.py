import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    String,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database.base import Base
from app.modules.catalogo.lpu.models import Unidade # Importa Unidade do módulo LPU

class Material(Base):
    """
    Catálogo de Materiais.
    Possui vínculo com Unidade de medida, similar aos Serviços.
    """
    __tablename__ = "materiais"
    __table_args__ = (
        UniqueConstraint("codigo", name="uq_materiais_codigo"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    codigo = Column(String(50), nullable=False, unique=True)
    descricao = Column(String(255), nullable=False)
    unidade_id = Column(
        UUID(as_uuid=True),
        ForeignKey("unidades.id", ondelete="RESTRICT"), # FK para Unidade do módulo LPU
        nullable=False,
    )
    ativo = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relacionamento
    unidade = relationship("Unidade") # Relaciona-se com a Unidade do módulo LPU
