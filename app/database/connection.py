from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from app.config.settings import settings

# TODO:UPGRADE [PRIORIDADE: ALTA]
# Motivo: Banco PostgreSQL Free Tier expira em 30 dias após criação no Render
# Solução: Upgrade para Render Postgres Basic-256mb ($6/mês) — sem expiração
# Custo estimado: $6/mês
# Métrica de alerta: Monitorar DB_CREATED_AT no .env e agir 5 dias antes do vencimento

# TODO:UPGRADE [PRIORIDADE: MÉDIA]
# Motivo: Limite de 100 conexões simultâneas no Free Tier
# Solução: Implementar PgBouncer ou upgrade de plano
# Custo estimado: PgBouncer gratuito (self-hosted) ou incluído em planos pagos
# Métrica de alerta: Erros de "too many connections" nos logs

# TODO:UPGRADE [PRIORIDADE: MÉDIA]
# Motivo: Storage limitado a 1 GB no Free Tier
# Solução: Upgrade para plano Basic ($6/mês)
# Custo estimado: $6/mês
# Métrica de alerta: Alertar ao atingir DB_STORAGE_ALERT_MB (padrão: 800 MB)

def _get_db_url() -> str:
    url = settings.DATABASE_URL
    if url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
    return url


engine = create_async_engine(
    _get_db_url(),
    pool_size=5,        # Conservativo para Free Tier (max 100 conexões)
    max_overflow=10,
    pool_timeout=30,
    pool_recycle=1800,
    echo=settings.ENVIRONMENT == "development",
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
