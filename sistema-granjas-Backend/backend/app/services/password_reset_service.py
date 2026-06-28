import random
import string
import logging
from datetime import datetime, timedelta
from threading import Lock
from typing import Optional

logger = logging.getLogger(__name__)

CODE_LENGTH = 5
CODE_TTL_MINUTES = 10
MAX_ATTEMPTS = 5

_store: dict[str, dict] = {}
_lock = Lock()


def _clean_expired():
    now = datetime.utcnow()
    expired = [email for email, data in _store.items() if data["expires_at"] < now]
    for email in expired:
        del _store[email]


def generate_reset_code(email: str) -> str:
    code = "".join(random.choices(string.digits, k=CODE_LENGTH))
    expires_at = datetime.utcnow() + timedelta(minutes=CODE_TTL_MINUTES)

    with _lock:
        _clean_expired()
        _store[email.lower()] = {
            "code": code,
            "expires_at": expires_at,
            "attempts": 0,
            "verified": False,
        }

    logger.info(f"Código de recuperación generado para {email} (expira en {CODE_TTL_MINUTES} min)")
    return code


def verify_reset_code(email: str, code: str) -> tuple[bool, str]:
    email = email.lower()
    with _lock:
        entry = _store.get(email)

        if not entry:
            return False, "No hay un código de verificación activo para este correo"

        if datetime.utcnow() > entry["expires_at"]:
            del _store[email]
            return False, "El código ha expirado. Solicita uno nuevo"

        if entry["attempts"] >= MAX_ATTEMPTS:
            del _store[email]
            return False, "Demasiados intentos fallidos. Solicita un nuevo código"

        if entry["code"] != code.strip():
            entry["attempts"] += 1
            remaining = MAX_ATTEMPTS - entry["attempts"]
            return False, f"Código incorrecto. Intentos restantes: {remaining}"

        entry["verified"] = True
        return True, "Código verificado correctamente"


def is_code_verified(email: str) -> bool:
    email = email.lower()
    with _lock:
        entry = _store.get(email)
        if not entry:
            return False
        if datetime.utcnow() > entry["expires_at"]:
            return False
        return entry.get("verified", False)


def consume_reset_code(email: str) -> bool:
    email = email.lower()
    with _lock:
        entry = _store.get(email)
        if not entry or not entry.get("verified", False):
            return False
        if datetime.utcnow() > entry["expires_at"]:
            del _store[email]
            return False
        del _store[email]
        return True


def invalidate_reset_code(email: str) -> None:
    email = email.lower()
    with _lock:
        _store.pop(email, None)
