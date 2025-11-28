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
    evidencias,  # ✅ AGREGADO: Importar evidencias
    upload,
    movimientos
    
)
from app.db.database import engine, Base
from app.db.models import Usuario, Granja, Programa, Lote, Labor, Rol  # Importar modelos existentes

import logging

# Configurar logging detallado
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
# Crear tablas (esto es solo para desarrollo)
# En producción usa Alembic
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Sistema Granjas UCaldas",
    description="Sistema de Gestión Agrícola para la Universidad de Caldas",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir routers
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
app.include_router(evidencias.router, prefix="/api")  # ✅ AGREGADO: Incluir router de evidencias
app.include_router(upload.router, prefix="/api")
app.include_router(movimientos.router, prefix="/api")

@app.get("/")
def root():
    return {
        "message": "Sistema de Gestión de Granjas UCaldas API", 
        "version": "2.0.0",
        "status": "running"
    }

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "timestamp": "2024-01-01T00:00:00Z"}

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
            "evidencias": "/api/evidencias"  # ✅ AGREGADO: Información del endpoint
        }
    }