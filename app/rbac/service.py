from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete

from app.rbac.models import Permission, RolePermission, ScreenPermission
from app.rbac.schemas import ScreenActionSet
from app.auth.models import UserRole


async def list_permissions(db: AsyncSession) -> list[Permission]:
    result = await db.execute(select(Permission).order_by(Permission.module, Permission.name))
    return result.scalars().all()


async def list_role_permissions(db: AsyncSession, role: UserRole) -> list[RolePermission]:
    result = await db.execute(
        select(RolePermission).where(RolePermission.role == role)
    )
    return result.scalars().all()


# --- Screen Permissions ---

async def get_all_screen_permissions(db: AsyncSession) -> dict[str, dict[str, ScreenActionSet]]:
    """Retorna permissões de tela de todos os perfis."""
    result = await db.execute(select(ScreenPermission))
    rows = result.scalars().all()

    output: dict[str, dict[str, ScreenActionSet]] = {}
    for row in rows:
        role_key = row.role.value
        if role_key not in output:
            output[role_key] = {}
        output[role_key][row.screen_key] = ScreenActionSet(
            view=row.can_view,
            create=row.can_create,
            edit=row.can_edit,
            delete=row.can_delete,
        )
    return output


async def get_screen_permissions_for_role(
    db: AsyncSession, role: UserRole
) -> dict[str, ScreenActionSet]:
    """Retorna permissões de tela de um perfil específico."""
    result = await db.execute(
        select(ScreenPermission).where(ScreenPermission.role == role)
    )
    rows = result.scalars().all()
    return {
        row.screen_key: ScreenActionSet(
            view=row.can_view,
            create=row.can_create,
            edit=row.can_edit,
            delete=row.can_delete,
        )
        for row in rows
    }


async def update_screen_permissions_for_role(
    db: AsyncSession,
    role: UserRole,
    screens: dict[str, ScreenActionSet],
) -> dict[str, ScreenActionSet]:
    """Substitui todas as permissões de tela de um perfil."""
    await db.execute(
        delete(ScreenPermission).where(ScreenPermission.role == role)
    )

    for screen_key, actions in screens.items():
        db.add(ScreenPermission(
            role=role,
            screen_key=screen_key,
            can_view=actions.view,
            can_create=actions.create,
            can_edit=actions.edit,
            can_delete=actions.delete,
        ))

    await db.commit()
    return screens
