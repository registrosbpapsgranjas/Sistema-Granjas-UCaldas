import os
import json
import re
import logging
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta

from app.db.database import get_db
from app.db.models import (
    Diagnostico, Usuario, Lote, Programa, Monitoreo, Recomendacion,
    Planta, diagnostico_planta
)
from app.schemas.diagnostico_schema import (
    DiagnosticoCreate, DiagnosticoUpdate,
    DiagnosticoResponse, DiagnosticoWithRecomendacionesResponse,
    DiagnosticoListResponse, EstadisticasDiagnosticosResponse,
    PlantaSimpleResponse, GenerarPlantasRequest, GenerarPlantasResponse,
    PlantaGenerada
)
from app.core.dependencies import get_current_user, require_any_role
from app.core.r2_storage import upload_file_to_r2, delete_file_from_r2
from app.CRUD import diagnosticos as crud

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/diagnosticos", tags=["diagnosticos"])


# ── Procesamiento de archivos con R2 ───────────────────────────────────────────
def procesar_archivos_r2(form_data) -> Dict[str, List[str]]:
    fotos_por_prefix: Dict[str, List[str]] = {}
    for key, value in form_data.items():
        if key.startswith("files[") and hasattr(value, "filename"):
            match = re.search(r'files\[(.*?)\]', key)
            if match:
                prefix = match.group(1)
                url = upload_file_to_r2(value, prefix)
                fotos_por_prefix.setdefault(prefix, []).append(url)
                logger.info(f"Archivo subido: {url}")
    return fotos_por_prefix


# ── Helpers ────────────────────────────────────────────────────────────────────
def get_or_404(db: Session, model, id: int, msg: str = "Recurso no encontrado"):
    obj = db.get(model, id)
    if not obj:
        raise HTTPException(404, msg)
    return obj


def _enriquecer(obj: Diagnostico) -> None:
    obj.programa_nombre = obj.programa.nombre if obj.programa else None
    obj.tipo_monitoreo_nombre = obj.tipo_monitoreo.nombre if obj.tipo_monitoreo else None
    obj.lote_nombre = obj.lote.nombre if obj.lote else None
    obj.granja_nombre = getattr(obj.lote.granja, "nombre", None) if obj.lote else None
    obj.usuario_nombre = obj.usuario.nombre if obj.usuario else None


def _cargar_plantas(db: Session, diagnostico: Diagnostico) -> List[PlantaSimpleResponse]:
    plantas = db.query(Planta).join(
        diagnostico_planta,
        diagnostico_planta.c.planta_id == Planta.id
    ).filter(
        diagnostico_planta.c.diagnostico_id == diagnostico.id
    ).all()
    return [PlantaSimpleResponse(
        id=p.id,
        codigo=p.codigo,
        surco=p.surco,
        numero=p.numero,
        lote_id=p.lote_id
    ) for p in plantas]


