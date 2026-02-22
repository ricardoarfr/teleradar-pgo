"""Tabela contracts

Revision ID: 002
Revises: 001
Create Date: 2026-02-21
"""
from typing import Sequence, Union

from alembic import op

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'contractstatus') THEN
                CREATE TYPE contractstatus AS ENUM ('ACTIVE', 'SUSPENDED', 'CANCELLED');
            END IF;
        END$$;
    """)

    op.execute("""
        CREATE TABLE IF NOT EXISTS contracts (
            id UUID PRIMARY KEY,
            tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            client_id UUID REFERENCES users(id) ON DELETE SET NULL,
            plan_name VARCHAR(255) NOT NULL,
            plan_value NUMERIC(10,2) NOT NULL,
            status contractstatus NOT NULL,
            start_date DATE NOT NULL,
            end_date DATE,
            notes TEXT,
            created_at TIMESTAMP NOT NULL,
            updated_at TIMESTAMP NOT NULL
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_contracts_tenant_id ON contracts (tenant_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_contracts_client_id ON contracts (client_id)")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS contracts")
    op.execute("DROP TYPE IF EXISTS contractstatus")
