"""Relatório 1 — Visão Geral de Atividades.

Aggregates form fills by period and returns:
- Table by form (form_name → count)
- Table by user (user_name → count per form + total)
- Cross-tabulation (user × form)
"""
from collections import defaultdict
from typing import Optional

from app.modules.produttivo.api_client import buscar_form_fills, buscar_todos_formularios, buscar_todos_usuarios
from app.modules.produttivo.models import AccountMember, Form, FormFill


def _build_user_map(members: list[AccountMember]) -> dict[int, str]:
    """Maps created_by_id (user.id) → display name.
    CRITICAL: created_by_id == account_member.user_id, NOT account_member.id
    """
    return {m.user_id: m.display_name for m in members}


def _build_form_map(forms: list[Form]) -> dict[int, str]:
    """Maps form_id → form name. Falls back to 'Form #{id}' for unknown forms."""
    mapping = {f.id: f.name for f in forms}
    return defaultdict(lambda: "Desconhecido", mapping)


async def gerar_relatorio_atividades(
    cookie: str,
    account_id: str,
    data_inicio: str,  # DD/MM/YYYY
    data_fim: str,     # DD/MM/YYYY
) -> dict:
    """Fetches data and builds Report 1 aggregations."""
    # Fetch all data in parallel conceptually (sequential to keep it simple)
    fills = await buscar_form_fills(cookie, account_id, data_inicio, data_fim)
    members = await buscar_todos_usuarios(cookie, account_id)
    forms = await buscar_todos_formularios(cookie, account_id)

    user_map = _build_user_map(members)
    form_map = _build_form_map(forms)

    # Aggregate: form → count
    por_formulario: dict[str, int] = defaultdict(int)
    # Aggregate: user → form → count
    por_usuario: dict[str, dict[str, int]] = defaultdict(lambda: defaultdict(int))

    for fill in fills:
        if fill.removed:
            continue
        # work_id links to a Work which has form_id
        # But form_fills also carry form info via the work; we need the form_id.
        # The fill itself doesn't have form_id directly — it comes from the work.
        # Since we fetched without form filter here, we use the title as fallback.
        # For a better approach, we'd need to fetch works. But for the overview
        # report, we aggregate by the fill title prefix or use a separate fetch.
        # Using fill title as form name (Produttivo sets it as "FormName - workNumber")
        form_name = _extract_form_name_from_fill(fill, form_map)
        user_name = user_map.get(fill.created_by_id, f"Usuário #{fill.created_by_id}")

        por_formulario[form_name] += 1
        por_usuario[user_name][form_name] += 1

    # Build response structures
    all_forms = sorted(por_formulario.keys())

    formularios_list = [
        {"form_name": name, "total": count}
        for name, count in sorted(por_formulario.items(), key=lambda x: -x[1])
    ]

    usuarios_list = []
    for user_name, form_counts in sorted(por_usuario.items()):
        row = {"user_name": user_name, "total": sum(form_counts.values())}
        for form in all_forms:
            row[form] = form_counts.get(form, 0)
        usuarios_list.append(row)
    usuarios_list.sort(key=lambda x: -x["total"])

    cruzamento = {
        "forms": all_forms,
        "rows": [
            {
                "user_name": user_name,
                "values": [por_usuario[user_name].get(f, 0) for f in all_forms],
            }
            for user_name in sorted(por_usuario.keys())
        ],
    }

    return {
        "periodo": {"inicio": data_inicio, "fim": data_fim},
        "total_fills": len([f for f in fills if not f.removed]),
        "por_formulario": formularios_list,
        "por_usuario": usuarios_list,
        "cruzamento": cruzamento,
        "forms_names": all_forms,
    }


def _extract_form_name_from_fill(fill: FormFill, form_map) -> str:
    """
    Extracts form name from fill. Since FormFill doesn't carry form_id directly,
    we use the title (which Produttivo formats as 'FormName - WorkNumber') or
    fall back to 'Formulário desconhecido'.
    """
    if fill.title:
        # Title format: "FormName - 1234" — extract part before " - "
        parts = fill.title.split(" - ")
        if len(parts) >= 2:
            # Last part is the work number, everything before is the form name
            return " - ".join(parts[:-1]).strip()
    return "Formulário desconhecido"
