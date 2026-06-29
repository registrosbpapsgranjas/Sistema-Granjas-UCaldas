from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.CRUD.usuarios import get_usuario_by_email, create_usuario
from app.core.security import create_access_token, verify_password, get_password_hash
from app.schemas.usuario_schema import UsuarioCreate
from app.schemas.auth_schema import RegisterRequest, LoginRequest, TokenResponse, LogoutRequest

import logging

logger = logging.getLogger(__name__)

class AuthService:
    """Clase que encapsula la lógica de negocio para la autenticación."""

    @staticmethod
    def _get_programas_info(usuario):
        """Obtiene la lista de programas asociados al usuario desde la tabla usuario_programa."""
        programas = []
        for programa in usuario.programas:
            programas.append({
                "id": programa.id,
                "nombre": programa.nombre,
                "tipo": programa.tipo,
                "activo": programa.activo
            })
        return programas

    @staticmethod
    def _create_token_response(usuario, message: str = None) -> TokenResponse:
        """Helper para generar el JWT y la respuesta estándar con programas incluidos."""
        access_token = create_access_token({
            "id": usuario.id,
            "sub": usuario.email,
            "rol": usuario.rol.nombre,
            "rol_id": usuario.rol_id,
            "nombre": usuario.nombre
        })
        
        # Verificar si el usuario tiene rol y obtener su nombre
        rol_nombre = usuario.rol.nombre if hasattr(usuario, 'rol') and usuario.rol else "usuario"
        
        # Obtener programas asociados
        programas = AuthService._get_programas_info(usuario)
        
        return TokenResponse(
            id=usuario.id,
            access_token=access_token,
            token_type="bearer",
            nombre=usuario.nombre,
            rol=rol_nombre,
            rol_id=usuario.rol_id,
            email=usuario.email,
            programas=programas,  # 👈 NUEVO: incluir programas
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
        
        # 2. Validación de que el usuario tenga contraseña (proveedor tradicional)
        if usuario.auth_provider and usuario.auth_provider not in ("traditional", "both"):
            logger.warning(f"Login fallido: Intento tradicional para usuario sin contraseña: {data.email}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Credenciales inválidas"
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

