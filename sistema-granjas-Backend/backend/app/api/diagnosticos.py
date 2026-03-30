from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from app.db.database import get_db
from app.db.models import Diagnostico, Usuario, Lote, Programa, Monitoreo, Recomendacion
from app.schemas.diagnostico_schema import (
    DiagnosticoCreate, DiagnosticoUpdate,
    DiagnosticoResponse, DiagnosticoWithRecomendacionesResponse,
    DiagnosticoListResponse, EstadisticasDiagnosticosResponse,
)
from app.core.dependencies import get_current_user, require_any_role
from app.CRUD import diagnosticos as crud

router = APIRouter(prefix="/diagnosticos", tags=["diagnosticos"])


# ── Helper ────────────────────────────────────────────────────────────────────
def get_or_404(db: Session, model, id: int, msg: str = "Recurso no encontrado"):
    obj = db.get(model, id)
    if not obj:
        raise HTTPException(404, msg)
    return obj


def _enriquecer(obj: Diagnostico) -> None:
    """Añade campos calculados al objeto Diagnostico antes de serializar."""
    obj.programa_nombre       = obj.programa.nombre if obj.programa else None
    obj.tipo_monitoreo_nombre = obj.tipo_monitoreo.nombre if obj.tipo_monitoreo else None
    obj.lote_nombre           = obj.lote.nombre if obj.lote else None
    obj.granja_nombre         = getattr(obj.lote.granja, "nombre", None) if obj.lote else None
    obj.usuario_nombre        = obj.usuario.nombre if obj.usuario else None


# ── LISTAR ────────────────────────────────────────────────────────────────────
@router.get("/", response_model=DiagnosticoListResponse)
def listar_diagnosticos(
    skip:             int = 0,
    limit:            int = 100,
    programa_id:      Optional[int] = None,
    tipo_monitoreo_id: Optional[int] = None,
    lote_id:          Optional[int] = None,
    usuario_id:       Optional[int] = None,
    tipo_diagnostico: Optional[str] = None,
    db:   Session = Depends(get_db),
    user: Usuario = Depends(require_any_role(["admin", "docente", "asesor", "estudiante"]))
):
    query = db.query(Diagnostico)

    # Estudiantes solo ven sus propios diagnósticos
    if user.rol.nombre == "estudiante":
        query = query.filter(Diagnostico.usuario_id == user.id)

    # Filtros opcionales
    if programa_id:
        query = query.filter(Diagnostico.programa_id == programa_id)
    if tipo_monitoreo_id:
        query = query.filter(Diagnostico.tipo_monitoreo_id == tipo_monitoreo_id)
    if lote_id:
        query = query.filter(Diagnostico.lote_id == lote_id)
    if usuario_id and user.rol.nombre in ["admin", "docente", "asesor"]:
        query = query.filter(Diagnostico.usuario_id == usuario_id)
    if tipo_diagnostico:
        query = query.filter(Diagnostico.tipo_diagnostico == tipo_diagnostico)

    total = query.count()
    items = query.order_by(Diagnostico.fecha_creacion.desc()).offset(skip).limit(limit).all()

    for d in items:
        _enriquecer(d)

    return DiagnosticoListResponse(
        items=items,
        total=total,
        paginas=(total + limit - 1) // limit
    )


# ── CREAR ─────────────────────────────────────────────────────────────────────
@router.post("/", response_model=DiagnosticoResponse, status_code=201)
def crear_diagnostico(
    data: DiagnosticoCreate,
    db:   Session = Depends(get_db),
    user: Usuario = Depends(require_any_role(["admin", "docente", "asesor", "estudiante"]))
):
    # Estudiante solo puede crear diagnósticos para sí mismo
    if user.rol.nombre == "estudiante" and data.usuario_id != user.id:
        raise HTTPException(403, "Solo puede crear diagnósticos para su propio usuario")

    # Validar existencia de FK
    get_or_404(db, Programa,  data.programa_id,       "Programa no encontrado")
    get_or_404(db, Monitoreo, data.tipo_monitoreo_id,  "Tipo de monitoreo no encontrado")
    get_or_404(db, Lote,      data.lote_id,            "Lote no encontrado")
    get_or_404(db, Usuario,   data.usuario_id,         "Usuario no encontrado")

    # ✅ CORREGIDO
    obj = crud.create_diagnostico(db, data)

    _enriquecer(obj)
    return obj


# ── OBTENER UNO ───────────────────────────────────────────────────────────────
@router.get("/{id}", response_model=DiagnosticoWithRecomendacionesResponse)
def obtener_diagnostico(
    id: int,
    db:   Session = Depends(get_db),
    user: Usuario = Depends(get_current_user)
):
    obj = get_or_404(db, Diagnostico, id)

    if user.rol.nombre == "estudiante" and obj.usuario_id != user.id:
        raise HTTPException(403, "No puede ver este diagnóstico")

    _enriquecer(obj)
    obj.recomendaciones = db.query(Recomendacion).filter_by(diagnostico_id=id).all()
    return obj


# ── ACTUALIZAR ────────────────────────────────────────────────────────────────
@router.put("/{id}", response_model=DiagnosticoResponse)
def actualizar_diagnostico(
    id:   int,
    data: DiagnosticoUpdate,
    db:   Session = Depends(get_db),
    user: Usuario = Depends(get_current_user)
):
    obj = get_or_404(db, Diagnostico, id)

    if user.rol.nombre == "estudiante" and obj.usuario_id != user.id:
        raise HTTPException(403, "No tiene permisos para editar este diagnóstico")

    # ✅ CORREGIDO
    obj = crud.update_diagnostico(db, obj, data)

    _enriquecer(obj)
    return obj


# ── ELIMINAR ──────────────────────────────────────────────────────────────────
@router.delete("/{id}", status_code=200)
def eliminar_diagnostico(
    id: int,
    db:   Session = Depends(get_db),
    user: Usuario = Depends(require_any_role(["admin", "docente", "asesor"]))
):
    obj = get_or_404(db, Diagnostico, id)

    if obj.recomendaciones:
        raise HTTPException(400, "No se puede eliminar un diagnóstico con recomendaciones asociadas")

    # ✅ CORREGIDO
    crud.delete_diagnostico(db, obj)

    return {"message": "Diagnóstico eliminado correctamente"}


# ── ESTADÍSTICAS ──────────────────────────────────────────────────────────────
@router.get("/estadisticas/resumen", response_model=EstadisticasDiagnosticosResponse)
def obtener_estadisticas(
    programa_id: Optional[int] = None,
    db:   Session = Depends(get_db),
    user: Usuario = Depends(require_any_role(["admin", "docente", "asesor", "estudiante"]))
):
    query = db.query(Diagnostico)

    if user.rol.nombre == "estudiante":
        query = query.filter(Diagnostico.usuario_id == user.id)
    if programa_id:
        query = query.filter(Diagnostico.programa_id == programa_id)

    total = query.count()

    por_tipo: dict = {}
    for row in db.query(Diagnostico.tipo_diagnostico).distinct():
        t = row[0]
        if t:
            por_tipo[t] = query.filter(Diagnostico.tipo_diagnostico == t).count()

    por_lote: dict = {}
    for d in query.all():
        nombre_lote = d.lote.nombre if d.lote else f"lote_{d.lote_id}"
        por_lote[nombre_lote] = por_lote.get(nombre_lote, 0) + 1

    return EstadisticasDiagnosticosResponse(
        total=total,
        por_tipo=por_tipo,
        por_lote=por_lote,
    )