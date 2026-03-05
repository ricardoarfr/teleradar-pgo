"""Relatório 2 — Atividades por Usuário (agrupado por work × usuário).

Returns one row per (work_id, user_id) pair with fixed columns:
  Cliente | Nome da Atividade | Usuário | Qtd | Data Inicial | Data Final |
  CABO (m) | CORDOALHA (m) | CEO | CTO | DIO
"""
from collections import defaultdict
from datetime import datetime
from typing import Optional

from app.modules.produttivo.api_client import (
    buscar_form_fills,
    buscar_resource_places,
    buscar_todos_usuarios,
    buscar_works_por_form,
)
from app.modules.produttivo.forms.registry import listar_form_ids_conhecidos, obter_modelo
from app.modules.produttivo.models import FormFill

COLUNAS = [
    "Cliente",
    "Nome da Atividade",
    "Usuário",
    "Qtd",
    "Data Inicial",
    "Data Final",
    "CABO (m)",
    "CORDOALHA (m)",
    "CEO",
    "CTO",
    "DIO",
]


async def gerar_relatorio_usuario(
    cookie: str,
    account_id: str,
    data_inicio: str,    # DD/MM/YYYY
    data_fim: str,       # DD/MM/YYYY
    user_ids: Optional[list[int]] = None,
    form_ids: Optional[list[int]] = None,
    resource_place_ids: Optional[list[int]] = None,
    work_ids: Optional[list[int]] = None,
) -> dict:
    """Fetches filtered form fills and returns rows grouped by (work, user)."""
    fills = await buscar_form_fills(
        cookie, account_id, data_inicio, data_fim,
        form_ids=form_ids or None,
        user_ids=user_ids or None,
        resource_place_ids=resource_place_ids or None,
        work_ids=work_ids or None,
    )
    fills = [f for f in fills if not f.removed]

    if not fills:
        return {
            "periodo": {"inicio": data_inicio, "fim": data_fim},
            "total": 0,
            "total_atividades": 0,
            "colunas": COLUNAS,
            "linhas": [],
        }

    # Fetch supporting data
    members = await buscar_todos_usuarios(cookie, account_id)
    resource_places_list = await buscar_resource_places(cookie, account_id)

    user_map = {m.user_id: _format_user(m) for m in members}
    rp_map = {rp.id: rp.display_name for rp in resource_places_list}

    # Fetch works for the requested form_ids, or all known form_ids if unfiltered
    fetch_form_ids = form_ids if form_ids else listar_form_ids_conhecidos()
    work_map: dict = {}
    if fetch_form_ids:
        works = await buscar_works_por_form(cookie, account_id, fetch_form_ids)
        work_map = {w.id: w for w in works}

    # Group fills by (work_id, user_id)
    grupos: dict[tuple, list[FormFill]] = defaultdict(list)
    for fill in fills:
        grupos[(fill.work_id, fill.created_by_id)].append(fill)

    linhas = []
    for (work_id, user_id), grupo in grupos.items():
        work = work_map.get(work_id) if work_id else None

        work_title = work.title if work else _infer_work_title(grupo[0])
        cliente = (
            rp_map.get(work.resource_place_id, "—")
            if work and work.resource_place_id
            else "—"
        )
        usuario = user_map.get(user_id, f"Usuário #{user_id}")

        # Date range
        datas = []
        for ff in grupo:
            try:
                datas.append(datetime.fromisoformat(ff.created_at.replace("Z", "+00:00")))
            except Exception:
                pass
        data_ini_str = min(datas).strftime("%d/%m/%Y") if datas else "—"
        data_fim_str = max(datas).strftime("%d/%m/%Y") if datas else "—"

        # Sum production values
        cabo_m = cordoalha_m = ceo = cto = dio = 0.0
        if work:
            modelo = obter_modelo(work.form_id)
            if modelo:
                for ff in grupo:
                    prod = modelo.extrair_producao(ff)
                    cabo_m      += prod.get("cabo_m", 0)
                    cordoalha_m += prod.get("cordoalha_m", 0)
                    ceo         += prod.get("ceo", 0)
                    cto         += prod.get("cto", 0)
                    dio         += prod.get("dio", 0)

        linhas.append({
            "Cliente":           cliente,
            "Nome da Atividade": work_title,
            "Usuário":           usuario,
            "Qtd":               len(grupo),
            "Data Inicial":      data_ini_str,
            "Data Final":        data_fim_str,
            "CABO (m)":          round(cabo_m, 2),
            "CORDOALHA (m)":     round(cordoalha_m, 2),
            "CEO":               int(ceo),
            "CTO":               int(cto),
            "DIO":               int(dio),
        })

    linhas.sort(key=lambda r: (r["Cliente"], r["Nome da Atividade"], r["Usuário"]))

    return {
        "periodo": {"inicio": data_inicio, "fim": data_fim},
        "total": len(fills),
        "total_atividades": len(linhas),
        "colunas": COLUNAS,
        "linhas": linhas,
    }


def _format_user(member) -> str:
    name = member.display_name
    if member.user and member.user.email:
        return f"{name} ({member.user.email})"
    return name


def _infer_work_title(fill: FormFill) -> str:
    if fill.title:
        return fill.title
    return f"Work #{fill.work_id or '?'}"
