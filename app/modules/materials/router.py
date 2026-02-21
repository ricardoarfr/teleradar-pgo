# SCAFFOLD — implementar na próxima fase
# Módulo: Materiais
# Responsabilidade: Controle de estoque e materiais utilizados em projetos
# Dependências futuras: projects, tenants

from fastapi import APIRouter, HTTPException

router = APIRouter()


@router.get("/")
async def list_materials():
    raise HTTPException(status_code=501, detail="Módulo em desenvolvimento")


@router.post("/")
async def create_material():
    raise HTTPException(status_code=501, detail="Módulo em desenvolvimento")
