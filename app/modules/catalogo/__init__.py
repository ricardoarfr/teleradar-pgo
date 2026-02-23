from fastapi import APIRouter

from app.modules.catalogo.lpu.router import router as lpu_router
from app.modules.catalogo.materiais.router import router as materiais_router

router = APIRouter()

router.include_router(lpu_router, prefix="/lpu")
router.include_router(materiais_router, prefix="/materiais")
