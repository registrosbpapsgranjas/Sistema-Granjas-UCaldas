from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.database import get_db
from app.core.dependencies import require_any_role, get_current_user
from app.CRUD.labores import (
    crear_labor_crud, listar_labores_crud, obtener_labor_objeto, 
    obtener_labor_dict, actualizar_labor_crud, eliminar_labor_crud,
    asignar_herramienta_crud, asignar_insumo_crud, registrar_avance_crud,
    completar_labor_crud, devolver_herramienta_crud, listar_labores_por_trabajador,
    listar_labores_por_recomendacion, obtener_estadisticas_labores_crud
)
from app.schemas.labor_schema import (
    LaborCreate, LaborUpdate, LaborResponse, LaborListResponse,
    LaborWithRecursosResponse, AsignacionHerramientaRequest,
    AsignacionInsumoRequest, RegistroAvanceRequest,
    EstadisticasLaboresResponse
)

router = APIRouter(prefix="/labores", tags=["Labores"])

@router.post("/", response_model=LaborResponse)
def crear_labor(
    data: LaborCreate,
    db: Session = Depends(get_db),
    usuario = Depends(get_current_user),
    _ = Depends(require_any_role(["admin", "talento_humano"]))
):
    """
    Crear una nueva labor
    Ahora incluye tipo_labor_id (ya validado en el CRUD).
    """
    return crear_labor_crud(db, data, usuario)


@router.get("/", response_model=LaborListResponse)
def listar_labores(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    estado: Optional[str] = None,
    trabajador_id: Optional[int] = None,
    lote_id: Optional[int] = None,
    recomendacion_id: Optional[int] = None,
    tipo_labor_id: Optional[int] = None,  # ✅ AGREGADO: Filtro por tipo de labor
    db: Session = Depends(get_db),
    usuario = Depends(require_any_role(["admin", "talento_humano", "estudiante", "docente", "asesor"]))
):
    """Listar labores con filtros"""
    return listar_labores_crud(
        db, skip, limit, estado, trabajador_id, lote_id, recomendacion_id, tipo_labor_id, usuario
    )


@router.get("/{id}", response_model=LaborWithRecursosResponse)
def obtener_labor(
    id: int,
    db: Session = Depends(get_db),
    usuario = Depends(get_current_user)
):
    """
    Obtener una labor con sus recursos asignados.
    Incluye tipo_labor_nombre y tipo_labor_descripcion si el CRUD las carga.
    """
    labor = obtener_labor_dict(db, id, usuario)  # Usar obtener_labor_dict para respuesta
    if not labor:
        raise HTTPException(404, "Labor no encontrada")
    return labor


@router.put("/{id}", response_model=LaborResponse)
def actualizar_labor(
    id: int,
    data: LaborUpdate,
    db: Session = Depends(get_db),
    usuario = Depends(require_any_role(["admin", "talento_humano", "trabajador"]))
):
    """
    Actualizar una labor.
    Ahora soporta actualizar tipo_labor_id si es enviado.
    """
    labor = obtener_labor_objeto(db, id, usuario)  # Usar obtener_labor_objeto para actualizar
    if not labor:
        raise HTTPException(404, "Labor no encontrada")
    return actualizar_labor_crud(db, labor, data, usuario)


@router.delete("/{id}")
def eliminar_labor(
    id: int,
    db: Session = Depends(get_db),
    usuario = Depends(get_current_user),
    _ = Depends(require_any_role(["admin", "talento_humano", "trabajador"]))
):
    """Eliminar una labor"""
    labor = obtener_labor_objeto(db, id, usuario)  # Usar obtener_labor_objeto para eliminar
    if not labor:
        raise HTTPException(404, "Labor no encontrada")
    eliminar_labor_crud(db, labor, usuario)
    return {"message": "✅ Labor eliminada correctamente"}


# === ASIGNACIÓN DE RECURSOS ===

