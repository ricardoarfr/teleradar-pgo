# Arquitetura — Teleradar PGO

## Visão Geral

O Teleradar PGO é uma aplicação **full-stack multi-tenant SaaS** composta por:

- **Backend:** FastAPI (Python 3.11, async-first)
- **Frontend:** Next.js 15 (React 18, TypeScript)
- **Banco de dados:** PostgreSQL 14+ com SQLAlchemy 2.0 async
- **Integração principal:** API do Produttivo (dados de campo em tempo real)

---

## Diagrama de Componentes

```
┌──────────────────────────────────────────────────────────────────┐
│  CAMADA DE CLIENTE                                               │
│                                                                  │
│  Next.js 15 + React 18 + TypeScript                             │
│  Tailwind CSS │ Radix UI │ TanStack React Query │ React Hook Form│
│  ─────────────────────────────────────────────────────────────  │
│  (auth)                    (protected)                           │
│  /login   /register        /admin   /produttivo   /catalogo     │
│  /forgot  /reset           /contratos  /partners  /companies    │
└───────────────────────┬──────────────────────────────────────────┘
                        │ HTTPS / Axios
                        │ JWT Bearer Token
┌───────────────────────▼──────────────────────────────────────────┐
│  CAMADA DE API (FastAPI 0.115)                                   │
│                                                                  │
│  Routers: /auth  /admin  /users  /tenants  /modules/*           │
│  Middleware: CORS │ JWT │ Rate Limiting                          │
│  Pydantic v2 para validação                                     │
└───────────────────────┬──────────────────────────────────────────┘
                        │
          ┌─────────────┼──────────────┐
          │             │              │
┌─────────▼──────┐ ┌────▼────┐ ┌──────▼────────────────────────┐
│  SERVICE LAYER │ │  RBAC   │ │  MÓDULOS DE NEGÓCIO            │
│                │ │  TENANT │ │  contracts / projects          │
│  auth.service  │ │  CONTEXT│ │  materials / payments          │
│  admin.service │ │         │ │  partners / reports            │
│  tenant.service│ │         │ │  catalogo (LPU)                │
└─────────┬──────┘ └────┬────┘ │  produttivo (integração)       │
          │             │      └──────┬────────────────────────┘
          └─────────────┴─────────────┘
                        │
┌───────────────────────▼──────────────────────────────────────────┐
│  CAMADA DE DADOS (SQLAlchemy 2.0 async + asyncpg)               │
│                                                                  │
│  Pool: 5 base + 10 overflow, 30s timeout                        │
│  20+ tabelas com UUID PKs                                        │
└───────────────────────┬──────────────────────────────────────────┘
                        │
┌───────────────────────▼──────────────────────────────────────────┐
│  POSTGRESQL 14+                                                  │
│  Enums │ JSONB │ UUID │ Cascades │ Unique Constraints            │
└──────────────────────────────────────────────────────────────────┘

INTEGRAÇÕES EXTERNAS:
  ┌─────────────────┐  ┌─────────────┐  ┌──────────────────────┐
  │  Produttivo API │  │ Resend.com  │  │  Google OAuth2       │
  │  (campo+forms)  │  │  (e-mails)  │  │  (auth opcional)     │
  └─────────────────┘  └─────────────┘  └──────────────────────┘
  ┌─────────────────┐
  │  Playwright     │
  │  (login auto)   │
  └─────────────────┘
```

---

## Módulos e Responsabilidades

### `app/auth/`
Autenticação completa do sistema.

- Registro com e-mail de confirmação
- Login com e-mail + senha (rate limiting: 5 tentativas → lock 15 min)
- JWT: access token (30 min) + refresh token (7 dias)
- Reset de senha via token one-time com TTL 15 min
- Google OAuth2 (opcional)
- Bootstrap do usuário MASTER (endpoint único protegido por secret)
- Audit log de todas as ações

**Arquivos chave:** `service.py`, `jwt.py`, `router.py`

---

