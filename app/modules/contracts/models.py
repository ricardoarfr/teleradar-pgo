import uuid
import enum
from datetime import datetime

from sqlalchemy import Column, String, DateTime, Enum, ForeignKey, Text, Numeric, Date
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
    client_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    plan_name = Column(String(255), nullable=False)
    plan_value = Column(Numeric(10, 2), nullable=False)
    status = Column(Enum(ContractStatus), nullable=False, default=ContractStatus.ACTIVE)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    tenant = relationship("Tenant", backref="contracts")
    client = relationship("User", backref="contracts")
    payments = relationship("Payment", back_populates="contract", cascade="all, delete-orphan")
