# AI_CONTEXT — Teleradar PGO

> Este arquivo foi criado para que assistentes de IA (Claude, GPT, Copilot, etc.)
> compreendam rapidamente o projeto e possam raciocinar corretamente sobre ele.

---

## O que é este sistema?

**Teleradar PGO** é um **back-office SaaS multi-tenant para provedores de internet (ISPs)**.

Seu objetivo central é unificar em uma única plataforma:
1. **Dados de campo** vindos do Produttivo (atividades dos técnicos)
2. **Contratos** com clientes
3. **Catálogo de serviços com preços** (modelo LPU)
4. **Gestão de pagamentos e parceiros**

Os técnicos de campo continuam usando o Produttivo normalmente — o Teleradar apenas consome a API do Produttivo em tempo real, sem armazenar os dados localmente.

---

## Stack em uma linha

**Backend:** Python 3.11 + FastAPI (async) + PostgreSQL + SQLAlchemy 2.0
**Frontend:** Next.js 15 + React 18 + TypeScript + Tailwind CSS
**Deploy:** Render.com

---

## Organização dos Módulos

```
app/
├── auth/           → Login, registro, JWT, OAuth Google, reset de senha
├── admin/          → Aprovação de usuários, bloqueio, alteração de roles
├── rbac/           → Controle de acesso por roles + contexto multi-tenant
├── tenants/        → CRUD de tenants (empresas/provedores)
├── users/          → Perfil de usuário
└── modules/
    ├── contracts/  → Contratos (status, serviços, anexos, log)
    ├── projects/   → Projetos internos
    ├── materials/  → Estoque de materiais
    ├── payments/   → Pagamentos vinculados a contratos
    ├── partners/   → Perfis de parceiros/subcontratados
    ├── reports/    → Relatórios (em desenvolvimento)
    ├── catalogo/
    │   ├── lpu/    → Catálogo de serviços + Lista de Preço Única por parceiro
    │   └── materiais/ → Catálogo global de materiais
    └── produttivo/ → Integração com Produttivo API (módulo central)
```

---

## Conceitos Arquiteturais Importantes

### Multi-tenancy

Cada "tenant" é um provedor de internet. Um usuário pode pertencer a múltiplos tenants (tabela `user_tenants` N:N).

Toda query de negócio filtra por `tenant_id`. A dependency `tenant_context()` resolve qual tenant usar:
- 1 tenant → inferred automaticamente
- N tenants → `?tenant_id=` obrigatório
- MASTER → `?tenant_id=` obrigatório (pode acessar qualquer um)

### Role Hierarchy

```
MASTER > ADMIN > MANAGER > STAFF > PARTNER
```

A dependency `require_roles(*roles)` protege endpoints. Exemplo:
```python
Depends(require_roles(UserRole.ADMIN, UserRole.MASTER))
```

### LPU — Lista de Preço Única

Conceito central do catálogo:
- `Servico` = serviço global **sem preço** (ex: "Lançamento de Cabo 4FO")
- `LPU` = tabela de preços vinculada a um parceiro específico de um tenant
- `LPUItem` = preço daquele serviço naquela LPU específica

O mesmo serviço pode ter preços diferentes para parceiros diferentes.

### Integração Produttivo

O Produttivo é a plataforma onde os técnicos registram as atividades de campo (forms, works, fills).

O Teleradar:
1. Armazena apenas o cookie de sessão + account_id por tenant (`produttivo_configs`)
2. Busca tudo em tempo real via `api_client.py` (httpx async)
3. Extrai métricas via "form models" (extratores de formulário)
4. Gera relatórios consolidados (Excel ou JSON)

Form models implementados:
- Form 359797: Lançamento de Cabo → extrai `cabo_m` e `cordoalha_m`
- Form 375197: Fusões Provedor → extrai `ceo`, `cto`, `dio`

---

## Fluxos Comuns do Sistema

### Fluxo de autenticação

```
1. POST /auth/register → status PENDING
2. ADMIN aprova: POST /admin/users/{id}/approve (envia código por e-mail)
3. ADMIN confirma: POST /admin/users/confirm-approval (com código)
4. Usuário faz: POST /auth/login → recebe access_token + refresh_token
5. Renovação: POST /auth/refresh
```

### Fluxo de relatório Produttivo

```
1. MANAGER configura cookie: POST /modules/produttivo/config/cookie
2. Usuário chama: GET /modules/produttivo/relatorio/usuario?data_inicio=...&data_fim=...
3. Backend busca fills no Produttivo API
4. Agrupa por (work_id, user_id)
5. Aplica form models para extrair métricas
6. Retorna JSON ou Excel
```

### Fluxo de criação de LPU

