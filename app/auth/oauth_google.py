import logging

import httpx
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.jwt import create_access_token, create_refresh_token
from app.auth.models import User, UserRole, UserStatus
from app.config.settings import settings

logger = logging.getLogger(__name__)

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"


def get_google_auth_url() -> str:
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=503, detail="Google OAuth não configurado")
    params = "&".join([
        f"client_id={settings.GOOGLE_CLIENT_ID}",
        f"redirect_uri={settings.GOOGLE_REDIRECT_URI}",
        "response_type=code",
        "scope=openid email profile",
        "access_type=offline",
    ])
    return f"{GOOGLE_AUTH_URL}?{params}"


async def handle_google_callback(db: AsyncSession, code: str) -> dict:
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=503, detail="Google OAuth não configurado")

    async with httpx.AsyncClient() as client:
        token_resp = await client.post(GOOGLE_TOKEN_URL, data={
            "code": code,
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "redirect_uri": settings.GOOGLE_REDIRECT_URI,
            "grant_type": "authorization_code",
        })
        if token_resp.status_code != 200:
            raise HTTPException(status_code=400, detail="Falha na autenticação Google")

        userinfo_resp = await client.get(
            GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {token_resp.json()['access_token']}"},
        )
        userinfo = userinfo_resp.json()

    google_id = userinfo.get("id")
    email = userinfo.get("email")
    name = userinfo.get("name", email)

    result = await db.execute(select(User).where(User.google_id == google_id))
    user = result.scalar_one_or_none()

    if not user:
        email_result = await db.execute(select(User).where(User.email == email))
        user = email_result.scalar_one_or_none()
        if user:
            user.google_id = google_id
        else:
            user = User(name=name, email=email, google_id=google_id, role=UserRole.STAFF, status=UserStatus.PENDING)
            db.add(user)
            await db.flush()

    if user.status != UserStatus.APPROVED:
        await db.commit()
        raise HTTPException(status_code=403, detail="Conta aguardando aprovação")

    token_payload = {"sub": str(user.id), "role": user.role.value, "tenant_id": str(user.tenant_id) if user.tenant_id else None}
    await db.commit()
    return {"access_token": create_access_token(token_payload), "refresh_token": create_refresh_token(token_payload), "token_type": "bearer"}
