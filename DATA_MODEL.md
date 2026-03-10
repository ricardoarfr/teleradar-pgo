# Modelo de Dados — Teleradar PGO

## Visão Geral

O banco de dados usa **PostgreSQL 14+** com as seguintes convenções:
- UUIDs como chaves primárias
- Timestamps `created_at` / `updated_at` em todas as entidades principais
- Enums nativos do PostgreSQL via SQLAlchemy
- JSONB para dados semiestruturados (audit log)
- Cascades explícitos em todas as FKs

---

## Diagrama de Entidades

```
users ──────────────────────── user_tenants ─── tenants
  │                                                │
  ├── tokens                                       ├── contracts ─── contract_servicos
  ├── audit_logs                                   │                ─── contract_anexos
  └── partner_profiles                             │                ─── contract_logs
                                                   ├── projects
                                                   ├── materials
                                                   ├── payments ──── contracts
                                                   ├── lpus ──────── lpu_items ─── servicos
                                                   │                               ─── classes
                                                   │                               ─── unidades
                                                   └── produttivo_configs

classes ─── servicos ─── unidades
materiais_catalogo ─── unidades

permissions ─── role_permissions
screen_permissions
```

---

## Tabelas

---

### `users`

| Coluna | Tipo | Restrições | Descrição |
|--------|------|-----------|-----------|
| `id` | UUID | PK, default gen_random_uuid() | Identificador único |
| `name` | VARCHAR | NOT NULL | Nome completo |
| `email` | VARCHAR | UNIQUE, NOT NULL, indexed | E-mail de acesso |
| `password_hash` | VARCHAR | NULL | Hash bcrypt (NULL se Google OAuth) |
| `google_id` | VARCHAR | NULL | ID do Google OAuth2 |
| `role` | ENUM(UserRole) | NOT NULL, default STAFF | Role de acesso |
| `status` | ENUM(UserStatus) | NOT NULL, default PENDING | Status da conta |
| `tenant_id` | UUID | FK → tenants, SET NULL | Tenant principal (pode ser NULL para MASTER) |
| `is_active` | BOOLEAN | default true | Se a conta está ativa |
| `login_attempts` | INTEGER | default 0 | Contador de tentativas falhas |
| `locked_until` | TIMESTAMP | NULL | Até quando a conta está bloqueada |
| `created_at` | TIMESTAMP | NOT NULL | Data de criação |
| `updated_at` | TIMESTAMP | NOT NULL | Última atualização |

**Enums:**
```
UserRole:   MASTER | ADMIN | MANAGER | STAFF | PARTNER
UserStatus: PENDING | APPROVED | BLOCKED
```

---

### `user_tenants` (Tabela de Associação N:N)

| Coluna | Tipo | Restrições |
|--------|------|-----------|
| `user_id` | UUID | PK, FK → users(CASCADE) |
| `tenant_id` | UUID | PK, FK → tenants(CASCADE) |

---

### `tokens`

| Coluna | Tipo | Restrições | Descrição |
|--------|------|-----------|-----------|
| `id` | UUID | PK | - |
| `user_id` | UUID | FK → users(CASCADE), NOT NULL | Dono do token |
| `type` | ENUM(TokenType) | NOT NULL | Tipo do token |
| `token` | VARCHAR | UNIQUE, NOT NULL, indexed | Valor do token |
| `expires_at` | TIMESTAMP | NOT NULL | Expiração |
| `used` | BOOLEAN | default false | Se já foi utilizado |
| `created_at` | TIMESTAMP | NOT NULL | - |

**Enum TokenType:** `RESET_PASSWORD | APPROVAL_CODE | REFRESH`

---

### `audit_logs`

