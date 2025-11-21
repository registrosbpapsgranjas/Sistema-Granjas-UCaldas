import os
from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.CRUD.roles import get_roles_para_registro
from app.services.auth_service import AuthService
from app.schemas.auth_schema import (
    GoogleLoginRequest, 
    TokenResponse, 
    RolesAvailableResponse
)
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["Authentication"])

# La función verify_google_token fue movida a app.services.auth_service.py

@router.get("/roles-disponibles", response_model=RolesAvailableResponse)
def obtener_roles_para_registro(db: Session = Depends(get_db)):
    """
    Endpoint para que el frontend sepa qué roles puede seleccionar para el registro tradicional.
    """
    logger.info("Solicitando roles disponibles para registro.")
    
    roles = get_roles_para_registro(db)
    
    return RolesAvailableResponse(
        roles=[
            {
                "id": rol.id,
                "nombre": rol.nombre,
                "descripcion": rol.descripcion
            } for rol in roles
        ]
    )

@router.post("/google/login", response_model=TokenResponse)
def login_with_google(data: GoogleLoginRequest, db: Session = Depends(get_db)):
    """
    Login CON Google - Verifica el token de Google y genera la sesión JWT.
    """
    try:
        logger.info("Iniciando login con Google desde el router")
        
        # Llama al servicio para manejar toda la lógica de verificación y login
        response = AuthService.login_with_google(db, data)
        response.message = "Login con Google exitoso" # Aunque el TokenResponse no tiene message en el esquema, se incluye por consistencia.
        return response

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error inesperado en login Google: {str(e)}")
        # Los errores 500 deberían ser muy raros aquí, ya que el servicio maneja la mayoría.
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error en autenticación: {str(e)}")

# Endpoint de DEBUG para verificar configuración Google (se mantiene en el router)
@router.get("/debug/google-config")
def debug_google_config():
    """Endpoint para debug de configuración Google"""
    from app.core.config import settings # Importación local
    client_id = settings.GOOGLE_CLIENT_ID
    return {
        "client_id": client_id,
        "client_id_exists": bool(client_id),
        "client_id_format": "Válido" if client_id and "googleusercontent.com" in client_id else "Inválido",
        "client_id_preview": client_id[:20] + "..." if client_id else "No configurado"
    }
