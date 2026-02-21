from datetime import datetime

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User
from app.users.schemas import UpdateProfile


async def update_profile(db: AsyncSession, user: User, data: UpdateProfile) -> User:
    if data.name is not None:
        user.name = data.name
    user.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(user)
    return user
