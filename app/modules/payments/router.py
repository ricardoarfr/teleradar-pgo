from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User, UserRole
from app.database.connection import get_db
from app.modules.payments import schemas, service
from app.modules.payments.models import PaymentStatus
from app.rbac.dependencies import require_roles
from app.utils.responses import success

router = APIRouter()

_staff_up = require_roles(UserRole.STAFF, UserRole.MANAGER, UserRole.ADMIN, UserRole.MASTER)
_manager_up = require_roles(UserRole.MANAGER, UserRole.ADMIN, UserRole.MASTER)


@router.post("/", status_code=201)
async def create_payment(
    data: schemas.PaymentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(_manager_up),
):
    payment = await service.create_payment(db, current_user.tenant_id, data)
    return success("Pagamento criado.", schemas.PaymentResponse.model_validate(payment))


@router.get("/")
async def list_payments(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    status: Optional[PaymentStatus] = None,
    contract_id: Optional[UUID] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(_staff_up),
):
    payments, total = await service.list_payments(
        db, current_user.tenant_id, page, per_page, status, contract_id
    )
    return success("Lista de pagamentos.", {
        "results": [schemas.PaymentResponse.model_validate(p) for p in payments],
        "total": total,
        "page": page,
        "per_page": per_page,
    })


@router.get("/{payment_id}")
async def get_payment(
    payment_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(_staff_up),
):
    payment = await service.get_payment(db, current_user.tenant_id, payment_id)
    return success("Dados do pagamento.", schemas.PaymentResponse.model_validate(payment))


@router.put("/{payment_id}")
async def update_payment(
    payment_id: UUID,
    data: schemas.PaymentUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(_manager_up),
):
    payment = await service.update_payment(db, current_user.tenant_id, payment_id, data)
    return success("Pagamento atualizado.", schemas.PaymentResponse.model_validate(payment))


@router.post("/{payment_id}/pay")
async def mark_paid(
    payment_id: UUID,
    data: schemas.PaymentMarkPaid,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(_manager_up),
):
    payment = await service.mark_paid(db, current_user.tenant_id, payment_id, data)
    return success("Pagamento quitado.", schemas.PaymentResponse.model_validate(payment))


@router.post("/{payment_id}/cancel")
async def cancel_payment(
    payment_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(_manager_up),
):
    payment = await service.cancel_payment(db, current_user.tenant_id, payment_id)
    return success("Pagamento cancelado.", schemas.PaymentResponse.model_validate(payment))


@router.post("/sync-overdue")
async def sync_overdue(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(_manager_up),
):
    count = await service.sync_overdue(db, current_user.tenant_id)
    return success(f"{count} pagamento(s) marcado(s) como vencido(s).", {"updated": count})
