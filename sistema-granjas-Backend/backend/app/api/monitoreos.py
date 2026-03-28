from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_db
from app.core.dependencies import require_any_role
from app.schemas.monitoreo_schema import (
    MonitoreoCreate, MonitoreoUpdate, MonitoreoResponse
)
from app.CRUD import monitoreos as crud

router = APIRouter(prefix="/monitoreos", tags=["Monitoreos"])

# ========== ENDPOINTS ==========
@router.get("/", response_model=List[MonitoreoResponse])
def listar_monitoreos(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_any_role(["admin", "coordinador"]))
):
    """Listar todos los monitoreos con paginación"""
    return crud.get_monitoreos(db, skip=skip, limit=limit)


@router.get("/programa/{programa_id}", response_model=List[MonitoreoResponse])
def listar_monitoreos_por_programa(
    programa_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_any_role(["admin", "coordinador", "estudiante"]))
):
    """Obtener monitoreos de un programa específico"""
    monitoreos = crud.get_monitoreos_por_programa(db, programa_id)
    return monitoreos


@router.get("/{monitoreo_id}", response_model=MonitoreoResponse)
def obtener_monitoreo(
    monitoreo_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_any_role(["admin", "coordinador"]))
):
    """Obtener un monitoreo por su ID"""
    monitoreo = crud.get_monitoreo(db, monitoreo_id)
    if not monitoreo:
        raise HTTPException(status_code=404, detail="Monitoreo no encontrado")
    return monitoreo


@router.post("/", response_model=MonitoreoResponse, status_code=201)
def crear_monitoreo(
    data: MonitoreoCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_any_role(["admin"]))
):
    """Crear un nuevo monitoreo (solo administradores)"""
    return crud.create_monitoreo(db, data)


@router.put("/{monitoreo_id}", response_model=MonitoreoResponse)
def actualizar_monitoreo(
    monitoreo_id: int,
    data: MonitoreoUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_any_role(["admin"]))
):
    """Actualizar un monitoreo existente"""
    monitoreo = crud.get_monitoreo(db, monitoreo_id)
    if not monitoreo:
        raise HTTPException(status_code=404, detail="Monitoreo no encontrado")
    return crud.update_monitoreo(db, monitoreo, data)


@router.delete("/{monitoreo_id}")
def eliminar_monitoreo(
    monitoreo_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_any_role(["admin"]))
):
    """Eliminar un monitoreo (borrado físico)"""
    monitoreo = crud.get_monitoreo(db, monitoreo_id)
    if not monitoreo:
        raise HTTPException(status_code=404, detail="Monitoreo no encontrado")
    return crud.delete_monitoreo(db, monitoreo)