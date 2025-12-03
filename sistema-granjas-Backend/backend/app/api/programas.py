from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_db
from app.core.dependencies import require_role
from app.schemas.programa_schema import (
    ProgramaCreate, ProgramaResponse, ProgramaUpdate,
    AsignacionUsuarioPrograma, AsignacionGranjaPrograma
)
from app.CRUD.programas import (
    get_programas, get_programa,
    create_programa, update_programa, delete_programa,
    # Nuevas funciones
    asignar_usuario_programa, desasignar_usuario_programa, listar_usuarios_programa,
    asignar_granja_programa, desasignar_granja_programa, listar_granjas_programa,
    _programa_a_dict
)

router = APIRouter(prefix="/programas", tags=["Programas"])

# Endpoints básicos existentes
@router.get("/", response_model=List[ProgramaResponse])
def listar_programas(db: Session = Depends(get_db),
                     current_user: dict = Depends(require_role(["admin"]))):
    return get_programas(db)

@router.get("/{programa_id}", response_model=ProgramaResponse)
def obtener_programa(programa_id: int, db: Session = Depends(get_db),
                     current_user: dict = Depends(require_role(["admin"]))):
    programa = get_programa(db, programa_id)
    if not programa:
        raise HTTPException(404, "Programa no encontrado")
    return programa

@router.post("/", response_model=ProgramaResponse, status_code=201)
def crear_programa(data: ProgramaCreate, db: Session = Depends(get_db),
                   current_user: dict = Depends(require_role(["admin"]))):
    return create_programa(db, data)

@router.put("/{programa_id}", response_model=ProgramaResponse)
def actualizar_programa(programa_id: int, data: ProgramaUpdate,
                        db: Session = Depends(get_db),
                        current_user: dict = Depends(require_role(["admin"]))):
    programa = get_programa(db, programa_id)
    if not programa:
        raise HTTPException(404, "Programa no encontrado")
    return update_programa(db, programa, data)

@router.delete("/{programa_id}")
def eliminar_programa(programa_id: int, db: Session = Depends(get_db),
                      current_user: dict = Depends(require_role(["admin"]))):
    programa = get_programa(db, programa_id)
    if not programa:
        raise HTTPException(404, "Programa no encontrado")
    delete_programa(db, programa)
    return {"message": "Programa eliminado correctamente"}

# === NUEVOS ENDPOINTS PARA ASIGNACIÓN DE USUARIOS ===

@router.post("/{programa_id}/usuarios", response_model=ProgramaResponse)
def asignar_usuario_a_programa(
    programa_id: int,
    data: AsignacionUsuarioPrograma,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role(["admin"]))
):
    """Asignar un usuario a un programa"""
    programa = asignar_usuario_programa(db, programa_id, data.usuario_id)
    return _programa_a_dict(programa)

@router.delete("/{programa_id}/usuarios/{usuario_id}")
def desasignar_usuario_de_programa(
    programa_id: int,
    usuario_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role(["admin"]))
):
    """Desasignar un usuario de un programa"""
    return desasignar_usuario_programa(db, programa_id, usuario_id)

@router.get("/{programa_id}/usuarios")
def listar_usuarios_del_programa(
    programa_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role(["admin"]))
):
    """Listar todos los usuarios asignados a un programa"""
    return listar_usuarios_programa(db, programa_id)

# === NUEVOS ENDPOINTS PARA ASIGNACIÓN DE GRANJAS ===

@router.post("/{programa_id}/granjas", response_model=ProgramaResponse)
def asignar_granja_a_programa(
    programa_id: int,
    data: AsignacionGranjaPrograma,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role(["admin"]))
):
    """Asignar una granja a un programa"""
    programa = asignar_granja_programa(db, programa_id, data.granja_id)
    return _programa_a_dict(programa)

@router.delete("/{programa_id}/granjas/{granja_id}")
def desasignar_granja_de_programa(
    programa_id: int,
    granja_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role(["admin"]))
):
    """Desasignar una granja de un programa"""
    return desasignar_granja_programa(db, programa_id, granja_id)

@router.get("/{programa_id}/granjas")
def listar_granjas_del_programa(
    programa_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role(["admin"]))
):
    """Listar todas las granjas asignadas a un programa"""
    return listar_granjas_programa(db, programa_id)