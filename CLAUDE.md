# Diretrizes para Claude Code — teleradar-pgo

## Fluxo de Trabalho

Antes de qualquer commit ou push, seguir obrigatoriamente o processo definido em
[CLAUDE_WORKFLOW.md](./CLAUDE_WORKFLOW.md):

1. Analisar e implementar a mudança
2. Montar o ambiente de execução (dependências, banco, migrations)
3. Subir os serviços e verificar logs
4. Executar testes (automatizados e/ou manuais via HTTP)
5. Validar que nada foi quebrado
6. Apresentar relatório de testes
7. **Aguardar confirmação do usuário antes de fazer push**

## Pull Requests

Ao criar um PR, **sempre** incluir uma descrição detalhada com a seguinte estrutura:

```
## Resumo

<1-3 frases explicando o objetivo da mudança>

## O que mudou

### Backend
- <lista de mudanças no backend>

### Frontend
- <lista de mudanças no frontend>

### Outros
- <migrações, config, CI, etc. se houver>

## Como testar

- [ ] <passo a passo para validar a mudança manualmente ou via testes>

https://claude.ai/code/session_...
```

**Regras:**
- Separar claramente mudanças de **Backend** e **Frontend**
- Citar os arquivos principais alterados
- Descrever o comportamento **antes** e **depois** quando relevante
- Incluir passos de teste sempre que a mudança afete o usuário final