| Coluna | Tipo | Restrições | Descrição |
|--------|------|-----------|-----------|
| `id` | UUID | PK | - |
| `user_id` | UUID | FK → users(SET NULL), indexed | Usuário que executou a ação |
| `action` | VARCHAR | NOT NULL, indexed | Ação executada (ex: LOGIN, REGISTER) |
| `ip` | VARCHAR | NULL | IP do cliente |
| `user_agent` | VARCHAR | NULL | User agent do cliente |
| `details` | JSONB | NULL | Dados adicionais da ação |
| `created_at` | TIMESTAMP | NOT NULL | - |

---

### `tenants`

| Coluna | Tipo | Restrições | Descrição |
|--------|------|-----------|-----------|
| `id` | UUID | PK | - |
| `name` | VARCHAR | NOT NULL | Nome da empresa/tenant |
| `status` | ENUM(TenantStatus) | default ACTIVE | Status |
| `created_at` | TIMESTAMP | NOT NULL | - |
| `updated_at` | TIMESTAMP | NOT NULL | - |

**Enum TenantStatus:** `ACTIVE | INACTIVE`

---

### `permissions`

| Coluna | Tipo | Restrições | Descrição |
|--------|------|-----------|-----------|
| `id` | UUID | PK | - |
| `name` | VARCHAR | UNIQUE, NOT NULL, indexed | Chave da permissão (ex: `view_contracts`) |
| `description` | VARCHAR | NULL | Descrição humana |
| `module` | VARCHAR | NULL | Módulo ao qual pertence |
| `created_at` | TIMESTAMP | NOT NULL | - |

---

### `role_permissions`

| Coluna | Tipo | Restrições |
|--------|------|-----------|
| `role` | ENUM(UserRole) | PK |
| `permission_id` | UUID | PK, FK → permissions(CASCADE) |

---

### `screen_permissions`

| Coluna | Tipo | Restrições | Descrição |
|--------|------|-----------|-----------|
| `role` | ENUM(UserRole) | PK | Role |
| `screen_key` | VARCHAR | PK | Chave da tela (ex: `lpu_management`) |
| `can_view` | BOOLEAN | default false | - |
| `can_create` | BOOLEAN | default false | - |
| `can_edit` | BOOLEAN | default false | - |
| `can_delete` | BOOLEAN | default false | - |

---

### `contracts`

| Coluna | Tipo | Restrições | Descrição |
|--------|------|-----------|-----------|
| `id` | UUID | PK | - |
| `tenant_id` | UUID | FK → tenants(CASCADE), NOT NULL, indexed | Tenant dono |
| `numero` | VARCHAR | NOT NULL, indexed | Número do contrato |
| `client_id` | UUID | FK → users, NULL | Usuário cliente |
| `estado` | VARCHAR | NULL | UF |
| `cidade` | VARCHAR | NULL | Cidade |
| `status` | ENUM(ContractStatus) | default ACTIVE | Status |
| `start_date` | DATE | NOT NULL | Data de início |
| `end_date` | DATE | NULL | Data de término |
| `notes` | TEXT | NULL | Observações |
| `created_by` | UUID | FK → users(SET NULL) | Quem criou |
| `created_at` | TIMESTAMP | NOT NULL | - |
| `updated_at` | TIMESTAMP | NOT NULL | - |

**Enum ContractStatus:** `ACTIVE | SUSPENDED | CANCELLED`

---

### `contract_servicos`

| Coluna | Tipo | Restrições |
|--------|------|-----------|
| `id` | UUID | PK |
| `contract_id` | UUID | FK → contracts(CASCADE), indexed |
| `servico_id` | UUID | indexed |
| UNIQUE | - | (contract_id, servico_id) |
| `created_at` | TIMESTAMP | NOT NULL |

---

### `contract_anexos`

| Coluna | Tipo | Restrições |
|--------|------|-----------|
| `id` | UUID | PK |
| `contract_id` | UUID | FK → contracts(CASCADE), indexed |
| `nome` | VARCHAR | NOT NULL |
| `arquivo_path` | VARCHAR | NOT NULL |
| `created_at` | TIMESTAMP | NOT NULL |

---

### `contract_logs`

