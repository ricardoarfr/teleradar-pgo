"""Tabela contracts

Revision ID: 002
Revises: 001
Create Date: 2026-02-21
"""
from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from alembic import op

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing = inspector.get_table_names()

    postgresql.ENUM("ACTIVE", "SUSPENDED", "CANCELLED", name="contractstatus").create(bind, checkfirst=True)

    if "contracts" not in existing:
        op.create_table(
            "contracts",
            sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
            sa.Column("tenant_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False),
            sa.Column("client_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
            sa.Column("plan_name", sa.String(255), nullable=False),
            sa.Column("plan_value", sa.Numeric(10, 2), nullable=False),
            sa.Column("status", sa.Enum("ACTIVE", "SUSPENDED", "CANCELLED", name="contractstatus", create_type=False), nullable=False),
            sa.Column("start_date", sa.Date(), nullable=False),
            sa.Column("end_date", sa.Date(), nullable=True),
            sa.Column("notes", sa.Text(), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=False),
            sa.Column("updated_at", sa.DateTime(), nullable=False),
        )
        op.create_index("ix_contracts_tenant_id", "contracts", ["tenant_id"])
        op.create_index("ix_contracts_client_id", "contracts", ["client_id"])


def downgrade() -> None:
    op.drop_index("ix_contracts_client_id", "contracts")
    op.drop_index("ix_contracts_tenant_id", "contracts")
    op.drop_table("contracts")
    op.execute("DROP TYPE IF EXISTS contractstatus")
