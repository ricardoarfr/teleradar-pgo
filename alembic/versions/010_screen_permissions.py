"""Cria tabela screen_permissions para controle granular de acesso por tela

Revision ID: 010
Revises: 39bd5cd2aa7f
Create Date: 2026-03-01

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "010"
down_revision: Union[str, None] = "39bd5cd2aa7f"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create the enum type only if it doesn't already exist (idempotent)
    userrole_enum = postgresql.ENUM(
        "MASTER", "ADMIN", "MANAGER", "STAFF", "PARTNER",
        name="userrole",
    )
    userrole_enum.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "screen_permissions",
        sa.Column(
            "role",
            postgresql.ENUM("MASTER", "ADMIN", "MANAGER", "STAFF", "PARTNER", name="userrole", create_type=False),
            nullable=False,
        ),
        sa.Column("screen_key", sa.String(length=100), nullable=False),
        sa.Column("can_view", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("can_create", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("can_edit", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("can_delete", sa.Boolean(), nullable=False, server_default="false"),
        sa.PrimaryKeyConstraint("role", "screen_key"),
    )
    op.create_index("ix_screen_permissions_role", "screen_permissions", ["role"])


def downgrade() -> None:
    op.drop_index("ix_screen_permissions_role", table_name="screen_permissions")
    op.drop_table("screen_permissions")
