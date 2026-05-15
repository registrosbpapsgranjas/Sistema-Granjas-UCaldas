from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.database import get_db
from app.core.dependencies import require_any_role, get_current_user
from app.CRUD.recomendaciones import (
    crear_recomendacion, listar_recomendaciones, obtener_recomendacion,
    actualizar_recomendacion, eliminar_recomendacion, aprobar_recomendacion_crud,
    obtener_recomendacion_con_labores, listar_recomendaciones_por_diagnostico,
    listar_recomendaciones_por_lote, obtener_estadisticas_recomendaciones,
    listar_recomendaciones_por_usuario, obtener_recomendacion_vista_completa,
    agregar_item_recomendacion, eliminar_item_recomendacion,
    agregar_producto_recomendacion, eliminar_producto_recomendacion, listar_productos_recomendacion
)
from app.schemas.recomendacion_schema import (
    RecomendacionCreate, RecomendacionUpdate, RecomendacionResponse,
    RecomendacionListResponse, AprobacionRecomendacionRequest,
    EstadisticasRecomendacionesResponse, RecomendacionWithLaboresDetalladasResponse,
    RecomendacionItemCreate, RecomendacionItemResponse,
    ProductoRecomendacionCreate, ProductoRecomendacionResponse
)

router = APIRouter(prefix="/recomendaciones", tags=["Recomendaciones"])

roles_recomendacion = ["admin", "docente", "asesor", "estudiante"]


@router.post("/", response_model=RecomendacionResponse)
def crear(
    data: RecomendacionCreate,
    db: Session = Depends(get_db),
    usuario=Depends(get_current_user),
    _=Depends(require_any_role(roles_recomendacion))
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
    programa_id: Optional[int] = None,
    db: Session = Depends(get_db),
    usuario=Depends(get_current_user)
):
    return listar_recomendaciones(db, skip, limit, estado, tipo, lote_id, docente_id, programa_id, usuario)


@router.get("/{id}", response_model=RecomendacionResponse)
def obtener(
    id: int,
    db: Session = Depends(get_db),
    usuario=Depends(get_current_user)
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
    usuario=Depends(get_current_user),
    _=Depends(require_any_role(roles_recomendacion))
):
    rec = obtener_recomendacion(db, id, usuario)
    if not rec:
        raise HTTPException(404, "Recomendación no encontrada")
    return actualizar_recomendacion(db, rec, data, usuario)


@router.delete("/{id}")
def eliminar(
    id: int,
    db: Session = Depends(get_db),
    usuario=Depends(get_current_user),
    _=Depends(require_any_role(["admin"]))
):
    rec = obtener_recomendacion(db, id, usuario)
    if not rec:
        raise HTTPException(404, "Recomendación no encontrada")
    eliminar_recomendacion(db, rec, usuario)
    return {"message": "Recomendación eliminada correctamente"}


@router.post("/{id}/aprobar", response_model=RecomendacionResponse)
def aprobar(
    id: int,
    data: AprobacionRecomendacionRequest,
    db: Session = Depends(get_db),
    usuario=Depends(get_current_user),
    _=Depends(require_any_role(["admin", "docente"]))
):
    return aprobar_recomendacion_crud(db, id, data, usuario)


@router.get("/{id}/labores", response_model=RecomendacionResponse)
def obtener_con_labores(
    id: int,
    db: Session = Depends(get_db),
    usuario=Depends(get_current_user)
):
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
    usuario=Depends(get_current_user)
):
    return listar_recomendaciones_por_diagnostico(db, diagnostico_id, skip, limit, usuario)


@router.get("/lote/{lote_id}", response_model=RecomendacionListResponse)
def listar_por_lote(
    lote_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    estado: Optional[str] = None,
    db: Session = Depends(get_db),
    usuario=Depends(get_current_user)
):
    return listar_recomendaciones_por_lote(db, lote_id, skip, limit, estado, usuario)


