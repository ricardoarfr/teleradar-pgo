"""
Service Layer — Módulo LPU

Responsabilidades:
- CRUD assíncrono para Classe, Unidade, Servico, LPU, LPUItem
- Isolamento de tenant em LPU/LPUItem
- Validação de integridade referencial (duplicidade, existência de FK)
- Regra de negócio: Serviço nunca possui preço
"""
from typing import Optional
from datetime import datetime
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.modules.catalogo.lpu.models import Classe, LPU, LPUItem, Servico, Unidade
from app.modules.catalogo.lpu.schemas import (
    ClasseCreate,
    ClasseUpdate,
    LPUCreate,
    LPUItemCreate,
    LPUItemUpdate,
    LPUUpdate,
    ServicoCreate,
    ServicoUpdate,
    UnidadeCreate,
    UnidadeUpdate,
)


# ===========================================================================
# CLASSE
# ===========================================================================

async def create_classe(db: AsyncSession, data: ClasseCreate) -> Classe:
    # Verifica unicidade do nome antes de inserir
    existing = (await db.execute(
        select(Classe).where(Classe.nome == data.nome)
    )).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=409, detail="Classe com este nome já existe.")

    classe = Classe(
        nome=data.nome,
        descricao=data.descricao,
        ativa=data.ativa,
    )
    db.add(classe)
    await db.commit()
    await db.refresh(classe)
    return classe


async def list_classes(
    db: AsyncSession,
    page: int = 1,
    per_page: int = 20,
    ativa: Optional[bool] = None,
) -> tuple[list[Classe], int]:
    query = select(Classe)
    count_query = select(func.count()).select_from(Classe)

    if ativa is not None:
        query = query.where(Classe.ativa == ativa)
        count_query = count_query.where(Classe.ativa == ativa)

    total = (await db.execute(count_query)).scalar()
    classes = (
        await db.execute(
            query.order_by(Classe.nome).offset((page - 1) * per_page).limit(per_page)
        )
    ).scalars().all()
    return classes, total


async def get_classe(db: AsyncSession, classe_id: UUID) -> Classe:
    result = await db.execute(select(Classe).where(Classe.id == classe_id))
    classe = result.scalar_one_or_none()
    if not classe:
        raise HTTPException(status_code=404, detail="Classe não encontrada.")
    return classe


async def update_classe(db: AsyncSession, classe_id: UUID, data: ClasseUpdate) -> Classe:
    classe = await get_classe(db, classe_id)

    if data.nome is not None and data.nome != classe.nome:
        existing = (await db.execute(
            select(Classe).where(Classe.nome == data.nome)
        )).scalar_one_or_none()
        if existing:
            raise HTTPException(status_code=409, detail="Classe com este nome já existe.")
        classe.nome = data.nome

    if data.descricao is not None:
        classe.descricao = data.descricao
    if data.ativa is not None:
        classe.ativa = data.ativa

    classe.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(classe)
    return classe


async def delete_classe(db: AsyncSession, classe_id: UUID) -> None:
    classe = await get_classe(db, classe_id)
    em_uso = (await db.execute(
        select(func.count()).select_from(Servico).where(Servico.classe_id == classe_id)
    )).scalar()
    if em_uso:
        raise HTTPException(
            status_code=409,
            detail="Classe está vinculada a uma ou mais atividades e não pode ser excluída.",
        )
    await db.delete(classe)
    await db.commit()


# ===========================================================================
# UNIDADE
# ===========================================================================

async def create_unidade(db: AsyncSession, data: UnidadeCreate) -> Unidade:
    existing = (await db.execute(
        select(Unidade).where(Unidade.sigla == data.sigla)
    )).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=409, detail="Unidade com esta sigla já existe.")

    unidade = Unidade(
        nome=data.nome,
        sigla=data.sigla,
        ativa=data.ativa,
    )
    db.add(unidade)
    await db.commit()
    await db.refresh(unidade)
    return unidade


async def list_unidades(
    db: AsyncSession,
    page: int = 1,
    per_page: int = 20,
    ativa: Optional[bool] = None,
) -> tuple[list[Unidade], int]:
    query = select(Unidade)
    count_query = select(func.count()).select_from(Unidade)

    if ativa is not None:
        query = query.where(Unidade.ativa == ativa)
        count_query = count_query.where(Unidade.ativa == ativa)

    total = (await db.execute(count_query)).scalar()
    unidades = (
        await db.execute(
            query.order_by(Unidade.sigla).offset((page - 1) * per_page).limit(per_page)
        )
    ).scalars().all()
    return unidades, total


