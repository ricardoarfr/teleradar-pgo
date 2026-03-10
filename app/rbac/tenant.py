"""
Resolução de tenant para operações tenant-scoped.

Uso (operações que exigem tenant único obrigatório, ex: LPU):
    ctx = tenant_context(UserRole.ADMIN, UserRole.MASTER)

    @router.post("/alguma-coisa")
    async def endpoint(
        ctx: TenantContext = Depends(ctx),
    ):
        # ctx.tenant_id   → UUID garantido (único alvo)
        # ctx.tenant_ids  → lista de todos os tenants acessíveis ([] = MASTER = sem filtro)
        # ctx.user        → User autenticado

Uso (listagens e operações sem tenant único obrigatório):
    Use get_user_tenant_ids(current_user) no router para obter a lista de tenants.

Regras de resolução do tenant_id:
  - Usuário com exatamente 1 tenant → usa o próprio (query param ignorado).
  - Usuário com >1 tenants → ?tenant_id= obrigatório; deve ser um dos seus.
  - MASTER → ?tenant_id= obrigatório; pode ser qualquer tenant.
  - Ausência de ?tenant_id= quando necessário → 422.

Regras de tenant_ids (lista para filtro IN nas queries):
  - MASTER → [] (sem filtro, acessa tudo).
  - Demais roles → [t.id for t in user.tenants].
"""
from dataclasses import dataclass, field
from typing import Optional
from uuid import UUID

from fastapi import Depends, HTTPException, Query, status

from app.auth.models import User, UserRole
from app.rbac.dependencies import require_roles


@dataclass
class TenantContext:
    user: User
    tenant_id: UUID
    tenant_ids: list[UUID] = field(default_factory=list)


def get_user_tenant_ids(user: User) -> list[UUID]:
    """Retorna a lista de tenant IDs acessíveis pelo usuário.

    MASTER sempre retorna [] (sem restrição — acessa tudo).
    Demais roles retornam os UUIDs vinculados via user_tenants.
    """
    if user.role == UserRole.MASTER:
        return []
    return [t.id for t in user.tenants]


def tenant_context(*roles: UserRole):
    """
    Factory de dependency que resolve o tenant_id efetivo e preenche tenant_ids.

    Parâmetros:
        roles: roles permitidos (repassados ao require_roles).

    Query param exposto:
        tenant_id (UUID, opcional):
          - Obrigatório para MASTER.
          - Obrigatório para usuários com >1 tenant.
          - Ignorado (inferido) para usuários com exatamente 1 tenant.
    """
    _require_roles = require_roles(*roles)

    async def _resolve(
        tenant_id: Optional[UUID] = Query(
            None,
            description="Obrigatório para MASTER ou usuário com múltiplas empresas.",
        ),
        current_user: User = Depends(_require_roles),
    ) -> TenantContext:
        tenant_ids = get_user_tenant_ids(current_user)

        if current_user.role == UserRole.MASTER:
            if tenant_id is None:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="Parâmetro tenant_id é obrigatório para MASTER.",
                )
            effective = tenant_id
        elif len(current_user.tenants) == 1:
            effective = current_user.tenants[0].id
        elif len(current_user.tenants) > 1:
            if tenant_id is None:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="Parâmetro tenant_id é obrigatório para usuário com múltiplas empresas.",
                )
            if tenant_id not in tenant_ids:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Acesso negado a esta empresa.",
                )
            effective = tenant_id
        else:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Usuário não está vinculado a nenhuma empresa.",
            )

        return TenantContext(user=current_user, tenant_id=effective, tenant_ids=tenant_ids)

    return _resolve
