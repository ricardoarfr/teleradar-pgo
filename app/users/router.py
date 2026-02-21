from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.auth.models import User
from app.database.connection import get_db
from app.users import schemas, service
from app.utils.responses import success

router = APIRouter()


@router.get("/me")
async def get_me(current_user: User = Depends(get_current_user)):
    return success("Perfil do usuário.", schemas.UserProfileResponse.model_validate(current_user))


@router.put("/me")
async def update_me(
    data: schemas.UpdateProfile,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    user = await service.update_profile(db, current_user, data)
    return success("Perfil atualizado.", schemas.UserProfileResponse.model_validate(user))


@router.put("/me/avatar", status_code=501)
async def update_avatar():
    # SCAFFOLD — implementar na próxima fase
    # Módulo: Upload de avatar
    # Dependências futuras: serviço de storage (S3, Cloudinary ou similar)
    return {"status": "error", "message": "Funcionalidade em desenvolvimento", "data": None}


@router.delete("/me", status_code=501)
async def delete_account():
    # SCAFFOLD — implementar na próxima fase
    # Módulo: Exclusão de conta
    # Requer: fluxo de confirmação por e-mail + soft delete
    return {"status": "error", "message": "Funcionalidade em desenvolvimento", "data": None}
