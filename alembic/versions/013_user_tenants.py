"""Cria tabela user_tenants para associação N:N entre usuários e empresas

Revision ID: 013
Revises: 012
Create Date: 2026-03-10
"""
from typing import Sequence, Union
from alembic import op

revision: str = "013"
down_revision: Union[str, None] = "012"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE IF NOT EXISTS user_tenants (
            user_id   UUID NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
            tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            PRIMARY KEY (user_id, tenant_id)
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_user_tenants_user_id   ON user_tenants (user_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_user_tenants_tenant_id ON user_tenants (tenant_id)")

    # Migra vínculos existentes de users.tenant_id para a nova tabela
    op.execute("""
        INSERT INTO user_tenants (user_id, tenant_id)
        SELECT id, tenant_id
        FROM users
        WHERE tenant_id IS NOT NULL
        ON CONFLICT DO NOTHING
    """)


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS user_tenants")
