"""Stub de compatibilidade — lógica consolidada em 006_partner_profiles

Revision ID: 007
Revises: 006
Create Date: 2026-02-22

Este arquivo existe apenas para manter compatibilidade com ambientes
que já rodaram a revision 007. A criação da tabela foi consolidada
diretamente em 006_partner_profiles, eliminando o rename intermediário.
"""
from typing import Sequence, Union

from alembic import op  # noqa: F401

revision: str = "007"
down_revision: Union[str, None] = "006"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # No-op: ambientes novos chegam aqui com partner_profiles já criada pelo 006.
    # Ambientes existentes já executaram a lógica real; este stub só fecha a cadeia.
    pass


def downgrade() -> None:
    pass
