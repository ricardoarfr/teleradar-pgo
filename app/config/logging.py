import logging
import sys
import json
from datetime import datetime

from app.config.settings import settings

# TODO:UPGRADE [PRIORIDADE: BAIXA]
# Motivo: Free Tier retém logs por apenas 7 dias no Render
# Solução: Integrar com serviço externo (ex: Papertrail, Logtail — ambos têm free tier)
# Custo estimado: Gratuito até certo volume de logs
# Métrica de alerta: Quando logs históricos forem necessários para auditoria/debugging


class JSONFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        log_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)
        return json.dumps(log_data, ensure_ascii=False)


def setup_logging() -> None:
    handler = logging.StreamHandler(sys.stdout)
    if settings.ENVIRONMENT == "production":
        handler.setFormatter(JSONFormatter())
    else:
        handler.setFormatter(
            logging.Formatter("%(asctime)s | %(levelname)s | %(name)s | %(message)s")
        )

    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO)
    root_logger.addHandler(handler)

    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