### `app/admin/`
Painel de administração de usuários.

- Listagem e filtragem de usuários
- Fluxo de aprovação: ADMIN inicia → código enviado por e-mail → ADMIN confirma
- Bloqueio/desbloqueio de usuários
- Alteração de roles (ADMIN não pode promover a MASTER/ADMIN)

**Arquivos chave:** `service.py`, `router.py`

---

### `app/rbac/`
Controle de acesso baseado em roles e isolamento multi-tenant.

**Role hierarchy:**
```
MASTER → ADMIN → MANAGER → STAFF → PARTNER
```

**Modelos de permissão:**
- `RolePermission`: permissões por ação (ex: `view_contracts`)
- `ScreenPermission`: flags can_view/can_create/can_edit/can_delete por tela

**Contexto multi-tenant (`tenant.py`):**
```python
# Dependency factory que resolve o tenant_id efetivo
_ctx = tenant_context(UserRole.ADMIN, UserRole.MASTER)

@router.post("/lpu")
async def create_lpu(ctx: TenantContext = Depends(_ctx)):
    ctx.tenant_id   # garantido e validado
    ctx.tenant_ids  # lista de tenants acessíveis
```

**Regras de resolução de tenant:**
| Situação | Comportamento |
|----------|--------------|
| 1 tenant | tenant_id inferido automaticamente |
| N tenants | `?tenant_id=` obrigatório (deve estar na lista) |
| MASTER | `?tenant_id=` obrigatório (qualquer tenant) |
| Sem tenant | 403 Forbidden |

---

### `app/tenants/`
CRUD de tenants (empresas/organizações).

- Tenant é a unidade de isolamento de dados
- Status: ACTIVE / INACTIVE
- Associação N:N com usuários via `user_tenants`

---

### `app/modules/contracts/`
Gestão do ciclo de vida de contratos.

- Status: ACTIVE / SUSPENDED / CANCELLED
- Serviços vinculados (`ContractServico`)
- Anexos com path de arquivo (`ContractAnexo`)
- Log de auditoria com ação + descrição (`ContractLog`)
- `start_date` obrigatório

---

### `app/modules/catalogo/lpu/`
Catálogo de serviços com modelo de preços LPU (Lista de Preço Única).

**Conceito central:**
- `Classe` → agrupa serviços (ex: "Infraestrutura")
- `Unidade` → unidade de medida (ex: "metro", "un")
- `Servico` → serviço global sem preço (preço fica no `LPUItem`)
- `LPU` → lista de preços vinculada a um parceiro + tenant
- `LPUItem` → preço do serviço dentro de uma LPU específica

O mesmo serviço pode ter preços diferentes em LPUs diferentes para parceiros distintos.

---

### `app/modules/produttivo/`
Módulo de integração com a plataforma Produttivo. **Nenhum dado de campo é armazenado localmente** — tudo buscado em tempo real.

**Componentes:**

| Arquivo | Responsabilidade |
|---------|-----------------|
| `api_client.py` | Cliente HTTP async para a API do Produttivo |
| `config_models.py` | Armazena cookie de sessão + account_id por tenant |
| `forms/base.py` | Classe abstrata para extratores de formulário |
| `forms/lancamento_cabo.py` | Extrator do form 359797 (cabo/cordoalha) |
| `forms/fusoes_provedor.py` | Extrator do form 375197 (CEO/CTO/DIO) |
| `forms/registry.py` | Registro central de todos os extratores |
| `reports/atividades.py` | Relatório: todas as atividades |
| `reports/atividades_usuario.py` | Relatório: por técnico × atividade |
| `excel.py` | Exportação para Excel |

**Fluxo de dados do relatório:**
```
Produttivo API
    ↓ (busca todos os fills no intervalo de datas)
Filtros opcionais (form_id, user_id, resource_place_id, work_id)
    ↓
Agrupamento por (work_id, user_id)
    ↓
Extração de dados via form models (cabo, fusões, etc.)
    ↓
Agregação de métricas de produção
    ↓
JSON ou Excel
```