```
1. Criar serviços globais: POST /modules/catalogo/servicos
2. Criar parceiro: POST /admin/partners
3. Criar LPU vinculada ao parceiro: POST /modules/catalogo/lpu
4. Adicionar itens com preço: POST /modules/catalogo/lpu/{id}/items
```

---

## Responsabilidades por Arquivo

| Arquivo | O que faz |
|---------|----------|
| `app/main.py` | Inicializa o FastAPI, registra todos os routers |
| `app/config/settings.py` | Lê variáveis de ambiente via pydantic-settings |
| `app/database/connection.py` | Cria o engine async + session factory (`get_db`) |
| `app/auth/jwt.py` | Cria e decodifica JWT (access + refresh) |
| `app/auth/dependencies.py` | `get_current_user` — extrai usuário do JWT |
| `app/rbac/tenant.py` | `tenant_context()` — resolve tenant_id efetivo |
| `app/rbac/dependencies.py` | `require_roles()` — guarda endpoints por role |
| `app/modules/produttivo/api_client.py` | Cliente HTTP async para o Produttivo |
| `app/modules/produttivo/forms/base.py` | Classe abstrata para extratores de formulário |
| `app/modules/produttivo/forms/registry.py` | Registro de todos os form models |
| `app/utils/email.py` | Envia e-mails via Resend API |
| `web/middleware.ts` | Protege rotas `/(protected)` no Next.js |
| `web/lib/api.ts` | Cliente Axios com interceptor de refresh token |

---

## Como Modificar o Código com Segurança

### Adicionar novo endpoint

1. Defina schemas em `módulo/schemas.py` (Pydantic v2)
2. Implemente lógica em `módulo/service.py` (recebe `AsyncSession` + `tenant_id`)
3. Adicione endpoint em `módulo/router.py` com dependencies corretas
4. Se novo módulo: registre router em `app/main.py`

### Adicionar nova tabela

1. Defina model em `módulo/models.py` (estende `Base` de `app/database/base.py`)
2. Gere migration: `alembic revision --autogenerate -m "descrição"`
3. Revise o arquivo gerado em `alembic/versions/`
4. Aplique: `alembic upgrade head`

### Adicionar novo form model do Produttivo

1. Crie `app/modules/produttivo/forms/meu_form.py` estendendo `BaseFormModel`
2. Implemente `extrair_dados(fill) → dict` e `extrair_producao(fill) → dict`
3. Registre em `app/modules/produttivo/forms/registry.py`

### Modificar permissões de acesso

- Endpoints de API: modifique a dependency `require_roles()` no router
- Telas do frontend: use a tabela `screen_permissions` via `/admin/profiles`

---

## O que NÃO fazer

- **Não remova tenant_id de queries** — quebra o isolamento multi-tenant
- **Não armazene dados de campo do Produttivo no banco** — use apenas o api_client
- **Não adicione preço diretamente em `Servico`** — preço fica em `LPUItem`
- **Não use `tenant_id` do `user` diretamente** — use sempre `tenant_context()` que resolve N tenants
- **Não commite `.env`** — está no `.gitignore`

---

## Tabelas Globais vs. Por Tenant

| Tabela | Global? | Escopo |
|--------|---------|--------|
| `classes` | Sim | Todos os tenants |
| `unidades` | Sim | Todos os tenants |
| `servicos` | Sim | Todos os tenants |
| `materiais_catalogo` | Sim | Todos os tenants |
| `permissions` | Sim | Todos os tenants |
| `screen_permissions` | Sim | Por role (global) |
| `contracts` | Não | Por tenant |
| `projects` | Não | Por tenant |
| `materials` | Não | Por tenant (estoque) |
| `payments` | Não | Por tenant |
| `lpus` / `lpu_items` | Não | Por tenant |
| `partner_profiles` | Não | Por tenant |
| `produttivo_configs` | Não | Por tenant (1:1) |

---

## Dependências Externas Críticas

| Dependência | Impacto se falhar | Como diagnosticar |
|-------------|------------------|-------------------|
| PostgreSQL | Sistema inteiro para | `GET /health` retorna erro |
| Produttivo API | Módulo Produttivo para | `GET /modules/produttivo/config/validate` |
| Resend | E-mails não enviados | Logs de `app/utils/email.py` |
| Playwright | Login automático Produttivo falha | Erro em `gerar-cookie` endpoint |

---

## Referências Rápidas

- Documentação completa dos endpoints: [API.md](./API.md)
- Modelo de dados detalhado: [DATA_MODEL.md](./DATA_MODEL.md)
- Arquitetura do sistema: [ARCHITECTURE.md](./ARCHITECTURE.md)
- Setup do ambiente de dev: [DEVELOPMENT.md](./DEVELOPMENT.md)
- Swagger interativo (local): http://localhost:8000/docs
