from datetime import datetime, date
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.payments.models import Payment, PaymentStatus
from app.modules.payments.schemas import PaymentCreate, PaymentUpdate, PaymentMarkPaid


async def create_payment(db: AsyncSession, tenant_id: UUID, data: PaymentCreate) -> Payment:
    payment = Payment(
        tenant_id=tenant_id,
        contract_id=data.contract_id,
        amount=data.amount,
        due_date=data.due_date,
        reference=data.reference,
        notes=data.notes,
    )
    db.add(payment)
    await db.commit()
    await db.refresh(payment)
    return payment


async def list_payments(
    db: AsyncSession,
    tenant_id: UUID,
    page: int = 1,
    per_page: int = 20,
    status: PaymentStatus | None = None,
    contract_id: UUID | None = None,
) -> tuple[list[Payment], int]:
    query = select(Payment).where(Payment.tenant_id == tenant_id)
    count_query = select(func.count()).select_from(Payment).where(Payment.tenant_id == tenant_id)

    if status:
        query = query.where(Payment.status == status)
        count_query = count_query.where(Payment.status == status)
    if contract_id:
        query = query.where(Payment.contract_id == contract_id)
        count_query = count_query.where(Payment.contract_id == contract_id)

    total = (await db.execute(count_query)).scalar()
    payments = (
        await db.execute(
            query.order_by(Payment.due_date.desc()).offset((page - 1) * per_page).limit(per_page)
        )
    ).scalars().all()
    return payments, total


async def get_payment(db: AsyncSession, tenant_id: UUID, payment_id: UUID) -> Payment:
    result = await db.execute(
        select(Payment).where(Payment.id == payment_id, Payment.tenant_id == tenant_id)
    )
    payment = result.scalar_one_or_none()
    if not payment:
        raise HTTPException(status_code=404, detail="Pagamento não encontrado")
    return payment


async def update_payment(
    db: AsyncSession, tenant_id: UUID, payment_id: UUID, data: PaymentUpdate
) -> Payment:
    payment = await get_payment(db, tenant_id, payment_id)

    if payment.status == PaymentStatus.PAID:
        raise HTTPException(status_code=422, detail="Pagamento já quitado não pode ser alterado")

    if data.amount is not None:
        payment.amount = data.amount
    if data.due_date is not None:
        payment.due_date = data.due_date
    if data.reference is not None:
        payment.reference = data.reference
    if data.notes is not None:
        payment.notes = data.notes

    payment.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(payment)
    return payment


async def mark_paid(
    db: AsyncSession, tenant_id: UUID, payment_id: UUID, data: PaymentMarkPaid
) -> Payment:
    payment = await get_payment(db, tenant_id, payment_id)

    if payment.status == PaymentStatus.PAID:
        raise HTTPException(status_code=422, detail="Pagamento já quitado")
    if payment.status == PaymentStatus.CANCELLED:
        raise HTTPException(status_code=422, detail="Pagamento cancelado não pode ser quitado")

    payment.status = PaymentStatus.PAID
    payment.paid_at = data.paid_at or datetime.utcnow()
    payment.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(payment)
    return payment


async def cancel_payment(db: AsyncSession, tenant_id: UUID, payment_id: UUID) -> Payment:
    payment = await get_payment(db, tenant_id, payment_id)

    if payment.status == PaymentStatus.PAID:
        raise HTTPException(status_code=422, detail="Pagamento já quitado não pode ser cancelado")

    payment.status = PaymentStatus.CANCELLED
    payment.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(payment)
    return payment


async def sync_overdue(db: AsyncSession, tenant_id: UUID) -> int:
    """Marca como OVERDUE todos os pagamentos PENDING com due_date < hoje."""
    today = date.today()
    result = await db.execute(
        select(Payment).where(
            Payment.tenant_id == tenant_id,
            Payment.status == PaymentStatus.PENDING,
            Payment.due_date < today,
        )
    )
    payments = result.scalars().all()
    for p in payments:
        p.status = PaymentStatus.OVERDUE
        p.updated_at = datetime.utcnow()
    await db.commit()
    return len(payments)
