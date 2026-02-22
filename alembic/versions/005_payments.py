"""Tabela payments

Revision ID: 005
Revises: 004
Create Date: 2026-02-21
"""
from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from alembic import op

revision: str = "005"
down_revision: Union[str, None] = "004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing = inspector.get_table_names()

    postgresql.ENUM("PENDING", "PAID", "OVERDUE", "CANCELLED", name="paymentstatus").create(bind, checkfirst=True)

    if "payments" not in existing:
        op.create_table(
            "payments",
            sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
            sa.Column("tenant_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False),
            sa.Column("contract_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("contracts.id", ondelete="CASCADE"), nullable=False),
            sa.Column("amount", sa.Numeric(10, 2), nullable=False),
            sa.Column("due_date", sa.Date(), nullable=False),
            sa.Column("paid_at", sa.DateTime(), nullable=True),
            sa.Column("status", sa.Enum("PENDING", "PAID", "OVERDUE", "CANCELLED", name="paymentstatus", create_type=False), nullable=False),
            sa.Column("reference", sa.String(100), nullable=True),
            sa.Column("notes", sa.Text(), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=False),
            sa.Column("updated_at", sa.DateTime(), nullable=False),
        )
        op.create_index("ix_payments_tenant_id", "payments", ["tenant_id"])
        op.create_index("ix_payments_contract_id", "payments", ["contract_id"])


def downgrade() -> None:
    op.drop_index("ix_payments_contract_id", "payments")
    op.drop_index("ix_payments_tenant_id", "payments")
    op.drop_table("payments")
    op.execute("DROP TYPE IF EXISTS paymentstatus")
