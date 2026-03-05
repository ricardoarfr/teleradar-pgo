"""Async HTTP client for Produttivo API using httpx."""
import asyncio
from typing import Optional

import httpx
from fastapi import HTTPException

from app.modules.produttivo.models import (
    AccountMember, Form, FormFill, PaginationMeta, ResourcePlace, Work,
)

BASE_URL = "https://app.produttivo.com.br"
TIMEOUT = 30.0


def _build_headers(cookie: str) -> dict:
    return {
        "Cookie": f"_produttivo_session={cookie}",
        "Accept": "application/json",
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (compatible; Teleradar/1.0)",
    }


def _raise_for_produttivo(response: httpx.Response) -> None:
    if response.status_code == 401:
        raise HTTPException(status_code=401, detail="Cookie do Produttivo inválido ou expirado.")
    if response.status_code == 403:
        raise HTTPException(status_code=403, detail="Acesso negado pelo Produttivo.")
    if response.status_code >= 400:
        raise HTTPException(
            status_code=502,
            detail=f"Erro na API do Produttivo: {response.status_code}",
        )


async def validate_cookie(cookie: str, account_id: str) -> bool:
    """Validates cookie by calling a lightweight Produttivo endpoint."""
    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        r = await client.get(
            f"{BASE_URL}/forms.json",
            headers=_build_headers(cookie),
            params={"account_id": account_id, "per_page": 1, "page": 1},
        )
        return r.status_code == 200


async def buscar_todos_usuarios(
    cookie: str, account_id: str, include_inactive: bool = False
) -> list[AccountMember]:
    """Fetches account members. By default only active; pass include_inactive=True for all."""
    members: list[AccountMember] = []
    page = 1
    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        while True:
            params: dict = {"account_id": account_id, "per_page": 100, "page": page}
            if not include_inactive:
                params["status"] = "active"
            r = await client.get(
                f"{BASE_URL}/account_members",
                headers=_build_headers(cookie),
                params=params,
            )
            _raise_for_produttivo(r)
            data = r.json()
            results = data.get("results", [])
            members.extend(AccountMember(**m) for m in results)
            meta = PaginationMeta(**data.get("meta", {}))
            if page >= meta.total_pages or len(results) < 100:
                break
            page += 1
    return members


async def buscar_todos_formularios(cookie: str, account_id: str) -> list[Form]:
    """Fetches all active forms."""
    forms: list[Form] = []
    page = 1
    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        while True:
            r = await client.get(
                f"{BASE_URL}/forms.json",
                headers=_build_headers(cookie),
                params={"account_id": account_id, "per_page": 100, "page": page, "actives": True},
            )
            _raise_for_produttivo(r)
            data = r.json()
            results = data.get("results", [])
            forms.extend(Form(**f) for f in results)
            meta = PaginationMeta(**data.get("meta", {}))
            if page >= meta.total_pages or len(results) < 100:
                break
            page += 1
    return forms


async def buscar_works_por_form(cookie: str, account_id: str, form_ids: list[int]) -> list[Work]:
    """Fetches all works for given form_ids (without pagination)."""
    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        params: dict = {
            "account_id": account_id,
            "actives": "true",
            "work_type": 1,
            "without_pagination": "true",
            "include_team_works": "true",
            "order_filter_param": "true",
        }
        # httpx handles repeated keys via a list of tuples
        query_params = list(params.items())
        for fid in form_ids:
            query_params.append(("form_ids[]", fid))
        r = await client.get(f"{BASE_URL}/works", headers=_build_headers(cookie), params=query_params)
        _raise_for_produttivo(r)
        data = r.json()
        results = data.get("results", data if isinstance(data, list) else [])
        return [Work(**w) for w in results]


async def buscar_resource_places(
    cookie: str, account_id: str, search: Optional[str] = None
) -> list[ResourcePlace]:
    """Fetches resource places (clients/locations)."""
    places: list[ResourcePlace] = []
    page = 1
    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        while True:
            params: dict = {"account_id": account_id, "per_page": 100, "page": page}
            if search:
                params["q"] = search
            r = await client.get(f"{BASE_URL}/resource_places", headers=_build_headers(cookie), params=params)
            _raise_for_produttivo(r)
            data = r.json()
            results = data.get("results", [])
            places.extend(ResourcePlace(**p) for p in results)
            meta = PaginationMeta(**data.get("meta", {}))
            if page >= meta.total_pages or len(results) < 100:
                break
            page += 1
    return places


async def buscar_form_fills(
    cookie: str,
    account_id: str,
    data_inicio: str,  # DD/MM/YYYY
    data_fim: str,     # DD/MM/YYYY
    form_ids: Optional[list[int]] = None,
    user_ids: Optional[list[int]] = None,
    resource_place_ids: Optional[list[int]] = None,
    work_ids: Optional[list[int]] = None,
    per_page: int = 100,
) -> list[FormFill]:
    """Fetches all form fills for the given filters, handling pagination automatically."""
    fills: list[FormFill] = []
    page = 1

    async with httpx.AsyncClient(timeout=60.0) as client:
        while True:
            # Build query params; never pass empty lists (API treats [] as "none found")
            query: list[tuple] = [
                ("account_id", account_id),
                ("range_time", f"{data_inicio} - {data_fim}"),
                ("per_page", per_page),
                ("page", page),
                ("order_type", "asc"),
            ]
            if form_ids:
                for fid in form_ids:
                    query.append(("form_fill[form_ids][]", fid))
            if user_ids:
                for uid in user_ids:
                    query.append(("form_fill[user_ids][]", uid))
            if resource_place_ids:
                for rid in resource_place_ids:
                    query.append(("form_fill[resource_place_ids][]", rid))
            if work_ids:
                for wid in work_ids:
                    query.append(("form_fill[work_ids][]", wid))

            r = await client.get(f"{BASE_URL}/form_fills.json", headers=_build_headers(cookie), params=query)
            _raise_for_produttivo(r)
            data = r.json()
            results = data.get("results", [])
            fills.extend(FormFill(**f) for f in results)
            meta = PaginationMeta(**data.get("meta", {}))
            if page >= meta.total_pages or len(results) < per_page:
                break
            page += 1

    return fills