# ── NUEVO ENDPOINT: GENERAR PLANTAS ALEATORIAS ──────────────────────────────
@router.post("/generar-plantas", response_model=GenerarPlantasResponse)
def generar_plantas_aleatorias(
    data: GenerarPlantasRequest,
    db: Session = Depends(get_db),
    user: Usuario = Depends(require_any_role(["admin", "docente", "asesor", "estudiante"]))
):
    lote = db.query(Lote).filter(Lote.id == data.lote_id).first()
    if not lote:
        raise HTTPException(404, "Lote no encontrado")

    hace_un_mes = datetime.utcnow() - timedelta(days=30)

    subquery = db.query(diagnostico_planta.c.planta_id).join(
        Diagnostico, Diagnostico.id == diagnostico_planta.c.diagnostico_id
    ).filter(
        Diagnostico.tipo_diagnostico == data.tipo_diagnostico,
        Diagnostico.fecha_creacion >= hace_un_mes
    ).subquery()

    query = db.query(Planta).filter(
        Planta.lote_id == data.lote_id,
        Planta.estado == "productivo",
        ~Planta.id.in_(subquery)
    )

    total_plantas_lote = db.query(Planta).filter(Planta.lote_id == data.lote_id).count()
    productivas = db.query(Planta).filter(Planta.lote_id == data.lote_id, Planta.estado == "productivo").count()
    elegibles = query.count()

    plantas_elegibles = query.order_by(func.random()).limit(data.cantidad).all()

    advertencias = []
    if elegibles < data.cantidad:
        advertencias.append(f"Solo se encontraron {elegibles} plantas que cumplen los criterios. Se generarán {len(plantas_elegibles)}.")
    if productivas == 0:
        advertencias.append("No hay plantas productivas en este lote.")
    elif elegibles == 0 and productivas > 0:
        advertencias.append("Todas las plantas productivas ya han sido evaluadas con este diagnóstico en el último mes.")

    return GenerarPlantasResponse(
        plantas=[PlantaGenerada(id=p.id, codigo=p.codigo, surco=p.surco, numero=p.numero, lote_id=p.lote_id) for p in plantas_elegibles],
        total_plantas_lote=total_plantas_lote,
        productivas=productivas,
        elegibles=elegibles,
        advertencias=advertencias
    )