async def get_unidade(db: AsyncSession, unidade_id: UUID) -> Unidade:
    result = await db.execute(select(Unidade).where(Unidade.id == unidade_id))
    unidade = result.scalar_one_or_none()
    if not unidade:
        raise HTTPException(status_code=404, detail="Unidade não encontrada.")
    return unidade


async def update_unidade(db: AsyncSession, unidade_id: UUID, data: UnidadeUpdate) -> Unidade:
    unidade = await get_unidade(db, unidade_id)

    if data.sigla is not None and data.sigla != unidade.sigla:
        existing = (await db.execute(
            select(Unidade).where(Unidade.sigla == data.sigla)
        )).scalar_one_or_none()
        if existing:
            raise HTTPException(status_code=409, detail="Unidade com esta sigla já existe.")
        unidade.sigla = data.sigla

    if data.nome is not None:
        unidade.nome = data.nome
    if data.ativa is not None:
        unidade.ativa = data.ativa

    unidade.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(unidade)
    return unidade


async def delete_unidade(db: AsyncSession, unidade_id: UUID) -> None:
    from app.modules.catalogo.materiais.models import Material
    unidade = await get_unidade(db, unidade_id)
    em_uso_servico = (await db.execute(
        select(func.count()).select_from(Servico).where(Servico.unidade_id == unidade_id)
    )).scalar()
    em_uso_material = (await db.execute(
        select(func.count()).select_from(Material).where(Material.unidade_id == unidade_id)
    )).scalar()
    if em_uso_servico or em_uso_material:
        raise HTTPException(
            status_code=409,
            detail="Unidade está vinculada a atividades ou materiais e não pode ser excluída.",
        )
    await db.delete(unidade)
    await db.commit()


# ===========================================================================
# SERVICO — nunca possui preço
# ===========================================================================

async def create_servico(db: AsyncSession, data: ServicoCreate) -> Servico:
    # Verifica unicidade do código
    existing = (await db.execute(
        select(Servico).where(Servico.codigo == data.codigo)
    )).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=409, detail="Serviço com este código já existe.")

    # Valida FK: classe deve existir
    await get_classe(db, data.classe_id)
    # Valida FK: unidade deve existir
    await get_unidade(db, data.unidade_id)

    servico = Servico(
        codigo=data.codigo,
        atividade=data.atividade,
        classe_id=data.classe_id,
        unidade_id=data.unidade_id,
        ativo=data.ativo,
    )
    db.add(servico)
    await db.commit()
    await db.refresh(servico)
    return servico


async def list_servicos(
    db: AsyncSession,
    page: int = 1,
    per_page: int = 20,
    ativo: Optional[bool] = None,
    classe_id: Optional[UUID] = None,
) -> tuple[list[Servico], int]:
    query = select(Servico).options(
        selectinload(Servico.classe),
        selectinload(Servico.unidade),
    )
    count_query = select(func.count()).select_from(Servico)

    if ativo is not None:
        query = query.where(Servico.ativo == ativo)
        count_query = count_query.where(Servico.ativo == ativo)
    if classe_id is not None:
        query = query.where(Servico.classe_id == classe_id)
        count_query = count_query.where(Servico.classe_id == classe_id)

    total = (await db.execute(count_query)).scalar()
    servicos = (
        await db.execute(
            query.order_by(Servico.codigo).offset((page - 1) * per_page).limit(per_page)
        )
    ).scalars().all()
    return servicos, total


async def get_servico(db: AsyncSession, servico_id: UUID) -> Servico:
    result = await db.execute(
        select(Servico)
        .where(Servico.id == servico_id)
        .options(selectinload(Servico.classe), selectinload(Servico.unidade))
    )
    servico = result.scalar_one_or_none()
    if not servico:
        raise HTTPException(status_code=404, detail="Serviço não encontrado.")
    return servico


