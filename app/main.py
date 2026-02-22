import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config.logging import setup_logging
from app.config.settings import settings

# TODO:UPGRADE [PRIORIDADE: MÉDIA]
# Motivo: Free Tier hiberna após 15 minutos sem requisições — cold start de até 60s
# Solução: Upgrade para Render Starter ($7/mês) — sem hibernação
# Custo estimado: $7/mês
# Métrica de alerta: Quando cold start impactar a experiência em produção

setup_logging()
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Teleradar PGO API iniciando... ambiente=%s", settings.ENVIRONMENT)
    yield
    logger.info("Teleradar PGO API encerrando...")


app = FastAPI(
    title="Teleradar PGO API",
    description="Sistema de gestão para ISPs — Multi-tenant, RBAC, seguro e escalável",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.auth.router import router as auth_router
from app.admin.router import router as admin_router
from app.users.router import router as users_router
from app.tenants.router import router as tenants_router
from app.client_portal.router import router as client_portal_router
from app.modules.contracts.router import router as contracts_router
from app.modules.projects.router import router as projects_router
from app.modules.materials.router import router as materials_router
from app.modules.payments.router import router as payments_router
from app.modules.reports.router import router as reports_router
from app.modules.clients.router import router as clients_router

app.include_router(auth_router, prefix="/auth", tags=["Auth"])
app.include_router(admin_router, prefix="/admin", tags=["Admin"])
app.include_router(users_router, prefix="/users", tags=["Users"])
app.include_router(tenants_router, prefix="/tenants", tags=["Tenants"])
app.include_router(client_portal_router, prefix="/client", tags=["Portal do Cliente"])
app.include_router(contracts_router, prefix="/modules/contracts", tags=["Módulo: Contratos"])
app.include_router(projects_router, prefix="/modules/projects", tags=["Módulo: Projetos"])
app.include_router(materials_router, prefix="/modules/materials", tags=["Módulo: Materiais"])
app.include_router(payments_router, prefix="/modules/payments", tags=["Módulo: Pagamentos"])
app.include_router(reports_router, prefix="/modules/reports", tags=["Módulo: Relatórios"])
app.include_router(clients_router, prefix="/admin/clients", tags=["Clientes"])


@app.get("/health", tags=["Health"])
async def health_check():
    # TODO:UPGRADE [PRIORIDADE: MÉDIA]
    # Motivo: Use este endpoint com UptimeRobot (free) para evitar hibernação parcial
    # Solução: Configurar ping a cada 14 minutos — funciona no Free Tier como workaround
    # Custo estimado: Gratuito (UptimeRobot free tier)
    # Métrica de alerta: Latência > 5s indica cold start — considere upgrade
    return {"status": "ok", "environment": settings.ENVIRONMENT, "version": "1.0.0"}
