from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime

from app.db.database import get_db
from app.core.dependencies import get_current_user, require_role
from app.CRUD.movimientos import (
    listar_movimientos_herramientas_crud,
    listar_movimientos_insumos_crud,
    obtener_movimiento_herramienta_crud,
    obtener_movimiento_insumo_crud,
    obtener_estadisticas_movimientos_crud
)
from app.schemas.movimientos_schema import (
    MovimientoHerramientaResponse,
    MovimientoInsumoResponse,
    MovimientosListResponse
)

router = APIRouter(prefix="/movimientos", tags=["Movimientos de Inventario"])

@router.get("/herramientas", response_model=dict)
def listar_movimientos_herramientas(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    herramienta_id: Optional[int] = None,
    labor_id: Optional[int] = None,
    tipo_movimiento: Optional[str] = Query(None, regex="^(salida|entrada)$"),
    fecha_desde: Optional[datetime] = None,
    fecha_hasta: Optional[datetime] = None,
    db: Session = Depends(get_db),
    usuario = Depends(get_current_user),
    _ = Depends(require_role(["admin", "talento_humano", "docente"]))
):
    """
    Listar movimientos de herramientas con filtros
    """
    return listar_movimientos_herramientas_crud(
        db, skip, limit, herramienta_id, labor_id, tipo_movimiento, fecha_desde, fecha_hasta
    )

@router.get("/insumos", response_model=dict)
def listar_movimientos_insumos(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    insumo_id: Optional[int] = None,
    labor_id: Optional[int] = None,
    tipo_movimiento: Optional[str] = Query(None, regex="^(salida|entrada)$"),
    fecha_desde: Optional[datetime] = None,
    fecha_hasta: Optional[datetime] = None,
    db: Session = Depends(get_db),
    usuario = Depends(get_current_user),
    _ = Depends(require_role(["admin", "talento_humano", "docente"]))
):
    """
    Listar movimientos de insumos con filtros
    """
    return listar_movimientos_insumos_crud(
        db, skip, limit, insumo_id, labor_id, tipo_movimiento, fecha_desde, fecha_hasta
    )

@router.get("/herramientas/{movimiento_id}")
def obtener_movimiento_herramienta(
    movimiento_id: int,
    db: Session = Depends(get_db),
    usuario = Depends(get_current_user),
    _ = Depends(require_role(["admin", "talento_humano", "docente"]))
):
    """
    Obtener un movimiento específico de herramienta
    """
    movimiento = obtener_movimiento_herramienta_crud(db, movimiento_id)
    if not movimiento:
        raise HTTPException(404, "Movimiento de herramienta no encontrado")
    return movimiento

@router.get("/insumos/{movimiento_id}")
def obtener_movimiento_insumo(
    movimiento_id: int,
    db: Session = Depends(get_db),
    usuario = Depends(get_current_user),
    _ = Depends(require_role(["admin", "talento_humano", "docente"]))
):
    """
    Obtener un movimiento específico de insumo
    """
    movimiento = obtener_movimiento_insumo_crud(db, movimiento_id)
    if not movimiento:
        raise HTTPException(404, "Movimiento de insumo no encontrado")
    return movimiento

@router.get("/labor/{labor_id}")
def obtener_movimientos_labor(
    labor_id: int,
    db: Session = Depends(get_db),
    usuario = Depends(get_current_user)
):
    """
    Obtener todos los movimientos de una labor específica
    """
    movimientos_herramientas = listar_movimientos_herramientas_crud(db, labor_id=labor_id, limit=1000)
    movimientos_insumos = listar_movimientos_insumos_crud(db, labor_id=labor_id, limit=1000)
    
    return {
        "herramientas": movimientos_herramientas,
        "insumos": movimientos_insumos
    }

@router.get("/estadisticas/resumen")
def obtener_estadisticas_movimientos(
    dias: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db),
    usuario = Depends(get_current_user),
    _ = Depends(require_role(["admin", "talento_humano"]))
):
    """
    Obtener estadísticas de movimientos en un período
    """
    return obtener_estadisticas_movimientos_crud(db, dias)