# ── ENDPOINTS CRUD ──────────────────────────────────────────────────────────────
@router.get("/", response_model=DiagnosticoListResponse)
def listar_diagnosticos(
    skip: int = 0, limit: int = 100,
    programa_id: Optional[int] = None,
    tipo_monitoreo_id: Optional[int] = None,
    lote_id: Optional[int] = None,
    usuario_id: Optional[int] = None,
    tipo_diagnostico: Optional[str] = None,
    db: Session = Depends(get_db),
    user: Usuario = Depends(require_any_role(["admin", "docente", "asesor", "estudiante"]))
):
    query = db.query(Diagnostico)
    if user.rol.nombre == "estudiante":
        query = query.filter(Diagnostico.usuario_id == user.id)
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
    return DiagnosticoListResponse(items=items, total=total, paginas=(total + limit - 1) // limit)


@router.post("/", response_model=DiagnosticoResponse, status_code=201)
async def crear_diagnostico(
    request: Request,
    db: Session = Depends(get_db),
    user: Usuario = Depends(require_any_role(["admin", "docente", "asesor", "estudiante"]))
):
    form_data = await request.form()
    logger.info(f"Creando diagnóstico. Campos recibidos: {list(form_data.keys())}")

    def get_required(nombre: str) -> str:
        valor = form_data.get(nombre)
        if valor is None:
            raise HTTPException(400, f"Campo requerido '{nombre}' no enviado")
        return valor

    try:
        programa_id = int(get_required("programa_id"))
        tipo_monitoreo_id = int(get_required("tipo_monitoreo_id"))
        lote_id = int(get_required("lote_id"))
        usuario_id = int(get_required("usuario_id"))
        tipo_diagnostico = get_required("tipo_diagnostico")
        condiciones_dia = get_required("condiciones_dia")
        formulario_json = get_required("formulario")
    except ValueError as e:
        raise HTTPException(400, f"Error en tipo de dato: {str(e)}")

    plantas_ids_raw = form_data.get("plantas_ids")
    plantas_ids = None
    if plantas_ids_raw:
        try:
            plantas_ids = json.loads(plantas_ids_raw)
            if not isinstance(plantas_ids, list):
                raise HTTPException(400, "plantas_ids debe ser una lista de enteros")
        except json.JSONDecodeError:
            raise HTTPException(400, "plantas_ids debe ser un JSON válido")

    try:
        formulario = json.loads(formulario_json)
    except json.JSONDecodeError:
        raise HTTPException(400, "El campo 'formulario' debe ser un JSON válido")

    fotos_por_prefix = procesar_archivos_r2(form_data)
    if fotos_por_prefix:
        formulario["fotos_subidas"] = fotos_por_prefix
        logger.info(f"Archivos subidos: {list(fotos_por_prefix.keys())}")

    if user.rol.nombre == "estudiante" and usuario_id != user.id:
        raise HTTPException(403, "Solo puede crear diagnósticos para su propio usuario")

    get_or_404(db, Programa, programa_id, "Programa no encontrado")
    get_or_404(db, Monitoreo, tipo_monitoreo_id, "Tipo de monitoreo no encontrado")
    lote = get_or_404(db, Lote, lote_id, "Lote no encontrado")
    get_or_404(db, Usuario, usuario_id, "Usuario no encontrado")

    if plantas_ids:
        hace_un_mes = datetime.utcnow() - timedelta(days=30)
        subquery = db.query(diagnostico_planta.c.planta_id).join(
            Diagnostico, Diagnostico.id == diagnostico_planta.c.diagnostico_id
        ).filter(
            Diagnostico.tipo_diagnostico == tipo_diagnostico,
            Diagnostico.fecha_creacion >= hace_un_mes
        ).subquery()

        plantas = db.query(Planta).filter(
            Planta.id.in_(plantas_ids),
            Planta.lote_id == lote_id,
            Planta.estado == "productivo",
            ~Planta.id.in_(subquery)
        ).all()

        if len(plantas) != len(plantas_ids):
            raise HTTPException(
                400,
                "Alguna planta no existe, no pertenece al lote, no está productiva o ya fue evaluada con este diagnóstico en el último mes"
            )
    else:
        plantas = []

    data = DiagnosticoCreate(
        programa_id=programa_id,
        tipo_monitoreo_id=tipo_monitoreo_id,
        lote_id=lote_id,
        usuario_id=usuario_id,
        tipo_diagnostico=tipo_diagnostico,
        condiciones_dia=condiciones_dia,
        formulario=formulario,
        plantas_ids=plantas_ids
    )
    obj = crud.create_diagnostico(db, data)

    if plantas_ids:
        obj.plantas = plantas
        db.commit()
        db.refresh(obj)

    _enriquecer(obj)
    obj.plantas = _cargar_plantas(db, obj)
    return obj


@router.get("/{id}", response_model=DiagnosticoWithRecomendacionesResponse)
def obtener_diagnostico(
    id: int,
    db: Session = Depends(get_db),
    user: Usuario = Depends(get_current_user)
):
    obj = get_or_404(db, Diagnostico, id)
    if user.rol.nombre == "estudiante" and obj.usuario_id != user.id:
        raise HTTPException(403, "No puede ver este diagnóstico")
    _enriquecer(obj)
    obj.recomendaciones = db.query(Recomendacion).filter_by(diagnostico_id=id).all()
    obj.plantas = _cargar_plantas(db, obj)
    return obj


@router.put("/{id}", response_model=DiagnosticoResponse)
async def actualizar_diagnostico(
    id: int,
    request: Request,
    db: Session = Depends(get_db),
    user: Usuario = Depends(get_current_user)
):
    obj = get_or_404(db, Diagnostico, id)
    if user.rol.nombre == "estudiante" and obj.usuario_id != user.id:
        raise HTTPException(403, "No tiene permisos para editar este diagnóstico")

    form_data = await request.form()
    update_data = {}

    if "tipo_diagnostico" in form_data:
        update_data["tipo_diagnostico"] = form_data["tipo_diagnostico"]
    if "condiciones_dia" in form_data:
        update_data["condiciones_dia"] = form_data["condiciones_dia"]
    if "formulario" in form_data:
        try:
            formulario_nuevo = json.loads(form_data["formulario"])
            update_data["formulario"] = formulario_nuevo
        except json.JSONDecodeError:
            raise HTTPException(400, "El campo 'formulario' debe ser JSON válido")

    plantas_ids_raw = form_data.get("plantas_ids")
    plantas_ids = None
    if plantas_ids_raw:
        try:
            plantas_ids = json.loads(plantas_ids_raw)
            if not isinstance(plantas_ids, list):
                raise HTTPException(400, "plantas_ids debe ser una lista de enteros")
            update_data["plantas_ids"] = plantas_ids
        except json.JSONDecodeError:
            raise HTTPException(400, "plantas_ids debe ser un JSON válido")

    fotos_por_prefix = procesar_archivos_r2(form_data)
    if fotos_por_prefix:
        formulario_actual = update_data.get("formulario", obj.formulario or {})
        existing = formulario_actual.get("fotos_subidas", {})
        for prefix, urls in fotos_por_prefix.items():
            existing.setdefault(prefix, []).extend(urls)
        formulario_actual["fotos_subidas"] = existing
        update_data["formulario"] = formulario_actual
        logger.info(f"Nuevos archivos añadidos en actualización: {list(fotos_por_prefix.keys())}")

    if plantas_ids:
        hace_un_mes = datetime.utcnow() - timedelta(days=30)
        subquery = db.query(diagnostico_planta.c.planta_id).join(
            Diagnostico, Diagnostico.id == diagnostico_planta.c.diagnostico_id
        ).filter(
            Diagnostico.tipo_diagnostico == obj.tipo_diagnostico,
            Diagnostico.fecha_creacion >= hace_un_mes,
            Diagnostico.id != id
        ).subquery()

        plantas = db.query(Planta).filter(
            Planta.id.in_(plantas_ids),
            Planta.lote_id == obj.lote_id,
            Planta.estado == "productivo",
            ~Planta.id.in_(subquery)
        ).all()

        if len(plantas) != len(plantas_ids):
            raise HTTPException(
                400,
                "Alguna planta no existe, no pertenece al lote, no está productiva o ya fue evaluada con este diagnóstico en el último mes"
            )
    else:
        plantas = []

    if update_data:
        data_update = DiagnosticoUpdate(**update_data)
        obj = crud.update_diagnostico(db, obj, data_update)

        if plantas_ids is not None:
            obj.plantas = plantas
            db.commit()
            db.refresh(obj)

    _enriquecer(obj)
    obj.plantas = _cargar_plantas(db, obj)
    return obj


@router.delete("/{id}", status_code=200)
def eliminar_diagnostico(
    id: int,
    db: Session = Depends(get_db),
    user: Usuario = Depends(require_any_role(["admin", "docente", "asesor"]))
):
    obj = get_or_404(db, Diagnostico, id)
    if obj.recomendaciones:
        raise HTTPException(400, "No se puede eliminar un diagnóstico con recomendaciones asociadas")

    if obj.formulario and "fotos_subidas" in obj.formulario:
        for urls in obj.formulario["fotos_subidas"].values():
            for url in urls:
                delete_file_from_r2(url)
        logger.info(f"Archivos eliminados de R2 para diagnóstico {id}")

    crud.delete_diagnostico(db, obj)
    return {"message": "Diagnóstico eliminado correctamente"}


@router.get("/mapa/{lote_id}")
def obtener_datos_mapa(
    lote_id: int,
    db: Session = Depends(get_db),
    user: Usuario = Depends(require_any_role(["admin", "docente", "asesor", "estudiante", "trabajador", "talento_humano"]))
):
    """Retorna datos de diagnósticos agregados por planta para colorear el mapa del lote."""
    diagnosticos = db.query(Diagnostico).filter(Diagnostico.lote_id == lote_id).all()

    plant_data: Dict[int, Dict[str, Any]] = {}

    for diag in diagnosticos:
        formulario = diag.formulario or {}

        # Extraer presión de plagas desde formulario JSON
        presion = "ninguna"
        try:
            articulos = formulario.get("artropodos", {})
            if isinstance(articulos, dict):
                total_plagas = sum(
                    int(v) for v in articulos.values() if str(v).isdigit()
                )
                if total_plagas >= 10:
                    presion = "alta"
                elif total_plagas >= 5:
                    presion = "media"
                elif total_plagas >= 1:
                    presion = "baja"
        except Exception:
            pass

        # Extraer enfermedades
        tiene_enfermedades = False
        try:
            enf = formulario.get("enfermedades", {})
            if isinstance(enf, dict):
                tiene_enfermedades = any(
                    str(v).lower() not in ("0", "false", "no", "", "ninguna")
                    for v in enf.values()
                )
            elif isinstance(enf, list):
                tiene_enfermedades = len(enf) > 0
        except Exception:
            pass

        # Obtener plantas asociadas via pivot
        try:
            rows = db.execute(
                diagnostico_planta.select().where(diagnostico_planta.c.diagnostico_id == diag.id)
            ).fetchall()
            plant_ids = [r[1] for r in rows]
        except Exception:
            plant_ids = []

        for pid in plant_ids:
            if pid not in plant_data:
                plant_data[pid] = {
                    "planta_id": pid,
                    "diagnosticos_count": 0,
                    "ultima_fecha": None,
                    "presion_plagas": "ninguna",
                    "tiene_enfermedades": False,
                }
            d = plant_data[pid]
            d["diagnosticos_count"] += 1
            fecha_str = diag.fecha_creacion.isoformat() if diag.fecha_creacion else None
            if not d["ultima_fecha"] or (fecha_str and fecha_str > d["ultima_fecha"]):
                d["ultima_fecha"] = fecha_str
            prioridad = {"alta": 3, "media": 2, "baja": 1, "ninguna": 0}
            if prioridad.get(presion, 0) > prioridad.get(d["presion_plagas"], 0):
                d["presion_plagas"] = presion
            if tiene_enfermedades:
                d["tiene_enfermedades"] = True

    return {"lote_id": lote_id, "plants": list(plant_data.values())}


@router.get("/estadisticas/resumen", response_model=EstadisticasDiagnosticosResponse)
def obtener_estadisticas(
    programa_id: Optional[int] = None,
    db: Session = Depends(get_db),
    user: Usuario = Depends(require_any_role(["admin", "docente", "asesor", "estudiante"]))
):
    query = db.query(Diagnostico)
    if user.rol.nombre == "estudiante":
        query = query.filter(Diagnostico.usuario_id == user.id)
    if programa_id:
        query = query.filter(Diagnostico.programa_id == programa_id)

    total = query.count()

    # Group by tipo_diagnostico (free string, derived from Monitoreo.nombre)
    por_tipo: Dict[str, int] = {}
    for row in db.query(Diagnostico.tipo_diagnostico).distinct():
        t = row[0]
        if t:
            por_tipo[t] = query.filter(Diagnostico.tipo_diagnostico == t).count()

    # Group by tipo_monitoreo (Monitoreo.nombre) — dynamic per program
    por_monitoreo: Dict[str, int] = {}
    for d in query.all():
        nombre_mon = d.tipo_monitoreo.nombre if d.tipo_monitoreo else f"monitoreo_{d.tipo_monitoreo_id}"
        por_monitoreo[nombre_mon] = por_monitoreo.get(nombre_mon, 0) + 1

    # Group by lote
    por_lote: Dict[str, int] = {}
    for d in query.all():
        nombre_lote = d.lote.nombre if d.lote else f"lote_{d.lote_id}"
        por_lote[nombre_lote] = por_lote.get(nombre_lote, 0) + 1

    # Group by programa
    por_programa: Dict[str, int] = {}
    for d in query.all():
        nombre_prog = d.programa.nombre if d.programa else f"programa_{d.programa_id}"
        por_programa[nombre_prog] = por_programa.get(nombre_prog, 0) + 1

    return EstadisticasDiagnosticosResponse(
        total=total,
        por_tipo=por_tipo,
        por_monitoreo=por_monitoreo,
        por_lote=por_lote,
        por_programa=por_programa
    )