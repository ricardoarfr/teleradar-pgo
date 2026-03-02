"""
Router — Módulo LPU

Prefixo registrado em main.py: /modules/lpu

Endpoints:
  Catálogo global (sem tenant):
    /classes       → CRUD de Classe
    /unidades      → CRUD de Unidade
    /servicos      → CRUD de Serviço (sem preço)

  Tenant-scoped:
    /lpus          → CRUD de LPU
    /lpus/{id}/itens → CRUD de Itens da LPU (onde o preço vive)

Controle de acesso:
  - Leitura: STAFF, MANAGER, ADMIN, MASTER
  - Escrita (catálogo global): ADMIN, MASTER
  - Escrita (LPU/Itens): ADMIN, MASTER

Resolução de tenant:
  Operações tenant-scoped usam a dependency TenantContext (app/rbac/tenant.py).
  Usuários com tenant_id próprio têm o tenant resolvido automaticamente.
  MASTER sem tenant deve informar ?tenant_id= na query.
"""
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import UserRole
from app.database.connection import get_db
from app.modules.catalogo.lpu import schemas, service
from app.rbac.dependencies import require_roles
from app.rbac.tenant import TenantContext, tenant_context
from app.utils.responses import success

router = APIRouter()

# Dependências de RBAC reutilizáveis
_staff_up = require_roles(UserRole.STAFF, UserRole.MANAGER, UserRole.ADMIN, UserRole.MASTER)
_admin_up = require_roles(UserRole.ADMIN, UserRole.MASTER)

# Dependências tenant-scoped
_staff_tenant = tenant_context(UserRole.STAFF, UserRole.MANAGER, UserRole.ADMIN, UserRole.MASTER)
_admin_tenant = tenant_context(UserRole.ADMIN, UserRole.MASTER)


# ===========================================================================
# CLASSE
# ===========================================================================

@router.post("/classes", status_code=201, tags=["LPU: Classes"])
async def create_classe(
    data: schemas.ClasseCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(_admin_up),
):
    classe = await service.create_classe(db, data)
    return success("Classe criada.", schemas.ClasseResponse.model_validate(classe))


@router.get("/classes", tags=["LPU: Classes"])
async def list_classes(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    ativa: Optional[bool] = None,
    db: AsyncSession = Depends(get_db),
    _=Depends(_staff_up),
):
    classes, total = await service.list_classes(db, page, per_page, ativa)
    return success("Lista de classes.", {
        "results": [schemas.ClasseResponse.model_validate(c) for c in classes],
        "total": total,
        "page": page,
        "per_page": per_page,
    })


@router.get("/classes/{classe_id}", tags=["LPU: Classes"])
async def get_classe(
    classe_id: UUID,
    db: AsyncSession = Depends(get_db),
    _=Depends(_staff_up),
):
    classe = await service.get_classe(db, classe_id)
    return success("Dados da classe.", schemas.ClasseResponse.model_validate(classe))


@router.put("/classes/{classe_id}", tags=["LPU: Classes"])
async def update_classe(
    classe_id: UUID,
    data: schemas.ClasseUpdate,
    db: AsyncSession = Depends(get_db),
    _=Depends(_admin_up),
):
    classe = await service.update_classe(db, classe_id, data)
    return success("Classe atualizada.", schemas.ClasseResponse.model_validate(classe))


@router.delete("/classes/{classe_id}", status_code=204, tags=["LPU: Classes"])
async def delete_classe(
    classe_id: UUID,
    db: AsyncSession = Depends(get_db),
    _=Depends(_admin_up),
):
    await service.delete_classe(db, classe_id)


# ===========================================================================
# UNIDADE
# ===========================================================================

@router.post("/unidades", status_code=201, tags=["LPU: Unidades"])
async def create_unidade(
    data: schemas.UnidadeCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(_admin_up),
):
    unidade = await service.create_unidade(db, data)
    return success("Unidade criada.", schemas.UnidadeResponse.model_validate(unidade))


