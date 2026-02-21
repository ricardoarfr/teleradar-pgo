# SCAFFOLD — implementar na próxima fase
# Módulo: Contratos
# Responsabilidade: Gestão de contratos entre ISP e clientes
# Dependências futuras: tenants, users, projects

from fastapi import APIRouter, HTTPException

router = APIRouter()


@router.get("/")
async def list_contracts():
    raise HTTPException(status_code=501, detail="Módulo em desenvolvimento")


@router.post("/")
async def create_contract():
    raise HTTPException(status_code=501, detail="Módulo em desenvolvimento")


@router.get("/{contract_id}")
async def get_contract(contract_id: str):
    raise HTTPException(status_code=501, detail="Módulo em desenvolvimento")
