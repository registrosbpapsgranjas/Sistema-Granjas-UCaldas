import json
import logging
from pydantic_settings import BaseSettings
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)

class Settings(BaseSettings):
    # === Base de datos ===
    DATABASE_URL: str
    SECRET_KEY: str = "dev-secret-key-please-change-in-production"
    GOOGLE_CLIENT_ID: str = ""

    # === Directorio temporal (solo para procesamiento, no guardado final) ===
    TEMP_DIR: str = "/tmp/uploads"

    # === JWT ===
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # === Cloudflare R2 (opcional en desarrollo) ===
    R2_ACCOUNT_ID: str = ""
    R2_ACCESS_KEY: str = ""
    R2_SECRET_KEY: str = ""
    R2_BUCKET_NAME: str = ""
    R2_ENDPOINT: str = ""
    R2_PUBLIC_URL: str = ""

    # === Datos semilla (opcionales) ===
    ROLES_POR_DEFECTO: Optional[Dict] = None
    ROLES_PERMITIDOS_REGISTRO: Optional[List[str]] = None
    GRANJAS_PREDEFINIDAS: Optional[List[Dict]] = None
    PROGRAMAS_AGRICOLAS: Optional[List[Dict]] = None
    PROGRAMAS_PECUARIOS: Optional[List[Dict]] = None

    class Config:
        env_file = ".env"
        extra = "allow"

    def init_storage(self):
        """Inicializa el cliente de Cloudflare R2."""
        if not self.R2_ENDPOINT or not self.R2_ACCESS_KEY or not self.R2_SECRET_KEY:
            logger.warning("R2 credentials not configured, file uploads will be unavailable")
            self.r2_client = None
            return False
        
        logger.info("Inicializando cliente R2...")
        try:
            import boto3
            import ssl
            from botocore.config import Config
            s3_config = Config(
                region_name="auto",
                signature_version='s3v4',
                connect_timeout=30,
                read_timeout=60,
                retries={'max_attempts': 3},
                s3={'addressing_style': 'virtual'}
            )
            session = boto3.Session()
            self.r2_client = session.client(
                's3',
                endpoint_url=self.R2_ENDPOINT,
                aws_access_key_id=self.R2_ACCESS_KEY,
                aws_secret_access_key=self.R2_SECRET_KEY,
                config=s3_config
            )
            # Verificar conexión
            self.r2_client.head_bucket(Bucket=self.R2_BUCKET_NAME)
            logger.info(f"Conectado a R2 bucket: {self.R2_BUCKET_NAME}")
            return True
        except Exception as e:
            logger.error(f"Error inicializando R2: {e}")
            self.r2_client = None
            return False

settings = Settings()

# Parsear campos JSON (igual que antes)
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

# Inicializar R2
storage_ok = settings.init_storage()
if storage_ok:
    logger.info("R2 listo para subir archivos")
else:
    logger.warning("R2 no disponible, las subidas fallarán")
