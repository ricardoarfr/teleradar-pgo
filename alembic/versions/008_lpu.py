"""Tabelas do módulo LPU: classes, unidades, servicos, lpus, lpu_itens

Revision ID: 008
Revises: 007
Create Date: 2026-02-22

Arquitetura:
  classes     → catálogo global de classes de serviço
  unidades    → catálogo global de unidades de medida
  servicos    → catálogo global de serviços (SEM campo de preço)
  lpus        → lista de preço único, vinculada a parceiro + tenant
  lpu_itens   → onde o preço vive; unique (lpu_id, servico_id)

Constraints importantes:
  - uq_servicos_codigo: código de serviço único
  - uq_lpu_itens_lpu_servico: mesmo serviço não pode aparecer duas vezes na mesma LPU
  - ck_lpu_itens_valor_unitario_positivo: preço não pode ser negativo
  - ck_lpu_itens_valor_classe_positivo: valor_classe >= 0 quando preenchido
  - ON DELETE CASCADE em lpu_itens → lpus (ao remover LPU, itens são removidos)
  - ON DELETE RESTRICT em servicos → classes/unidades (proteção de integridade)
  - ON DELETE RESTRICT em lpu_itens → servicos (serviço em uso não pode ser removido)
"""
from typing import Sequence, Union

from alembic import op

revision: str = "008"
down_revision: Union[str, None] = "007"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ------------------------------------------------------------------
    # CLASSES — catálogo global de classes de serviço
    # ------------------------------------------------------------------
    op.execute("""
        CREATE TABLE IF NOT EXISTS classes (
            id          UUID PRIMARY KEY,
            nome        VARCHAR(100) NOT NULL,
            descricao   TEXT,
            ativa       BOOLEAN NOT NULL DEFAULT TRUE,
            created_at  TIMESTAMP NOT NULL,
            updated_at  TIMESTAMP NOT NULL,
            CONSTRAINT uq_classes_nome UNIQUE (nome)
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_classes_nome ON classes (nome)")

    # ------------------------------------------------------------------
    # UNIDADES — catálogo global de unidades de medida
    # ------------------------------------------------------------------
    op.execute("""
        CREATE TABLE IF NOT EXISTS unidades (
            id          UUID PRIMARY KEY,
            nome        VARCHAR(100) NOT NULL,
            sigla       VARCHAR(20) NOT NULL,
            ativa       BOOLEAN NOT NULL DEFAULT TRUE,
            created_at  TIMESTAMP NOT NULL,
            updated_at  TIMESTAMP NOT NULL,
            CONSTRAINT uq_unidades_sigla UNIQUE (sigla)
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_unidades_sigla ON unidades (sigla)")

    # ------------------------------------------------------------------
    # SERVICOS — catálogo global de serviços
    # REGRA: não possui campo de preço/valor sob nenhuma hipótese.
    # O preço vive exclusivamente em lpu_itens.
    # ------------------------------------------------------------------
    op.execute("""
        CREATE TABLE IF NOT EXISTS servicos (
            id          UUID PRIMARY KEY,
            codigo      VARCHAR(50) NOT NULL,
            atividade   VARCHAR(255) NOT NULL,
            classe_id   UUID NOT NULL REFERENCES classes(id) ON DELETE RESTRICT,
            unidade_id  UUID NOT NULL REFERENCES unidades(id) ON DELETE RESTRICT,
            ativo       BOOLEAN NOT NULL DEFAULT TRUE,
            created_at  TIMESTAMP NOT NULL,
            updated_at  TIMESTAMP NOT NULL,
            CONSTRAINT uq_servicos_codigo UNIQUE (codigo)
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_servicos_codigo ON servicos (codigo)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_servicos_classe_id ON servicos (classe_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_servicos_unidade_id ON servicos (unidade_id)")

    # ------------------------------------------------------------------
    # LPUS — Lista de Preço Único, vinculada a um parceiro e tenant
    # data_inicio / data_fim: preparação para controle de vigência futuro
    # ------------------------------------------------------------------
    op.execute("""
        CREATE TABLE IF NOT EXISTS lpus (
            id           UUID PRIMARY KEY,
            nome         VARCHAR(255) NOT NULL,
            parceiro_id  UUID NOT NULL REFERENCES partner_profiles(id) ON DELETE RESTRICT,
            tenant_id    UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            ativa        BOOLEAN NOT NULL DEFAULT TRUE,
            data_inicio  DATE,
            data_fim     DATE,
            created_at   TIMESTAMP NOT NULL,
            updated_at   TIMESTAMP NOT NULL
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_lpus_parceiro_id ON lpus (parceiro_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_lpus_tenant_id ON lpus (tenant_id)")

    # ------------------------------------------------------------------
    # LPU_ITENS — onde o preço vive
    # Constraints:
    #   - Unique (lpu_id, servico_id): mesmo serviço não duplica na LPU
    #   - Check valor_unitario >= 0: preço não pode ser negativo
    #   - Check valor_classe >= 0 (quando preenchido)
    #   - CASCADE DELETE: ao remover LPU, itens são removidos automaticamente
    # ------------------------------------------------------------------
    op.execute("""
        CREATE TABLE IF NOT EXISTS lpu_itens (
            id              UUID PRIMARY KEY,
            lpu_id          UUID NOT NULL REFERENCES lpus(id) ON DELETE CASCADE,
            servico_id      UUID NOT NULL REFERENCES servicos(id) ON DELETE RESTRICT,
            valor_unitario  NUMERIC(15, 2) NOT NULL,
            valor_classe    NUMERIC(15, 2),
            created_at      TIMESTAMP NOT NULL,
            updated_at      TIMESTAMP NOT NULL,
            CONSTRAINT uq_lpu_itens_lpu_servico
                UNIQUE (lpu_id, servico_id),
            CONSTRAINT ck_lpu_itens_valor_unitario_positivo
                CHECK (valor_unitario >= 0),
            CONSTRAINT ck_lpu_itens_valor_classe_positivo
                CHECK (valor_classe IS NULL OR valor_classe >= 0)
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_lpu_itens_lpu_id ON lpu_itens (lpu_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_lpu_itens_servico_id ON lpu_itens (servico_id)")


def downgrade() -> None:
    # Remover na ordem inversa das dependências de FK
    op.execute("DROP TABLE IF EXISTS lpu_itens")
    op.execute("DROP TABLE IF EXISTS lpus")
    op.execute("DROP TABLE IF EXISTS servicos")
    op.execute("DROP TABLE IF EXISTS unidades")
    op.execute("DROP TABLE IF EXISTS classes")
