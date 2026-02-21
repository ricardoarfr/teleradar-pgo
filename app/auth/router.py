from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import schemas, service
from app.auth.dependencies import get_current_user
from app.auth.models import User
from app.auth.oauth_google import get_google_auth_url, handle_google_callback
from app.database.connection import get_db
from app.utils.responses import success

router = APIRouter()


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(data: schemas.UserRegister, request: Request, db: AsyncSession = Depends(get_db)):
    user = await service.register_user(db, data, request)
    return success("Cadastro realizado. Aguarde aprovação.", schemas.UserResponse.model_validate(user))


@router.post("/login")
async def login(data: schemas.UserLogin, request: Request, db: AsyncSession = Depends(get_db)):
    tokens = await service.login_user(db, data, request)
    return success("Login realizado com sucesso.", tokens)


@router.post("/refresh")
async def refresh(data: schemas.TokenRefresh, db: AsyncSession = Depends(get_db)):
    tokens = await service.refresh_tokens(db, data.refresh_token)
    return success("Tokens renovados.", tokens)


@router.post("/logout")
async def logout(
    data: schemas.TokenRefresh,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await service.logout_user(db, data.refresh_token, current_user, request)
    return success("Logout realizado.")


@router.post("/forgot-password")
async def forgot_password(data: schemas.ForgotPassword, db: AsyncSession = Depends(get_db)):
    await service.forgot_password(db, data.email)
    return success("Se o e-mail existir, você receberá as instruções.")


@router.post("/reset-password")
async def reset_password(data: schemas.ResetPassword, db: AsyncSession = Depends(get_db)):
    await service.reset_password(db, data.token, data.new_password)
    return success("Senha redefinida com sucesso.")


@router.post("/change-password")
async def change_password(
    data: schemas.ChangePassword,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await service.change_password(db, current_user, data.current_password, data.new_password)
    return success("Senha alterada com sucesso.")


@router.get("/me")
async def me(current_user: User = Depends(get_current_user)):
    return success("Dados do usuário.", schemas.UserResponse.model_validate(current_user))


@router.post("/master/bootstrap", status_code=status.HTTP_201_CREATED)
async def bootstrap_master(data: schemas.MasterBootstrap, request: Request, db: AsyncSession = Depends(get_db)):
    master = await service.bootstrap_master(db, data, request)
    return success("Usuário MASTER criado com sucesso.", schemas.UserResponse.model_validate(master))


@router.get("/google")
async def google_login():
    return success("URL de autenticação Google.", {"auth_url": get_google_auth_url()})


@router.get("/google/callback")
async def google_callback(code: str, db: AsyncSession = Depends(get_db)):
    result = await handle_google_callback(db, code)
    return success("Login Google realizado.", result)
