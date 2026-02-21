from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User, UserRole
from app.database.connection import get_db
from app.modules.contracts import schemas, service
from app.modules.contracts.models import ContractStatus
from app.rbac.dependencies import require_roles
from app.utils.responses import success

router = APIRouter()

_staff_up = require_roles(UserRole.STAFF, UserRole.MANAGER, UserRole.ADMIN, UserRole.MASTER)
_manager_up = require_roles(UserRole.MANAGER, UserRole.ADMIN, UserRole.MASTER)


@router.post("/", status_code=201)
async def create_contract(
    data: schemas.ContractCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(_manager_up),
):
    contract = await service.create_contract(db, current_user.tenant_id, data)
    return success("Contrato criado.", schemas.ContractResponse.model_validate(contract))


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
        "results": [schemas.ContractResponse.model_validate(c) for c in contracts],
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
    return success("Dados do contrato.", schemas.ContractResponse.model_validate(contract))


@router.put("/{contract_id}")
async def update_contract(
    contract_id: UUID,
    data: schemas.ContractUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(_manager_up),
):
    contract = await service.update_contract(db, current_user.tenant_id, contract_id, data)
    return success("Contrato atualizado.", schemas.ContractResponse.model_validate(contract))


@router.post("/{contract_id}/cancel")
async def cancel_contract(
    contract_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(_manager_up),
):
    contract = await service.cancel_contract(db, current_user.tenant_id, contract_id)
    return success("Contrato cancelado.", schemas.ContractResponse.model_validate(contract))
