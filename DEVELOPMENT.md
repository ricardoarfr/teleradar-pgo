# Guia de Desenvolvimento — Teleradar PGO

## Pré-requisitos

| Ferramenta | Versão Mínima | Uso |
|-----------|--------------|-----|
| Python | 3.11+ | Backend |
| Node.js | 20+ | Frontend |
| Docker | 24+ | PostgreSQL local |
| Git | 2.x | Controle de versão |

---

## Configuração do Ambiente Local

### 1. Clone e estrutura

```bash
git clone https://github.com/ricardoarfr/teleradar-pgo.git
cd teleradar-pgo
```

### 2. Backend

```bash
# Criar ambiente virtual
python -m venv .venv
source .venv/bin/activate        # Linux/macOS
# .venv\Scripts\activate         # Windows

# Instalar dependências Python
pip install -r requirements.txt

# Instalar o Chromium para o Playwright (automação de login Produttivo)
playwright install chromium
```

### 3. Variáveis de Ambiente

```bash
cp .env.example .env
```

Edite o `.env` com os valores reais. Variáveis mínimas para desenvolvimento local:

```env
# Banco de dados (PostgreSQL local via Docker)
DATABASE_URL=postgresql+asyncpg://teleradar:teleradar@localhost:5433/teleradar_pgo

# JWT
SECRET_KEY=dev-secret-key-mude-em-producao
BOOTSTRAP_SECRET=dev-bootstrap-secret

# E-mail (Resend — use uma chave de teste ou mock)
RESEND_API_KEY=re_xxxx
ADMIN_MASTER_EMAIL=dev@localhost.com

# CORS
CORS_ORIGINS=http://localhost:3000

# Ambiente
ENVIRONMENT=development
```

### 4. PostgreSQL Local

```bash
# Subir o banco via Docker Compose
docker-compose -f docker-compose.dev.yml up -d

# Verificar se está rodando
docker-compose -f docker-compose.dev.yml ps
```

PostgreSQL disponível em `localhost:5433` (porta diferente do padrão para não conflitar).

### 5. Migrations

```bash
# Aplicar todas as migrations pendentes
alembic upgrade head

# Verificar estado atual
alembic current
```

### 6. Iniciar o Backend

```bash
uvicorn app.main:app --reload --port 8000

# API: http://localhost:8000
# Swagger: http://localhost:8000/docs
# ReDoc:   http://localhost:8000/redoc
```

### 7. Frontend

```bash
cd web
npm install
npm run dev

# Web: http://localhost:3000
```

### 8. Criar o Usuário MASTER

```bash
curl -X POST http://localhost:8000/auth/master/bootstrap \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dev Master",
    "email": "master@dev.com",
    "password": "senha123",
    "bootstrap_secret": "dev-bootstrap-secret"
  }'
```

---

## Estrutura de Pastas — Backend

```
app/
├── main.py                  # FastAPI app + routers registrados
├── config/
│   ├── settings.py          # pydantic-settings (lê .env)
│   └── logging.py           # Configuração de logs
├── database/
│   ├── base.py              # DeclarativeBase do SQLAlchemy
│   └── connection.py        # Async engine + get_db() dependency
├── auth/
│   ├── models.py            # User, Token, AuditLog
│   ├── schemas.py           # Pydantic schemas de request/response
│   ├── service.py           # Lógica de negócio de auth
│   ├── router.py            # Endpoints /auth/*
│   ├── jwt.py               # Criação e decodificação de JWT
│   ├── dependencies.py      # get_current_user dependency
│   └── oauth_google.py      # Fluxo OAuth2 Google
├── admin/
│   ├── schemas.py
│   ├── service.py
│   └── router.py
├── rbac/
│   ├── models.py            # Permission, RolePermission, ScreenPermission
│   ├── dependencies.py      # require_roles() factory
│   ├── tenant.py            # tenant_context() factory (multi-tenant)
│   ├── schemas.py
│   ├── service.py
│   └── router.py
├── tenants/
│   ├── models.py
│   ├── schemas.py
│   ├── service.py
│   └── router.py
├── users/
│   ├── schemas.py
│   ├── service.py
│   └── router.py
├── modules/
│   ├── contracts/
│   ├── projects/
│   ├── materials/
│   ├── payments/
│   ├── partners/
│   ├── reports/
│   ├── catalogo/
│   │   ├── lpu/
│   │   └── materiais/
│   └── produttivo/
│       ├── api_client.py
│       ├── config_models.py
│       ├── config_crud.py
│       ├── excel.py
│       ├── models.py
│       ├── router.py
│       ├── forms/
│       │   ├── base.py
│       │   ├── lancamento_cabo.py
│       │   ├── fusoes_provedor.py
│       │   └── registry.py
│       └── reports/
│           ├── atividades.py
│           └── atividades_usuario.py
└── utils/
    ├── email.py             # Integração Resend
    └── responses.py         # Resposta padronizada
```

---

## Padrões de Código

### Módulo típico

Cada módulo segue a estrutura `models → schemas → service → router`:

```
módulo/
├── models.py    # SQLAlchemy ORM models
├── schemas.py   # Pydantic v2 input/output schemas
├── service.py   # Lógica de negócio (queries, validações)
└── router.py    # FastAPI router com endpoints
```

### Service Pattern

```python
# service.py — lógica isolada, recebe db session
async def create_contrato(
    db: AsyncSession,
    tenant_id: UUID,
    data: ContratoCreate,
) -> Contract:
    contrato = Contract(tenant_id=tenant_id, **data.model_dump())
    db.add(contrato)
    await db.commit()
    await db.refresh(contrato)
    return contrato
```

