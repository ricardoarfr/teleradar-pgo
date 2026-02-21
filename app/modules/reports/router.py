# SCAFFOLD — implementar na próxima fase
# Módulo: Relatórios
# Responsabilidade: Geração de relatórios gerenciais e operacionais
# Dependências futuras: todos os módulos

from fastapi import APIRouter, HTTPException

router = APIRouter()


@router.get("/")
async def list_reports():
    raise HTTPException(status_code=501, detail="Módulo em desenvolvimento")


@router.get("/generate")
async def generate_report():
    raise HTTPException(status_code=501, detail="Módulo em desenvolvimento")
