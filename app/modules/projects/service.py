from datetime import datetime
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.projects.models import Project, ProjectStatus
from app.modules.projects.schemas import ProjectCreate, ProjectUpdate


async def create_project(db: AsyncSession, tenant_id: UUID, data: ProjectCreate) -> Project:
    project = Project(
        tenant_id=tenant_id,
        name=data.name,
        description=data.description,
        responsible_id=data.responsible_id,
        start_date=data.start_date,
        end_date=data.end_date,
    )
    db.add(project)
    await db.commit()
    await db.refresh(project)
    return project


async def list_projects(
    db: AsyncSession,
    tenant_id: UUID,
    page: int = 1,
    per_page: int = 20,
    status: ProjectStatus | None = None,
) -> tuple[list[Project], int]:
    query = select(Project).where(Project.tenant_id == tenant_id)
    count_query = select(func.count()).select_from(Project).where(Project.tenant_id == tenant_id)

    if status:
        query = query.where(Project.status == status)
        count_query = count_query.where(Project.status == status)

    total = (await db.execute(count_query)).scalar()
    projects = (
        await db.execute(
            query.order_by(Project.created_at.desc()).offset((page - 1) * per_page).limit(per_page)
        )
    ).scalars().all()
    return projects, total


async def get_project(db: AsyncSession, tenant_id: UUID, project_id: UUID) -> Project:
    result = await db.execute(
        select(Project).where(Project.id == project_id, Project.tenant_id == tenant_id)
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Projeto não encontrado")
    return project


async def update_project(
    db: AsyncSession, tenant_id: UUID, project_id: UUID, data: ProjectUpdate
) -> Project:
    project = await get_project(db, tenant_id, project_id)

    if data.name is not None:
        project.name = data.name
    if data.description is not None:
        project.description = data.description
    if data.status is not None:
        project.status = data.status
    if data.responsible_id is not None:
        project.responsible_id = data.responsible_id
    if data.start_date is not None:
        project.start_date = data.start_date
    if data.end_date is not None:
        project.end_date = data.end_date

    project.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(project)
    return project
