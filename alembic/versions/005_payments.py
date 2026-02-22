"""Tabela payments

Revision ID: 005
Revises: 004
Create Date: 2026-02-21
"""
from typing import Sequence, Union

from alembic import op

revision: str = "005"
down_revision: Union[str, None] = "004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'paymentstatus') THEN
                CREATE TYPE paymentstatus AS ENUM ('PENDING', 'PAID', 'OVERDUE', 'CANCELLED');
            END IF;
        END$$;
    """)

    op.execute("""
        CREATE TABLE IF NOT EXISTS payments (
            id UUID PRIMARY KEY,
            tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
            amount NUMERIC(10,2) NOT NULL,
            due_date DATE NOT NULL,
            paid_at TIMESTAMP,
            status paymentstatus NOT NULL,
            reference VARCHAR(100),
            notes TEXT,
            created_at TIMESTAMP NOT NULL,
            updated_at TIMESTAMP NOT NULL
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_payments_tenant_id ON payments (tenant_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_payments_contract_id ON payments (contract_id)")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS payments")
    op.execute("DROP TYPE IF EXISTS paymentstatus")
