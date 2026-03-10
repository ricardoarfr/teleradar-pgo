# Fluxo de Trabalho Obrigatório — teleradar-pgo

> **Estas regras são obrigatórias.** Para qualquer alteração solicitada neste repositório,
> siga rigorosamente cada etapa abaixo antes de realizar commit ou push.

---

## 1. Implementação

- Leia e analise o código existente antes de fazer qualquer alteração
- Mantenha consistência com a arquitetura atual (FastAPI, SQLAlchemy async, padrão de serviços)
- Faça apenas as mudanças necessárias — sem refatorações não solicitadas

---

## 2. Simulação do Ambiente

Monte o ambiente de execução dentro da sessão. Se necessário:

```bash
# Instalar dependências
pip install -r requirements.txt

# Carregar variáveis de ambiente
cp .env.example .env  # se ainda não existir

# Rodar migrations
alembic upgrade head

# Verificar banco de dados
# (subir container PostgreSQL se não houver infraestrutura disponível)
docker run -d --name teleradar-db \
  -e POSTGRES_DB=teleradar \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 postgres:15
```

Se não houver infraestrutura pronta, crie o mínimo necessário para simular o funcionamento.

---

## 3. Subir os Serviços

Sempre que possível, suba o servidor e verifique os logs de inicialização:

```bash
# Subir a aplicação
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Verificar que está respondendo
curl http://localhost:8000/health
```

Confirme que:
- O servidor iniciou sem erros
- Os logs não apresentam exceções críticas
- O endpoint `/health` retorna 200 OK

---

## 4. Testes de Funcionamento

Após subir o ambiente, execute:

### Testes automatizados (se existirem)
```bash
pytest -v
```

### Testes manuais via HTTP
Simule cenários de uso reais com `curl` ou cliente HTTP:

```bash
# Exemplo: autenticação
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@test.com", "password": "senha"}'

# Exemplo: endpoint afetado pela mudança
curl -X GET http://localhost:8000/<endpoint_alterado> \
  -H "Authorization: Bearer <token>"
```

- Teste os endpoints diretamente afetados pela mudança
- Teste endpoints que possam ter sido impactados indiretamente
- Observe os logs da aplicação durante os testes

---

## 5. Validação das Mudanças

Antes de qualquer commit, confirme cada item:

- [ ] O sistema inicia corretamente (sem erros de importação ou configuração)
- [ ] Migrations executadas sem conflito
- [ ] O endpoint/funcionalidade alterado funciona conforme esperado
- [ ] Funcionalidades existentes não foram quebradas
- [ ] Logs sem erros críticos

---

## 6. Relatório de Testes

Antes de commit ou push, apresente um relatório no seguinte formato:

```
## Relatório de Testes

**Ambiente:**
- Python X.X / FastAPI X.X
- PostgreSQL X.X
- Migrations: HEAD (alembic)

**Testes executados:**
- Servidor iniciou corretamente ✅
- Migration executada ✅
- Endpoint /xxx testado ✅
- Cenário Y validado ✅
- Logs sem erro crítico ✅

**Problemas encontrados:**
- Nenhum / Descrição do problema e como foi resolvido

**Resultado:** APROVADO ✅ / REPROVADO ❌
```

---

## 7. Confirmação Antes do Push

**Nunca fazer push automaticamente.**

Após validar tudo, perguntar:

> "Os testes foram concluídos com sucesso. Posso fazer o commit e push para o repositório?"

Somente realizar o push após confirmação explícita do usuário.

---

## Observações

- O ambiente criado pode existir apenas durante a sessão atual — isso é aceitável
- Se a sessão reiniciar, recriar o ambiente seguindo as etapas acima
- O objetivo é garantir que **nenhuma mudança suba sem ter sido testada**
- Em caso de dúvida sobre o impacto de uma mudança, perguntar antes de implementar
