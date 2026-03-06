"""Abstract base class for Produttivo form models."""
from abc import ABC, abstractmethod
from typing import Any

from app.modules.produttivo.models import FormFill


class BaseFormModel(ABC):
    """
    Base class for form-specific data extraction.
    Each subclass handles one form_id and knows how to extract
    structured data from the field_values list.
    """

    form_id: int
    form_name: str

    def get_field(self, fill: FormFill, field_name: str) -> Any:
        """Extracts a field value by name (case-insensitive, underscore/space tolerant).

        Normalizes underscores to spaces so that "PONTA_INICIAL" matches "Ponta Inicial"
        as returned by the Produttivo API.
        """
        name_lower = field_name.lower().replace("_", " ")
        for fv in fill.field_values:
            if fv.name.lower().replace("_", " ") == name_lower:
                return fv.value
        return None

    @abstractmethod
    def extrair_dados(self, fill: FormFill) -> dict:
        """Returns a flat dict of extracted fields for this fill."""
        ...

    def extrair_producao(self, fill: FormFill) -> dict:
        """Standardized production values for grouped aggregation.
        Override in subclasses. Returns cabo_m, cordoalha_m, ceo, cto, dio.
        """
        return {"cabo_m": 0, "cordoalha_m": 0, "ceo": 0, "cto": 0, "dio": 0}

    @property
    @abstractmethod
    def colunas_especificas(self) -> list[str]:
        """Names of form-specific columns to show in Report 2."""
        ...
