import io
import json
from datetime import datetime
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User, UserRole
from app.database.connection import get_db
from app.modules.produttivo import api_client, config_crud
from app.modules.produttivo.excel import gerar_excel_relatorio1, gerar_excel_relatorio2
from app.modules.produttivo.reports.atividades import gerar_relatorio_atividades
from app.modules.produttivo.reports.atividades_usuario import gerar_relatorio_usuario
from app.rbac.dependencies import require_roles
from app.utils.responses import success
from pydantic import BaseModel

router = APIRouter()

_staff_up = require_roles(UserRole.STAFF, UserRole.MANAGER, UserRole.ADMIN, UserRole.MASTER)
_manager_up = require_roles(UserRole.MANAGER, UserRole.ADMIN, UserRole.MASTER)


# ---------------------------------------------------------------------------
# CONFIG — Cookie management
# ---------------------------------------------------------------------------

class CookiePayload(BaseModel):
    cookie: str


class AccountPayload(BaseModel):
    account_id: str


@router.get("/config")
async def get_config(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(_staff_up),
):
    config = await config_crud.get_or_create_config(db, current_user.tenant_id)
    return success("Configuração Produttivo.", {
        "has_cookie": bool(config.cookie),
        "account_id": config.account_id,
        "cookie_updated_at": config.cookie_updated_at.isoformat() if config.cookie_updated_at else None,
        "produttivo_email": config.produttivo_email,
    })


@router.post("/config/cookie")
async def save_cookie(
    payload: CookiePayload,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(_manager_up),
):
    config = await config_crud.save_cookie(db, current_user.tenant_id, payload.cookie.strip())
    return success("Cookie salvo.", {"has_cookie": True, "cookie_updated_at": config.cookie_updated_at.isoformat()})


@router.post("/config/validate")
async def validate_cookie(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(_staff_up),
):
    config = await config_crud.get_config_or_404(db, current_user.tenant_id)
    valid = await api_client.validate_cookie(config.cookie, config.account_id)
    if not valid:
        return success("Cookie inválido ou expirado.", {"valid": False})
    return success("Cookie válido.", {"valid": True})


class GerarCookiePayload(BaseModel):
    email: str
    senha: str