async def update_servico(db: AsyncSession, servico_id: UUID, data: ServicoUpdate) -> Servico:
    servico = await get_servico(db, servico_id)

    if data.codigo is not None and data.codigo != servico.codigo:
        existing = (await db.execute(
            select(Servico).where(Servico.codigo == data.codigo)
        )).scalar_one_or_none()
        if existing:
            raise HTTPException(status_code=409, detail="Serviço com este código já existe.")
        servico.codigo = data.codigo

    if data.atividade is not None:
        servico.atividade = data.atividade
    if data.classe_id is not None:
        await get_classe(db, data.classe_id)  # valida existência
        servico.classe_id = data.classe_id
    if data.unidade_id is not None:
        await get_unidade(db, data.unidade_id)  # valida existência
        servico.unidade_id = data.unidade_id
    if data.ativo is not None:
        servico.ativo = data.ativo

    servico.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(servico)
    return servico


async def delete_servico(db: AsyncSession, servico_id: UUID) -> None:
    from app.modules.catalogo.lpu.models import LPUItem
    servico = await get_servico(db, servico_id)
    em_uso = (await db.execute(
        select(func.count()).select_from(LPUItem).where(LPUItem.servico_id == servico_id)
    )).scalar()
    if em_uso:
        raise HTTPException(
            status_code=409,
            detail="Atividade está vinculada a uma ou mais LPUs e não pode ser excluída.",
        )
    await db.delete(servico)
    await db.commit()


# ===========================================================================
# LPU
# ===========================================================================

async def create_lpu(db: AsyncSession, tenant_id: UUID, data: LPUCreate) -> LPU:
    # Valida que o parceiro existe e pertence ao tenant (via JOIN com user)
    from app.modules.partners.models import PartnerProfile
    parceiro = (await db.execute(
        select(PartnerProfile).where(
            PartnerProfile.id == data.parceiro_id,
            PartnerProfile.tenant_id == tenant_id,
        )
    )).scalar_one_or_none()
    if not parceiro:
        raise HTTPException(status_code=404, detail="Parceiro não encontrado neste tenant.")

    lpu = LPU(
        nome=data.nome,
        parceiro_id=data.parceiro_id,
        tenant_id=tenant_id,
        ativa=data.ativa,
        data_inicio=data.data_inicio,
        data_fim=data.data_fim,
    )
    db.add(lpu)
    await db.commit()
    await db.refresh(lpu)
    return lpu


async def list_lpus(
    db: AsyncSession,
    tenant_id: UUID,
    page: int = 1,
    per_page: int = 20,
    parceiro_id: Optional[UUID] = None,
    ativa: Optional[bool] = None,
) -> tuple[list[LPU], int]:
    query = select(LPU).where(LPU.tenant_id == tenant_id)
    count_query = select(func.count()).select_from(LPU).where(LPU.tenant_id == tenant_id)

    if parceiro_id is not None:
        query = query.where(LPU.parceiro_id == parceiro_id)
        count_query = count_query.where(LPU.parceiro_id == parceiro_id)
    if ativa is not None:
        query = query.where(LPU.ativa == ativa)
        count_query = count_query.where(LPU.ativa == ativa)

    total = (await db.execute(count_query)).scalar()
    lpus = (
        await db.execute(
            query.order_by(LPU.nome).offset((page - 1) * per_page).limit(per_page)
        )
    ).scalars().all()
    return lpus, total


async def get_lpu(db: AsyncSession, tenant_id: UUID, lpu_id: UUID) -> LPU:
    result = await db.execute(
        select(LPU).where(LPU.id == lpu_id, LPU.tenant_id == tenant_id)
    )
    lpu = result.scalar_one_or_none()
    if not lpu:
        raise HTTPException(status_code=404, detail="LPU não encontrada.")
    return lpu


async def update_lpu(db: AsyncSession, tenant_id: UUID, lpu_id: UUID, data: LPUUpdate) -> LPU:
    lpu = await get_lpu(db, tenant_id, lpu_id)

    if data.parceiro_id is not None:
        from app.modules.partners.models import PartnerProfile
        parceiro = (await db.execute(
            select(PartnerProfile).where(
                PartnerProfile.id == data.parceiro_id,
                PartnerProfile.tenant_id == tenant_id,
            )
        )).scalar_one_or_none()
        if not parceiro:
            raise HTTPException(status_code=404, detail="Parceiro não encontrado neste tenant.")
        lpu.parceiro_id = data.parceiro_id

    if data.nome is not None:
        lpu.nome = data.nome
    if data.ativa is not None:
        lpu.ativa = data.ativa
    if data.data_inicio is not None:
        lpu.data_inicio = data.data_inicio
    if data.data_fim is not None:
        lpu.data_fim = data.data_fim

    lpu.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(lpu)
    return lpu


