from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import (
    granjas, 
    oauth_google, 
    auth_tradicional,
    usuarios,
    sync,
    programas,
    lotes,
    tipo_lotes,
    cultivos_especies,
    tipo_labores,
    categorias_inventario,
    insumos,
    herramientas,
    diagnosticos,
    recomendaciones,
    labores,
    evidencias,
    upload,
    movimientos,
    roles,
    exportRoutes
)
from app.db.database import engine, Base
from app.db.models import Usuario, Granja, Programa, Lote, Labor, Rol
import logging
import time  # <-- Añade esto
import sys   # <-- Añade esto
import ssl   # <-- Añade esto

# Configurar logging detallado para Render
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    stream=sys.stdout  # <-- Esto asegura que Render vea los logs
)

logger = logging.getLogger(__name__)

# ========== DIAGNÓSTICO INICIAL ==========
logger.info("🚀 ========== INICIANDO APLICACIÓN ==========")
logger.info(f"Python version: {sys.version}")
logger.info(f"OpenSSL version: {ssl.OPENSSL_VERSION}")

# Test de variables de entorno críticas
import os
env_vars_to_check = [
    'R2_ACCESS_KEY',
    'R2_SECRET_KEY', 
    'R2_ENDPOINT',
    'R2_BUCKET_NAME',
    'DATABASE_URL'
]

for var in env_vars_to_check:
    value = os.getenv(var)
    if value:
        masked = value[:4] + "..." + value[-4:] if len(value) > 8 else "***"
        logger.info(f"✅ {var}: {masked}")
    else:
        logger.warning(f"⚠️  {var}: NO DEFINIDA")

# Crear tablas (esto es solo para desarrollo)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Sistema Granjas UCaldas",
    description="Sistema de Gestión Agrícola para la Universidad de Caldas",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS - Añade tu dominio de frontend si está en producción
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:5173", "https://sistema-granjas-ucaldas-front.onrender.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ========== ENDPOINT DE DIAGNÓSTICO R2 ==========
@app.get("/debug/r2")
async def debug_r2():
    """Endpoint para debug de R2"""
    try:
        from app.core.config import settings
        import boto3
        from botocore.exceptions import ClientError
        
        debug_info = {
            "timestamp": time.time(),
            "python_version": sys.version,
            "openssl_version": ssl.OPENSSL_VERSION,
        }
        
        # Información de configuración
        if hasattr(settings, 'R2_ENDPOINT'):
            debug_info["config"] = {
                "endpoint": settings.R2_ENDPOINT,
                "bucket": settings.R2_BUCKET_NAME,
                "has_access_key": bool(settings.R2_ACCESS_KEY),
                "has_secret_key": bool(settings.R2_SECRET_KEY),
            }
        
        # Probar conexión si el cliente existe
        if hasattr(settings, 'r2_client') and settings.r2_client:
            try:
                # 1. Listar buckets
                logger.info("🔍 Debug R2: Listando buckets...")
                buckets = settings.r2_client.list_buckets()
                debug_info["connection_test"] = {
                    "status": "success",
                    "bucket_count": len(buckets['Buckets']),
                    "bucket_names": [b['Name'] for b in buckets['Buckets']]
                }
                logger.info(f"✅ Debug R2: {len(buckets['Buckets'])} buckets encontrados")
                
                # 2. Test PUT
                test_key = f"debug-test-{int(time.time())}.txt"
                logger.info(f"🔍 Debug R2: Probando PUT con key {test_key}")
                
                settings.r2_client.put_object(
                    Bucket=settings.R2_BUCKET_NAME,
                    Key=test_key,
                    Body=b"Debug test from Render",
                    ContentType='text/plain'
                )
                debug_info["put_test"] = {"status": "success", "key": test_key}
                logger.info("✅ Debug R2: PUT exitoso")
                
                # 3. Test DELETE
                settings.r2_client.delete_object(
                    Bucket=settings.R2_BUCKET_NAME,
                    Key=test_key
                )
                debug_info["delete_test"] = {"status": "success"}
                logger.info("✅ Debug R2: DELETE exitoso")
                
                debug_info["overall"] = "ALL_TESTS_PASSED"
                
            except Exception as e:
                debug_info["connection_test"] = {
                    "status": "error",
                    "error": str(e),
                    "type": type(e).__name__
                }
                logger.error(f"❌ Debug R2 error: {e}")
        else:
            debug_info["error"] = "r2_client no está inicializado"
            logger.error("❌ Debug R2: r2_client no inicializado")
        
        return debug_info
        
    except Exception as e:
        logger.error(f"❌ Error en debug endpoint: {e}")
        return {"error": str(e), "type": type(e).__name__}

