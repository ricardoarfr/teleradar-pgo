"""Cria tabela produttivo_config para armazenar cookie e configurações por tenant

Revision ID: 012
Revises: 011
Create Date: 2026-03-04
"""
from typing import Sequence, Union
from alembic import op

revision: str = "012"
down_revision: Union[str, None] = "011"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE IF NOT EXISTS produttivo_config (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
            account_id VARCHAR(50) NOT NULL DEFAULT '20834',
            cookie TEXT,
            cookie_updated_at TIMESTAMP,
            produttivo_email VARCHAR(255),
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_produttivo_config_tenant_id ON produttivo_config (tenant_id)")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS produttivo_config")
