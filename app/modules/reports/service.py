from uuid import UUID

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.contracts.models import Contract, ContractStatus
from app.modules.materials.models import Material
from app.modules.payments.models import Payment, PaymentStatus
from app.modules.projects.models import Project, ProjectStatus


async def contracts_summary(db: AsyncSession, tenant_id: UUID) -> dict:
    rows = (await db.execute(
        select(Contract.status, func.count().label("total"))
        .where(Contract.tenant_id == tenant_id)
        .group_by(Contract.status)
    )).all()

    summary = {s.value: 0 for s in ContractStatus}
    for status, total in rows:
        summary[status.value] = total
    summary["total"] = sum(summary.values())
    return summary


async def payments_summary(db: AsyncSession, tenant_id: UUID) -> dict:
    rows = (await db.execute(
        select(Payment.status, func.count().label("qty"), func.sum(Payment.amount).label("amount"))
        .where(Payment.tenant_id == tenant_id)
        .group_by(Payment.status)
    )).all()

    summary = {s.value: {"qty": 0, "amount": 0} for s in PaymentStatus}
    for status, qty, amount in rows:
        summary[status.value] = {"qty": qty, "amount": float(amount or 0)}
    summary["total_amount"] = sum(v["amount"] for v in summary.values())
    return summary


async def projects_summary(db: AsyncSession, tenant_id: UUID) -> dict:
    rows = (await db.execute(
        select(Project.status, func.count().label("total"))
        .where(Project.tenant_id == tenant_id)
        .group_by(Project.status)
    )).all()

    summary = {s.value: 0 for s in ProjectStatus}
    for status, total in rows:
        summary[status.value] = total
    summary["total"] = sum(summary.values())
    return summary


async def materials_summary(db: AsyncSession, tenant_id: UUID) -> dict:
    result = await db.execute(
        select(
            func.count().label("total"),
            func.sum(
                func.cast(Material.quantity <= Material.min_quantity, db.get_bind().dialect.name == "postgresql" and "int" or "integer")
            ).label("low_stock"),
        ).where(Material.tenant_id == tenant_id)
    )
    # Fazer a query de forma compatível
    total_result = (await db.execute(
        select(func.count()).select_from(Material).where(Material.tenant_id == tenant_id)
    )).scalar() or 0

    low_stock_result = (await db.execute(
        select(func.count()).select_from(Material).where(
            Material.tenant_id == tenant_id,
            Material.quantity <= Material.min_quantity,
        )
    )).scalar() or 0

    return {"total": total_result, "low_stock": low_stock_result}


async def dashboard(db: AsyncSession, tenant_id: UUID) -> dict:
    contracts = await contracts_summary(db, tenant_id)
    payments = await payments_summary(db, tenant_id)
    projects = await projects_summary(db, tenant_id)
    materials = await materials_summary(db, tenant_id)
    return {
        "contracts": contracts,
        "payments": payments,
        "projects": projects,
        "materials": materials,
    }