### Router Pattern

```python
# router.py — delegates to service
_ctx = tenant_context(UserRole.ADMIN, UserRole.MANAGER)

@router.post("/", response_model=ContratoResponse, status_code=201)
async def create_contrato(
    data: ContratoCreate,
    ctx: TenantContext = Depends(_ctx),
    db: AsyncSession = Depends(get_db),
):
    return await contratos_service.create_contrato(db, ctx.tenant_id, data)
```

### Adicionando novo endpoint

1. Crie ou edite `schemas.py` com os tipos de entrada/saída
2. Implemente a lógica em `service.py`
3. Adicione o endpoint em `router.py` com a dependency correta
4. Registre o router em `app/main.py` se for um módulo novo

### Adicionando nova tabela

1. Defina o modelo em `models.py` estendendo `Base` de `app/database/base.py`
2. Crie uma migration:
   ```bash
   alembic revision --autogenerate -m "descricao curta"
   ```
3. Revise o arquivo gerado em `alembic/versions/`
4. Aplique:
   ```bash
   alembic upgrade head
   ```

---

## Comandos Úteis

### Alembic

```bash
# Criar migration automática
alembic revision --autogenerate -m "add coluna x em tabela y"

# Aplicar pendentes
alembic upgrade head

# Reverter última
alembic downgrade -1

# Ver histórico
alembic history --verbose

# Ver estado atual
alembic current
```

### Docker

```bash
# Subir banco
docker-compose -f docker-compose.dev.yml up -d

# Parar banco
docker-compose -f docker-compose.dev.yml down

# Ver logs
docker-compose -f docker-compose.dev.yml logs -f

# Acessar psql
docker exec -it teleradar_postgres psql -U teleradar -d teleradar_pgo
```

### Frontend

```bash
cd web

# Desenvolvimento
npm run dev

# Build de produção
npm run build

# Rodar produção localmente
npm start

# Lint
npm run lint

# Type check
npx tsc --noEmit
```

---

## Testes

```bash
# Rodar todos os testes
pytest

# Rodar com verbose
pytest -v

# Rodar arquivo específico
pytest tests/test_auth.py

# Rodar com cobertura
pytest --cov=app --cov-report=html
```

> **Atenção:** A cobertura de testes está baixa. Contribuições para testes são bem-vindas.

---

## Variáveis de Ambiente Completas

```env
# === BANCO DE DADOS ===
DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/db

# === AUTENTICAÇÃO ===
SECRET_KEY=<openssl rand -hex 32>
BOOTSTRAP_SECRET=<openssl rand -hex 16>

# === EMAIL (Resend) ===
RESEND_API_KEY=re_xxxx
ADMIN_MASTER_EMAIL=admin@empresa.com

# === GOOGLE OAUTH (opcional) ===
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# === CORS ===
CORS_ORIGINS=https://frontend.com,http://localhost:3000

# === AMBIENTE ===
ENVIRONMENT=development  # ou production

# === RENDER FREE TIER (monitoramento) ===
DB_CREATED_AT=2026-02-21
DB_STORAGE_ALERT_MB=800
```

---

## Convenções de Commit

Siga o padrão **Conventional Commits**:

```
<tipo>(<escopo>): <descrição>

Tipos:
  feat      → Nova funcionalidade
  fix       → Correção de bug
  docs      → Documentação
  refactor  → Refatoração sem mudança de comportamento
  test      → Adição/correção de testes
  chore     → Manutenção, deps, config

Exemplos:
  feat(contracts): adicionar filtro por status
  fix(produttivo): corrigir parsing do campo metragem
  docs(readme): atualizar instruções de deploy
  chore(deps): atualizar SQLAlchemy para 2.0.36
```

---

## Workflow de Desenvolvimento

1. Crie um branch a partir de `main`:
   ```bash
   git checkout -b feature/nome-da-funcionalidade
   ```

2. Implemente as mudanças seguindo os padrões acima

3. Rode os testes:
   ```bash
   pytest
   ```

4. Commit com mensagem descritiva

5. Abra Pull Request para `main`

---

## Integração com Produttivo (Desenvolvimento)

Para testar a integração com o Produttivo localmente, você precisa de credenciais reais do Produttivo (ambiente de produção — não há sandbox disponível).

1. Crie um usuário MASTER e faça login
2. Crie um tenant
3. Acesse `POST /modules/produttivo/config/cookie` e envie um cookie válido
4. Ou use `POST /modules/produttivo/config/gerar-cookie` com e-mail e senha do Produttivo

Para debug dos campos de formulário:
```bash
GET /modules/produttivo/debug/fill-fields?data_inicio=01/03/2026&data_fim=10/03/2026&form_id=359797
```

---

## Problemas Comuns

### `asyncpg.exceptions.TooManyConnectionsError`
O pool de conexões atingiu o limite. Verifique se há sessões abertas sem fechar ou reduza o número de workers do Uvicorn.

### `alembic.util.exc.CommandError: Can't locate revision identified by...`
O banco está desatualizado. Rode `alembic upgrade head`.

### Cookie Produttivo inválido
Cookies de sessão do Produttivo expiram. Use `POST /modules/produttivo/config/gerar-cookie` para renovar automaticamente ou obtenha um novo cookie manualmente pelo DevTools do browser.

### `playwright._impl._errors.Error: Executable doesn't exist`
Execute `playwright install chromium` para instalar o browser headless.
