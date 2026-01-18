import json
import boto3
from botocore.config import Config  # <-- AÑADE ESTA IMPORTACIÓN
from pydantic_settings import BaseSettings
from typing import Dict, List, Optional
import logging

logger = logging.getLogger(__name__)

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
    R2_ENDPOINT: str

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
        """Inicializa cliente R2 con configuración SSL específica para Cloudflare"""
        # Configuración optimizada para Cloudflare R2
        s3_config = Config(
            region_name="auto",
            signature_version='s3v4',
            retries={
                'max_attempts': 3,
                'mode': 'standard'
            },
            connect_timeout=10,
            read_timeout=30,
            max_pool_connections=50,
            s3={
                'addressing_style': 'virtual'
            }
        )
        
        try:
            # Crear sesión con configuración específica
            session = boto3.Session()
            
            self.r2_client = session.client(
                "s3",
                endpoint_url=self.R2_ENDPOINT,
                aws_access_key_id=self.R2_ACCESS_KEY,
                aws_secret_access_key=self.R2_SECRET_KEY,
                config=s3_config
            )
            
            # Verificar conexión más específicamente
            response = self.r2_client.list_buckets()
            logger.info(f"✅ Conexión a R2 establecida. Buckets disponibles: {len(response['Buckets'])}")
            
            # Verificar que nuestro bucket existe
            self.r2_client.head_bucket(Bucket=self.R2_BUCKET_NAME)
            logger.info(f"✅ Bucket '{self.R2_BUCKET_NAME}' verificado")
            
        except Exception as e:
            logger.error(f"❌ Error crítico conectando a R2: {str(e)}")
            # No inicies el cliente si falla
            self.r2_client = None
            raise

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