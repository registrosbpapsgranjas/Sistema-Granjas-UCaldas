# app/api/roles.py
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db.database import get_db
from app.schemas.rol_schema import (
    RolCreate, 
    RolUpdate, 
    RolResponse,
    RolParaRegistro
)
from app.CRUD.roles import (
    get_rol_by_id,
    get_rol_by_nombre,
    get_roles_activos,
    get_roles_para_registro,
    create_rol,
    inicializar_roles_por_defecto
)

router = APIRouter()

@router.get("/roles/", response_model=List[RolResponse])
def obtener_roles(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    Obtiene la lista de todos los roles activos.
    """
    roles = get_roles_activos(db, skip=skip, limit=limit)
    return roles

@router.get("/roles/para-registro", response_model=List[RolParaRegistro])
def obtener_roles_para_registro(db: Session = Depends(get_db)):
    """
    Obtiene roles permitidos para el registro de usuarios.
    """
    roles = get_roles_para_registro(db)
    return roles

@router.get("/roles/{rol_id}", response_model=RolResponse)
def obtener_rol_por_id(rol_id: int, db: Session = Depends(get_db)):
    """
    Obtiene un rol específico por su ID.
    """
    rol = get_rol_by_id(db, rol_id)
    if rol is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rol no encontrado"
        )
    return rol

@router.post("/roles/", response_model=RolResponse, status_code=status.HTTP_201_CREATED)
def crear_nuevo_rol(rol: RolCreate, db: Session = Depends(get_db)):
    """
    Crea un nuevo rol.
    """
    # Verificar si ya existe un rol con ese nombre
    rol_existente = get_rol_by_nombre(db, rol.nombre)
    if rol_existente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ya existe un rol con el nombre '{rol.nombre}'"
        )
    
    nuevo_rol = create_rol(db=db, rol=rol)
    return nuevo_rol

@router.put("/roles/{rol_id}", response_model=RolResponse)
def actualizar_rol(rol_id: int, rol_update: RolUpdate, db: Session = Depends(get_db)):
    """
    Actualiza un rol existente.
    """
    # Verificar si el rol existe
    rol = get_rol_by_id(db, rol_id)
    if rol is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rol no encontrado"
        )
    
    # Si se está actualizando el nombre, verificar que no exista otro con ese nombre
    if rol_update.nombre and rol_update.nombre != rol.nombre:
        rol_con_mismo_nombre = get_rol_by_nombre(db, rol_update.nombre)
        if rol_con_mismo_nombre:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Ya existe otro rol con el nombre '{rol_update.nombre}'"
            )
    
    # Actualizar campos
    update_data = rol_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(rol, field, value)
    
    db.commit()
    db.refresh(rol)
    return rol

@router.delete("/roles/{rol_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_rol(rol_id: int, db: Session = Depends(get_db)):
    """
    Elimina un rol (marca como inactivo).
    """
    rol = get_rol_by_id(db, rol_id)
    if rol is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rol no encontrado"
        )
    
    # Verificar si hay usuarios asignados a este rol
    if rol.usuarios:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se puede eliminar el rol porque tiene usuarios asignados"
        )
    
    # Soft delete - marcar como inactivo
    rol.activo = False
    db.commit()
    return None

@router.post("/roles/inicializar-roles", response_model=List[str])
def inicializar_roles(db: Session = Depends(get_db)):
    """
    Inicializa los roles por defecto en la base de datos.
    """
    roles_creados = inicializar_roles_por_defecto(db)
    return roles_creados