| Coluna | Tipo | Restrições | Descrição |
|--------|------|-----------|-----------|
| `id` | UUID | PK | - |
| `contract_id` | UUID | FK → contracts(CASCADE), indexed | - |
| `user_id` | UUID | FK → users(SET NULL), NULL | Quem executou |
| `acao` | VARCHAR | NOT NULL | Ação realizada |
| `descricao` | TEXT | NULL | Detalhes da ação |
| `created_at` | TIMESTAMP | NOT NULL | - |

---

### `projects`

| Coluna | Tipo | Restrições | Descrição |
|--------|------|-----------|-----------|
| `id` | UUID | PK | - |
| `tenant_id` | UUID | FK → tenants(CASCADE), indexed | - |
| `name` | VARCHAR | NOT NULL | - |
| `description` | TEXT | NULL | - |
| `status` | ENUM(ProjectStatus) | default PENDING | - |
| `responsible_id` | UUID | FK → users(SET NULL), NULL | Responsável |
| `start_date` | DATE | NULL | - |
| `end_date` | DATE | NULL | - |
| `created_at` | TIMESTAMP | NOT NULL | - |
| `updated_at` | TIMESTAMP | NOT NULL | - |

**Enum ProjectStatus:** `PENDING | IN_PROGRESS | COMPLETED | CANCELLED`

---

### `materials` (Estoque)

| Coluna | Tipo | Restrições | Descrição |
|--------|------|-----------|-----------|
| `id` | UUID | PK | - |
| `tenant_id` | UUID | FK → tenants(CASCADE), indexed | - |
| `name` | VARCHAR | NOT NULL | - |
| `description` | TEXT | NULL | - |
| `unit` | VARCHAR | NOT NULL | Unidade de medida |
| `quantity` | NUMERIC(10,3) | NOT NULL, default 0 | Quantidade atual |
| `min_quantity` | NUMERIC(10,3) | NOT NULL, default 0 | Quantidade mínima (alerta) |
| `created_at` | TIMESTAMP | NOT NULL | - |
| `updated_at` | TIMESTAMP | NOT NULL | - |

---

### `payments`

| Coluna | Tipo | Restrições | Descrição |
|--------|------|-----------|-----------|
| `id` | UUID | PK | - |
| `tenant_id` | UUID | FK → tenants(CASCADE), indexed | - |
| `contract_id` | UUID | FK → contracts(CASCADE), indexed | - |
| `amount` | NUMERIC(10,2) | NOT NULL | Valor |
| `due_date` | DATE | NOT NULL | Vencimento |
| `paid_at` | TIMESTAMP | NULL | Data do pagamento |
| `status` | ENUM(PaymentStatus) | default PENDING | Status |
| `reference` | VARCHAR | NULL | Referência (ex: "2026/01") |
| `notes` | TEXT | NULL | - |
| `created_at` | TIMESTAMP | NOT NULL | - |
| `updated_at` | TIMESTAMP | NOT NULL | - |

**Enum PaymentStatus:** `PENDING | PAID | OVERDUE | CANCELLED`

---

### `partner_profiles`

| Coluna | Tipo | Restrições | Descrição |
|--------|------|-----------|-----------|
| `id` | UUID | PK | - |
| `user_id` | UUID | FK → users(CASCADE), UNIQUE, indexed | Usuário associado |
| `tenant_id` | UUID | FK → tenants(CASCADE), indexed | - |
| `person_type` | VARCHAR | NOT NULL | `PF` ou `PJ` |
| `cpf_cnpj` | VARCHAR | NULL | CPF ou CNPJ |
| `phone` | VARCHAR | NULL | - |
| `address_street` | VARCHAR | NULL | - |
| `address_number` | VARCHAR | NULL | - |
| `address_complement` | VARCHAR | NULL | - |
| `address_neighborhood` | VARCHAR | NULL | Bairro |
| `address_city` | VARCHAR | NULL | - |
| `address_state` | VARCHAR | NULL | UF |
| `address_cep` | VARCHAR | NULL | CEP |
| `notes` | TEXT | NULL | - |
| `created_at` | TIMESTAMP | NOT NULL | - |
| `updated_at` | TIMESTAMP | NOT NULL | - |

