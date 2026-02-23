"""
Módulo LPU — Lista de Preço Único

Arquitetura conceitual:
  CLASSE   → classifica → SERVICO
  UNIDADE  → mede       → SERVICO
  SERVICO  → precificado por → LPU_ITEM
  LPU_ITEM → pertence a → LPU
  LPU      → pertence a → PARCEIRO (PartnerProfile)
  PARCEIRO → pertence a → TENANT

Regra fundamental: SERVIÇO NUNCA possui preço.
O preço vive exclusivamente em LPUItem.
O mesmo Serviço pode existir em múltiplas LPUs com valores distintos.
"""
import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Column,
    Date,
    DateTime,
    ForeignKey,
    Numeric,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database.base import Base


# ---------------------------------------------------------------------------
# CLASSE — categoriza o tipo de serviço (ex: "Civil", "Elétrica", "Rede")
# ---------------------------------------------------------------------------
class Classe(Base):
    """
    Catálogo global de classes de serviço.
    Não é tenant-scoped: é compartilhado por toda a plataforma.
    """
    __tablename__ = "classes"
    __table_args__ = (
        UniqueConstraint("nome", name="uq_classes_nome"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nome = Column(String(100), nullable=False, unique=True, index=True)
    descricao = Column(Text, nullable=True)
    ativa = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relacionamento: uma classe classifica vários serviços
    servicos = relationship("Servico", back_populates="classe")


# ---------------------------------------------------------------------------
# UNIDADE — unidade de medida do serviço (ex: "Metro", "Hora", "Unidade")
# ---------------------------------------------------------------------------
class Unidade(Base):
    """
    Catálogo global de unidades de medida.
    Não é tenant-scoped: é compartilhado por toda a plataforma.
    """
    __tablename__ = "unidades"
    __table_args__ = (
        UniqueConstraint("sigla", name="uq_unidades_sigla"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nome = Column(String(100), nullable=False)
    sigla = Column(String(20), nullable=False, unique=True, index=True)
    ativa = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relacionamento: uma unidade mede vários serviços
    servicos = relationship("Servico", back_populates="unidade")


# ---------------------------------------------------------------------------
# SERVICO — catálogo de serviços SEM preço
# O preço nunca pertence ao serviço; pertence ao LPUItem.
# ---------------------------------------------------------------------------
class Servico(Base):
    """
    Catálogo global de serviços.
    Não é tenant-scoped: é compartilhado por toda a plataforma.

    IMPORTANTE: Não possui nenhum campo de preço/valor.
    O mesmo Serviço pode aparecer em múltiplas LPUs com preços distintos,
    controlados exclusivamente pela tabela lpu_itens.
    """
    __tablename__ = "servicos"
    __table_args__ = (
        UniqueConstraint("codigo", name="uq_servicos_codigo"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    codigo = Column(String(50), nullable=False, unique=True, index=True)
    atividade = Column(String(255), nullable=False)
    # FK para Classe — classifica o serviço
    classe_id = Column(
        UUID(as_uuid=True),
        ForeignKey("classes.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    # FK para Unidade — define a unidade de medida
    unidade_id = Column(
        UUID(as_uuid=True),
        ForeignKey("unidades.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    ativo = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relacionamentos
    classe = relationship("Classe", back_populates="servicos")
    unidade = relationship("Unidade", back_populates="servicos")
    # Um serviço pode aparecer em vários itens de LPU (com preços distintos)
    lpu_itens = relationship("LPUItem", back_populates="servico")


# ---------------------------------------------------------------------------
# LPU — Lista de Preço Único vinculada a um Parceiro
# Preparada para vigência futura (data_inicio / data_fim).
# ---------------------------------------------------------------------------
class LPU(Base):
    """
    Lista de Preço Único (LPU).
    Representa a tabela de preços acordada entre o Tenant e um Parceiro específico.

    Um Parceiro pode ter múltiplas LPUs (ex: por região, por período, por contrato).
    Os campos data_inicio e data_fim estão preparados para controle de vigência futuro.
    """
    __tablename__ = "lpus"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nome = Column(String(255), nullable=False)
    # FK para PartnerProfile (parceiro vinculado a esta LPU)
    parceiro_id = Column(
        UUID(as_uuid=True),
        ForeignKey("partner_profiles.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    # Tenant que possui esta LPU (isolamento multi-tenant)
    tenant_id = Column(
        UUID(as_uuid=True),
        ForeignKey("tenants.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    ativa = Column(Boolean, nullable=False, default=True)
    # Campos de vigência — preparação para contratos futuros
    data_inicio = Column(Date, nullable=True)
    data_fim = Column(Date, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relacionamentos
    parceiro = relationship("PartnerProfile", backref="lpus")
    tenant = relationship("Tenant", backref="lpus")
    # Cascade: ao remover uma LPU, seus itens são removidos automaticamente
    itens = relationship(
        "LPUItem",
        back_populates="lpu",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


# ---------------------------------------------------------------------------
# LPU_ITEM — onde o preço vive
# Associa um Serviço a uma LPU com seu respectivo valor unitário.
# ---------------------------------------------------------------------------
class LPUItem(Base):
    """
    Item da LPU: associa um Serviço a uma LPU com preço específico.

    Regras críticas:
    - Unique constraint em (lpu_id, servico_id): mesmo serviço não pode aparecer
      duas vezes na mesma LPU.
    - valor_unitario nunca pode ser negativo (CHECK CONSTRAINT).
    - valor_classe nunca pode ser negativo quando preenchido (CHECK CONSTRAINT).
    - Cascade delete: ao remover a LPU, todos os itens são removidos.
    """
    __tablename__ = "lpu_itens"
    __table_args__ = (
        # Garantia de unicidade: um serviço só aparece uma vez por LPU
        UniqueConstraint("lpu_id", "servico_id", name="uq_lpu_itens_lpu_servico"),
        # Preço nunca pode ser negativo
        CheckConstraint("valor_unitario >= 0", name="ck_lpu_itens_valor_unitario_positivo"),
        # valor_classe, quando preenchido, também não pode ser negativo
        CheckConstraint(
            "valor_classe IS NULL OR valor_classe >= 0",
            name="ck_lpu_itens_valor_classe_positivo",
        ),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    # FK com CASCADE DELETE: ao remover a LPU, os itens são removidos junto
    lpu_id = Column(
        UUID(as_uuid=True),
        ForeignKey("lpus.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    # FK com RESTRICT: não pode remover um Serviço enquanto ele estiver em uma LPU
    servico_id = Column(
        UUID(as_uuid=True),
        ForeignKey("servicos.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    # Valor principal do serviço — obrigatório, não negativo
    valor_unitario = Column(Numeric(15, 2), nullable=False)
    # Valor de classe (campo auxiliar/opcional — ex: adicional por categoria)
    valor_classe = Column(Numeric(15, 2), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relacionamentos
    lpu = relationship("LPU", back_populates="itens")
    servico = relationship("Servico", back_populates="lpu_itens")