# ========== ENDPOINT DE SSL TEST ==========
@app.get("/debug/ssl")
async def debug_ssl():
    """Test SSL/TLS capabilities"""
    import urllib3
    import requests
    
    debug_info = {
        "ssl_version": ssl.OPENSSL_VERSION,
        "ssl_version_info": ssl.OPENSSL_VERSION_INFO,
        "available_protocols": {
            "TLSv1": hasattr(ssl, 'PROTOCOL_TLSv1'),
            "TLSv1_1": hasattr(ssl, 'PROTOCOL_TLSv1_1'),
            "TLSv1_2": hasattr(ssl, 'PROTOCOL_TLSv1_2'),
            "TLS": hasattr(ssl, 'PROTOCOL_TLS'),
        }
    }
    
    # Test de conexión a Cloudflare R2
    try:
        # Test directo con requests
        test_url = "https://ddaa13de1a3b654c3b292302013b8abb.r2.cloudflarestorage.com"
        response = requests.get(test_url, timeout=5, verify=False)
        debug_info["direct_cloudflare_test"] = {
            "status_code": response.status_code,
            "success": response.status_code < 400
        }
    except Exception as e:
        debug_info["direct_cloudflare_test"] = {
            "error": str(e),
            "type": type(e).__name__
        }
    
    return debug_info

# Incluir routers (tus routers existentes)
app.include_router(oauth_google.router, prefix="/api")
app.include_router(auth_tradicional.router, prefix="/api")
app.include_router(usuarios.router, prefix="/api")
app.include_router(granjas.router, prefix="/api")
app.include_router(sync.router, prefix="/api")
app.include_router(programas.router, prefix="/api")
app.include_router(lotes.router, prefix="/api")
app.include_router(tipo_lotes.router, prefix="/api")
app.include_router(cultivos_especies.router, prefix="/api")
app.include_router(tipo_labores.router, prefix="/api")
app.include_router(categorias_inventario.router, prefix="/api")
app.include_router(insumos.router, prefix="/api")
app.include_router(herramientas.router, prefix="/api")
app.include_router(diagnosticos.router, prefix="/api")
app.include_router(recomendaciones.router, prefix="/api")
app.include_router(labores.router, prefix="/api")
app.include_router(evidencias.router, prefix="/api")
app.include_router(upload.router, prefix="/api")
app.include_router(movimientos.router, prefix="/api")
app.include_router(roles.router, prefix="/api")
app.include_router(exportRoutes.router, prefix="/api")

@app.get("/")
def root():
    return {
        "message": "Sistema de Gestión de Granjas UCaldas API", 
        "version": "2.0.0",
        "status": "running",
        "debug_endpoints": {
            "r2_test": "/debug/r2",
            "ssl_test": "/debug/ssl"
        }
    }

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "timestamp": time.time()}

@app.get("/api/info")
def api_info():
    return {
        "name": "Sistema Granjas UCaldas",
        "version": "2.0.0",
        "endpoints": {
            "auth": "/api/auth",
            "usuarios": "/api/usuarios",
            "granjas": "/api/granjas",
            "sync": "/api/sync",
            "evidencias": "/api/evidencias",
            "debug_r2": "/debug/r2",
            "debug_ssl": "/debug/ssl"
        }
    }

# ========== INICIALIZACIÓN FINAL ==========
@app.on_event("startup")
async def startup_event():
    """Ejecutar al iniciar la app"""
    logger.info("🎉 Aplicación iniciada correctamente")
    
    # Test R2 al inicio
    try:
        from app.core.config import settings
        if hasattr(settings, 'r2_client') and settings.r2_client:
            logger.info("✅ Cliente R2 inicializado durante startup")
            # Test rápido
            response = settings.r2_client.list_buckets()
            logger.info(f"✅ R2 buckets disponibles: {len(response['Buckets'])}")
        else:
            logger.warning("⚠️  Cliente R2 no inicializado")
    except Exception as e:
        logger.error(f"❌ Error testing R2 on startup: {e}")