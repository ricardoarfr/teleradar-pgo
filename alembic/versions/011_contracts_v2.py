"""Atualiza tabela contracts para v2: remove plan_name/plan_value, adiciona numero/estado/cidade/created_by;
cria contract_servicos, contract_anexos, contract_logs

Revision ID: 011
Revises: 010
Create Date: 2026-03-02
"""
from typing import Sequence, Union

from alembic import op

revision: str = "011"
down_revision: Union[str, None] = "010"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # -----------------------------------------------------------------------
    # Altera tabela contracts
    # -----------------------------------------------------------------------
    op.execute("""
        ALTER TABLE contracts
            DROP COLUMN IF EXISTS plan_name,
            DROP COLUMN IF EXISTS plan_value,
            ADD COLUMN IF NOT EXISTS numero INTEGER,
            ADD COLUMN IF NOT EXISTS estado VARCHAR(2),
            ADD COLUMN IF NOT EXISTS cidade VARCHAR(100),
            ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id) ON DELETE SET NULL
    """)

    # Popula numero para registros existentes (retrocompatibilidade)
    op.execute("""
        WITH numbered AS (
            SELECT id, ROW_NUMBER() OVER (PARTITION BY tenant_id ORDER BY created_at) AS rn
            FROM contracts
            WHERE numero IS NULL
        )
        UPDATE contracts
        SET numero = numbered.rn
        FROM numbered
        WHERE contracts.id = numbered.id
    """)

    op.execute("CREATE INDEX IF NOT EXISTS ix_contracts_numero ON contracts (tenant_id, numero)")

    # -----------------------------------------------------------------------
    # Tabela de serviços contratados (N:M entre contracts e servicos)
    # -----------------------------------------------------------------------
    op.execute("""
        CREATE TABLE IF NOT EXISTS contract_servicos (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
            servico_id UUID NOT NULL REFERENCES servicos(id) ON DELETE RESTRICT,
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            UNIQUE (contract_id, servico_id)
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_contract_servicos_contract_id ON contract_servicos (contract_id)")

    # -----------------------------------------------------------------------
    # Tabela de anexos do contrato
    # -----------------------------------------------------------------------
    op.execute("""
        CREATE TABLE IF NOT EXISTS contract_anexos (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
            nome VARCHAR(255) NOT NULL,
            arquivo_path VARCHAR(500) NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_contract_anexos_contract_id ON contract_anexos (contract_id)")

    # -----------------------------------------------------------------------
    # Tabela de log de auditoria do contrato
    # -----------------------------------------------------------------------
    op.execute("""
        CREATE TABLE IF NOT EXISTS contract_logs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
            user_id UUID REFERENCES users(id) ON DELETE SET NULL,
            acao VARCHAR(50) NOT NULL,
            descricao TEXT,
            created_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_contract_logs_contract_id ON contract_logs (contract_id)")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS contract_logs")
    op.execute("DROP TABLE IF EXISTS contract_anexos")
    op.execute("DROP TABLE IF EXISTS contract_servicos")
    op.execute("""
        ALTER TABLE contracts
            DROP COLUMN IF EXISTS numero,
            DROP COLUMN IF EXISTS estado,
            DROP COLUMN IF EXISTS cidade,
            DROP COLUMN IF EXISTS created_by,
            ADD COLUMN IF NOT EXISTS plan_name VARCHAR(255) NOT NULL DEFAULT '',
            ADD COLUMN IF NOT EXISTS plan_value NUMERIC(10,2) NOT NULL DEFAULT 0
    """)
