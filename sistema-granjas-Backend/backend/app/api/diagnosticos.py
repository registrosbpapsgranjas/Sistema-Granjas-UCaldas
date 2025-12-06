from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime
from app.db.database import get_db
from app.db.models import Diagnostico, Usuario, Lote, Recomendacion
from app.schemas.diagnostico_schema import (
    DiagnosticoCreate, DiagnosticoUpdate, DiagnosticoResponse,
    DiagnosticoWithRecomendacionesResponse, DiagnosticoListResponse,
    AsignacionDocenteRequest, CierreDiagnosticoRequest,
    EstadisticasDiagnosticosResponse
)
from app.core.dependencies import get_current_user, require_role

router = APIRouter(prefix="/diagnosticos", tags=["diagnosticos"])


# === Helper ===
def get_or_404(db, model, id, msg="Recurso no encontrado"):
    obj = db.get(model, id)
    if not obj:
        raise HTTPException(404, msg)
    return obj


# === LISTAR ===
@router.get("/", response_model=DiagnosticoListResponse)
def listar_diagnosticos(
    skip: int = 0,
    limit: int = 100,
    estado: Optional[str] = None,
    tipo: Optional[str] = None,
    lote_id: Optional[int] = None,
    estudiante_id: Optional[int] = None,
    docente_id: Optional[int] = None,
    db: Session = Depends(get_db),
    user: Usuario = Depends(get_current_user)
):
    query = db.query(Diagnostico)

    # Permisos por rol
    rol = user.rol.nombre
    if rol == "estudiante":
        query = query.filter(Diagnostico.estudiante_id == user.id)
    elif rol == "docente":
        query = query.filter(
            (Diagnostico.docente_id == user.id) |
            (Diagnostico.estado == "abierto")
        )

    # Filtros opcionales
    if estado:
        query = query.filter(Diagnostico.estado == estado)
    if tipo:
        query = query.filter(Diagnostico.tipo == tipo)
    if lote_id:
        query = query.filter(Diagnostico.lote_id == lote_id)
    if estudiante_id and rol in ["docente", "admin"]:
        query = query.filter(Diagnostico.estudiante_id == estudiante_id)
    if docente_id and rol in ["docente", "admin"]:
        query = query.filter(Diagnostico.docente_id == docente_id)

    total = query.count()
    items = query.offset(skip).limit(limit).all()

    for d in items:
        _cargar_relaciones(d)

    return DiagnosticoListResponse(
        items=items,
        total=total,
        paginas=(total + limit - 1) // limit
    )


# === CREAR ===
@router.post("/", response_model=DiagnosticoResponse, status_code=201)
def crear_diagnostico(
    data: DiagnosticoCreate,
    db: Session = Depends(get_db),
    user: Usuario = Depends(require_role(["estudiante", "docente", "admin"]))
):
    # Estudiante solo puede crearse diagnósticos a si mismo
    if user.rol.nombre == "estudiante" and data.estudiante_id != user.id:
        raise HTTPException(403, "Solo puede crear diagnósticos para su propio usuario")

    get_or_404(db, Usuario, data.estudiante_id, "Estudiante no encontrado")
    get_or_404(db, Lote, data.lote_id, "Lote no encontrado")

    # Validación del docente (si lo envían)
    if data.docente_id:
        docente = get_or_404(db, Usuario, data.docente_id, "Docente no encontrado")
        if docente.rol.nombre not in ["docente", "asesor"]:
            raise HTTPException(400, "El usuario asignado no es docente ó asesor")

    # Crear
    obj = Diagnostico(**data.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)

    _cargar_relaciones(obj)
    return obj


# === OBTENER UNO ===
@router.get("/{id}", response_model=DiagnosticoWithRecomendacionesResponse)
def obtener_diagnostico(
    id: int,
    db: Session = Depends(get_db),
    user: Usuario = Depends(get_current_user)
):
    obj = get_or_404(db, Diagnostico, id)

    _check_view_permission(obj, user)
    _cargar_relaciones(obj)

    obj.recomendaciones = db.query(Recomendacion).filter_by(diagnostico_id=id).all()
    return obj


# === ACTUALIZAR ===
@router.put("/{id}", response_model=DiagnosticoResponse)
def actualizar_diagnostico(
    id: int,
    data: DiagnosticoUpdate,
    db: Session = Depends(get_db),
    user: Usuario = Depends(get_current_user)
):
    obj = get_or_404(db, Diagnostico, id)

    _check_edit_permission(obj, user, data)

    # Validar docente si se está asignando
    if data.docente_id:
        docente = get_or_404(db, Usuario, data.docente_id)
        if docente.rol.nombre not in ["docente", "asesor"]:
            raise HTTPException(400, "Usuario asignado no es docente")

    update_data = data.dict(exclude_unset=True)

    # Cerrar diagnóstico → asignar fecha_revision
    if update_data.get("estado") == "cerrado":
        update_data["fecha_revision"] = datetime.utcnow()

    for k, v in update_data.items():
        setattr(obj, k, v)

    db.commit()
    db.refresh(obj)

    _cargar_relaciones(obj)
    return obj