@router.post("/{id}/asignar-herramienta", response_model=LaborWithRecursosResponse)
def asignar_herramienta(
    id: int,
    data: AsignacionHerramientaRequest,
    db: Session = Depends(get_db),
    usuario = Depends(get_current_user),
    _ = Depends(require_any_role(["admin", "talento_humano", "trabajador"]))
):
    labor = obtener_labor_objeto(db, id, usuario)  # Usar obtener_labor_objeto
    if not labor:
        raise HTTPException(404, "Labor no encontrada")
    return asignar_herramienta_crud(db, labor, data, usuario)


@router.post("/{id}/asignar-insumo", response_model=LaborWithRecursosResponse)
def asignar_insumo(
    id: int,
    data: AsignacionInsumoRequest,
    db: Session = Depends(get_db),
    usuario = Depends(get_current_user),
    _ = Depends(require_any_role(["admin", "talento_humano", "trabajador"]))
):
    labor = obtener_labor_objeto(db, id, usuario)  # Usar obtener_labor_objeto
    if not labor:
        raise HTTPException(404, "Labor no encontrada")
    return asignar_insumo_crud(db, labor, data, usuario)


@router.post("/{id}/registrar-avance", response_model=LaborResponse)
def registrar_avance(
    id: int,
    data: RegistroAvanceRequest,
    db: Session = Depends(get_db),
    usuario = Depends(get_current_user)
):
    labor = obtener_labor_objeto(db, id, usuario)  # Usar obtener_labor_objeto
    if not labor:
        raise HTTPException(404, "Labor no encontrada")
    return registrar_avance_crud(db, labor, data, usuario)


@router.post("/{id}/completar", response_model=LaborResponse)
def completar_labor(
    id: int,
    db: Session = Depends(get_db),
    usuario = Depends(require_any_role(["admin", "talento_humano", "trabajador"]))
):
    labor = obtener_labor_objeto(db, id, usuario)  # Usar obtener_labor_objeto
    if not labor:
        raise HTTPException(404, "Labor no encontrada")
    return completar_labor_crud(db, labor, usuario)


@router.post("/{id}/devolver-herramienta/{movimiento_id}")
def devolver_herramienta(
    id: int,
    movimiento_id: int,
    cantidad: int = Query(..., gt=0),
    db: Session = Depends(get_db),
    usuario = Depends(require_any_role(["admin", "talento_humano", "trabajador"]))
):
    labor = obtener_labor_objeto(db, id, usuario)  # Usar obtener_labor_objeto
    if not labor:
        raise HTTPException(404, "Labor no encontrada")
    return devolver_herramienta_crud(db, labor, movimiento_id, cantidad, usuario)

@router.post("/{id}/devolver-insumo/{movimiento_id}")
def devolver_insumo(
    id: int,
    movimiento_id: int,
    cantidad: float = Query(..., gt=0),
    db: Session = Depends(get_db),
    usuario = Depends(require_any_role(["admin", "talento_humano", "trabajador"]))
):
    labor = obtener_labor_objeto(db, id, usuario)
    if not labor:
        raise HTTPException(404, "Labor no encontrada")
    return devolver_insumo(db, labor, movimiento_id, cantidad, usuario)


# === ENDPOINTS ADICIONALES ===
@router.get("/trabajador/mis-labores", response_model=LaborListResponse)  # ✅ Schema correcto
def listar_labores_trabajador(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    estado: Optional[str] = None,
    db: Session = Depends(get_db),
    usuario = Depends(require_any_role(["admin", "talento_humano", "trabajador"]))
):
    if usuario.rol.nombre not in ["trabajador", "admin"]:
        raise HTTPException(403, "Solo disponible para trabajadores")
    
    return listar_labores_por_trabajador(db, usuario.id, skip, limit, estado, usuario)


@router.get("/recomendacion/{recomendacion_id}", response_model=LaborListResponse)
def listar_labores_recomendacion(
    recomendacion_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    usuario = Depends(get_current_user)
):
    return listar_labores_por_recomendacion(db, recomendacion_id, skip, limit, usuario)


@router.get("/estadisticas/resumen", response_model=EstadisticasLaboresResponse)
def obtener_estadisticas_labores(
    db: Session = Depends(get_db),
    usuario = Depends(get_current_user),
    _ = Depends(require_any_role(["admin", "talento_humano", "trabajador"]))
):
    return obtener_estadisticas_labores_crud(db, usuario)