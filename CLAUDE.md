# Diretrizes para Claude Code — teleradar-pgo

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