# === ELIMINAR ===
@router.delete("/{id}", status_code=200)
def eliminar_diagnostico(
    id: int,
    db: Session = Depends(get_db),
    user: Usuario = Depends(require_role(["admin"]))
):
    obj = get_or_404(db, Diagnostico, id)

    if obj.recomendaciones:
        raise HTTPException(400, "No se puede eliminar un diagnóstico con recomendaciones")

    db.delete(obj)
    db.commit()
    return {"message": "Diagnóstico eliminado correctamente"}


# === ASIGNAR DOCENTE ===
@router.post("/{id}/asignar-docente", response_model=DiagnosticoResponse)
def asignar_docente(
    id: int,
    data: AsignacionDocenteRequest,
    db: Session = Depends(get_db),
    user: Usuario = Depends(require_role(["docente", "admin"]))
):
    obj = get_or_404(db, Diagnostico, id)

    docente = get_or_404(db, Usuario, data.docente_id)
    if docente.rol.nombre not in ["docente", "asesor"]:
        raise HTTPException(400, "El usuario asignado no es docente ó asesor")

    # Docente solo se asigna a si mismo
    if docente.rol.nombre not in ["docente", "asesor"] and docente.id != user.id:
        raise HTTPException(403, "Solo puede auto-asignarse diagnósticos")


    obj.docente_id = docente.id
    obj.estado = "en_revision"

    db.commit()
    db.refresh(obj)
    _cargar_relaciones(obj)
    return obj


# === CERRAR ===
@router.post("/{id}/cerrar", response_model=DiagnosticoResponse)
def cerrar_diagnostico(
    id: int,
    data: CierreDiagnosticoRequest,
    db: Session = Depends(get_db),
    user: Usuario = Depends(require_role(["docente", "admin"]))
):
    obj = get_or_404(db, Diagnostico, id)

    if not obj.docente_id:
        raise HTTPException(400, "No se puede cerrar sin docente asignado")

    # Docente solo cierra si es el asignado
    if docente.rol.nombre not in ["docente", "asesor"] and obj.docente_id != user.id:
        raise HTTPException(403, "Solo el docente asignado puede cerrar el diagnóstico")

    obj.estado = "cerrado"
    obj.observaciones = data.observaciones
    obj.fecha_revision = datetime.utcnow()

    db.commit()
    db.refresh(obj)
    _cargar_relaciones(obj)
    return obj


# === ESTADÍSTICAS ===
@router.get("/estadisticas/resumen", response_model=EstadisticasDiagnosticosResponse)
def obtener_estadisticas(
    db: Session = Depends(get_db),
    user: Usuario = Depends(require_role(["docente", "admin"]))
):
    query = db.query(Diagnostico)

    if docente.rol.nombre not in ["docente", "asesor"]:
        query = query.filter(Diagnostico.docente_id == user.id)

    total = query.count()

    estados = ["abierto", "en_revision", "cerrado"]
    stats = {s: query.filter(Diagnostico.estado == s).count() for s in estados}

    tipos = {t[0]: query.filter(Diagnostico.tipo == t[0]).count()
             for t in db.query(Diagnostico.tipo).distinct()
             if t[0]}

    return EstadisticasDiagnosticosResponse(
        total=total,
        abiertos=stats["abierto"],
        en_revision=stats["en_revision"],
        cerrados=stats["cerrado"],
        por_tipo=tipos
    )


# === PERMISOS ===
def _check_view_permission(obj: Diagnostico, user: Usuario):
    rol = user.rol.nombre

    if rol == "admin":
        return
    if rol == "docente" and (obj.docente_id == user.id or obj.estado == "abierto"):
        return
    if rol == "estudiante" and obj.estudiante_id == user.id:
        return

    raise HTTPException(403, "No puede ver este diagnóstico")


def _check_edit_permission(obj: Diagnostico, user: Usuario, data: DiagnosticoUpdate):
    rol = user.rol.nombre
    fields = set(data.dict(exclude_unset=True).keys())
    
    # ✅ admin tiene acceso completo a todo
    if rol == "admin":
        return

    # ✅ Docente solo puede editar diagnósticos asignados a él
    if rol in  ["docente", "asesor"] and obj.docente_id == user.id:
        if not fields.issubset({"estado", "observaciones"}):
            raise HTTPException(403, "Docente solo puede editar estado u observaciones")
        return

    # ✅ Estudiante solo puede editar sus diagnósticos abiertos
    if rol == "estudiante" and obj.estado == "abierto" and obj.estudiante_id == user.id:
        if not fields.issubset({"descripcion"}):
            raise HTTPException(403, "Estudiante solo puede editar descripción")
        return

    # ❌ Si no cumple ninguna condición anterior
    raise HTTPException(403, "No tiene permisos para editar este diagnóstico")

# === RELACIONES ===
def _cargar_relaciones(obj: Diagnostico):
    obj.estudiante_nombre = obj.estudiante.nombre if obj.estudiante else None
    obj.docente_nombre = obj.docente.nombre if obj.docente else None
    if obj.lote:
        obj.lote_nombre = obj.lote.nombre
        obj.granja_nombre = getattr(obj.lote.granja, "nombre", None)
        obj.programa_nombre = getattr(obj.lote.programa, "nombre", None)
