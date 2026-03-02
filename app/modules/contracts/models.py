import uuid
import enum
from datetime import datetime

from sqlalchemy import Column, String, DateTime, Enum, ForeignKey, Text, Integer, Date, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database.base import Base


class ContractStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    SUSPENDED = "SUSPENDED"
    CANCELLED = "CANCELLED"


class Contract(Base):
    __tablename__ = "contracts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    numero = Column(Integer, nullable=True, index=True)
    client_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    estado = Column(String(2), nullable=True)
    cidade = Column(String(100), nullable=True)
    status = Column(Enum(ContractStatus), nullable=False, default=ContractStatus.ACTIVE)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    notes = Column(Text, nullable=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    tenant = relationship("Tenant", backref="contracts")
    client = relationship("User", foreign_keys=[client_id], backref="contracts")
    creator = relationship("User", foreign_keys=[created_by])
    payments = relationship("Payment", back_populates="contract", cascade="all, delete-orphan")
    servicos = relationship("ContractServico", back_populates="contract", cascade="all, delete-orphan")
    anexos = relationship("ContractAnexo", back_populates="contract", cascade="all, delete-orphan")
    logs = relationship(
        "ContractLog",
        back_populates="contract",
        cascade="all, delete-orphan",
        order_by="ContractLog.created_at.desc()",
    )


class ContractServico(Base):
    __tablename__ = "contract_servicos"
    __table_args__ = (
        UniqueConstraint("contract_id", "servico_id", name="uq_contract_servico"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    contract_id = Column(UUID(as_uuid=True), ForeignKey("contracts.id", ondelete="CASCADE"), nullable=False, index=True)
    servico_id = Column(UUID(as_uuid=True), ForeignKey("servicos.id", ondelete="RESTRICT"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    contract = relationship("Contract", back_populates="servicos")
    servico = relationship("Servico")


class ContractAnexo(Base):
    __tablename__ = "contract_anexos"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    contract_id = Column(UUID(as_uuid=True), ForeignKey("contracts.id", ondelete="CASCADE"), nullable=False, index=True)
    nome = Column(String(255), nullable=False)
    arquivo_path = Column(String(500), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    contract = relationship("Contract", back_populates="anexos")


class ContractLog(Base):
    __tablename__ = "contract_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    contract_id = Column(UUID(as_uuid=True), ForeignKey("contracts.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    acao = Column(String(50), nullable=False)
    descricao = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    contract = relationship("Contract", back_populates="logs")
    user = relationship("User")