# ===========================================================================
# LPU ITEM
# ===========================================================================

async def add_item_lpu(
    db: AsyncSession,
    tenant_id: UUID,
    lpu_id: UUID,
    data: LPUItemCreate,
) -> LPUItem:
    # Garante que a LPU existe e pertence ao tenant
    lpu = await get_lpu(db, tenant_id, lpu_id)

    # Valida que o serviço existe
    servico = (await db.execute(
        select(Servico).where(Servico.id == data.servico_id)
    )).scalar_one_or_none()
    if not servico:
        raise HTTPException(status_code=404, detail="Serviço não encontrado.")
    if not servico.ativo:
        raise HTTPException(status_code=422, detail="Serviço inativo não pode ser adicionado à LPU.")

    # Verifica duplicidade: mesmo serviço na mesma LPU
    existing = (await db.execute(
        select(LPUItem).where(
            LPUItem.lpu_id == lpu.id,
            LPUItem.servico_id == data.servico_id,
        )
    )).scalar_one_or_none()
    if existing:
        raise HTTPException(
            status_code=409,
            detail="Este serviço já está cadastrado nesta LPU.",
        )

    item = LPUItem(
        lpu_id=lpu.id,
        servico_id=data.servico_id,
        valor_unitario=data.valor_unitario,
        valor_classe=data.valor_classe,
    )
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item


async def list_itens_lpu(
    db: AsyncSession,
    tenant_id: UUID,
    lpu_id: UUID,
    page: int = 1,
    per_page: int = 20,
) -> tuple[list[LPUItem], int]:
    # Garante que a LPU existe e pertence ao tenant
    await get_lpu(db, tenant_id, lpu_id)

    query = (
        select(LPUItem)
        .where(LPUItem.lpu_id == lpu_id)
        .options(
            selectinload(LPUItem.servico).selectinload(Servico.classe),
            selectinload(LPUItem.servico).selectinload(Servico.unidade),
        )
    )
    count_query = select(func.count()).select_from(LPUItem).where(LPUItem.lpu_id == lpu_id)

    total = (await db.execute(count_query)).scalar()
    itens = (
        await db.execute(
            query.order_by(LPUItem.created_at.desc()).offset((page - 1) * per_page).limit(per_page)
        )
    ).scalars().all()
    return itens, total


async def get_item_lpu(db: AsyncSession, tenant_id: UUID, lpu_id: UUID, item_id: UUID) -> LPUItem:
    # Garante que a LPU existe e pertence ao tenant
    await get_lpu(db, tenant_id, lpu_id)

    result = await db.execute(
        select(LPUItem)
        .where(LPUItem.id == item_id, LPUItem.lpu_id == lpu_id)
        .options(
            selectinload(LPUItem.servico).selectinload(Servico.classe),
            selectinload(LPUItem.servico).selectinload(Servico.unidade),
        )
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item de LPU não encontrado.")
    return item


async def update_item_lpu(
    db: AsyncSession,
    tenant_id: UUID,
    lpu_id: UUID,
    item_id: UUID,
    data: LPUItemUpdate,
) -> LPUItem:
    item = await get_item_lpu(db, tenant_id, lpu_id, item_id)

    if data.valor_unitario is not None:
        item.valor_unitario = data.valor_unitario
    if data.valor_classe is not None:
        item.valor_classe = data.valor_classe

    item.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(item)
    return item


async def delete_lpu(
    db: AsyncSession,
    tenant_id: UUID,
    lpu_id: UUID,
) -> None:
    lpu = await get_lpu(db, tenant_id, lpu_id)
    await db.delete(lpu)
    await db.commit()


async def remove_item_lpu(
    db: AsyncSession,
    tenant_id: UUID,
    lpu_id: UUID,
    item_id: UUID,
) -> None:
    item = await get_item_lpu(db, tenant_id, lpu_id, item_id)
    await db.delete(item)
    await db.commit()
