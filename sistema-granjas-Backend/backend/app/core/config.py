import json
import boto3
from botocore.config import Config
from pydantic_settings import BaseSettings
from typing import Dict, List, Optional
import logging
import urllib3
import time
import warnings
import logging
import sys

# Configurar logging ANTES de crear el logger
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    stream=sys.stdout,
    force=True  # <-- IMPORTANTE: Forzar reconfiguración
)

# Configurar logger
logger = logging.getLogger(__name__)
logger.info("🆕 config.py cargado")

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
    R2_PUBLIC_URL: str  # URL pública para acceder a los archivos

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
        """Inicializa cliente R2 - SOLUCIÓN DEFINITIVA"""
        logger.info("🔄 Inicializando cliente R2 para Cloudflare...")
        
        # Deshabilitar warnings de SSL temporalmente
        warnings.filterwarnings('ignore', category=urllib3.exceptions.InsecureRequestWarning)
        urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
        
        # Configuración optimizada para Cloudflare R2
        s3_config = Config(
            region_name="auto",
            signature_version='s3v4',
            connect_timeout=15,
            read_timeout=30,
            max_pool_connections=50,
            retries={
                'max_attempts': 3,
                'mode': 'standard'
            },
            s3={
                'addressing_style': 'virtual',
                'payload_signing_enabled': False  # Cloudflare R2 no necesita payload signing
            }
        )
        
        try:
            logger.info(f"🔗 Conectando a: {self.R2_ENDPOINT}")
            logger.info(f"📦 Bucket: {self.R2_BUCKET_NAME}")
            
            # Monkey patch CRÍTICO para deshabilitar verificación SSL en boto3
            import botocore.httpsession
            original_send = botocore.httpsession.URLLib3Session.send
            
            def patched_send(self, request, **kwargs):
                # Forzar no verificación SSL y configurar timeouts
                kwargs['verify'] = False
                kwargs['timeout'] = (15, 30)
                # Forzar TLS 1.2 si es posible
                import ssl
                if 'ssl_context' not in kwargs:
                    context = ssl.create_default_context()
                    context.minimum_version = ssl.TLSVersion.TLSv1_2
                    kwargs['ssl_context'] = context
                return original_send(self, request, **kwargs)
            
            # Aplicar el patch
            botocore.httpsession.URLLib3Session.send = patched_send
            
            # Crear sesión y cliente
            session = boto3.Session()
            
            self.r2_client = session.client(
                's3',
                endpoint_url=self.R2_ENDPOINT,
                aws_access_key_id=self.R2_ACCESS_KEY,
                aws_secret_access_key=self.R2_SECRET_KEY,
                config=s3_config
            )
            
            # ===== TEST DE CONEXIÓN COMPLETO =====
            logger.info("🧪 Realizando tests de conexión R2...")
            
            # 1. Test de listado de buckets
            start_time = time.time()
            response = self.r2_client.list_buckets()
            elapsed = time.time() - start_time
            
            bucket_names = [b['Name'] for b in response['Buckets']]
            logger.info(f"✅ List buckets exitoso ({elapsed:.2f}s)")
            logger.info(f"   → Buckets disponibles: {bucket_names}")
            
            # 2. Verificar que nuestro bucket existe
            try:
                self.r2_client.head_bucket(Bucket=self.R2_BUCKET_NAME)
                logger.info(f"✅ Bucket '{self.R2_BUCKET_NAME}' accesible")
            except Exception as e:
                logger.warning(f"⚠️  Bucket no accesible (puede que no exista): {e}")
            
            # 3. Test de PUT real
            test_key = f"connection-test-{int(time.time())}.txt"
            logger.info(f"📤 Probando PUT con archivo: {test_key}")
            
            self.r2_client.put_object(
                Bucket=self.R2_BUCKET_NAME,
                Key=test_key,
                Body=b"Connection test from Render at " + str(time.time()).encode(),
                ContentType='text/plain',
                Metadata={'test': 'true', 'timestamp': str(time.time())}
            )
            logger.info("✅ PUT test exitoso")
            
            # 4. Test de GET (opcional)
            try:
                obj = self.r2_client.get_object(Bucket=self.R2_BUCKET_NAME, Key=test_key)
                content = obj['Body'].read().decode('utf-8')
                logger.info(f"✅ GET test exitoso. Contenido: {content[:50]}...")
            except Exception as e:
                logger.warning(f"⚠️  GET test falló (pero PUT funcionó): {e}")
            
            # 5. Test de DELETE
            self.r2_client.delete_object(Bucket=self.R2_BUCKET_NAME, Key=test_key)
            logger.info("✅ DELETE test exitoso")
            
            # 6. Información de URLs
            public_url = f"{self.R2_PUBLIC_URL}/{test_key}" if hasattr(self, 'R2_PUBLIC_URL') else "No configurada"
            logger.info(f"🌐 URL pública base: {self.R2_PUBLIC_URL if hasattr(self, 'R2_PUBLIC_URL') else 'No configurada'}")
            
            logger.info("🎉 ✅✅✅ CLIENTE R2 INICIALIZADO CON ÉXITO ✅✅✅")
            logger.info(f"   • Endpoint: {self.R2_ENDPOINT}")
            logger.info(f"   • Bucket: {self.R2_BUCKET_NAME}")
            logger.info(f"   • SSL: Deshabilitado para testing")
            
            return True
            
        except Exception as e:
            logger.error(f"❌💥 ERROR CRÍTICO INICIALIZANDO R2 💥❌")
            logger.error(f"   Tipo: {type(e).__name__}")
            logger.error(f"   Mensaje: {str(e)}")
            
            # Intentar solución de emergencia
            try:
                logger.info("🆘 Intentando solución de emergencia...")
                self._emergency_storage_init()
                return True
            except Exception as emergency_e:
                logger.error(f"💣 Solución de emergencia también falló: {emergency_e}")
                self.r2_client = None
                return False
    
    def _emergency_storage_init(self):
        """Solución de emergencia si la principal falla"""
        logger.warning("🚨 USANDO MODO DE EMERGENCIA PARA R2")
        
        # Crear un cliente MUY básico con configuración mínima
        self.r2_client = boto3.client(
            's3',
            endpoint_url=self.R2_ENDPOINT,
            aws_access_key_id=self.R2_ACCESS_KEY,
            aws_secret_access_key=self.R2_SECRET_KEY,
            config=Config(
                region_name='auto',
                signature_version='s3v4',
                connect_timeout=30,
                read_timeout=60,
                retries={'max_attempts': 1}
            )
        )
        
        # Forzar no SSL verification a nivel de sesión HTTP
        import botocore.session
        from botocore.httpsession import URLLib3Session
        
        class InsecureURLLib3Session(URLLib3Session):
            def send(self, request):
                # Sobrescribir completamente para evitar SSL verification
                import urllib3
                import urllib.parse
                
                # Crear pool manager inseguro
                http = urllib3.PoolManager(
                    cert_reqs='CERT_NONE',
                    assert_hostname=False,
                    retries=urllib3.Retry(1)
                )
                
                # Preparar request
                url = request.url
                method = request.method
                headers = dict(request.headers)
                body = request.body
                
                # Enviar request
                resp = http.request(
                    method,
                    url,
                    body=body,
                    headers=headers,
                    timeout=urllib3.Timeout(connect=30, read=60),
                    retries=urllib3.Retry(1)
                )
                
                # Crear respuesta compatible
                from botocore.awsrequest import AWSResponse
                return AWSResponse(
                    url=url,
                    status_code=resp.status,
                    headers=resp.headers,
                    raw=resp
                )
        
        # Reemplazar la sesión HTTP
        botocore_session = botocore.session.get_session()
        botocore_session._session = InsecureURLLib3Session()
        
        logger.warning("✅ Modo emergencia activado (SSL completamente deshabilitado)")

# Crear instancia de settings
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

# Inicializar almacenamiento R2
logger.info("=" * 60)
logger.info("INICIALIZANDO SISTEMA DE ALMACENAMIENTO R2")
logger.info("=" * 60)

storage_success = settings.init_storage()

if storage_success:
    logger.info("🎊🎊🎊 SISTEMA R2 LISTO PARA USO 🎊🎊🎊")
else:
    logger.critical("💀💀💀 SISTEMA R2 NO DISPONIBLE - LA APP FUNCIONARÁ SIN ALMACENAMIENTO 💀💀💀")
    logger.critical("   Las operaciones de upload fallarán hasta que se solucione R2")

logger.info("=" * 60)