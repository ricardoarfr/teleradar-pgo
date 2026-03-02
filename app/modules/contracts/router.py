from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User, UserRole
from app.database.connection import get_db
from app.modules.contracts import schemas, service
from app.modules.contracts.models import Contract, ContractStatus
from app.rbac.dependencies import require_roles
from app.utils.responses import success

router = APIRouter()

_staff_up = require_roles(UserRole.STAFF, UserRole.MANAGER, UserRole.ADMIN, UserRole.MASTER)
_manager_up = require_roles(UserRole.MANAGER, UserRole.ADMIN, UserRole.MASTER)


def _to_response(contract: Contract) -> schemas.ContractResponse:
    """Converts Contract ORM object to ContractResponse schema.

    contract.servicos is a list of ContractServico (join table rows),
    each with a .servico relationship to the actual Servico object.
    We extract the Servico data to build ServicoInfo.
    """
    servicos = [
        schemas.ServicoInfo(
            id=cs.servico.id,
            codigo=cs.servico.codigo,
            atividade=cs.servico.atividade,
        )
        for cs in contract.servicos
        if cs.servico is not None
    ]
    logs = [schemas.LogEntry.model_validate(log) for log in contract.logs]

    return schemas.ContractResponse(
        id=contract.id,
        tenant_id=contract.tenant_id,
        numero=contract.numero,
        client_id=contract.client_id,
        estado=contract.estado,
        cidade=contract.cidade,
        status=contract.status,
        start_date=contract.start_date,
        end_date=contract.end_date,
        notes=contract.notes,
        created_by=contract.created_by,
        created_at=contract.created_at,
        updated_at=contract.updated_at,
        servicos=servicos,
        logs=logs,
    )


@router.post("/", status_code=201)
async def create_contract(
    data: schemas.ContractCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(_manager_up),
):
    contract = await service.create_contract(db, current_user.tenant_id, current_user.id, data)
    return success("Contrato criado.", _to_response(contract))


@router.get("/")
async def list_contracts(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    status: Optional[ContractStatus] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(_staff_up),
):
    contracts, total = await service.list_contracts(db, current_user.tenant_id, page, per_page, status)
    return success("Lista de contratos.", {
        "results": [_to_response(c) for c in contracts],
        "total": total,
        "page": page,
        "per_page": per_page,
    })


@router.get("/{contract_id}")
async def get_contract(
    contract_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(_staff_up),
):
    contract = await service.get_contract(db, current_user.tenant_id, contract_id)
    return success("Dados do contrato.", _to_response(contract))


@router.put("/{contract_id}")
async def update_contract(
    contract_id: UUID,
    data: schemas.ContractUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(_manager_up),
):
    contract = await service.update_contract(
        db, current_user.tenant_id, contract_id, current_user.id, data
    )
    return success("Contrato atualizado.", _to_response(contract))


@router.delete("/{contract_id}", status_code=204)
async def delete_contract(
    contract_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(_manager_up),
):
    await service.delete_contract(db, current_user.tenant_id, contract_id, current_user.id)
