"""Form model for form_id 375197 — Fusões de Provedor v5."""
from app.modules.produttivo.forms.base import BaseFormModel
from app.modules.produttivo.models import FormFill

_CEO_KEYWORDS = {"CEO"}
_CTO_KEYWORDS = {"CTO"}
_DIO_KEYWORDS = {"DIO"}


class FusoesProvedorV5(BaseFormModel):
    form_id = 375197
    form_name = "Fusões de Provedor"

    @property
    def colunas_especificas(self) -> list[str]:
        return ["Atividade", "CEO", "CTO", "DIO"]

    def extrair_dados(self, fill: FormFill) -> dict:
        atividade = (self.get_field(fill, "ATIVIDADE") or "").upper().strip()

        ceo = 1 if any(k in atividade for k in _CEO_KEYWORDS) else 0
        cto = 1 if any(k in atividade for k in _CTO_KEYWORDS) else 0
        dio = 1 if any(k in atividade for k in _DIO_KEYWORDS) else 0

        return {
            "Atividade": self.get_field(fill, "ATIVIDADE") or "—",
            "CEO": ceo,
            "CTO": cto,
            "DIO": dio,
        }