@router.get("/estadisticas/resumen", response_model=EstadisticasRecomendacionesResponse)
def obtener_estadisticas(
    db: Session = Depends(get_db),
    usuario=Depends(get_current_user),
    _=Depends(require_any_role(["admin", "docente"]))
):
    return obtener_estadisticas_recomendaciones(db, usuario)


@router.get("/{id}/vista-completa", response_model=RecomendacionWithLaboresDetalladasResponse)
def obtener_vista_completa(
    id: int,
    db: Session = Depends(get_db),
    usuario=Depends(get_current_user)
):
    return obtener_recomendacion_vista_completa(db, id, usuario)


@router.get("/usuario/{usuario_id}", response_model=RecomendacionListResponse)
def listar_por_usuario(
    usuario_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    usuario_actual=Depends(get_current_user)
):
    return listar_recomendaciones_por_usuario(db, usuario_id, skip, limit, usuario_actual)


# ── Items sugeridos de una recomendación ─────────────────────────────────────

@router.post("/{id}/items", response_model=RecomendacionItemResponse)
def agregar_item(
    id: int,
    data: RecomendacionItemCreate,
    db: Session = Depends(get_db),
    usuario=Depends(get_current_user),
    _=Depends(require_any_role(roles_recomendacion))
):
    ri = agregar_item_recomendacion(
        db, id,
        inventario_item_id=data.inventario_item_id,
        cantidad_sugerida=data.cantidad_sugerida,
        descripcion=data.descripcion,
        usuario=usuario
    )
    if ri.inventario_item:
        v = ri.inventario_item.valores or {}
        ri.inventario_item_nombre = v.get("nombre") or v.get("producto") or f"Ítem #{ri.inventario_item_id}"
        ri.inventario_item_unidad = ri.inventario_item.unidad_medida
        ri.inventario_item_disponible = ri.inventario_item.cantidad_disponible
    return ri


@router.delete("/{id}/items/{item_id}")
def eliminar_item(
    id: int,
    item_id: int,
    db: Session = Depends(get_db),
    usuario=Depends(get_current_user),
    _=Depends(require_any_role(roles_recomendacion))
):
    eliminar_item_recomendacion(db, id, item_id, usuario)
    return {"message": "Ítem eliminado correctamente"}


# ── Productos de una recomendación (productos_recomendaciones) ────────────────

@router.get("/{id}/productos", response_model=List[ProductoRecomendacionResponse])
def listar_productos(
    id: int,
    db: Session = Depends(get_db),
    usuario=Depends(get_current_user)
):
    return listar_productos_recomendacion(db, id, usuario)


@router.post("/{id}/productos", response_model=ProductoRecomendacionResponse)
def agregar_producto(
    id: int,
    data: ProductoRecomendacionCreate,
    db: Session = Depends(get_db),
    usuario=Depends(get_current_user),
    _=Depends(require_any_role(roles_recomendacion))
):
    producto = agregar_producto_recomendacion(
        db, id,
        inventario_item_id=data.inventario_item_id,
        cantidad_sugerida=data.cantidad_sugerida,
        descripcion=data.descripcion,
        usuario=usuario
    )
    if producto.inventario_item:
        v = producto.inventario_item.valores or {}
        producto.inventario_item_nombre = v.get("nombre") or v.get("producto") or f"Ítem #{producto.inventario_item_id}"
        producto.inventario_item_unidad = producto.inventario_item.unidad_medida
        producto.inventario_item_disponible = producto.inventario_item.cantidad_disponible
    return producto


@router.delete("/{id}/productos/{producto_id}")
def eliminar_producto(
    id: int,
    producto_id: int,
    db: Session = Depends(get_db),
    usuario=Depends(get_current_user),
    _=Depends(require_any_role(roles_recomendacion))
):
    eliminar_producto_recomendacion(db, id, producto_id, usuario)
    return {"message": "Producto eliminado correctamente"}
