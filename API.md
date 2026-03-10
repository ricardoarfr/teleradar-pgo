# API Reference — Teleradar PGO

**Base URL (produção):** `https://<api>.onrender.com`
**Base URL (local):** `http://localhost:8000`
**Documentação interativa:** `{base_url}/docs` (Swagger UI)

---

## Autenticação

Todos os endpoints protegidos exigem o header:

```
Authorization: Bearer <access_token>
```

O `access_token` é obtido no endpoint de login e tem validade de **30 minutos**. Use o refresh token para renová-lo.

---

## Formato de Resposta

Todas as respostas seguem o padrão:

```json
{
  "success": true,
  "data": { ... },
  "message": "Mensagem opcional"
}
```

Erros:
```json
{
  "detail": "Descrição do erro"
}
```

---

## Endpoints

---

### Auth — `/auth`

#### `POST /auth/register`
Cadastra novo usuário. Status inicial: `PENDING` (aguarda aprovação do admin).

**Body:**
```json
{
  "name": "João Silva",
  "email": "joao@empresa.com",
  "password": "SenhaSegura123"
}
```

**Response 201:**
```json
{
  "id": "uuid",
  "name": "João Silva",
  "email": "joao@empresa.com",
  "role": "STAFF",
  "status": "PENDING"
}
```

---

#### `POST /auth/login`
Autentica com e-mail e senha.

**Body:**
```json
{
  "email": "joao@empresa.com",
  "password": "SenhaSegura123"
}
```

**Response 200:**
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer"
}
```

> Após 5 tentativas falhas, a conta é bloqueada por 15 minutos.

---

#### `POST /auth/refresh`
Renova o access token usando o refresh token.

**Body:**
```json
{
  "refresh_token": "eyJ..."
}
```

**Response 200:**
```json
{
  "access_token": "eyJ...",
  "token_type": "bearer"
}
```

---

#### `POST /auth/logout`
Invalida o refresh token. Requer autenticação.

**Body:**
```json
{
  "refresh_token": "eyJ..."
}
```

---

#### `GET /auth/me`
Retorna dados do usuário autenticado.

**Response 200:**
```json
{
  "id": "uuid",
  "name": "João Silva",
  "email": "joao@empresa.com",
  "role": "STAFF",
  "status": "APPROVED",
  "tenant_id": "uuid"
}
```

---

#### `POST /auth/forgot-password`
Envia e-mail com link de reset de senha.

**Body:**
```json
{
  "email": "joao@empresa.com"
}
```

---

#### `POST /auth/reset-password`
Redefine a senha usando token recebido por e-mail (válido por 15 min, uso único).

**Body:**
```json
{
  "token": "abc123...",
  "new_password": "NovaSenha456"
}
```

---

#### `POST /auth/change-password`
Altera a senha estando autenticado.

**Body:**
```json
{
  "current_password": "SenhaAtual",
  "new_password": "NovaSenha456"
}
```

---

#### `GET /auth/google`
Redireciona para o fluxo OAuth2 do Google.

---

#### `GET /auth/google/callback`
Callback do OAuth2. Retorna tokens JWT após autenticação Google bem-sucedida.

---

#### `POST /auth/master/bootstrap`
Cria o usuário MASTER. Funciona **apenas uma vez** (403 se já existir MASTER).

**Body:**
```json
{
  "name": "Admin Master",
  "email": "master@empresa.com",
  "password": "SenhaSegura",
  "bootstrap_secret": "valor-do-env-BOOTSTRAP_SECRET"
}
```

---

### Admin — `/admin`
> Requer role: `ADMIN` ou `MASTER`

#### `GET /admin/users`
Lista usuários com filtros opcionais.

**Query params:**
- `role` — filtrar por role
- `status` — filtrar por status (PENDING, APPROVED, BLOCKED)
- `tenant_id` — filtrar por tenant (MASTER pode usar qualquer)

---

#### `GET /admin/users/pending`
Lista usuários com status `PENDING`.

---

#### `GET /admin/users/{id}`
Detalhes de um usuário específico.

---

#### `POST /admin/users/{id}/approve`
Inicia o fluxo de aprovação. Envia código por e-mail para o `ADMIN_MASTER_EMAIL`.

---

#### `POST /admin/users/confirm-approval`
Confirma a aprovação com o código recebido.

**Body:**
```json
{
  "user_id": "uuid",
  "code": "123456"
}
```

---

#### `POST /admin/users/{id}/block`
Bloqueia usuário.

---

#### `POST /admin/users/{id}/unblock`
Desbloqueia usuário.

---

#### `PUT /admin/users/{id}/role`
Altera o role do usuário.

**Body:**
```json
{
  "role": "MANAGER"
}
```

> ADMIN não pode promover para MASTER ou ADMIN.

---

### Users — `/users`
> Requer autenticação

#### `GET /users/me`
Ver perfil do usuário autenticado.

#### `PUT /users/me`
Editar nome e outros dados do perfil.

**Body:**
```json
{
  "name": "João da Silva"
}
```

---

### Tenants — `/tenants`
> Requer role: `ADMIN` ou `MASTER`

#### `POST /tenants/`
Criar novo tenant.

**Body:**
```json
{
  "name": "Provedor Internet LTDA"
}
```

---

#### `GET /tenants/`
Listar todos os tenants.

---

#### `GET /tenants/{id}`
Detalhes de um tenant.

---

#### `PUT /tenants/{id}`
Atualizar tenant.

**Body:**
```json
{
  "name": "Novo Nome",
  "status": "ACTIVE"
}
```

---

### Contratos — `/modules/contracts`
> Isolado por tenant. Query param `?tenant_id=` obrigatório para MASTER e usuários com múltiplos tenants.

#### `GET /modules/contracts`
Listar contratos do tenant.

#### `POST /modules/contracts`
Criar contrato.

**Body:**
```json
{
  "numero": "C-001",
  "client_id": "uuid",
  "estado": "SP",
  "cidade": "São Paulo",
  "status": "ACTIVE",
  "start_date": "2026-01-01",
  "end_date": "2026-12-31",
  "notes": "Observações opcionais"
}
```

#### `GET /modules/contracts/{id}`
Detalhes do contrato com serviços, anexos e log.

#### `PUT /modules/contracts/{id}`
Atualizar contrato.

#### `DELETE /modules/contracts/{id}`
Remover contrato.

---

### Projetos — `/modules/projects`

CRUD completo. Status: `PENDING`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`.

