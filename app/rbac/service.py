from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.rbac.models import Permission, RolePermission
from app.auth.models import UserRole


async def list_permissions(db: AsyncSession) -> list[Permission]:
    result = await db.execute(select(Permission).order_by(Permission.module, Permission.name))
    return result.scalars().all()


async def list_role_permissions(db: AsyncSession, role: UserRole) -> list[RolePermission]:
    result = await db.execute(
        select(RolePermission).where(RolePermission.role == role)
    )
    return result.scalars().all()
