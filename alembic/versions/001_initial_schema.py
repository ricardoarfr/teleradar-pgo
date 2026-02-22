"""Schema inicial — tenants, users, tokens, audit_logs, permissions, role_permissions

Revision ID: 001
Revises:
Create Date: 2026-02-21
"""
from typing import Sequence, Union

from alembic import op

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Enums — IF NOT EXISTS garante idempotência independente do driver
op.execute("""
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tenantstatus') THEN
        CREATE TYPE tenantstatus AS ENUM ('ACTIVE', 'INACTIVE');
    END IF;
END
$$;
""")    op.execute("CREATE TYPE IF NOT EXISTS userrole AS ENUM ('MASTER', 'ADMIN', 'MANAGER', 'STAFF', 'CLIENT')")
    op.execute("CREATE TYPE IF NOT EXISTS userstatus AS ENUM ('PENDING', 'APPROVED', 'BLOCKED')")
    op.execute("CREATE TYPE IF NOT EXISTS tokentype AS ENUM ('RESET_PASSWORD', 'APPROVAL_CODE', 'REFRESH')")

    op.execute("""
        CREATE TABLE IF NOT EXISTS tenants (
            id UUID PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            status tenantstatus NOT NULL,
            created_at TIMESTAMP NOT NULL,
            updated_at TIMESTAMP NOT NULL
        )
    """)

    op.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id UUID PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL UNIQUE,
            password_hash VARCHAR(255),
            google_id VARCHAR(255) UNIQUE,
            role userrole NOT NULL,
            status userstatus NOT NULL,
            tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
            is_active BOOLEAN NOT NULL DEFAULT TRUE,
            login_attempts INTEGER NOT NULL DEFAULT 0,
            locked_until TIMESTAMP,
            created_at TIMESTAMP NOT NULL,
            updated_at TIMESTAMP NOT NULL
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_users_email ON users (email)")

    op.execute("""
        CREATE TABLE IF NOT EXISTS tokens (
            id UUID PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            type tokentype NOT NULL,
            token VARCHAR(512) NOT NULL UNIQUE,
            expires_at TIMESTAMP NOT NULL,
            used BOOLEAN NOT NULL DEFAULT FALSE,
            created_at TIMESTAMP NOT NULL
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_tokens_token ON tokens (token)")

    op.execute("""
        CREATE TABLE IF NOT EXISTS audit_logs (
            id UUID PRIMARY KEY,
            user_id UUID REFERENCES users(id) ON DELETE SET NULL,
            action VARCHAR(100) NOT NULL,
            ip VARCHAR(45),
            user_agent TEXT,
            details JSONB,
            created_at TIMESTAMP NOT NULL
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_audit_logs_action ON audit_logs (action)")

    op.execute("""
        CREATE TABLE IF NOT EXISTS permissions (
            id UUID PRIMARY KEY,
            name VARCHAR(100) NOT NULL UNIQUE,
            description TEXT,
            module VARCHAR(100),
            created_at TIMESTAMP NOT NULL
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_permissions_name ON permissions (name)")

    op.execute("""
        CREATE TABLE IF NOT EXISTS role_permissions (
            role userrole NOT NULL,
            permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
            PRIMARY KEY (role, permission_id)
        )
    """)


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS role_permissions")
    op.execute("DROP TABLE IF EXISTS permissions")
    op.execute("DROP TABLE IF EXISTS audit_logs")
    op.execute("DROP TABLE IF EXISTS tokens")
    op.execute("DROP TABLE IF EXISTS users")
    op.execute("DROP TABLE IF EXISTS tenants")
    op.execute("DROP TYPE IF EXISTS tokentype")
    op.execute("DROP TYPE IF EXISTS userstatus")
    op.execute("DROP TYPE IF EXISTS userrole")
    op.execute("DROP TYPE IF EXISTS tenantstatus")