**Como adicionar novo formulário:**
1. Criar `app/modules/produttivo/forms/meu_form.py` estendendo `BaseFormModel`
2. Implementar `extrair_dados(fill)` e `extrair_producao(fill)`
3. Registrar em `app/modules/produttivo/forms/registry.py`

---

### `web/` — Frontend Next.js

**Estrutura de rotas:**
```
/                    → Redireciona conforme autenticação
/(auth)
  /login             → Formulário de login
  /register          → Cadastro de novo usuário
  /forgot-password   → Solicitar reset
  /reset-password    → Confirmar reset com token

/(protected)         → Todas as rotas exigem JWT válido
  /admin/users       → Gestão de usuários
  /admin/profiles    → Gestão de permissões por role
  /produttivo        → Dashboard Produttivo
    /configuracoes   → Configurar cookie + account_id
    /relatorio-usuario     → Relatório por técnico
    /relatorio-atividades  → Relatório geral
  /catalogo
    /lpu, /classes, /servicos, /unidades, /materiais
  /contratos
  /companies         → Tenants
  /partners
```

**Autenticação no frontend:**
- Tokens JWT armazenados em cookies HTTP-only via Next.js Server Actions
- `middleware.ts` protege rotas `/(protected)`
- `web/lib/api.ts` — cliente Axios com interceptor para refresh automático

---

## Multi-Tenant Architecture

```
Tenant A ──┐
           ├── user_tenants (N:N) ── User (pode pertencer a N tenants)
Tenant B ──┘

Cada query de negócio é filtrada por tenant_id:
  SELECT * FROM contracts WHERE tenant_id = :tenant_id

MASTER não tem tenant_id no campo user.tenant_id,
mas pode acessar qualquer tenant via ?tenant_id=
```

---

## Segurança

| Aspecto | Implementação |
|---------|--------------|
| Senhas | bcrypt cost 12 |
| Tokens | JWT HS256, access 30 min, refresh 7 dias |
| Rate limiting | 5 tentativas → lock 15 min (por usuário) |
| Tokens OTP | TTL 15 min, flag `used` (não reutilizáveis) |
| Audit log | Toda ação de auth registrada com IP + user-agent |
| SQL Injection | SQLAlchemy ORM parametrizado |
| Input | Pydantic v2 strict |
| CORS | Configurável via `CORS_ORIGINS` |
| Isolamento | Toda query filtrada por tenant_id |
| Bootstrap | MASTER criável apenas 1 vez via `BOOTSTRAP_SECRET` |

---

## Dependências Externas

| Serviço | Uso | Config |
|---------|-----|--------|
| **Produttivo** | Dados de campo (forms, works, users) | Cookie por tenant + account_id |
| **Resend.com** | Envio de e-mails transacionais | `RESEND_API_KEY` |
| **Google OAuth2** | Login social (opcional) | `GOOGLE_CLIENT_ID/SECRET` |
| **Playwright** | Login automático no Produttivo | Instalado no build |
| **Render.com** | Hosting (API + frontend + banco) | `render.yaml` |

---

## Decisões Arquiteturais

### Por que FastAPI async?
Todas as operações de I/O (banco, Produttivo API, e-mail) são não-bloqueantes. Com SQLAlchemy 2.0 async + asyncpg, o sistema suporta muitas requisições concorrentes com pool mínimo (free tier).

### Por que não armazenar dados do Produttivo?
Evita sincronização bidirecional complexa e manter dados desatualizados. O Produttivo é a fonte da verdade para dados de campo.

### Por que LPU separado do Servico?
O mesmo serviço tem preços diferentes por parceiro/contrato. Separar o catálogo de serviços (global) dos preços (por LPU) permite flexibilidade sem duplicação.

### Por que N:N entre User e Tenant?
Consultores e administradores frequentemente atuam em múltiplos provedores. A associação N:N via `user_tenants` suporta esse caso de uso sem criar múltiplas contas.
