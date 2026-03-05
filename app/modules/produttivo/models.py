"""Pydantic models for Produttivo API entities.
These are NOT database models — data comes from Produttivo API in real time.
"""
from typing import Any, Optional
from pydantic import BaseModel


class FieldValue(BaseModel):
    id: int
    name: str
    value: Optional[str] = None
    notes: Optional[str] = None
    accuracy: Optional[int] = None
    attachment_url: Optional[Any] = None
    attachments: list[Any] = []
    parts: list[Any] = []
    services: list[Any] = []

    model_config = {"extra": "allow"}


class FormFill(BaseModel):
    id: int
    title: Optional[str] = None
    work_id: Optional[int] = None
    resource_id: Optional[int] = None
    project_id: Optional[int] = None
    created_by_id: Optional[int] = None  # API may return null for some fills
    updated_by_id: Optional[int] = None
    created_at: str
    updated_at: str
    removed: bool = False
    is_valid: bool = True
    field_values: list[FieldValue] = []

    model_config = {"extra": "allow"}


class Work(BaseModel):
    id: int
    work_number: Optional[int] = None
    title: Optional[str] = None  # API may return null
    form_id: int
    status: str
    work_type: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    resource_place_id: Optional[int] = None
    project_id: Optional[int] = None
    account_member_ids: list[int] = []
    fills_count: Optional[int] = None
    fills_goal: Optional[int] = None

    model_config = {"extra": "allow"}


class UserProfile(BaseModel):
    id: int
    email: Optional[str] = None
    complete_name_and_email: Optional[str] = None
    profile_attributes: Optional[dict] = None

    model_config = {"extra": "allow"}

    @property
    def display_name(self) -> str:
        if self.profile_attributes:
            first = self.profile_attributes.get("firstname") or ""
            last = self.profile_attributes.get("lastname") or ""
            full = f"{first} {last}".strip()
            if full:
                return full
        return self.email or str(self.id)


class AccountMember(BaseModel):
    id: int
    user_id: int
    status: str = "active"  # API always returns "active" or "inactive" (string)
    member_role: Optional[str] = None
    user: Optional[UserProfile] = None

    model_config = {"extra": "allow"}

    @property
    def display_name(self) -> str:
        return self.user.display_name if self.user else str(self.user_id)


class Form(BaseModel):
    id: int
    name: str
    form_type: Optional[str] = None
    status: str = "active"

    model_config = {"extra": "allow"}


class ResourcePlace(BaseModel):
    id: int
    name: str
    resource_place_type: Optional[str] = None
    status: Optional[str] = None
    parent_id: Optional[int] = None
    hierarchy_name: Optional[str] = None
    address: Optional[str] = None

    model_config = {"extra": "allow"}

    @property
    def display_name(self) -> str:
        return self.hierarchy_name or self.name


class PaginationMeta(BaseModel):
    current_page: int = 1
    total_pages: int = 1
    count: Optional[int] = None

    model_config = {"extra": "allow"}