---

### Materiais — `/modules/materials`

Controle de estoque com quantidade e quantidade mínima.

---

### Pagamentos — `/modules/payments`

Rastreamento de pagamentos vinculados a contratos.

Status: `PENDING`, `PAID`, `OVERDUE`, `CANCELLED`.

---

### Parceiros — `/admin/partners` e `/partner`

Perfis de parceiros/subcontratados com CPF/CNPJ, endereço e contato.

---

### Catálogo — `/modules/catalogo`

#### Classes
```
GET    /modules/catalogo/classes
POST   /modules/catalogo/classes
GET    /modules/catalogo/classes/{id}
PUT    /modules/catalogo/classes/{id}
```

#### Unidades
```
GET    /modules/catalogo/unidades
POST   /modules/catalogo/unidades
GET    /modules/catalogo/unidades/{id}
PUT    /modules/catalogo/unidades/{id}
```

#### Serviços
```
GET    /modules/catalogo/servicos
POST   /modules/catalogo/servicos
GET    /modules/catalogo/servicos/{id}
PUT    /modules/catalogo/servicos/{id}
```

#### Materiais do Catálogo
```
GET    /modules/catalogo/materiais
POST   /modules/catalogo/materiais
GET    /modules/catalogo/materiais/{id}
PUT    /modules/catalogo/materiais/{id}
```

#### LPU (Lista de Preço Única)
```
GET    /modules/catalogo/lpu
POST   /modules/catalogo/lpu
GET    /modules/catalogo/lpu/{id}
PUT    /modules/catalogo/lpu/{id}
POST   /modules/catalogo/lpu/{id}/items
PUT    /modules/catalogo/lpu/{id}/items/{item_id}
```

**Criar LPU:**
```json
{
  "nome": "LPU Parceiro X - 2026",
  "parceiro_id": "uuid-do-partner-profile",
  "ativa": true,
  "data_inicio": "2026-01-01"
}
```