---

### `classes` (Catálogo — Global)

| Coluna | Tipo | Restrições | Descrição |
|--------|------|-----------|-----------|
| `id` | UUID | PK | - |
| `nome` | VARCHAR | UNIQUE, NOT NULL, indexed | Nome da classe |
| `descricao` | TEXT | NULL | - |
| `ativa` | BOOLEAN | default true | - |
| `created_at` | TIMESTAMP | NOT NULL | - |
| `updated_at` | TIMESTAMP | NOT NULL | - |

---

### `unidades` (Catálogo — Global)

| Coluna | Tipo | Restrições | Descrição |
|--------|------|-----------|-----------|
| `id` | UUID | PK | - |
| `nome` | VARCHAR | NOT NULL | Ex: "metro" |
| `sigla` | VARCHAR | UNIQUE, NOT NULL, indexed | Ex: "m" |
| `ativa` | BOOLEAN | default true | - |
| `created_at` | TIMESTAMP | NOT NULL | - |
| `updated_at` | TIMESTAMP | NOT NULL | - |

---

### `servicos` (Catálogo — Global, sem preço)

| Coluna | Tipo | Restrições | Descrição |
|--------|------|-----------|-----------|
| `id` | UUID | PK | - |
| `codigo` | VARCHAR | UNIQUE, NOT NULL, indexed | Código único do serviço |
| `atividade` | VARCHAR | NOT NULL | Descrição da atividade |
| `classe_id` | UUID | FK → classes(RESTRICT), NOT NULL | Classe do serviço |
| `unidade_id` | UUID | FK → unidades(RESTRICT), NOT NULL | Unidade de medida |
| `ativo` | BOOLEAN | default true | - |
| `created_at` | TIMESTAMP | NOT NULL | - |
| `updated_at` | TIMESTAMP | NOT NULL | - |

> **Importante:** `Servico` não tem preço. O preço é definido em `LPUItem`.

---

### `lpus` (Lista de Preço Única — por Tenant+Parceiro)

| Coluna | Tipo | Restrições | Descrição |
|--------|------|-----------|-----------|
| `id` | UUID | PK | - |
| `nome` | VARCHAR | NOT NULL | Ex: "LPU Parceiro X - 2026" |
| `parceiro_id` | UUID | FK → partner_profiles(RESTRICT), indexed | Parceiro vinculado |
| `tenant_id` | UUID | FK → tenants(CASCADE), indexed | Tenant dono |
| `ativa` | BOOLEAN | default true | - |
| `data_inicio` | DATE | NULL | Início da vigência |
| `data_fim` | DATE | NULL | Fim da vigência |
| `created_at` | TIMESTAMP | NOT NULL | - |
| `updated_at` | TIMESTAMP | NOT NULL | - |

---

### `lpu_items`

| Coluna | Tipo | Restrições | Descrição |
|--------|------|-----------|-----------|
| `id` | UUID | PK | - |
| `lpu_id` | UUID | FK → lpus, NOT NULL, indexed | LPU pai |
| `servico_id` | UUID | FK → servicos, NOT NULL, indexed | Serviço precificado |
| UNIQUE | - | (lpu_id, servico_id) | - |
| `valor_unitario` | NUMERIC(15,2) | NOT NULL, CHECK >= 0 | Preço unitário |
| `valor_classe` | NUMERIC(15,2) | NULL, CHECK >= 0 | Preço por classe (opcional) |
| `created_at` | TIMESTAMP | NOT NULL | - |
| `updated_at` | TIMESTAMP | NOT NULL | - |

---

### `materiais_catalogo` (Catálogo — Global)

