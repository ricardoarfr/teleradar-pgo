"""Tabela client_profiles

Revision ID: 006
Revises: 005
Create Date: 2026-02-22
"""
from typing import Sequence, Union

from alembic import op

revision: str = "006"
down_revision: Union[str, None] = "005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE IF NOT EXISTS client_profiles (
            id UUID PRIMARY KEY,
            user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
            tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            cpf_cnpj VARCHAR(20),
            phone VARCHAR(20),
            address_street VARCHAR(255),
            address_number VARCHAR(20),
            address_complement VARCHAR(100),
            address_neighborhood VARCHAR(100),
            address_city VARCHAR(100),
            address_state VARCHAR(2),
            address_cep VARCHAR(10),
            notes TEXT,
            created_at TIMESTAMP NOT NULL,
            updated_at TIMESTAMP NOT NULL
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_client_profiles_user_id ON client_profiles (user_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_client_profiles_tenant_id ON client_profiles (tenant_id)")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS client_profiles")
