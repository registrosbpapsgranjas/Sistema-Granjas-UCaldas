from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from typing import List
import re
from app.db.database import get_db
from app.core.security import verify_token, get_password_hash
from app.schemas.auth_schema import (
    LoginRequest, 
    RegisterRequest, 
    LogoutRequest, 
    TokenResponse, 
    UserVerification,
    SuccessMessage,
    ChangePasswordRequest,
    ForgotPasswordRequest,
    VerifyResetCodeRequest,
    ResetPasswordRequest,
)
from app.schemas.rol_schema import RolParaRegistro
from app.CRUD.roles import get_roles_para_registro
from app.services.auth_service import AuthService
from app.core.dependencies import get_current_user
from app.db.models import Usuario

import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["Authentication"])

# Expresión regular para validar el dominio @ucaldas.edu.co
UCLADAS_EMAIL_REGEX = re.compile(r'^[a-zA-Z0-9._%+-]+@ucaldas\.edu\.co$', re.IGNORECASE)

# *********************************
# RUTAS DE AUTENTICACIÓN
# *********************************

@router.post("/login", response_model=TokenResponse)
def login_tradicional(data: LoginRequest, db: Session = Depends(get_db)):
    """
    Inicia sesión tradicionalmente y devuelve un Token JWT.
    """
    try:
        logger.info(f"Intentando login tradicional para: {data.email}")
        response = AuthService.login_user(db, data)
        return response
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error inesperado en login: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor"
        )

@router.post("/register", response_model=TokenResponse)
def register_tradicional(data: RegisterRequest, db: Session = Depends(get_db)):
    """
    Registra un nuevo usuario con email y contraseña.
    Solo se permiten correos del dominio @ucaldas.edu.co
    """
    try:
        logger.info(f"Intentando registro tradicional para: {data.email}")
        
        if not UCLADAS_EMAIL_REGEX.match(data.email):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Solo se permiten correos institucionales @ucaldas.edu.co"
            )
        
        response = AuthService.register_user(db, data)
        return response 
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error inesperado en registro: {str(e)}")
        db.rollback() 
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error interno del servidor durante el registro."
        )

