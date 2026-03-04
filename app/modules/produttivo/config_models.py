import uuid
from datetime import datetime

from sqlalchemy import Column, String, DateTime, ForeignKey, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database.base import Base


class ProduttivoConfig(Base):
    __tablename__ = "produttivo_config"
    __table_args__ = (
        UniqueConstraint("tenant_id", name="uq_produttivo_config_tenant"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, unique=True)
    account_id = Column(String(50), nullable=False, default="20834")
    cookie = Column(Text, nullable=True)
    cookie_updated_at = Column(DateTime, nullable=True)
    produttivo_email = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    tenant = relationship("Tenant")
