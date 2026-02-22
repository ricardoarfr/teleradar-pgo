"""Tabela projects

Revision ID: 003
Revises: 002
Create Date: 2026-02-21
"""
from typing import Sequence, Union

from alembic import op

revision: str = "003"
down_revision: Union[str, None] = "002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'projectstatus') THEN
                CREATE TYPE projectstatus AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
            END IF;
        END$$;
    """)

    op.execute("""
        CREATE TABLE IF NOT EXISTS projects (
            id UUID PRIMARY KEY,
            tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            status projectstatus NOT NULL,
            responsible_id UUID REFERENCES users(id) ON DELETE SET NULL,
            start_date DATE,
            end_date DATE,
            created_at TIMESTAMP NOT NULL,
            updated_at TIMESTAMP NOT NULL
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_projects_tenant_id ON projects (tenant_id)")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS projects")
    op.execute("DROP TYPE IF EXISTS projectstatus")
