"""Tabela materials

Revision ID: 004
Revises: 003
Create Date: 2026-02-21
"""
from typing import Sequence, Union

from alembic import op

revision: str = "004"
down_revision: Union[str, None] = "003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE IF NOT EXISTS materials (
            id UUID PRIMARY KEY,
            tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            unit VARCHAR(50) NOT NULL,
            quantity NUMERIC(10,3) NOT NULL,
            min_quantity NUMERIC(10,3) NOT NULL,
            created_at TIMESTAMP NOT NULL,
            updated_at TIMESTAMP NOT NULL
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_materials_tenant_id ON materials (tenant_id)")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS materials")
