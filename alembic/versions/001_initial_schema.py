"""Schema inicial — tenants, users, tokens, audit_logs, permissions, role_permissions

Revision ID: 001
Revises:
Create Date: 2026-02-21
"""
from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from alembic import op

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing = inspector.get_table_names()

    # Enums com checkfirst=True — seguro em re-execuções
    postgresql.ENUM("ACTIVE", "INACTIVE", name="tenantstatus").create(bind, checkfirst=True)
    postgresql.ENUM("MASTER", "ADMIN", "MANAGER", "STAFF", "CLIENT", name="userrole").create(bind, checkfirst=True)
    postgresql.ENUM("PENDING", "APPROVED", "BLOCKED", name="userstatus").create(bind, checkfirst=True)
    postgresql.ENUM("RESET_PASSWORD", "APPROVAL_CODE", "REFRESH", name="tokentype").create(bind, checkfirst=True)

    if "tenants" not in existing:
        op.create_table(
            "tenants",
            sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
            sa.Column("name", sa.String(255), nullable=False),
            sa.Column("status", sa.Enum("ACTIVE", "INACTIVE", name="tenantstatus", create_type=False), nullable=False),
            sa.Column("created_at", sa.DateTime(), nullable=False),
            sa.Column("updated_at", sa.DateTime(), nullable=False),
        )

    if "users" not in existing:
        op.create_table(
            "users",
            sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
            sa.Column("name", sa.String(255), nullable=False),
            sa.Column("email", sa.String(255), nullable=False, unique=True),
            sa.Column("password_hash", sa.String(255), nullable=True),
            sa.Column("google_id", sa.String(255), nullable=True, unique=True),
            sa.Column("role", sa.Enum("MASTER", "ADMIN", "MANAGER", "STAFF", "CLIENT", name="userrole", create_type=False), nullable=False),
            sa.Column("status", sa.Enum("PENDING", "APPROVED", "BLOCKED", name="userstatus", create_type=False), nullable=False),
            sa.Column("tenant_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="SET NULL"), nullable=True),
            sa.Column("is_active", sa.Boolean(), nullable=False, default=True),
            sa.Column("login_attempts", sa.Integer(), nullable=False, default=0),
            sa.Column("locked_until", sa.DateTime(), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=False),
            sa.Column("updated_at", sa.DateTime(), nullable=False),
        )
        op.create_index("ix_users_email", "users", ["email"])

    if "tokens" not in existing:
        op.create_table(
            "tokens",
            sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
            sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
            sa.Column("type", sa.Enum("RESET_PASSWORD", "APPROVAL_CODE", "REFRESH", name="tokentype", create_type=False), nullable=False),
            sa.Column("token", sa.String(512), nullable=False, unique=True),
            sa.Column("expires_at", sa.DateTime(), nullable=False),
            sa.Column("used", sa.Boolean(), nullable=False, default=False),
            sa.Column("created_at", sa.DateTime(), nullable=False),
        )
        op.create_index("ix_tokens_token", "tokens", ["token"])

    if "audit_logs" not in existing:
        op.create_table(
            "audit_logs",
            sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
            sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
            sa.Column("action", sa.String(100), nullable=False),
            sa.Column("ip", sa.String(45), nullable=True),
            sa.Column("user_agent", sa.Text(), nullable=True),
            sa.Column("details", postgresql.JSONB(), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=False),
        )
        op.create_index("ix_audit_logs_action", "audit_logs", ["action"])

    if "permissions" not in existing:
        op.create_table(
            "permissions",
            sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
            sa.Column("name", sa.String(100), nullable=False, unique=True),
            sa.Column("description", sa.Text(), nullable=True),
            sa.Column("module", sa.String(100), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=False),
        )
        op.create_index("ix_permissions_name", "permissions", ["name"])

    if "role_permissions" not in existing:
        op.create_table(
            "role_permissions",
            sa.Column("role", sa.Enum("MASTER", "ADMIN", "MANAGER", "STAFF", "CLIENT", name="userrole", create_type=False), nullable=False),
            sa.Column("permission_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("permissions.id", ondelete="CASCADE"), nullable=False),
            sa.PrimaryKeyConstraint("role", "permission_id"),
        )


def downgrade() -> None:
    op.drop_table("role_permissions")
    op.drop_table("permissions")
    op.drop_table("audit_logs")
    op.drop_table("tokens")
    op.drop_table("users")
    op.drop_table("tenants")

    op.execute("DROP TYPE IF EXISTS tokentype")
    op.execute("DROP TYPE IF EXISTS userstatus")
    op.execute("DROP TYPE IF EXISTS userrole")
    op.execute("DROP TYPE IF EXISTS tenantstatus")