@router.get("/unidades", tags=["LPU: Unidades"])
async def list_unidades(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    ativa: Optional[bool] = None,
    db: AsyncSession = Depends(get_db),
    _=Depends(_staff_up),
):
    unidades, total = await service.list_unidades(db, page, per_page, ativa)
    return success("Lista de unidades.", {
        "results": [schemas.UnidadeResponse.model_validate(u) for u in unidades],
        "total": total,
        "page": page,
        "per_page": per_page,
    })


@router.get("/unidades/{unidade_id}", tags=["LPU: Unidades"])
async def get_unidade(
    unidade_id: UUID,
    db: AsyncSession = Depends(get_db),
    _=Depends(_staff_up),
):
    unidade = await service.get_unidade(db, unidade_id)
    return success("Dados da unidade.", schemas.UnidadeResponse.model_validate(unidade))


@router.put("/unidades/{unidade_id}", tags=["LPU: Unidades"])
async def update_unidade(
    unidade_id: UUID,
    data: schemas.UnidadeUpdate,
    db: AsyncSession = Depends(get_db),
    _=Depends(_admin_up),
):
    unidade = await service.update_unidade(db, unidade_id, data)
    return success("Unidade atualizada.", schemas.UnidadeResponse.model_validate(unidade))


@router.delete("/unidades/{unidade_id}", status_code=204, tags=["LPU: Unidades"])
async def delete_unidade(
    unidade_id: UUID,
    db: AsyncSession = Depends(get_db),
    _=Depends(_admin_up),
):
    await service.delete_unidade(db, unidade_id)


# ===========================================================================
# SERVICO — sem preço
# ===========================================================================

@router.post("/servicos", status_code=201, tags=["LPU: Serviços"])
async def create_servico(
    data: schemas.ServicoCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(_admin_up),
):
    servico = await service.create_servico(db, data)
    return success("Serviço criado.", schemas.ServicoResponse.model_validate(servico))


@router.get("/servicos", tags=["LPU: Serviços"])
async def list_servicos(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    ativo: Optional[bool] = None,
    classe_id: Optional[UUID] = None,
    db: AsyncSession = Depends(get_db),
    _=Depends(_staff_up),
):
    servicos, total = await service.list_servicos(db, page, per_page, ativo, classe_id)
    return success("Lista de serviços.", {
        "results": [schemas.ServicoResponse.model_validate(s) for s in servicos],
        "total": total,
        "page": page,
        "per_page": per_page,
    })


@router.get("/servicos/{servico_id}", tags=["LPU: Serviços"])
async def get_servico(
    servico_id: UUID,
    db: AsyncSession = Depends(get_db),
    _=Depends(_staff_up),
):
    servico = await service.get_servico(db, servico_id)
    return success("Dados do serviço.", schemas.ServicoResponse.model_validate(servico))


@router.put("/servicos/{servico_id}", tags=["LPU: Serviços"])
async def update_servico(
    servico_id: UUID,
    data: schemas.ServicoUpdate,
    db: AsyncSession = Depends(get_db),
    _=Depends(_admin_up),
):
    servico = await service.update_servico(db, servico_id, data)
    return success("Serviço atualizado.", schemas.ServicoResponse.model_validate(servico))


@router.delete("/servicos/{servico_id}", status_code=204, tags=["LPU: Serviços"])
async def delete_servico(
    servico_id: UUID,
    db: AsyncSession = Depends(get_db),
    _=Depends(_admin_up),
):
    await service.delete_servico(db, servico_id)


# ===========================================================================
# LPU — tenant-scoped
# ===========================================================================

@router.post("/lpus", status_code=201, tags=["LPU"])
async def create_lpu(
    data: schemas.LPUCreate,
    db: AsyncSession = Depends(get_db),
    ctx: TenantContext = Depends(_admin_tenant),
):
    lpu = await service.create_lpu(db, ctx.tenant_id, data)
    return success("LPU criada.", schemas.LPUResponse.model_validate(lpu))


