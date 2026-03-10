# Teleradar PGO

**Back-office unificado para provedores de internet (ISPs)** — centraliza contratos, equipes de campo e relatórios de produtividade em um único sistema multi-tenant, conectando-se em tempo real ao [Produttivo](https://app.produttivo.com.br) sem alterar a forma como os técnicos trabalham.

---

## Visão Geral

```
Problema: Dados espalhados entre Produttivo, planilhas e e-mails.
Solução:  Um back-office único com sync em tempo real, contratos, gestão
          de equipes, catálogo de serviços e relatórios consolidados.
```

**Principais funcionalidades:**

- Gestão de contratos (status, serviços, anexos, log de auditoria)
- Integração em tempo real com a API do Produttivo (atividades de campo, formulários)
- Catálogo de serviços com LPU — Lista de Preço Única por parceiro
- Controle de pagamentos vinculados a contratos
- Gestão de parceiros/subcontratados (CPF/CNPJ, endereço, contato)
- Relatórios de produtividade agrupados por técnico, atividade e localização
- Controle de acesso por papéis (RBAC) com isolamento multi-tenant

---

## Arquitetura

```mermaid
flowchart TD
    A[Browser / Next.js 15] -->|HTTPS + JWT| B[FastAPI 0.115]
    B --> C[(PostgreSQL 14+)]
    B --> D[Produttivo API]
    B --> E[Resend — E-mail]
    B --> F[Google OAuth2]
    B --> G[Playwright — Login automático]
```

Detalhes completos em [ARCHITECTURE.md](./ARCHITECTURE.md).

---

## Stack Tecnológica

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| Framework backend | FastAPI | 0.115.0 |
| Servidor ASGI | Uvicorn | 0.30.6 |
| Linguagem | Python | 3.11+ |
| ORM | SQLAlchemy (async) | 2.0.36 |
| Banco de dados | PostgreSQL | 14+ |
| Driver async | asyncpg | 0.30.0 |
| Validação | Pydantic v2 | 2.10.6 |
| Auth | JWT (python-jose) + bcrypt | - |
| Migrações | Alembic | 1.13.3 |
| Cliente HTTP | httpx | 0.27.2 |
| E-mail | Resend | 2.10.0 |
| Automação de browser | Playwright | 1.49.0 |
| Processamento de dados | pandas + openpyxl | 2.2.3 / 3.1.5 |
| Framework frontend | Next.js | 15.5.12 |
| Biblioteca UI | React | 18.3.1 |
| Componentes | Radix UI | - |
| Estilo | Tailwind CSS | 3.4.17 |
| Estado servidor | TanStack React Query | 5.64.1 |
| Formulários | React Hook Form + Zod | - |
| Deploy | Render.com | - |

---

## Estrutura do Repositório

```
teleradar-pgo/
├── app/                    # Backend FastAPI
│   ├── main.py             # Entry point + registro de routers
│   ├── config/             # Settings e logging
│   ├── database/           # Engine async + session factory
│   ├── auth/               # Autenticação e JWT
│   ├── admin/              # Painel admin (aprovação, bloqueio, roles)
│   ├── rbac/               # RBAC + contexto multi-tenant
│   ├── tenants/            # Gestão de tenants
│   ├── users/              # Perfis de usuário
│   ├── partner_portal/     # Portal do parceiro
│   ├── modules/
│   │   ├── contracts/      # Contratos
│   │   ├── projects/       # Projetos
│   │   ├── materials/      # Estoque de materiais
│   │   ├── payments/       # Pagamentos
│   │   ├── partners/       # Perfis de parceiros
│   │   ├── reports/        # Relatórios customizados
│   │   ├── catalogo/       # Catálogo (LPU, classes, serviços, unidades)
│   │   └── produttivo/     # Integração Produttivo (API + relatórios)
│   └── utils/              # E-mail, respostas padronizadas
├── web/                    # Frontend Next.js
│   ├── app/
│   │   ├── (auth)/         # Rotas públicas (login, cadastro, recuperação)
│   │   └── (protected)/    # Rotas protegidas (dashboard, módulos)
│   ├── components/         # Componentes React reutilizáveis
│   ├── hooks/              # Custom hooks
│   ├── lib/                # API client, helpers
│   └── types/              # Tipos TypeScript
├── alembic/                # Migrações do banco
│   └── versions/           # Arquivos de migração
├── tests/                  # Testes
├── scripts/                # Scripts utilitários
├── docker-compose.dev.yml  # PostgreSQL local para desenvolvimento
├── render.yaml             # Blueprint de deploy no Render.com
├── requirements.txt        # Dependências Python
└── CLAUDE.md               # Diretrizes para Claude Code
```

---

## Como Rodar Localmente

### Pré-requisitos

- Python 3.11+
- Node.js 20+
- Docker (para o PostgreSQL local)

### Backend

```bash
# 1. Clone o repositório
git clone https://github.com/ricardoarfr/teleradar-pgo.git
cd teleradar-pgo

# 2. Crie o ambiente virtual
python -m venv .venv
source .venv/bin/activate        # Linux/macOS
# .venv\Scripts\activate         # Windows

# 3. Instale as dependências
pip install -r requirements.txt
playwright install chromium      # Para o login automático do Produttivo

# 4. Configure as variáveis de ambiente
cp .env.example .env
# Edite o .env com seus valores reais

# 5. Suba o PostgreSQL local
docker-compose -f docker-compose.dev.yml up -d

# 6. Execute as migrations
alembic upgrade head

# 7. Inicie o servidor
uvicorn app.main:app --reload

# API: http://localhost:8000
# Docs: http://localhost:8000/docs
```

### Frontend

```bash
cd web
npm install
npm run dev

# Web: http://localhost:3000
```

### Criar o Usuário MASTER (primeiro acesso)

```bash
curl -X POST http://localhost:8000/auth/master/bootstrap \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Administrador Master",
    "email": "master@empresa.com",
    "password": "senha-segura",
    "bootstrap_secret": "valor-de-BOOTSTRAP_SECRET-no-.env"
  }'
```

> Após a criação, o endpoint retorna 403 permanentemente.

---

## Deploy (Render.com)

1. Faça push do repositório para o GitHub
2. Acesse [render.com](https://render.com) → **New → Blueprint**
3. Selecione o repositório — o Render detecta o `render.yaml` automaticamente
4. Configure as variáveis manuais no dashboard:
   - `RESEND_API_KEY`
   - `ADMIN_MASTER_EMAIL`
   - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (opcional)
5. Clique em **Apply** — o deploy inicia automaticamente

O `render.yaml` provisiona:
- Web Service (API FastAPI) + PostgreSQL Free Tier
- `SECRET_KEY` e `BOOTSTRAP_SECRET` gerados automaticamente
- Migrations executadas no build (`alembic upgrade head`)

> **Limite Free Tier:** O banco PostgreSQL expira em 30 dias. Veja a seção de upgrade abaixo.

---

## Variáveis de Ambiente

| Variável | Obrigatório | Descrição |
|----------|-------------|-----------|
| `DATABASE_URL` | Sim | `postgresql+asyncpg://user:pass@host:5432/db` |
| `SECRET_KEY` | Sim | Chave para JWT (`openssl rand -hex 32`) |
| `BOOTSTRAP_SECRET` | Sim | Proteção do endpoint `/auth/master/bootstrap` |
| `RESEND_API_KEY` | Sim | API key da Resend para e-mails |
| `ADMIN_MASTER_EMAIL` | Sim | E-mail que recebe códigos de aprovação |
| `CORS_ORIGINS` | Sim | URLs permitidas (ex: `https://frontend.com`) |
| `GOOGLE_CLIENT_ID` | Não | OAuth2 Google |
| `GOOGLE_CLIENT_SECRET` | Não | OAuth2 Google |
| `DB_CREATED_AT` | Não | Data de criação do banco (alerta de expiração) |

---

## Módulo Produttivo

Integração central do sistema. Busca atividades de campo em tempo real da API do Produttivo sem armazenar os dados localmente.

### Configuração por Tenant

```
POST /modules/produttivo/config/cookie       → salvar cookie de sessão
POST /modules/produttivo/config/account-id   → salvar account_id
POST /modules/produttivo/config/gerar-cookie → login automático via Playwright
GET  /modules/produttivo/config/validate     → validar cookie
```

### Formulários Implementados

| Form ID | Nome | Extrai |
|---------|------|--------|
| `359797` | LANÇAMENTO DE CABO V4 | `cabo_m`, `cordoalha_m` |
| `375197` | FUSÕES PROVEDOR V5 | `ceo`, `cto`, `dio` |

### Relatórios

```
GET /modules/produttivo/relatorio/usuario      → por técnico × atividade
GET /modules/produttivo/relatorio/atividades   → todas as atividades
```

Parâmetros: `data_inicio`, `data_fim` (DD/MM/YYYY), `user_ids[]`, `form_ids[]`, `resource_place_ids[]`, `work_ids[]`

Retorno: JSON ou Excel com Cliente, Atividade, Usuário, Qtd, Datas, CABO (m), CORDOALHA (m), CEO, CTO, DIO.

---

## Hierarquia de Roles

```
MASTER  → Acesso total a todos os tenants
ADMIN   → Gerencia recursos e usuários do tenant
MANAGER → Acesso operacional, não pode aprovar usuários
STAFF   → Acesso de leitura e entrada de dados
PARTNER → Portal restrito ao próprio perfil e contratos
```

Detalhes completos em [ARCHITECTURE.md](./ARCHITECTURE.md).

---

## Documentação Adicional

| Arquivo | Conteúdo |
|---------|---------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Arquitetura detalhada, módulos, fluxos de dados |
| [API.md](./API.md) | Todos os endpoints com exemplos |
| [DATA_MODEL.md](./DATA_MODEL.md) | Modelos de dados, tabelas, relacionamentos |
| [DEVELOPMENT.md](./DEVELOPMENT.md) | Guia completo para desenvolvedores |
| [AI_CONTEXT.md](./AI_CONTEXT.md) | Contexto para assistentes de IA |

---

## Upgrade Path — Free → Produção

| Quando agir | Serviço | Plano | Custo |
|-------------|---------|-------|-------|
| Banco expira (30 dias) | Render Postgres | Basic-256mb | $6/mês |
| Cold start inaceitável | Render Web | Starter | $7/mês |
| Storage > 800 MB | Render Postgres | Basic-256mb | $6/mês |
| Produção real | Ambos | Starter | $13/mês |

**Workaround gratuito para hibernação:** Configure o [UptimeRobot](https://uptimerobot.com) para fazer ping em `/health` a cada 14 minutos.