# 👇 NUEVO ENDPOINT PARA CAMBIAR CONTRASEÑA
@router.post("/change-password", response_model=SuccessMessage)
def change_password(
    data: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Cambia la contraseña del usuario autenticado.
    Requiere la contraseña actual y la nueva contraseña.
    """
    try:
        # Verificar que la contraseña actual sea correcta
        from app.core.security import verify_password
        if not verify_password(data.current_password, current_user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La contraseña actual es incorrecta"
            )
        
        # Validar que la nueva contraseña sea diferente
        if data.current_password == data.new_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La nueva contraseña debe ser diferente a la actual"
            )
        
        # Validar longitud de la nueva contraseña
        if len(data.new_password) < 6:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La nueva contraseña debe tener al menos 6 caracteres"
            )
        
        if len(data.new_password) > 100:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La nueva contraseña no puede tener más de 100 caracteres"
            )
        
        # Validar que la nueva contraseña tenga al menos una letra
        if not any(c.isalpha() for c in data.new_password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La nueva contraseña debe contener al menos una letra"
            )
        
        # Hashear y guardar la nueva contraseña
        current_user.password_hash = get_password_hash(data.new_password)
        db.commit()
        
        logger.info(f"Contraseña actualizada para usuario: {current_user.email}")
        return SuccessMessage(
            message="Contraseña actualizada exitosamente",
            detail="La contraseña ha sido cambiada correctamente"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error al cambiar contraseña: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor al cambiar la contraseña"
        )

@router.post("/forgot-password", response_model=SuccessMessage)
def forgot_password(data: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """
    Solicita un código de recuperación de contraseña.
    Envía un código de 5 dígitos al correo si el usuario existe.
    """
    from app.db.models import Usuario
    from app.services.password_reset_service import generate_reset_code
    from app.services.email_service import send_reset_code_email

    try:
        usuario = db.query(Usuario).filter(
            Usuario.email == data.email,
            Usuario.activo == True
        ).first()

        if not usuario:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No existe una cuenta registrada con este correo. Asegúrate de escribirlo correctamente."
            )

        if usuario.auth_provider and usuario.auth_provider != "traditional":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Esta cuenta usa inicio de sesión con Google. No es posible restablecer la contraseña por este medio."
            )

        code = generate_reset_code(data.email)
        sent = send_reset_code_email(data.email, usuario.nombre, code)

        if not sent:
            logger.error(f"No se pudo enviar el correo de recuperación a {data.email}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="No se pudo enviar el correo. Verifica la configuración del servidor de correo."
            )

        logger.info(f"Código de recuperación enviado a {data.email}")
        return SuccessMessage(
            message="Código enviado exitosamente.",
            detail="Revisá tu bandeja de entrada. El código expira en 10 minutos."
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error en forgot-password: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor"
        )


@router.post("/verify-reset-code", response_model=SuccessMessage)
def verify_reset_code(data: VerifyResetCodeRequest):
    """
    Verifica que el código de recuperación sea válido.
    """
    from app.services.password_reset_service import verify_reset_code as _verify

    try:
        valid, message = _verify(data.email, data.code)
        if not valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=message
            )
        return SuccessMessage(message="Código válido", detail=message)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error en verify-reset-code: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor"
        )


@router.post("/reset-password", response_model=SuccessMessage)
def reset_password(data: ResetPasswordRequest, db: Session = Depends(get_db)):
    """
    Restablece la contraseña usando el código verificado.
    """
    from app.db.models import Usuario
    from app.services.password_reset_service import is_code_verified, consume_reset_code

    try:
        if not is_code_verified(data.email):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El código no ha sido verificado o ha expirado. Solicita uno nuevo."
            )

        usuario = db.query(Usuario).filter(
            Usuario.email == data.email,
            Usuario.activo == True
        ).first()

        if not usuario:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado"
            )

        usuario.password_hash = get_password_hash(data.new_password)
        db.commit()

        consume_reset_code(data.email)

        logger.info(f"Contraseña restablecida para {data.email}")
        return SuccessMessage(
            message="Contraseña restablecida exitosamente.",
            detail="Ya puedes iniciar sesión con tu nueva contraseña."
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error en reset-password: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor"
        )


@router.post("/logout", response_model=SuccessMessage)
def logout(data: LogoutRequest = Depends(LogoutRequest)):
    """
    Logout - principal función para el frontend para notificar el cierre.
    """
    if data and data.token:
        try:
            payload = verify_token(data.token)
            if payload:
                logger.info(f"Logout solicitado para usuario: {payload.get('sub')}")
        except Exception:
            pass
    
    logger.info("Logout exitoso")
    return SuccessMessage(
        message="Logout exitoso",
        detail="Token eliminado del cliente. Sesión cerrada correctamente."
    )

@router.get("/roles-disponibles")
def get_roles_disponibles(db: Session = Depends(get_db)):
    """Obtiene los roles disponibles para el registro de nuevos usuarios."""
    try:
        roles = get_roles_para_registro(db)
        return {"roles": [{"id": r.id, "nombre": r.nombre, "descripcion": r.descripcion or ""} for r in roles]}
    except Exception as e:
        logger.error(f"Error obteniendo roles disponibles: {e}")
        return {"roles": []}


@router.get("/verify", response_model=UserVerification)
def verify_token_endpoint(token: str, db: Session = Depends(get_db)):
    """
    Endpoint para verificar si un token es válido y devolver la información del usuario.
    """
    payload = verify_token(token)
    
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado"
        )
    
    from app.db.models import Usuario
    user_id = payload.get("id")
    usuario = db.query(Usuario).filter(Usuario.id == user_id).first()
    
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario no encontrado"
        )
    
    programas = []
    for programa in usuario.programas:
        programas.append({
            "id": programa.id,
            "nombre": programa.nombre,
            "tipo": programa.tipo,
            "activo": programa.activo
        })
    
    return UserVerification(
        valid=True,
        user={
            "id": usuario.id,
            "email": usuario.email,
            "rol": usuario.rol.nombre if usuario.rol else None,
            "rol_id": usuario.rol_id,
            "nombre": usuario.nombre,
            "programas": programas
        }
    )