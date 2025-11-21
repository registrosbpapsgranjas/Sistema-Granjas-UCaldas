from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.core.security import verify_token
from app.db.database import get_db
from app.CRUD.usuarios import get_usuario_by_email
from app.db.models import Usuario

security = HTTPBearer()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security), 
    db: Session = Depends(get_db)
):
    """
    Obtener el usuario actual desde el JWT
    """
    token = credentials.credentials
    payload = verify_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    email = payload.get("sub")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido",
        )
    
    user = get_usuario_by_email(db, email=email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario no encontrado",
        )
    
    if not user.activo:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario inactivo",
        )
    
    return user

def require_role(role: str):
    """
    Dependency para requerir un rol específico
    """
    def role_checker(current_user: Usuario = Depends(get_current_user)):
        if current_user.rol.nombre != role and current_user.rol.nombre != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos suficientes para realizar esta acción"
            )
        return current_user
    return role_checker

def require_any_role(roles: list):
    """
    Dependency para requerir cualquiera de los roles especificados
    """
    def role_checker(current_user: Usuario = Depends(get_current_user)):
        if (current_user.rol.nombre not in roles and 
            current_user.rol.nombre != "admin"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Se requiere uno de los siguientes roles: {', '.join(roles)}"
            )
        return current_user
    return role_checker  # ✅ SOLO retornamos la función, sin Depends()