| Coluna | Tipo | Restrições | Descrição |
|--------|------|-----------|-----------|
| `id` | UUID | PK | - |
| `codigo` | VARCHAR | UNIQUE, NOT NULL | Código do material |
| `descricao` | VARCHAR | NOT NULL | - |
| `unidade_id` | UUID | FK → unidades(RESTRICT) | Unidade de medida |
| `ativo` | BOOLEAN | default true | - |
| `created_at` | TIMESTAMP | NOT NULL | - |
| `updated_at` | TIMESTAMP | NOT NULL | - |

---

### `produttivo_configs`

| Coluna | Tipo | Restrições | Descrição |
|--------|------|-----------|-----------|
| `id` | UUID | PK | - |
| `tenant_id` | UUID | FK → tenants(CASCADE), UNIQUE | 1 config por tenant |
| `account_id` | VARCHAR | NOT NULL, default "20834" | ID da conta no Produttivo |
| `cookie` | TEXT | NULL | Cookie de sessão `_produttivo_session` |
| `cookie_updated_at` | TIMESTAMP | NULL | Última atualização do cookie |
| `produttivo_email` | VARCHAR | NULL | E-mail usado no login |
| `created_at` | TIMESTAMP | NOT NULL | - |
| `updated_at` | TIMESTAMP | NOT NULL | - |

---

## Relacionamentos Principais

```
User 1──N Token            (um usuário tem múltiplos tokens)
User 1──N AuditLog         (histórico de ações)
User N──N Tenant           (via user_tenants)
User 1──1 PartnerProfile   (parceiro tem exatamente 1 perfil)

Tenant 1──N Contract
Tenant 1──N Project
Tenant 1──N Material
Tenant 1──N Payment
Tenant 1──N LPU
Tenant 1──N PartnerProfile
Tenant 1──1 ProduttivoConfig

Contract 1──N Payment
Contract 1──N ContractServico
Contract 1──N ContractAnexo
Contract 1──N ContractLog

LPU 1──N LPUItem
Servico 1──N LPUItem
Servico N──1 Classe
Servico N──1 Unidade
PartnerProfile 1──N LPU
```

---

## Migrações (Alembic)

As migrações estão em `alembic/versions/` em ordem cronológica:

| Migration | Conteúdo |
|-----------|---------|
| `001_initial_schema` | Tabelas de auth: users, tokens, audit_logs, tenants |
| `002_contracts` | Tabela contracts + relacionadas |
| `003_projects` | Tabela projects |
| `004_materials` | Tabela materials (estoque) |
| `005_payments` | Tabela payments |
| `006_partner_profiles` | Tabela partner_profiles |
| `007_stub` | Migration auxiliar |
| `008_lpu` | Tabelas do catálogo: classes, unidades, servicos, lpus, lpu_items |
| `010_screen_permissions` | Tabela screen_permissions |
| `011_contracts_v2` | Ajustes em contracts (start_date obrigatório) |
| `012_produttivo_config` | Tabela produttivo_configs |
| `013_user_tenants` | Tabela user_tenants (N:N) |
| `39bd5cd2aa7f_*` | Tabela materiais_catalogo |

---

## Notas Importantes

1. **Catálogo é global:** `classes`, `unidades`, `servicos` e `materiais_catalogo` NÃO têm `tenant_id`. São compartilhados entre todos os tenants.

2. **LPU é por tenant:** `lpus` e `lpu_items` têm `tenant_id`. Cada tenant define seus próprios preços.

3. **Materials (estoque) é por tenant:** Diferente de `materiais_catalogo` (catálogo global), `materials` é o inventário físico por tenant.

4. **Dados do Produttivo NÃO são armazenados:** Forms, works e fills são buscados em tempo real da API do Produttivo. Apenas o cookie de autenticação e o account_id ficam em `produttivo_configs`.

5. **CASCADE vs RESTRICT:** FKs para `tenants` usam `CASCADE` (deletar tenant deleta tudo). FKs para `classes`/`unidades`/`servicos` usam `RESTRICT` (não pode deletar se tiver referências).
