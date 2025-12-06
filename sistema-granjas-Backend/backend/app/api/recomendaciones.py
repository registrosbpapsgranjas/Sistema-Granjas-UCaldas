from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.database import get_db
from app.core.dependencies import require_role, get_current_user
from app.CRUD.recomendaciones import *
from app.schemas.recomendacion_schema import (
    RecomendacionCreate, RecomendacionUpdate, RecomendacionResponse,
    RecomendacionListResponse, AprobacionRecomendacionRequest,
    EstadisticasRecomendacionesResponse, RecomendacionWithLaboresDetalladasResponse
)

router = APIRouter(prefix="/recomendaciones", tags=["Recomendaciones"])

roles_recomendacion = ["admin", "docente", "asesor","estudiante"]

@router.post("/", response_model=RecomendacionResponse)
def crear(
    data: RecomendacionCreate, 
    db: Session = Depends(get_db),
    usuario = Depends(get_current_user),
    _ = Depends(require_role(roles_recomendacion))
):
    return crear_recomendacion(db, data, usuario.id)

@router.get("/", response_model=RecomendacionListResponse)
def listar(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    estado: Optional[str] = None,
    tipo: Optional[str] = None,
    lote_id: Optional[int] = None,
    docente_id: Optional[int] = None,
    db: Session = Depends(get_db),
    usuario = Depends(get_current_user)
):
    return listar_recomendaciones(db, skip, limit, estado, tipo, lote_id, docente_id, usuario)

@router.get("/{id}", response_model=RecomendacionResponse)
def obtener(
    id: int, 
    db: Session = Depends(get_db),
    usuario = Depends(get_current_user)
):
    rec = obtener_recomendacion(db, id, usuario)
    if not rec:
        raise HTTPException(404, "Recomendación no encontrada")
    return rec

@router.put("/{id}", response_model=RecomendacionResponse)
def editar(
    id: int, 
    data: RecomendacionUpdate, 
    db: Session = Depends(get_db),
    usuario = Depends(get_current_user),
    _ = Depends(require_role(roles_recomendacion))
):
    rec = obtener_recomendacion(db, id, usuario)
    if not rec:
        raise HTTPException(404, "Recomendación no encontrada")
    return actualizar_recomendacion(db, rec, data, usuario)

@router.delete("/{id}")
def eliminar(
    id: int, 
    db: Session = Depends(get_db),
    usuario = Depends(get_current_user),
    _ = Depends(require_role(["admin"]))  # Solo admin puede eliminar
):
    rec = obtener_recomendacion(db, id, usuario)
    if not rec:
        raise HTTPException(404, "Recomendación no encontrada")
    eliminar_recomendacion(db, rec, usuario)
    return {"message": "✅ Recomendación eliminada correctamente"}

# === ENDPOINTS ADICIONALES ÚTILES ===

@router.post("/{id}/aprobar", response_model=RecomendacionResponse)
def aprobar_recomendacion(
    id: int,
    data: AprobacionRecomendacionRequest,
    db: Session = Depends(get_db),
    usuario = Depends(get_current_user),
    _ = Depends(require_role(["admin", "docente"]))  # Solo admin puede aprobar
):
    """Aprobar o rechazar una recomendación"""
    return aprobar_recomendacion_crud(db, id, data, usuario)

@router.get("/{id}/labores", response_model=RecomendacionResponse)
def obtener_con_labores(
    id: int,
    db: Session = Depends(get_db),
    usuario = Depends(get_current_user)
):
    """Obtener una recomendación con sus labores asociadas"""
    rec = obtener_recomendacion_con_labores(db, id, usuario)
    if not rec:
        raise HTTPException(404, "Recomendación no encontrada")
    return rec

@router.get("/diagnostico/{diagnostico_id}", response_model=RecomendacionListResponse)
def listar_por_diagnostico(
    diagnostico_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    usuario = Depends(get_current_user)
):
    """Listar recomendaciones por diagnóstico específico"""
    return listar_recomendaciones_por_diagnostico(db, diagnostico_id, skip, limit, usuario)

@router.get("/lote/{lote_id}", response_model=RecomendacionListResponse)
def listar_por_lote(
    lote_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    estado: Optional[str] = None,
    db: Session = Depends(get_db),
    usuario = Depends(get_current_user)
):
    """Listar recomendaciones por lote específico"""
    return listar_recomendaciones_por_lote(db, lote_id, skip, limit, estado, usuario)

@router.get("/estadisticas/resumen", response_model=EstadisticasRecomendacionesResponse)
def obtener_estadisticas(
    db: Session = Depends(get_db),
    usuario = Depends(get_current_user),
    _ = Depends(require_role(["admin", "docente"]))
):
    """Obtener estadísticas de recomendaciones"""
    return obtener_estadisticas_recomendaciones(db, usuario)

@router.get("/{id}/vista-completa", response_model=RecomendacionWithLaboresDetalladasResponse)
def obtener_vista_completa(
    id: int,
    db: Session = Depends(get_db),
    usuario = Depends(get_current_user)
):
    """Obtener recomendación con contexto completo: diagnóstico -> recomendación -> labores"""
    return obtener_recomendacion_vista_completa(db, id, usuario)

@router.get("/usuario/{usuario_id}", response_model=RecomendacionListResponse)
def listar_por_usuario(
    usuario_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    usuario_actual = Depends(get_current_user)
):
    """Listar recomendaciones creadas por un usuario específico"""
    return listar_recomendaciones_por_usuario(db, usuario_id, skip, limit, usuario_actual)