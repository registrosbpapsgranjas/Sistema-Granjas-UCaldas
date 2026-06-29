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


def generate_verification_code(email: str, pending_data: dict) -> str:
    """
    Genera un código de verificación y almacena los datos del registro pendiente.
    pending_data debe contener: nombre, password_hash, rol_id
    """
    code = "".join(random.choices(string.digits, k=CODE_LENGTH))
    expires_at = datetime.utcnow() + timedelta(minutes=CODE_TTL_MINUTES)

    with _lock:
        _clean_expired()
        _store[email.lower()] = {
            "code": code,
            "expires_at": expires_at,
            "attempts": 0,
            "verified": False,
            "pending_data": pending_data,
        }

    logger.info(f"Código de verificación de registro generado para {email} (expira en {CODE_TTL_MINUTES} min)")
    return code


def verify_registration_code(email: str, code: str) -> tuple[bool, str]:
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


def get_pending_registration(email: str) -> Optional[dict]:
    """Retorna los datos del registro pendiente si el código fue verificado y no ha expirado."""
    email = email.lower()
    with _lock:
        entry = _store.get(email)
        if not entry:
            return None
        if datetime.utcnow() > entry["expires_at"]:
            del _store[email]
            return None
        if not entry.get("verified", False):
            return None
        return entry.get("pending_data")


def consume_verification_code(email: str) -> bool:
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


def has_pending_code(email: str) -> bool:
    """Verifica si hay un código activo (sin importar si fue verificado)."""
    email = email.lower()
    with _lock:
        entry = _store.get(email)
        if not entry:
            return False
        if datetime.utcnow() > entry["expires_at"]:
            del _store[email]
            return False
        return True


def invalidate_verification_code(email: str) -> None:
    email = email.lower()
    with _lock:
        _store.pop(email, None)