@router.post("/config/gerar-cookie")
async def gerar_cookie_automatico(
    payload: GerarCookiePayload,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(_manager_up),
):
    """
    Faz login no Produttivo via Playwright headless, captura o cookie de sessão
    e o salva automaticamente no banco. Retorna progresso via SSE.

    Formato de cada evento:
    data: {"pct": 0-100, "msg": "...", "status": "running|done|error", "cookie": null|"..."}
    """
    tenant_id = current_user.tenant_id
    if tenant_id is None:
        raise HTTPException(
            status_code=400,
            detail="Usuário não está associado a nenhuma empresa.",
        )

    async def stream_gen():
        from playwright.async_api import async_playwright

        def evento(pct: int, msg: str, status: str = "running", cookie: str | None = None) -> str:
            return f"data: {json.dumps({'pct': pct, 'msg': msg, 'status': status, 'cookie': cookie}, ensure_ascii=False)}\n\n"

        browser = None
        try:
            yield evento(5, "Iniciando navegador...")
            async with async_playwright() as p:
                browser = await p.chromium.launch(
                    headless=True,
                    args=[
                        "--no-sandbox",
                        "--disable-dev-shm-usage",
                        "--disable-gpu",
                        "--single-process",
                        "--disable-setuid-sandbox",
                    ],
                )
                yield evento(15, "Browser iniciado. Criando contexto...")
                context = await browser.new_context(
                    user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
                )
                context.set_default_timeout(60000)
                page = await context.new_page()

                yield evento(25, "Abrindo página de login...")
                await page.goto(
                    "https://app.produttivo.com.br/auth/sign_in",
                    wait_until="domcontentloaded",
                    timeout=60000,
                )

                yield evento(40, "Preenchendo e-mail...")
                await page.wait_for_selector(
                    'input[type="email"], input[name="email"]', timeout=30000
                )
                await page.fill('input[type="email"], input[name="email"]', payload.email)

                yield evento(50, "Preenchendo senha...")
                await page.fill('input[type="password"]', payload.senha)

                yield evento(60, "Enviando credenciais...")
                try:
                    await page.click('button:has-text("Login")', timeout=5000)
                except Exception:
                    try:
                        await page.click('button[type="submit"]', timeout=5000)
                    except Exception:
                        await page.press('input[type="password"]', "Enter")

                yield evento(70, "Aguardando autenticação...")
                await page.wait_for_timeout(4000)

                yield evento(80, "Capturando cookie de sessão...")
                await page.wait_for_timeout(2000)

                url_atual = page.url
                cookies = await context.cookies()
                cookie_value = next(
                    (c["value"] for c in cookies if c["name"] == "_produttivo_session"),
                    None,
                )
                await browser.close()
                browser = None

                if "sign_in" in url_atual:
                    yield evento(0, "Login falhou. Verifique e-mail e senha.", "error")
                    return

                if cookie_value:
                    await config_crud.save_cookie(db, tenant_id, cookie_value)
                    yield evento(100, "Cookie capturado e salvo com sucesso!", "done", cookie_value)
                else:
                    yield evento(0, "Login ok mas cookie não encontrado.", "error")

        except Exception as exc:
            yield evento(0, f"Erro: {exc}", "error")
        finally:
            if browser:
                await browser.close()

    return StreamingResponse(
        stream_gen(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.post("/config/account")
async def save_account_id(
    payload: AccountPayload,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(_manager_up),
):
    config = await config_crud.save_account_id(db, current_user.tenant_id, payload.account_id.strip())
    return success("Account ID salvo.", {"account_id": config.account_id})


# ---------------------------------------------------------------------------
# DATA — Proxy endpoints for Produttivo lists
# ---------------------------------------------------------------------------

@router.get("/usuarios")
async def listar_usuarios(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(_staff_up),
):
    config = await config_crud.get_config_or_404(db, current_user.tenant_id)
    members = await api_client.buscar_todos_usuarios(config.cookie, config.account_id)
    return success("Usuários do Produttivo.", [
        {"id": m.user_id, "nome": m.display_name, "status": m.status}
        for m in members
    ])


@router.get("/formularios")
async def listar_formularios(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(_staff_up),
):
    config = await config_crud.get_config_or_404(db, current_user.tenant_id)
    forms = await api_client.buscar_todos_formularios(config.cookie, config.account_id)
    return success("Formulários do Produttivo.", [
        {"id": f.id, "nome": f.name, "status": f.status}
        for f in forms
    ])


@router.get("/works")
async def listar_works(
    form_ids: str = Query(..., description="IDs dos formulários separados por vírgula"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(_staff_up),
):
    config = await config_crud.get_config_or_404(db, current_user.tenant_id)
    ids = [int(i.strip()) for i in form_ids.split(",") if i.strip().isdigit()]
    works = await api_client.buscar_works_por_form(config.cookie, config.account_id, ids)
    return success("Works do Produttivo.", [
        {"id": w.id, "titulo": w.title, "numero": w.work_number, "status": w.status}
        for w in works
    ])


@router.get("/locais")
async def listar_locais(
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(_staff_up),
):
    config = await config_crud.get_config_or_404(db, current_user.tenant_id)
    places = await api_client.buscar_resource_places(config.cookie, config.account_id, search)
    return success("Locais do Produttivo.", [
        {"id": p.id, "nome": p.display_name}
        for p in places
    ])


# ---------------------------------------------------------------------------
# REPORTS
# ---------------------------------------------------------------------------

@router.get("/relatorio/atividades")
async def relatorio_atividades(
    data_inicio: str = Query(..., description="DD/MM/YYYY"),
    data_fim: str = Query(..., description="DD/MM/YYYY"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(_staff_up),
):
    config = await config_crud.get_config_or_404(db, current_user.tenant_id)
    resultado = await gerar_relatorio_atividades(
        config.cookie, config.account_id, data_inicio, data_fim
    )
    return success("Relatório de atividades.", resultado)


@router.get("/relatorio/atividades/excel")
async def relatorio_atividades_excel(
    data_inicio: str = Query(..., description="DD/MM/YYYY"),
    data_fim: str = Query(..., description="DD/MM/YYYY"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(_staff_up),
):
    config = await config_crud.get_config_or_404(db, current_user.tenant_id)
    resultado = await gerar_relatorio_atividades(
        config.cookie, config.account_id, data_inicio, data_fim
    )
    excel_bytes = gerar_excel_relatorio1(resultado)
    filename = f"relatorio_atividades_{data_inicio.replace('/', '-')}_{data_fim.replace('/', '-')}.xlsx"
    return StreamingResponse(
        io.BytesIO(excel_bytes),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/relatorio/usuario")
async def relatorio_usuario(
    data_inicio: str = Query(..., description="DD/MM/YYYY"),
    data_fim: str = Query(..., description="DD/MM/YYYY"),
    user_ids: Optional[str] = Query(None, description="IDs separados por vírgula"),
    form_ids: Optional[str] = Query(None, description="IDs separados por vírgula"),
    resource_place_ids: Optional[str] = Query(None, description="IDs separados por vírgula"),
    work_ids: Optional[str] = Query(None, description="IDs separados por vírgula"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(_staff_up),
):
    config = await config_crud.get_config_or_404(db, current_user.tenant_id)

    def _parse_ids(s: Optional[str]) -> Optional[list[int]]:
        if not s:
            return None
        ids = [int(i.strip()) for i in s.split(",") if i.strip().isdigit()]
        return ids if ids else None

    resultado = await gerar_relatorio_usuario(
        config.cookie, config.account_id, data_inicio, data_fim,
        user_ids=_parse_ids(user_ids),
        form_ids=_parse_ids(form_ids),
        resource_place_ids=_parse_ids(resource_place_ids),
        work_ids=_parse_ids(work_ids),
    )
    return success("Relatório por usuário.", resultado)


@router.get("/relatorio/usuario/excel")
async def relatorio_usuario_excel(
    data_inicio: str = Query(..., description="DD/MM/YYYY"),
    data_fim: str = Query(..., description="DD/MM/YYYY"),
    user_ids: Optional[str] = Query(None),
    form_ids: Optional[str] = Query(None),
    resource_place_ids: Optional[str] = Query(None),
    work_ids: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(_staff_up),
):
    config = await config_crud.get_config_or_404(db, current_user.tenant_id)

    def _parse_ids(s: Optional[str]) -> Optional[list[int]]:
        if not s:
            return None
        ids = [int(i.strip()) for i in s.split(",") if i.strip().isdigit()]
        return ids if ids else None

    resultado = await gerar_relatorio_usuario(
        config.cookie, config.account_id, data_inicio, data_fim,
        user_ids=_parse_ids(user_ids),
        form_ids=_parse_ids(form_ids),
        resource_place_ids=_parse_ids(resource_place_ids),
        work_ids=_parse_ids(work_ids),
    )
    excel_bytes = gerar_excel_relatorio2(resultado)
    filename = f"relatorio_usuario_{data_inicio.replace('/', '-')}_{data_fim.replace('/', '-')}.xlsx"
    return StreamingResponse(
        io.BytesIO(excel_bytes),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
