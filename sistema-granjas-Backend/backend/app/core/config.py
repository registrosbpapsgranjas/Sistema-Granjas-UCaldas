import json
from pydantic_settings import BaseSettings
from typing import Dict, List, Optional


class Settings(BaseSettings):
    # === Variables de entorno requeridas ===
    DATABASE_URL: str
    SECRET_KEY: str
    GOOGLE_CLIENT_ID: str

    # === Configuración técnica ===
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # === Variables de negocio ===
    ROLES_POR_DEFECTO: Optional[Dict] = None
    ROLES_PERMITIDOS_REGISTRO: Optional[List[str]] = None

    GRANJAS_PREDEFINIDAS: Optional[List[Dict]] = None
    PROGRAMAS_AGRICOLAS: Optional[List[Dict]] = None
    PROGRAMAS_PECUARIOS: Optional[List[Dict]] = None

    class Config:
        env_file = ".env"
        extra = "allow"


settings = Settings()

# === Conversión automática de strings JSON a objetos Python ===
def parse_json_field(value, default=None):
    """Convierte una cadena JSON en un dict/list si es necesario"""
    if not value:
        return default
    if isinstance(value, str):
        try:
            return json.loads(value.replace("'", '"'))  # Corrige comillas simples del .env
        except json.JSONDecodeError:
            return default
    return value


# Aplicar el parser a las variables críticas
settings.ROLES_POR_DEFECTO = parse_json_field(settings.ROLES_POR_DEFECTO, {})
settings.ROLES_PERMITIDOS_REGISTRO = parse_json_field(settings.ROLES_PERMITIDOS_REGISTRO, [])
settings.GRANJAS_PREDEFINIDAS = parse_json_field(settings.GRANJAS_PREDEFINIDAS, [])
settings.PROGRAMAS_AGRICOLAS = parse_json_field(settings.PROGRAMAS_AGRICOLAS, [])
settings.PROGRAMAS_PECUARIOS = parse_json_field(settings.PROGRAMAS_PECUARIOS, [])
