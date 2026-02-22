"""Renomeia client_profiles para partner_profiles, adiciona person_type e migra role CLIENT->PARTNER

Revision ID: 007
Revises: 006
Create Date: 2026-02-22
"""
from typing import Sequence, Union

from alembic import op

revision: str = "007"
down_revision: Union[str, None] = "006"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Adiciona o novo valor PARTNER ao enum userrole
    # Precisa de COMMIT antes de usar o novo valor (restrição do PostgreSQL)
    op.execute("ALTER TYPE userrole ADD VALUE IF NOT EXISTS 'PARTNER'")
    op.execute("COMMIT")

    # 2. Migra usuários existentes com role CLIENT para PARTNER
    op.execute("UPDATE users SET role = 'PARTNER' WHERE role = 'CLIENT'")

    # 3. Renomeia a tabela
    op.execute("ALTER TABLE client_profiles RENAME TO partner_profiles")

    # 4. Renomeia os índices
    op.execute("ALTER INDEX IF EXISTS ix_client_profiles_user_id RENAME TO ix_partner_profiles_user_id")
    op.execute("ALTER INDEX IF EXISTS ix_client_profiles_tenant_id RENAME TO ix_partner_profiles_tenant_id")

    # 5. Adiciona coluna person_type (PF ou PJ)
    op.execute("ALTER TABLE partner_profiles ADD COLUMN IF NOT EXISTS person_type VARCHAR(2)")


def downgrade() -> None:
    op.execute("ALTER TABLE partner_profiles DROP COLUMN IF EXISTS person_type")
    op.execute("ALTER INDEX IF EXISTS ix_partner_profiles_tenant_id RENAME TO ix_client_profiles_tenant_id")
    op.execute("ALTER INDEX IF EXISTS ix_partner_profiles_user_id RENAME TO ix_client_profiles_user_id")
    op.execute("ALTER TABLE partner_profiles RENAME TO client_profiles")
    op.execute("UPDATE users SET role = 'CLIENT' WHERE role = 'PARTNER'")
