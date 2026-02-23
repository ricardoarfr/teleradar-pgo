import asyncio
from logging.config import fileConfig

from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

from alembic import context

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Importar todos os models para o Alembic detectar as tabelas
from app.database.base import Base
from app.tenants.models import Tenant, TenantStatus  # noqa: F401
from app.auth.models import User, Token, AuditLog, UserRole, UserStatus, TokenType  # noqa: F401
from app.rbac.models import Permission, RolePermission  # noqa: F401
from app.modules.contracts.models import Contract, ContractStatus  # noqa: F401
from app.modules.projects.models import Project, ProjectStatus  # noqa: F401
from app.modules.materials.models import Material  # noqa: F401
from app.modules.payments.models import Payment, PaymentStatus  # noqa: F401
from app.modules.partners.models import PartnerProfile  # noqa: F401
from app.modules.catalogo.lpu.models import Classe, Unidade, Servico, LPU, LPUItem # noqa: F401

target_metadata = Base.metadata


def get_url():
    import os
    url = os.getenv("DATABASE_URL", config.get_main_option("sqlalchemy.url"))
    # Corrigir URL para asyncpg se necessário
    if url and url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
    return url


def run_migrations_offline() -> None:
    url = get_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        dialect_opts={"paramstyle": "named"},
    )


def do_run_migrations(connection: Connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    configuration = config.get_section(config.config_ini_section, {})
    configuration["sqlalchemy.url"] = get_url()
    connectable = async_engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()


def run_migrations_online() -> None:
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
