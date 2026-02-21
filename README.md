# Teleradar PGO

Sistema de gestão para ISPs (Provedores de Internet) — multi-tenant, RBAC, seguro e escalável.

**Stack:** Python 3.11 + FastAPI + PostgreSQL + SQLAlchemy 2.0 (async) + Alembic + JWT

---

## Arquitetura

```
Client -> FastAPI -> PostgreSQL
                 -> SMTP
                 -> Google OAuth2
```

Rotas principais:
- `/auth` — Autenticação
- `/admin` — Administração
- `/users` — Perfis
- `/tenants` — Tenants
- `/client` — Portal Cliente
- `/modules/*` — Scaffolds 501

---

## Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| Framework | FastAPI 0.115 |
| ORM | SQLAlchemy 2.0 (async) |
| Banco | PostgreSQL (asyncpg) |
| Migrações | Alembic |
| Auth | JWT (python-jose) + bcrypt |
| Config | pydantic-settings + .env |
| Email | aiosmtplib |
| Deploy | Render.com |

---

## Pré-requisitos

- Python 3.11+
- PostgreSQL 14+
- `pg_dump` / `psql` (para scripts de backup)

---

## Como rodar localmente

```bash
# 1. Clonar o repositório
git clone https://github.com/ricardoarfr/teleradar-pgo.git
cd teleradar-pgo

# 2. Criar ambiente virtual
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# 3. Instalar dependências
pip install -r requirements.txt

# 4. Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com seus valores reais

# 5. Executar migrations
alembic upgrade head

# 6. Iniciar o servidor
uvicorn app.main:app --reload

# API disponível em: http://localhost:8000
# Documentação:      http://localhost:8000/docs
```

---

## Criar o usuário MASTER (primeiro acesso)

O MASTER é criado via endpoint protegido por `BOOTSTRAP_SECRET`. Funciona apenas se não existir nenhum MASTER no banco.

```bash
curl -X POST http://localhost:8000/auth/master/bootstrap \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Administrador Master",
    "email": "master@teleradar.com.br",
    "password": "senha-segura-aqui",
    "bootstrap_secret": "seu-BOOTSTRAP_SECRET-do-env"
  }'
```

**Importante:** Após criar o MASTER, o endpoint retorna 403 permanentemente (a condição "sem MASTER" nunca mais se repete).

---

## Como fazer deploy no Render

1. Faça fork ou push do repositório para o GitHub
2. Acesse [render.com](https://render.com) -> New -> Blueprint
3. Selecione o repositório `teleradar-pgo`
4. O Render detecta o `render.yaml` automaticamente
5. Configure as variáveis de ambiente manuais no dashboard:
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`
   - `ADMIN_MASTER_EMAIL`
   - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (opcional)
6. Clique em **Apply** — o deploy inicia automaticamente

O `render.yaml` já configura:
- Web Service (Free) com `alembic upgrade head` no build
- PostgreSQL (Free) com conexão automática via `DATABASE_URL`
- `SECRET_KEY` e `BOOTSTRAP_SECRET` gerados automaticamente

---

## Comandos Alembic

```bash
# Criar nova migration
alembic revision --autogenerate -m "descricao da mudanca"

# Aplicar migrations pendentes
alembic upgrade head

# Reverter última migration
alembic downgrade -1

# Ver histórico
alembic history

# Ver migration atual
alembic current
```

---

## Endpoints da API

### Auth
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/auth/register` | Cadastro de novo usuário |
| POST | `/auth/login` | Login email + senha |
| POST | `/auth/refresh` | Renovar access token |
| POST | `/auth/logout` | Invalidar refresh token |
| POST | `/auth/forgot-password` | Solicitar reset de senha |
| POST | `/auth/reset-password` | Confirmar reset com token |
| POST | `/auth/change-password` | Alterar senha (autenticado) |
| GET | `/auth/me` | Dados do usuário autenticado |
| GET | `/auth/google` | Redirect OAuth2 Google |
| GET | `/auth/google/callback` | Callback OAuth2 Google |
| POST | `/auth/master/bootstrap` | Criar MASTER (só 1 vez) |

### Admin (requer ADMIN ou MASTER)
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/admin/users` | Listar usuários com filtros |
| GET | `/admin/users/pending` | Listar pendentes |
| GET | `/admin/users/{id}` | Detalhes de um usuário |
| POST | `/admin/users/{id}/approve` | Iniciar aprovação (envia código) |
| POST | `/admin/users/confirm-approval` | Confirmar aprovação com código |
| POST | `/admin/users/{id}/block` | Bloquear usuário |
| POST | `/admin/users/{id}/unblock` | Desbloquear usuário |
| PUT | `/admin/users/{id}/role` | Alterar role |

### Users (autenticado)
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/users/me` | Ver perfil |
| PUT | `/users/me` | Editar perfil |

### Tenants (requer ADMIN ou MASTER)
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/tenants/` | Criar tenant |
| GET | `/tenants/` | Listar tenants |
| GET | `/tenants/{id}` | Detalhes do tenant |
| PUT | `/tenants/{id}` | Atualizar tenant |

### Portal do Cliente (requer role CLIENT)
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/client/me` | Dados do cliente |
| GET | `/client/overview` | Dashboard (scaffold) |

### Módulos (scaffolds — retornam 501)
- `/modules/contracts`
- `/modules/projects`
- `/modules/materials`
- `/modules/payments`
- `/modules/reports`

---

## Checklist de Segurança

- [x] Senhas com bcrypt (cost factor 12)
- [x] JWT HS256 com secret via env
- [x] Rate limiting: 5 tentativas -> lock 15 min
- [x] Lock automático de conta
- [x] Tokens de uso único com TTL (reset senha, aprovação)
- [x] Audit log em toda ação de autenticação
- [x] .env nunca commitado (.gitignore)
- [x] SQL Injection protegido via SQLAlchemy ORM
- [x] Validação de input via Pydantic v2
- [x] CORS configurável via env
- [x] HTTPS enforçado em produção (Render garante)
- [x] Isolamento de tenant no portal do cliente
- [x] Hierarquia de roles aplicada em todos os endpoints
- [x] MASTER criado apenas via bootstrap (endpoint protegido por secret)
- [x] Pool de conexões configurado com limites seguros (Free Tier)

---

## Upgrade Path — Render Free -> Produção

| Quando agir | Serviço | Plano | Custo |
|---|---|---|---|
| Banco expira (30 dias) | Render Postgres | Basic-256mb | $6/mês |
| Cold start inaceitável | Render Web | Starter | $7/mês |
| Storage > 800 MB | Render Postgres | Basic-256mb | $6/mês |
| Usuários em produção real | Ambos | Starter | $13/mês |
| Performance crítica | Ambos | Standard | $44/mês |

**Workaround gratuito para hibernação:** Configure o [UptimeRobot](https://uptimerobot.com) (free) para fazer ping em `/health` a cada 14 minutos.
