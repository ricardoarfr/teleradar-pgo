# SCAFFOLD — implementar na próxima fase
# Módulo: Pagamentos
# Responsabilidade: Controle financeiro e cobrança de clientes
# Dependências futuras: tenants, contracts

from fastapi import APIRouter, HTTPException

router = APIRouter()


@router.get("/")
async def list_payments():
    raise HTTPException(status_code=501, detail="Módulo em desenvolvimento")


@router.post("/")
async def create_payment():
    raise HTTPException(status_code=501, detail="Módulo em desenvolvimento")
