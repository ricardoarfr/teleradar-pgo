from typing import Any, Optional


def success(message: str, data: Any = None) -> dict:
    return {"status": "success", "message": message, "data": data}


def error(message: str, data: Any = None) -> dict:
    return {"status": "error", "message": message, "data": data}
