"""
Resolução de tenant para operações tenant-scoped.

Uso:
    ctx = tenant_context(UserRole.ADMIN, UserRole.MASTER)

    @router.post("/alguma-coisa")
    async def endpoint(
        ctx: TenantContext = Depends(ctx),
    ):
        # ctx.tenant_id  → UUID garantido
        # ctx.user       → User autenticado

Regras:
  - Usuário com tenant_id próprio → usa o próprio (query param ignorado).
  - MASTER sem tenant → requer ?tenant_id= na query; 422 se ausente.
"""
from dataclasses import dataclass
from typing import Optional
from uuid import UUID

from fastapi import Depends, HTTPException, Query, status

from app.auth.models import User, UserRole
from app.rbac.dependencies import require_roles


@dataclass
class TenantContext:
    user: User
    tenant_id: UUID


def tenant_context(*roles: UserRole):
    """
    Factory de dependency que resolve o tenant_id efetivo.

    Parâmetros:
        roles: roles permitidos (repassados ao require_roles).

    Query param exposto:
        tenant_id (UUID, opcional) — obrigatório apenas quando o usuário
        autenticado não possui tenant_id próprio (caso MASTER global).
    """
    _require_roles = require_roles(*roles)

    async def _resolve(
        tenant_id: Optional[UUID] = Query(
            None,
            description="Obrigatório para usuário MASTER sem tenant associado.",
        ),
        current_user: User = Depends(_require_roles),
    ) -> TenantContext:
        effective = current_user.tenant_id or tenant_id
        if effective is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=(
                    "Parâmetro tenant_id é obrigatório para usuário MASTER "
                    "sem tenant associado."
                ),
            )
        return TenantContext(user=current_user, tenant_id=effective)

    return _resolve
