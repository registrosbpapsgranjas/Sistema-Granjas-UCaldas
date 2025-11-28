import json
import boto3
from pydantic_settings import BaseSettings
from typing import Dict, List, Optional


class Settings(BaseSettings):
    # === Variables de entorno requeridas ===
    DATABASE_URL: str
    SECRET_KEY: str
    GOOGLE_CLIENT_ID: str

    # Directorio para guardado temporal
    UPLOAD_DIR: str = "app/uploads"

    # === Configuración técnica ===
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # === Cloudflare R2 ===
    R2_ACCOUNT_ID: str
    R2_ACCESS_KEY: str
    R2_SECRET_KEY: str
    R2_BUCKET_NAME: str
    R2_ENDPOINT: str  # ejemplo: https://xxxx.r2.cloudflarestorage.com

    # === Variables de negocio ===
    ROLES_POR_DEFECTO: Optional[Dict] = None
    ROLES_PERMITIDOS_REGISTRO: Optional[List[str]] = None

    GRANJAS_PREDEFINIDAS: Optional[List[Dict]] = None
    PROGRAMAS_AGRICOLAS: Optional[List[Dict]] = None
    PROGRAMAS_PECUARIOS: Optional[List[Dict]] = None

    class Config:
        env_file = ".env"
        extra = "allow"

    def init_storage(self):
        """Inicializa cliente R2 (igual en toda la app)"""
        self.r2_client = boto3.client(
            "s3",
            endpoint_url=self.R2_ENDPOINT,
            aws_access_key_id=self.R2_ACCESS_KEY,
            aws_secret_access_key=self.R2_SECRET_KEY,
            region_name="auto"
        )


settings = Settings()


# === Conversión automática strings JSON ===
def parse_json_field(value, default=None):
    if not value:
        return default
    if isinstance(value, str):
        try:
            return json.loads(value.replace("'", '"'))
        except json.JSONDecodeError:
            return default
    return value


settings.ROLES_POR_DEFECTO = parse_json_field(settings.ROLES_POR_DEFECTO, {})
settings.ROLES_PERMITIDOS_REGISTRO = parse_json_field(settings.ROLES_PERMITIDOS_REGISTRO, [])
settings.GRANJAS_PREDEFINIDAS = parse_json_field(settings.GRANJAS_PREDEFINIDAS, [])
settings.PROGRAMAS_AGRICOLAS = parse_json_field(settings.PROGRAMAS_AGRICOLAS, [])
settings.PROGRAMAS_PECUARIOS = parse_json_field(settings.PROGRAMAS_PECUARIOS, [])

# Inicializar cliente R2
settings.init_storage()
