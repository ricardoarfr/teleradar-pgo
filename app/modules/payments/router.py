from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User, UserRole
from app.database.connection import get_db
from app.modules.payments import schemas, service
from app.modules.payments.models import PaymentStatus
from app.rbac.dependencies import require_roles
from app.rbac.tenant import get_user_tenant_ids
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
    tenant_ids = get_user_tenant_ids(current_user)
    if tenant_ids and data.tenant_id not in tenant_ids:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso negado a esta empresa.",
        )
    payment = await service.create_payment(db, data.tenant_id, data)
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
    tenant_ids = get_user_tenant_ids(current_user)
    payments, total = await service.list_payments(
        db, tenant_ids, page, per_page, status, contract_id
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
    tenant_ids = get_user_tenant_ids(current_user)
    payment = await service.get_payment(db, tenant_ids, payment_id)
    return success("Dados do pagamento.", schemas.PaymentResponse.model_validate(payment))


@router.put("/{payment_id}")
async def update_payment(
    payment_id: UUID,
    data: schemas.PaymentUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(_manager_up),
):
    tenant_ids = get_user_tenant_ids(current_user)
    payment = await service.update_payment(db, tenant_ids, payment_id, data)
    return success("Pagamento atualizado.", schemas.PaymentResponse.model_validate(payment))


@router.post("/{payment_id}/pay")
async def mark_paid(
    payment_id: UUID,
    data: schemas.PaymentMarkPaid,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(_manager_up),
):
    tenant_ids = get_user_tenant_ids(current_user)
    payment = await service.mark_paid(db, tenant_ids, payment_id, data)
    return success("Pagamento quitado.", schemas.PaymentResponse.model_validate(payment))


@router.post("/{payment_id}/cancel")
async def cancel_payment(
    payment_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(_manager_up),
):
    tenant_ids = get_user_tenant_ids(current_user)
    payment = await service.cancel_payment(db, tenant_ids, payment_id)
    return success("Pagamento cancelado.", schemas.PaymentResponse.model_validate(payment))


@router.post("/sync-overdue")
async def sync_overdue(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(_manager_up),
):
    tenant_ids = get_user_tenant_ids(current_user)
    count = await service.sync_overdue(db, tenant_ids)
    return success(f"{count} pagamento(s) marcado(s) como vencido(s).", {"updated": count})
