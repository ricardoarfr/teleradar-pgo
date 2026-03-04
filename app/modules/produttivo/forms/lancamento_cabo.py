"""Form model for form_id 359797 — Lançamento de Cabo v4."""
from app.modules.produttivo.forms.base import BaseFormModel
from app.modules.produttivo.models import FormFill


class LancamentoCaboV4(BaseFormModel):
    form_id = 359797
    form_name = "Lançamento de Cabo"

    @property
    def colunas_especificas(self) -> list[str]:
        return ["Tipo Lançamento", "Cabo (m)", "Cordoalha (m)"]

    def extrair_dados(self, fill: FormFill) -> dict:
        try:
            ponta_inicial = float(self.get_field(fill, "PONTA_INICIAL") or 0)
        except (ValueError, TypeError):
            ponta_inicial = 0.0
        try:
            ponta_final = float(self.get_field(fill, "PONTA_FINAL") or 0)
        except (ValueError, TypeError):
            ponta_final = 0.0

        metragem = abs(ponta_final - ponta_inicial)

        tipo = (self.get_field(fill, "TIPO_LANÇAMENTO") or "").upper()
        especificacao = (self.get_field(fill, "ESPECIFICAÇÃO") or "").upper()

        is_cordoalha = "CORDOALHA" in tipo or "CORDOALHA" in especificacao

        return {
            "Tipo Lançamento": tipo or especificacao or "—",
            "Cabo (m)": round(metragem, 2) if not is_cordoalha else 0.0,
            "Cordoalha (m)": round(metragem, 2) if is_cordoalha else 0.0,
        }
