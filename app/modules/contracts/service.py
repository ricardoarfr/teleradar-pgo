from datetime import datetime
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.modules.contracts.models import Contract, ContractServico, ContractLog, ContractStatus
from app.modules.contracts.schemas import ContractCreate, ContractUpdate
from app.modules.catalogo.lpu.models import Servico


async def _get_contract_full(db: AsyncSession, tenant_id: UUID, contract_id: UUID) -> Contract:
    """Fetch contract with all relationships loaded (avoids MissingGreenlet)."""
    result = await db.execute(
        select(Contract)
        .where(Contract.id == contract_id, Contract.tenant_id == tenant_id)
        .options(
            selectinload(Contract.servicos).selectinload(ContractServico.servico),
            selectinload(Contract.logs),
            selectinload(Contract.anexos),
        )
    )
    contract = result.scalar_one_or_none()
    if not contract:
        raise HTTPException(status_code=404, detail="Contrato não encontrado")
    return contract


async def _next_numero(db: AsyncSession, tenant_id: UUID) -> int:
    """Returns the next sequential contract number for the tenant."""
    result = await db.execute(
        select(func.max(Contract.numero)).where(Contract.tenant_id == tenant_id)
    )
    current_max = result.scalar() or 0
    return current_max + 1


async def _validate_servicos(db: AsyncSession, servico_ids: list[UUID]) -> None:
    """Validates that all servico_ids exist."""
    for sid in servico_ids:
        result = await db.execute(select(Servico).where(Servico.id == sid))
        if not result.scalar_one_or_none():
            raise HTTPException(status_code=404, detail=f"Serviço {sid} não encontrado.")


async def create_contract(
    db: AsyncSession, tenant_id: UUID, user_id: UUID, data: ContractCreate
) -> Contract:
    await _validate_servicos(db, data.servico_ids)

    numero = await _next_numero(db, tenant_id)

    contract = Contract(
        tenant_id=tenant_id,
        numero=numero,
        client_id=data.client_id,
        estado=data.estado,
        cidade=data.cidade,
        start_date=data.start_date,
        end_date=data.end_date,
        notes=data.notes,
        created_by=user_id,
    )
    db.add(contract)
    await db.flush()  # get contract.id before adding children

    for sid in data.servico_ids:
        db.add(ContractServico(contract_id=contract.id, servico_id=sid))

    db.add(ContractLog(
        contract_id=contract.id,
        user_id=user_id,
        acao="CRIAÇÃO",
        descricao="Contrato criado.",
    ))

    await db.commit()
    return await _get_contract_full(db, tenant_id, contract.id)


async def list_contracts(
    db: AsyncSession,
    tenant_id: UUID,
    page: int = 1,
    per_page: int = 20,
    status: ContractStatus | None = None,
) -> tuple[list[Contract], int]:
    query = (
        select(Contract)
        .where(Contract.tenant_id == tenant_id)
        .options(
            selectinload(Contract.servicos).selectinload(ContractServico.servico),
            selectinload(Contract.logs),
        )
    )
    count_query = select(func.count()).select_from(Contract).where(Contract.tenant_id == tenant_id)

    if status:
        query = query.where(Contract.status == status)
        count_query = count_query.where(Contract.status == status)

    total = (await db.execute(count_query)).scalar()
    contracts = (
        await db.execute(
            query.order_by(Contract.numero.desc()).offset((page - 1) * per_page).limit(per_page)
        )
    ).scalars().all()
    return contracts, total


async def get_contract(db: AsyncSession, tenant_id: UUID, contract_id: UUID) -> Contract:
    return await _get_contract_full(db, tenant_id, contract_id)


async def update_contract(
    db: AsyncSession, tenant_id: UUID, contract_id: UUID, user_id: UUID, data: ContractUpdate
) -> Contract:
    contract = await _get_contract_full(db, tenant_id, contract_id)

    changes: list[str] = []

    if data.client_id is not None and data.client_id != contract.client_id:
        contract.client_id = data.client_id
        changes.append("cliente")
    if data.estado is not None and data.estado != contract.estado:
        contract.estado = data.estado
        changes.append("estado")
    if data.cidade is not None and data.cidade != contract.cidade:
        contract.cidade = data.cidade
        changes.append("cidade")
    if data.status is not None and data.status != contract.status:
        contract.status = data.status
        changes.append(f"status → {data.status}")
    if data.start_date is not None and data.start_date != contract.start_date:
        contract.start_date = data.start_date
        changes.append("data_inicio")
    if data.end_date is not None and data.end_date != contract.end_date:
        contract.end_date = data.end_date
        changes.append("data_fim")
    if data.notes is not None and data.notes != contract.notes:
        contract.notes = data.notes
        changes.append("observações")

    if data.servico_ids is not None:
        await _validate_servicos(db, data.servico_ids)
        # Remove existing and re-add
        for cs in list(contract.servicos):
            await db.delete(cs)
        await db.flush()
        for sid in data.servico_ids:
            db.add(ContractServico(contract_id=contract.id, servico_id=sid))
        changes.append("serviços")

    if changes:
        contract.updated_at = datetime.utcnow()
        db.add(ContractLog(
            contract_id=contract.id,
            user_id=user_id,
            acao="EDIÇÃO",
            descricao=f"Campos alterados: {', '.join(changes)}.",
        ))

    await db.commit()
    return await _get_contract_full(db, tenant_id, contract_id)


async def delete_contract(
    db: AsyncSession, tenant_id: UUID, contract_id: UUID, user_id: UUID
) -> None:
    contract = await _get_contract_full(db, tenant_id, contract_id)
    # Log before deletion (cascade will remove it anyway, but useful if we ever change to soft-delete)
    db.add(ContractLog(
        contract_id=contract.id,
        user_id=user_id,
        acao="EXCLUSÃO",
        descricao="Contrato excluído.",
    ))
    await db.flush()
    await db.delete(contract)
    await db.commit()