@router.get("/lpus", tags=["LPU"])
async def list_lpus(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    parceiro_id: Optional[UUID] = None,
    ativa: Optional[bool] = None,
    db: AsyncSession = Depends(get_db),
    ctx: TenantContext = Depends(_staff_tenant),
):
    lpus, total = await service.list_lpus(db, ctx.tenant_id, page, per_page, parceiro_id, ativa)
    return success("Lista de LPUs.", {
        "results": [schemas.LPUResponse.model_validate(l) for l in lpus],
        "total": total,
        "page": page,
        "per_page": per_page,
    })


@router.get("/lpus/{lpu_id}", tags=["LPU"])
async def get_lpu(
    lpu_id: UUID,
    db: AsyncSession = Depends(get_db),
    ctx: TenantContext = Depends(_staff_tenant),
):
    lpu = await service.get_lpu(db, ctx.tenant_id, lpu_id)
    return success("Dados da LPU.", schemas.LPUResponse.model_validate(lpu))


@router.put("/lpus/{lpu_id}", tags=["LPU"])
async def update_lpu(
    lpu_id: UUID,
    data: schemas.LPUUpdate,
    db: AsyncSession = Depends(get_db),
    ctx: TenantContext = Depends(_admin_tenant),
):
    lpu = await service.update_lpu(db, ctx.tenant_id, lpu_id, data)
    return success("LPU atualizada.", schemas.LPUResponse.model_validate(lpu))


@router.delete("/lpus/{lpu_id}", status_code=204, tags=["LPU"])
async def delete_lpu(
    lpu_id: UUID,
    db: AsyncSession = Depends(get_db),
    ctx: TenantContext = Depends(_admin_tenant),
):
    await service.delete_lpu(db, ctx.tenant_id, lpu_id)


# ===========================================================================
# LPU ITENS — onde o preço vive
# ===========================================================================

@router.post("/lpus/{lpu_id}/itens", status_code=201, tags=["LPU: Itens"])
async def add_item_lpu(
    lpu_id: UUID,
    data: schemas.LPUItemCreate,
    db: AsyncSession = Depends(get_db),
    ctx: TenantContext = Depends(_admin_tenant),
):
    item = await service.add_item_lpu(db, ctx.tenant_id, lpu_id, data)
    return success("Item adicionado à LPU.", schemas.LPUItemResponse.model_validate(item))


@router.get("/lpus/{lpu_id}/itens", tags=["LPU: Itens"])
async def list_itens_lpu(
    lpu_id: UUID,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    ctx: TenantContext = Depends(_staff_tenant),
):
    itens, total = await service.list_itens_lpu(db, ctx.tenant_id, lpu_id, page, per_page)
    return success("Itens da LPU.", {
        "results": [schemas.LPUItemResponse.model_validate(i) for i in itens],
        "total": total,
        "page": page,
        "per_page": per_page,
    })


@router.get("/lpus/{lpu_id}/itens/{item_id}", tags=["LPU: Itens"])
async def get_item_lpu(
    lpu_id: UUID,
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    ctx: TenantContext = Depends(_staff_tenant),
):
    item = await service.get_item_lpu(db, ctx.tenant_id, lpu_id, item_id)
    return success("Dados do item.", schemas.LPUItemResponse.model_validate(item))


@router.put("/lpus/{lpu_id}/itens/{item_id}", tags=["LPU: Itens"])
async def update_item_lpu(
    lpu_id: UUID,
    item_id: UUID,
    data: schemas.LPUItemUpdate,
    db: AsyncSession = Depends(get_db),
    ctx: TenantContext = Depends(_admin_tenant),
):
    item = await service.update_item_lpu(db, ctx.tenant_id, lpu_id, item_id, data)
    return success("Item atualizado.", schemas.LPUItemResponse.model_validate(item))


@router.delete("/lpus/{lpu_id}/itens/{item_id}", status_code=204, tags=["LPU: Itens"])
async def remove_item_lpu(
    lpu_id: UUID,
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    ctx: TenantContext = Depends(_admin_tenant),
):
    await service.remove_item_lpu(db, ctx.tenant_id, lpu_id, item_id)
