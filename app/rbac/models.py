import uuid
from datetime import datetime

from sqlalchemy import Column, String, Text, Enum, ForeignKey, DateTime, Boolean, PrimaryKeyConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database.base import Base
from app.auth.models import UserRole


class Permission(Base):
    __tablename__ = "permissions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    module = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    role_permissions = relationship("RolePermission", back_populates="permission")


class RolePermission(Base):
    __tablename__ = "role_permissions"

    role = Column(Enum(UserRole), nullable=False)
    permission_id = Column(UUID(as_uuid=True), ForeignKey("permissions.id", ondelete="CASCADE"), nullable=False)

    __table_args__ = (PrimaryKeyConstraint("role", "permission_id"),)

    permission = relationship("Permission", back_populates="role_permissions")


class ScreenPermission(Base):
    __tablename__ = "screen_permissions"

    role = Column(Enum(UserRole), nullable=False)
    screen_key = Column(String(100), nullable=False)
    can_view = Column(Boolean, nullable=False, default=False)
    can_create = Column(Boolean, nullable=False, default=False)
    can_edit = Column(Boolean, nullable=False, default=False)
    can_delete = Column(Boolean, nullable=False, default=False)

    __table_args__ = (PrimaryKeyConstraint("role", "screen_key"),)
