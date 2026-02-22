from fastapi import APIRouter, Depends, HTTPException

from app.auth.dependencies import get_current_user
from app.auth.models import User, UserRole
from app.partner_portal.schemas import PartnerOverview, PartnerProfile
from app.utils.responses import success

router = APIRouter()


def _require_partner(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != UserRole.PARTNER:
        raise HTTPException(status_code=403, detail="Acesso restrito ao portal do parceiro")
    if not current_user.tenant_id:
        raise HTTPException(status_code=403, detail="Usuário PARTNER sem tenant_id — contate o administrador")
    return current_user


@router.get("/me")
async def partner_me(current_user: User = Depends(_require_partner)):
    return success("Dados do parceiro.", PartnerProfile.model_validate(current_user))


@router.get("/overview")
async def partner_overview(current_user: User = Depends(_require_partner)):
    # SCAFFOLD — implementar na próxima fase
    # Módulo: Dashboard do parceiro
    # Responsabilidade: Resumo de contratos, projetos e chamados do tenant
    # Isolamento garantido: tenant_id = current_user.tenant_id (filtro obrigatório em todas as queries)
    return success("Overview do parceiro.", PartnerOverview(tenant_id=current_user.tenant_id))
