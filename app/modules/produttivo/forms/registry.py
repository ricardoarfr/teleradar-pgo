"""Factory for form models. Register new forms here."""
from typing import Optional

from app.modules.produttivo.forms.base import BaseFormModel
from app.modules.produttivo.forms.fusoes_provedor import FusoesProvedorV5
from app.modules.produttivo.forms.lancamento_cabo import LancamentoCaboV4

_REGISTRY: dict[int, BaseFormModel] = {
    LancamentoCaboV4.form_id: LancamentoCaboV4(),
    FusoesProvedorV5.form_id: FusoesProvedorV5(),
}


def obter_modelo(form_id: int) -> Optional[BaseFormModel]:
    """Returns the form model for the given form_id, or None if unknown."""
    return _REGISTRY.get(form_id)


def listar_form_ids_conhecidos() -> list[int]:
    return list(_REGISTRY.keys())
