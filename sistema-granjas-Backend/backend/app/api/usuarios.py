from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db.database import get_db
from app.CRUD.usuarios import (
    get_usuarios, 
    get_usuario_by_id, 
    update_usuario, 
    delete_usuario, 
    cambiar_rol_usuario,
    search_usuarios,
    get_usuario_by_email
)
from app.CRUD.roles import get_rol_by_id
from app.schemas.usuario_schema import UsuarioResponse, UsuarioUpdate
from app.core.dependencies import get_current_user, require_role
from app.db.models import Usuario

router = APIRouter(prefix="/usuarios", tags=["Usuarios"])

# ✅ FORMA 1: Usando dependencies en el decorador (CORREGIDO)
@router.get("/", response_model=List[UsuarioResponse], dependencies=[Depends(require_role("admin"))])
def listar_usuarios(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Listar todos los usuarios (solo admin)
    """
    if search:
        usuarios = search_usuarios(db, search)
    else:
        usuarios = get_usuarios(db, skip=skip, limit=limit)
    
    response_usuarios = []
    for usuario in usuarios:
        usuario_data = UsuarioResponse(
            id=usuario.id,
            nombre=usuario.nombre,
            email=usuario.email,
            rol_id=usuario.rol_id,
            rol_nombre=usuario.rol.nombre,
            activo=usuario.activo,
            fecha_creacion=usuario.fecha_creacion
        )
        response_usuarios.append(usuario_data)
    
    return response_usuarios

# ✅ FORMA 2: Usando el dependency como parámetro (ALTERNATIVA)
@router.get("/{usuario_id}", response_model=UsuarioResponse)
def obtener_usuario(
    usuario_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_role("admin"))
):
    """
    Obtener un usuario específico por ID (solo admin)
    """
    usuario = get_usuario_by_id(db, usuario_id)
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    return UsuarioResponse(
        id=usuario.id,
        nombre=usuario.nombre,
        email=usuario.email,
        rol_id=usuario.rol_id,
        rol_nombre=usuario.rol.nombre,
        activo=usuario.activo,
        fecha_creacion=usuario.fecha_creacion
    )

@router.put("/{usuario_id}", response_model=UsuarioResponse)
def actualizar_usuario(
    usuario_id: int,
    usuario_update: UsuarioUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_role("admin"))
):
    """
    Actualizar información de un usuario (solo admin)
    """
    usuario_existente = get_usuario_by_id(db, usuario_id)
    if not usuario_existente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    if usuario_update.rol_id is not None:
        rol = get_rol_by_id(db, usuario_update.rol_id)
        if not rol:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Rol no válido"
            )
    
    usuario_actualizado = update_usuario(db, usuario_id, usuario_update)
    if not usuario_actualizado:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al actualizar usuario"
        )
    
    return UsuarioResponse(
        id=usuario_actualizado.id,
        nombre=usuario_actualizado.nombre,
        email=usuario_actualizado.email,
        rol_id=usuario_actualizado.rol_id,
        rol_nombre=usuario_actualizado.rol.nombre,
        activo=usuario_actualizado.activo,
        fecha_creacion=usuario_actualizado.fecha_creacion
    )

@router.put("/{usuario_id}/rol", response_model=UsuarioResponse)
def cambiar_rol(
    usuario_id: int,
    rol_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_role("admin"))
):
    """
    Cambiar rol de un usuario (solo admin)
    """
    rol = get_rol_by_id(db, rol_id)
    if not rol:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Rol no válido"
        )
    
    usuario_actualizado = cambiar_rol_usuario(db, usuario_id, rol_id)
    if not usuario_actualizado:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    return UsuarioResponse(
        id=usuario_actualizado.id,
        nombre=usuario_actualizado.nombre,
        email=usuario_actualizado.email,
        rol_id=usuario_actualizado.rol_id,
        rol_nombre=usuario_actualizado.rol.nombre,
        activo=usuario_actualizado.activo,
        fecha_creacion=usuario_actualizado.fecha_creacion
    )

@router.delete("/{usuario_id}")
def eliminar_usuario(
    usuario_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_role("admin"))
):
    """
    Eliminar (desactivar) un usuario (solo admin)
    """
    success = delete_usuario(db, usuario_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    return {"message": "Usuario eliminado correctamente"}

@router.get("/me/perfil", response_model=UsuarioResponse)
def obtener_mi_perfil(current_user: Usuario = Depends(get_current_user)):
    """
    Obtener el perfil del usuario actual (cualquier usuario autenticado)
    """
    return UsuarioResponse(
        id=current_user.id,
        nombre=current_user.nombre,
        email=current_user.email,
        rol_id=current_user.rol_id,
        rol_nombre=current_user.rol.nombre,
        activo=current_user.activo,
        fecha_creacion=current_user.fecha_creacion
    )

@router.get("/email/{email}")
def buscar_usuario_por_email(
    email: str,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_role("admin"))
):
    """
    Buscar usuario por email (solo admin)
    """
    usuario = get_usuario_by_email(db, email)
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    return UsuarioResponse(
        id=usuario.id,
        nombre=usuario.nombre,
        email=usuario.email,
        rol_id=usuario.rol_id,
        rol_nombre=usuario.rol.nombre,
        activo=usuario.activo,
        fecha_creacion=usuario.fecha_creacion
    )