**Adicionar item à LPU:**
```json
{
  "servico_id": "uuid-do-servico",
  "valor_unitario": 35.50,
  "valor_classe": 10.00
}
```

---

### Produttivo — `/modules/produttivo`

#### Configuração

##### `GET /modules/produttivo/config`
Retorna status da configuração do tenant atual (se tem cookie e account_id).
> Requer: STAFF+

##### `POST /modules/produttivo/config/cookie`
Salva o cookie de sessão do Produttivo para o tenant atual.
> Requer: MANAGER+

**Body:**
```json
{
  "cookie": "_produttivo_session=abc123..."
}
```

##### `POST /modules/produttivo/config/account-id`
Salva o account_id da conta Produttivo.
> Requer: MANAGER+

**Body:**
```json
{
  "account_id": "20834"
}
```

##### `POST /modules/produttivo/config/validate`
Valida se o cookie salvo ainda é válido.
> Requer: STAFF+

##### `POST /modules/produttivo/config/gerar-cookie`
Faz login automático no Produttivo via Playwright e salva o cookie automaticamente.
> Requer: MANAGER+

**Body:**
```json
{
  "email": "tecnico@provedor.com.br",
  "password": "senha-produttivo"
}
```

---

#### Relatórios

##### `GET /modules/produttivo/relatorio/usuario`
Relatório de atividades agrupado por técnico × atividade.

**Query params:**
| Param | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `data_inicio` | string | Sim | DD/MM/YYYY |
| `data_fim` | string | Sim | DD/MM/YYYY |
| `user_ids[]` | array | Não | IDs de usuários Produttivo |
| `form_ids[]` | array | Não | IDs de formulários |
| `resource_place_ids[]` | array | Não | IDs de locais/clientes |
| `work_ids[]` | array | Não | IDs de atividades |
| `formato` | string | Não | `json` (default) ou `excel` |

**Response (JSON):**
```json
[
  {
    "cliente": "Cliente A",
    "nome_atividade": "Lançamento de Cabo",
    "usuario": "João Silva (joao@empresa.com)",
    "qtd": 3,
    "data_inicial": "2026-03-01",
    "data_final": "2026-03-02",
    "cabo_m": 450.5,
    "cordoalha_m": 0,
    "ceo": 0,
    "cto": 0,
    "dio": 0
  }
]
```

---

##### `GET /modules/produttivo/relatorio/atividades`
Relatório de todas as atividades (sem agrupamento por usuário).

Mesmos parâmetros do relatório por usuário.

---

##### `GET /modules/produttivo/debug/fill-fields`
Retorna os `field_values` brutos dos primeiros 3 form_fills de um formulário.
Útil para inspecionar os nomes exatos dos campos retornados pela API do Produttivo.

**Query params:**
- `data_inicio`, `data_fim` (obrigatórios)
- `form_id` (obrigatório)

---

### Health Check

#### `GET /health`
Verifica se a API está online.

**Response 200:**
```json
{
  "status": "ok",
  "environment": "production",
  "version": "1.0.0"
}
```

---

## Códigos de Status HTTP

| Código | Significado |
|--------|------------|
| 200 | OK |
| 201 | Criado com sucesso |
| 400 | Dados inválidos |
| 401 | Não autenticado |
| 403 | Sem permissão |
| 404 | Não encontrado |
| 422 | Erro de validação (Pydantic) |
| 429 | Rate limit atingido |
| 500 | Erro interno |

---

## Exemplos com cURL

### Login e uso do token

```bash
# Login
TOKEN=$(curl -s -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"master@empresa.com","password":"senha"}' \
  | jq -r '.access_token')

# Usar o token
curl http://localhost:8000/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

### Criar tenant e associar usuário

```bash
# Criar tenant
curl -X POST http://localhost:8000/tenants/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Provedor X LTDA"}'
```

### Gerar relatório Produttivo

```bash
curl "http://localhost:8000/modules/produttivo/relatorio/usuario?\
data_inicio=01/03/2026&data_fim=10/03/2026&tenant_id=uuid-do-tenant" \
  -H "Authorization: Bearer $TOKEN"
```
