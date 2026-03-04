"""Relatório 2 — Atividades por Usuário.

Returns detailed form fills with form-specific column extraction.
"""
from typing import Optional

from app.modules.produttivo.api_client import (
    buscar_form_fills,
    buscar_todos_formularios,
    buscar_todos_usuarios,
    buscar_works_por_form,
)
from app.modules.produttivo.forms.registry import obter_modelo
from app.modules.produttivo.models import AccountMember, Form, FormFill, Work


def _build_user_map(members: list[AccountMember]) -> dict[int, str]:
    """CRITICAL: created_by_id == account_member.user_id (NOT account_member.id)."""
    return {m.user_id: m.display_name for m in members}


def _build_form_map(forms: list[Form]) -> dict[int, str]:
    return {f.id: f.name for f in forms}


def _build_work_map(works: list[Work]) -> dict[int, Work]:
    return {w.id: w for w in works}


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
    """Fetches filtered form fills and extracts form-specific columns."""
    # Fetch fills with filters applied
    fills = await buscar_form_fills(
        cookie, account_id, data_inicio, data_fim,
        form_ids=form_ids or None,
        user_ids=user_ids or None,
        resource_place_ids=resource_place_ids or None,
        work_ids=work_ids or None,
    )

    members = await buscar_todos_usuarios(cookie, account_id)
    forms_list = await buscar_todos_formularios(cookie, account_id)

    user_map = _build_user_map(members)
    form_map = _build_form_map(forms_list)

    # Fetch works to map fill → form_id via work_id
    work_map: dict[int, Work] = {}
    if form_ids:
        works = await buscar_works_por_form(cookie, account_id, form_ids)
        work_map = _build_work_map(works)

    # Determine which form-specific columns to show
    # Use the form model for the selected form (if exactly one form selected)
    modelo = None
    colunas_especificas: list[str] = []
    if form_ids and len(form_ids) == 1:
        modelo = obter_modelo(form_ids[0])
        if modelo:
            colunas_especificas = modelo.colunas_especificas

    # Build rows
    rows: list[dict] = []
    for fill in fills:
        if fill.removed:
            continue

        # Resolve form_id from work
        form_id_fill: Optional[int] = None
        form_name = "—"
        if fill.work_id and fill.work_id in work_map:
            work = work_map[fill.work_id]
            form_id_fill = work.form_id
            form_name = form_map.get(form_id_fill, f"Form #{form_id_fill}")
        else:
            # Fallback: extract from title
            if fill.title:
                parts = fill.title.split(" - ")
                if len(parts) >= 2:
                    form_name = " - ".join(parts[:-1]).strip()

        user_name = user_map.get(fill.created_by_id, f"Usuário #{fill.created_by_id}")

        # Parse date from ISO string
        data_str = fill.created_at[:10] if fill.created_at else "—"
        try:
            from datetime import datetime
            dt = datetime.fromisoformat(fill.created_at.replace("Z", "+00:00"))
            data_str = dt.strftime("%d/%m/%Y %H:%M")
        except Exception:
            pass

        row: dict = {
            "ID": fill.id,
            "Data": data_str,
            "Técnico": user_name,
            "Formulário": form_name,
            "OS (Work)": fill.work_id or "—",
        }

        # Extract form-specific columns
        if modelo and form_id_fill == modelo.form_id:
            row.update(modelo.extrair_dados(fill))
        else:
            for col in colunas_especificas:
                row[col] = "—"

        rows.append(row)

    # Sort by date desc
    rows.sort(key=lambda r: r.get("Data", ""), reverse=True)

    # Build column list
    base_cols = ["ID", "Data", "Técnico", "Formulário", "OS (Work)"]
    colunas = base_cols + colunas_especificas

    return {
        "periodo": {"inicio": data_inicio, "fim": data_fim},
        "total": len(rows),
        "colunas": colunas,
        "linhas": rows,
        "colunas_especificas": colunas_especificas,
    }
