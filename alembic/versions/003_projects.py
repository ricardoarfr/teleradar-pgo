"""Tabela projects

Revision ID: 003
Revises: 002
Create Date: 2026-02-21
"""
from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from alembic import op

revision: str = "003"
down_revision: Union[str, None] = "002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    project_status = postgresql.ENUM("PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED", name="projectstatus")
    project_status.create(op.get_bind())

    op.create_table(
        "projects",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("status", sa.Enum("PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED", name="projectstatus"), nullable=False),
        sa.Column("responsible_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("start_date", sa.Date(), nullable=True),
        sa.Column("end_date", sa.Date(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_projects_tenant_id", "projects", ["tenant_id"])


def downgrade() -> None:
    op.drop_index("ix_projects_tenant_id", "projects")
    op.drop_table("projects")
    op.execute("DROP TYPE IF EXISTS projectstatus")
