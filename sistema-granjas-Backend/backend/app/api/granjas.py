from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_db
from app.services.granjas_service import GranjaService
from app.schemas.granja_schema import (
    GranjaCreate, GranjaUpdate, GranjaResponse,
    AsignacionUsuarioGranja, AsignacionProgramaGranja
)
from app.core.dependencies import get_current_user, require_role
from app.CRUD.granjas import (
    # Nuevas funciones
    asignar_usuario_granja, desasignar_usuario_granja, listar_usuarios_granja,
    asignar_programa_granja, desasignar_programa_granja, listar_programas_granja,
    _granja_a_dict
)

router = APIRouter(
    prefix="/granjas",
    tags=["Granjas"]
)

# Endpoints básicos existentes
@router.get("/", response_model=List[GranjaResponse])
def listar(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    return GranjaService.listar_granjas(db, skip, limit)

@router.get("/{granja_id}", response_model=GranjaResponse)
def obtener(granja_id: int, db: Session = Depends(get_db)):
    return GranjaService.obtener_granja(db, granja_id)

@router.post("/", response_model=GranjaResponse)
def crear(data: GranjaCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    return GranjaService.crear_granja(db, data)

@router.put("/{granja_id}", response_model=GranjaResponse)
def actualizar(granja_id: int, data: GranjaUpdate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    return GranjaService.actualizar_granja(db, granja_id, data)

@router.delete("/{granja_id}")
def eliminar(granja_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    return GranjaService.eliminar_granja(db, granja_id)

# === NUEVOS ENDPOINTS PARA ASIGNACIÓN DE USUARIOS ===

@router.post("/{granja_id}/usuarios", response_model=GranjaResponse)
def asignar_usuario_a_granja(
    granja_id: int,
    data: AsignacionUsuarioGranja,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role(["admin"]))
):
    """Asignar un usuario a una granja"""
    granja = asignar_usuario_granja(db, granja_id, data.usuario_id)
    return _granja_a_dict(granja)

@router.delete("/{granja_id}/usuarios/{usuario_id}")
def desasignar_usuario_de_granja(
    granja_id: int,
    usuario_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role(["admin"]))
):
    """Desasignar un usuario de una granja"""
    return desasignar_usuario_granja(db, granja_id, usuario_id)

@router.get("/{granja_id}/usuarios")
def listar_usuarios_de_la_granja(
    granja_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role(["admin"]))
):
    """Listar todos los usuarios asignados a una granja"""
    return listar_usuarios_granja(db, granja_id)

# === NUEVOS ENDPOINTS PARA ASIGNACIÓN DE PROGRAMAS ===

@router.post("/{granja_id}/programas", response_model=GranjaResponse)
def asignar_programa_a_granja(
    granja_id: int,
    data: AsignacionProgramaGranja,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role(["admin"]))
):
    """Asignar un programa a una granja"""
    granja = asignar_programa_granja(db, granja_id, data.programa_id)
    return _granja_a_dict(granja)

@router.delete("/{granja_id}/programas/{programa_id}")
def desasignar_programa_de_granja(
    granja_id: int,
    programa_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role(["admin"]))
):
    """Desasignar un programa de una granja"""
    return desasignar_programa_granja(db, granja_id, programa_id)

@router.get("/{granja_id}/programas")
def listar_programas_de_la_granja(
    granja_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role(["admin"]))
):
    """Listar todos los programas asignados a una granja"""
    return listar_programas_granja(db, granja_id)