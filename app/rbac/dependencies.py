from typing import Callable

from fastapi import Depends, HTTPException, status

from app.auth.models import User, UserRole
from app.auth.dependencies import get_current_user


def require_roles(*roles: UserRole) -> Callable:
    async def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Acesso negado. Roles permitidos: {[r.value for r in roles]}",
            )
        return current_user
    return role_checker


def require_permissions(*permission_names: str) -> Callable:
    async def permission_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role in (UserRole.MASTER, UserRole.ADMIN):
            return current_user
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Permissão negada: {list(permission_names)}",
        )
    return permission_checker
