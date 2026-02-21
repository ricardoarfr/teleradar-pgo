from fastapi import APIRouter, Depends, HTTPException

from app.auth.dependencies import get_current_user
from app.auth.models import User, UserRole
from app.client_portal.schemas import ClientOverview, ClientProfile
from app.utils.responses import success

router = APIRouter()


def _require_client(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != UserRole.CLIENT:
        raise HTTPException(status_code=403, detail="Acesso restrito ao portal do cliente")
    if not current_user.tenant_id:
        raise HTTPException(status_code=403, detail="Usuário CLIENT sem tenant_id — contate o administrador")
    return current_user


@router.get("/me")
async def client_me(current_user: User = Depends(_require_client)):
    return success("Dados do cliente.", ClientProfile.model_validate(current_user))


@router.get("/overview")
async def client_overview(current_user: User = Depends(_require_client)):
    # SCAFFOLD — implementar na próxima fase
    # Módulo: Dashboard do cliente
    # Responsabilidade: Resumo de contratos, projetos e chamados do tenant
    # Isolamento garantido: tenant_id = current_user.tenant_id (filtro obrigatório em todas as queries)
    return success("Overview do cliente.", ClientOverview(tenant_id=current_user.tenant_id))
