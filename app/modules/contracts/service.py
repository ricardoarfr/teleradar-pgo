from datetime import datetime
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.contracts.models import Contract, ContractStatus
from app.modules.contracts.schemas import ContractCreate, ContractUpdate


async def create_contract(db: AsyncSession, tenant_id: UUID, data: ContractCreate) -> Contract:
    contract = Contract(
        tenant_id=tenant_id,
        client_id=data.client_id,
        plan_name=data.plan_name,
        plan_value=data.plan_value,
        start_date=data.start_date,
        end_date=data.end_date,
        notes=data.notes,
    )
    db.add(contract)
    await db.commit()
    await db.refresh(contract)
    return contract


async def list_contracts(
    db: AsyncSession,
    tenant_id: UUID,
    page: int = 1,
    per_page: int = 20,
    status: ContractStatus | None = None,
) -> tuple[list[Contract], int]:
    query = select(Contract).where(Contract.tenant_id == tenant_id)
    count_query = select(func.count()).select_from(Contract).where(Contract.tenant_id == tenant_id)

    if status:
        query = query.where(Contract.status == status)
        count_query = count_query.where(Contract.status == status)

    total = (await db.execute(count_query)).scalar()
    contracts = (
        await db.execute(
            query.order_by(Contract.created_at.desc()).offset((page - 1) * per_page).limit(per_page)
        )
    ).scalars().all()
    return contracts, total


async def get_contract(db: AsyncSession, tenant_id: UUID, contract_id: UUID) -> Contract:
    result = await db.execute(
        select(Contract).where(Contract.id == contract_id, Contract.tenant_id == tenant_id)
    )
    contract = result.scalar_one_or_none()
    if not contract:
        raise HTTPException(status_code=404, detail="Contrato não encontrado")
    return contract


async def update_contract(
    db: AsyncSession, tenant_id: UUID, contract_id: UUID, data: ContractUpdate
) -> Contract:
    contract = await get_contract(db, tenant_id, contract_id)

    if data.client_id is not None:
        contract.client_id = data.client_id
    if data.plan_name is not None:
        contract.plan_name = data.plan_name
    if data.plan_value is not None:
        contract.plan_value = data.plan_value
    if data.status is not None:
        contract.status = data.status
    if data.start_date is not None:
        contract.start_date = data.start_date
    if data.end_date is not None:
        contract.end_date = data.end_date
    if data.notes is not None:
        contract.notes = data.notes

    contract.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(contract)
    return contract


async def cancel_contract(db: AsyncSession, tenant_id: UUID, contract_id: UUID) -> Contract:
    contract = await get_contract(db, tenant_id, contract_id)
    contract.status = ContractStatus.CANCELLED
    contract.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(contract)
    return contract
