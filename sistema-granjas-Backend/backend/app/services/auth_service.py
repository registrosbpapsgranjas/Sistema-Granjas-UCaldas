from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.CRUD.usuarios import get_usuario_by_email, create_usuario
from app.core.security import create_access_token, verify_password, get_password_hash
from app.schemas.usuario_schema import UsuarioCreate
from app.schemas.auth_schema import RegisterRequest, LoginRequest, TokenResponse, LogoutRequest, GoogleLoginRequest
from app.core.config import settings
from google.oauth2 import id_token
from google.auth.transport import requests

import logging

logger = logging.getLogger(__name__)

class AuthService:
    """Clase que encapsula la lógica de negocio para la autenticación."""

    @staticmethod
    def _create_token_response(usuario, message: str = None) -> TokenResponse:
        """Helper para generar el JWT y la respuesta estándar."""
        access_token = create_access_token({
            "id": usuario.id,
            "sub": usuario.email,
            "rol": usuario.rol.nombre,
            "rol_id": usuario.rol_id,
            "nombre": usuario.nombre
        })
        
        # Verificar si el usuario tiene rol y obtener su nombre
        rol_nombre = usuario.rol.nombre if hasattr(usuario, 'rol') and usuario.rol else "usuario"
        
        return TokenResponse(
            id=usuario.id,
            access_token=access_token,
            token_type="bearer",
            nombre=usuario.nombre,
            rol=rol_nombre,
            rol_id=usuario.rol_id,
            email=usuario.email,
            message=message
        )

    # --- LÓGICA DE AUTENTICACIÓN TRADICIONAL ---

    @staticmethod
    def login_user(db: Session, data: LoginRequest) -> TokenResponse:
        """Procesa el login tradicional de un usuario."""
        logger.info(f"Procesando login tradicional para: {data.email}")
        
        usuario = get_usuario_by_email(db, data.email)

        # 1. Validación de existencia
        if not usuario:
            logger.warning(f"Login fallido: Usuario no encontrado: {data.email}")
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciales inválidas")
        
        # 2. Validación de proveedor de autenticación (Bloquear si es solo Google)
        if usuario.auth_provider == "google":
            logger.warning(f"Login fallido: Intento tradicional para usuario Google: {data.email}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Este usuario se registró con Google. Use ese método para iniciar sesión."
            )
        
        # 3. Validación de hash de contraseña
        if not usuario.password_hash:
            logger.warning(f"Login fallido: Usuario sin password_hash: {data.email}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Credenciales inválidas - contraseña no configurada"
            )
        
        # 4. Verificación de contraseña
        if not verify_password(data.password, usuario.password_hash):
            logger.warning(f"Login fallido: Contraseña incorrecta para: {data.email}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Credenciales inválidas"
            )
        
        logger.info(f"Login tradicional exitoso para: {data.email}")
        return AuthService._create_token_response(usuario, "Login exitoso")

    @staticmethod
    def register_user(db: Session, data: RegisterRequest) -> TokenResponse:
        """Procesa el registro tradicional de un nuevo usuario."""
        logger.info(f"Procesando registro tradicional para: {data.email}")
        
        # 1. Verificar si el usuario ya existe
        usuario_existente = get_usuario_by_email(db, data.email)
        if usuario_existente:
            logger.warning(f"Registro fallido: email existente: {data.email}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El usuario ya está registrado"
            )
        
        # 2. Hashear la contraseña
        hashed_password = get_password_hash(data.password)
        
        # 3. Crear usuario base en la base de datos
        usuario_data = UsuarioCreate(
            nombre=data.nombre,
            email=data.email,
            rol_id=data.rol_id
        )
        
        usuario = create_usuario(db, usuario_data)
        
        # 4. Asignar hash y proveedor de auth
        usuario.password_hash = hashed_password
        usuario.auth_provider = "traditional"
        db.commit()
        db.refresh(usuario)

        logger.info(f"Registro tradicional exitoso para: {data.email}")
        
        # 5. Generar token de respuesta
        return AuthService._create_token_response(usuario, "Registro exitoso")

    # --- LÓGICA DE AUTENTICACIÓN CON GOOGLE ---

    @staticmethod
    def verify_google_token(token: str) -> dict:
        """
        Verifica el token de Google ID y devuelve la información del usuario.
        """
        try:
            logger.debug("Verificando token de Google")
            
            # Revisa la audiencia y firma del token
            idinfo = id_token.verify_oauth2_token(
                token, 
                requests.Request(), 
                settings.GOOGLE_CLIENT_ID
            )
            
            # Verificación de que el token es para nuestra aplicación
            if idinfo['aud'] != settings.GOOGLE_CLIENT_ID:
                logger.error(f"Audience mismatch: {idinfo['aud']} != {settings.GOOGLE_CLIENT_ID}")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED, 
                    detail="Token de Google inválido: Audience mismatch"
                )
            
            logger.debug(f"Token Google verificado para email: {idinfo.get('email')}")
            return idinfo
            
        except ValueError as e:
            logger.error(f"Error verificando token Google (ValueError): {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, 
                detail="Token de Google inválido o expirado"
            )
        except Exception as e:
            logger.error(f"Error inesperado verificando token Google: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
                detail="Error interno al verificar el token"
            )

    @staticmethod
    def login_with_google(db: Session, data: GoogleLoginRequest) -> TokenResponse:
        """
        Procesa el login con Google, verifica el token y genera la sesión.
        """
        logger.info("Iniciando lógica de login con Google en el servicio")

        # Paso 1: Verificar token
        user_info = AuthService.verify_google_token(data.token)

        email = user_info.get("email")
        if not email:
            logger.error("Token de Google no contiene email")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email no disponible en el token de Google"
            )

        email_normalizado = email.lower().strip()
        logger.info(f"Buscando usuario con email: {email_normalizado}")
        
        usuario = get_usuario_by_email(db, email_normalizado)

        # Paso 2: Validar que el usuario exista
        if not usuario:
            logger.warning(f"Login Google fallido: Usuario no registrado: {email_normalizado}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Usuario no registrado. Debe registrarse con el formulario tradicional para asignar un rol."
            )

        # Paso 3: Actualizar proveedor si aplica
        if usuario.auth_provider == "traditional":
            logger.info(f"Actualizando usuario {email_normalizado} para login mixto")
            usuario.auth_provider = "both"
            db.commit()
            db.refresh(usuario)

        logger.info(f"Login con Google exitoso para: {email_normalizado}")

        # Paso 4: Generar respuesta con token
        return AuthService._create_token_response(usuario, "Login con Google exitoso")