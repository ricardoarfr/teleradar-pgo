# SCAFFOLD — implementar na próxima fase
# Módulo: Projetos
# Responsabilidade: Gestão de projetos e ordens de serviço
# Dependências futuras: tenants, users, contracts, materials

from fastapi import APIRouter, HTTPException

router = APIRouter()


@router.get("/")
async def list_projects():
    raise HTTPException(status_code=501, detail="Módulo em desenvolvimento")


@router.post("/")
async def create_project():
    raise HTTPException(status_code=501, detail="Módulo em desenvolvimento")


@router.get("/{project_id}")
async def get_project(project_id: str):
    raise HTTPException(status_code=501, detail="Módulo em desenvolvimento")
