from sqlalchemy.orm import Session
from sqlalchemy import and_
from datetime import datetime
from app.db.models import Recomendacion, Labor, Usuario, Lote, Diagnostico
from app.schemas.recomendacion_schema import RecomendacionCreate, RecomendacionUpdate, AprobacionRecomendacionRequest
from fastapi import HTTPException

def crear_recomendacion(db: Session, data: RecomendacionCreate, usuario_id: int):
    # CORRECCIÓN: Usar docente_id en lugar de usuario_id
    rec = Recomendacion(
        titulo=data.titulo,
        descripcion=data.descripcion,
        tipo=data.tipo,
        estado=data.estado,
        lote_id=data.lote_id,
        diagnostico_id=data.diagnostico_id,
        docente_id=data.docente_id  # ← CORREGIDO
    )
    db.add(rec)
    db.commit()
    db.refresh(rec)
    return rec

def listar_recomendaciones(
    db: Session, 
    skip: int = 0, 
    limit: int = 100,
    estado: str = None,
    tipo: str = None,
    lote_id: int = None,
    docente_id: int = None,
    usuario: Usuario = None
):
    query = db.query(Recomendacion)
    
    # Filtros opcionales
    if estado:
        query = query.filter(Recomendacion.estado == estado)
    if tipo:
        query = query.filter(Recomendacion.tipo == tipo)
    if lote_id:
        query = query.filter(Recomendacion.lote_id == lote_id)
    if docente_id:
        query = query.filter(Recomendacion.docente_id == docente_id)
    
    # Permisos según rol
    if usuario.rol.nombre == "docente":
        query = query.filter(Recomendacion.docente_id == usuario.id)
    # Estudiantes no pueden ver recomendaciones directamente
    
    total = query.count()
    items = query.offset(skip).limit(limit).all()
    
    # Cargar relaciones
    for item in items:
        _cargar_relaciones_recomendacion(item)
    
    return {
        "items": items,
        "total": total,
        "paginas": (total + limit - 1) // limit
    }

def obtener_recomendacion(db: Session, id: int, usuario: Usuario = None):
    rec = db.query(Recomendacion).filter(Recomendacion.id == id).first()
    if rec:
        _cargar_relaciones_recomendacion(rec)
        
        # Verificar permisos
        if usuario and usuario.rol.nombre == "docente" and rec.docente_id != usuario.id:
            return None
            
    return rec

def actualizar_recomendacion(db: Session, recomendacion: Recomendacion, data: RecomendacionUpdate, usuario: Usuario = None):
    # Verificar permisos para docentes
    if usuario and usuario.rol.nombre == "docente" and recomendacion.docente_id != usuario.id:
        raise HTTPException(403, "No puede editar recomendaciones de otros docentes")
    
    update_data = data.dict(exclude_unset=True)
    
    # Si se aprueba, establecer fecha de aprobación
    if update_data.get("estado") == "aprobada" and not recomendacion.fecha_aprobacion:
        update_data["fecha_aprobacion"] = datetime.utcnow()
    
    for attr, value in update_data.items():
        setattr(recomendacion, attr, value)
    
    db.commit()
    db.refresh(recomendacion)
    _cargar_relaciones_recomendacion(recomendacion)
    return recomendacion

def eliminar_recomendacion(db: Session, recomendacion: Recomendacion, usuario: Usuario = None):
    # Verificar que no tenga labores asociadas
    labores_count = db.query(Labor).filter(Labor.recomendacion_id == recomendacion.id).count()
    if labores_count > 0:
        raise HTTPException(400, "No se puede eliminar recomendación con labores asociadas")
    
    db.delete(recomendacion)
    db.commit()

# === FUNCIONES ADICIONALES ÚTILES ===

def aprobar_recomendacion_crud(db: Session, id: int, data: AprobacionRecomendacionRequest, usuario: Usuario):
    rec = obtener_recomendacion(db, id, usuario)
    if not rec:
        raise HTTPException(404, "Recomendación no encontrada")
    
    if data.aprobar:
        rec.estado = "aprobada"
        rec.fecha_aprobacion = datetime.utcnow()
    else:
        rec.estado = "cancelada"
    
    if data.observaciones:
        # Podrías agregar un campo para observaciones de aprobación si lo necesitas
        pass
    
    db.commit()
    db.refresh(rec)
    _cargar_relaciones_recomendacion(rec)
    return rec

def obtener_recomendacion_con_labores(db: Session, id: int, usuario: Usuario):
    rec = db.query(Recomendacion).filter(Recomendacion.id == id).first()
    if rec:
        _cargar_relaciones_recomendacion(rec)
        rec.labores = db.query(Labor).filter(Labor.recomendacion_id == id).all()
        
        # Cargar información de trabajador en cada labor
        for labor in rec.labores:
            if labor.trabajador:
                labor.trabajador_nombre = labor.trabajador.nombre
                
    return rec

def listar_recomendaciones_por_diagnostico(db: Session, diagnostico_id: int, skip: int = 0, limit: int = 100, usuario: Usuario = None):
    query = db.query(Recomendacion).filter(Recomendacion.diagnostico_id == diagnostico_id)
    
    if usuario and usuario.rol.nombre == "docente":
        query = query.filter(Recomendacion.docente_id == usuario.id)
    
    total = query.count()
    items = query.offset(skip).limit(limit).all()
    
    for item in items:
        _cargar_relaciones_recomendacion(item)
    
    return {
        "items": items,
        "total": total,
        "paginas": (total + limit - 1) // limit
    }

def listar_recomendaciones_por_lote(db: Session, lote_id: int, skip: int = 0, limit: int = 100, estado: str = None, usuario: Usuario = None):
    query = db.query(Recomendacion).filter(Recomendacion.lote_id == lote_id)
    
    if estado:
        query = query.filter(Recomendacion.estado == estado)
    
    if usuario and usuario.rol.nombre == "docente":
        query = query.filter(Recomendacion.docente_id == usuario.id)
    
    total = query.count()
    items = query.offset(skip).limit(limit).all()
    
    for item in items:
        _cargar_relaciones_recomendacion(item)
    
    return {
        "items": items,
        "total": total,
        "paginas": (total + limit - 1) // limit
    }

def listar_recomendaciones_por_usuario(db: Session, usuario_id: int, skip: int = 0, limit: int = 100, usuario_actual: Usuario = None):
    # Solo admin puede ver recomendaciones de otros usuarios
    if usuario_actual.rol.nombre != "admin" and usuario_actual.id != usuario_id:
        raise HTTPException(403, "No puede ver recomendaciones de otros usuarios")
    
    query = db.query(Recomendacion).filter(Recomendacion.docente_id == usuario_id)
    total = query.count()
    items = query.offset(skip).limit(limit).all()
    
    for item in items:
        _cargar_relaciones_recomendacion(item)
    
    return {
        "items": items,
        "total": total,
        "paginas": (total + limit - 1) // limit
    }

def obtener_estadisticas_recomendaciones(db: Session, usuario: Usuario):
    query = db.query(Recomendacion)
    
    if usuario.rol.nombre == "docente":
        query = query.filter(Recomendacion.docente_id == usuario.id)
    
    total = query.count()
    
    estados = ["pendiente", "aprobada", "en_ejecucion", "completada", "cancelada"]
    stats = {estado: query.filter(Recomendacion.estado == estado).count() for estado in estados}
    
    # Estadísticas por tipo
    tipos = db.query(Recomendacion.tipo).distinct().all()
    por_tipo = {tipo[0]: query.filter(Recomendacion.tipo == tipo[0]).count() for tipo in tipos if tipo[0]}
    
    return {
        "total": total,
        "pendientes": stats["pendiente"],
        "aprobadas": stats["aprobada"],
        "en_ejecucion": stats["en_ejecucion"],
        "completadas": stats["completada"],
        "canceladas": stats["cancelada"],
        "por_tipo": por_tipo
    }

def actualizar_estado_por_labores(db: Session, recomendacion_id: int):
    labores = db.query(Labor).filter(Labor.recomendacion_id == recomendacion_id).all()

    if not labores:
        return

    if all(l.estado == "completada" for l in labores):
        rec = obtener_recomendacion(db, recomendacion_id)
        if rec:
            rec.estado = "completada"
            db.commit()

# === FUNCIÓN AUXILIAR ===
def _cargar_relaciones_recomendacion(recomendacion: Recomendacion):
    """Cargar información relacionada de la recomendación"""
    if recomendacion.docente:
        recomendacion.docente_nombre = recomendacion.docente.nombre
    if recomendacion.lote:
        recomendacion.lote_nombre = recomendacion.lote.nombre
        if recomendacion.lote.granja:
            recomendacion.granja_nombre = recomendacion.lote.granja.nombre
        if recomendacion.lote.programa:
            recomendacion.programa_nombre = recomendacion.lote.programa.nombre
    if recomendacion.diagnostico:
        recomendacion.diagnostico_tipo = recomendacion.diagnostico.tipo

def obtener_recomendacion_vista_completa(db: Session, id: int, usuario: Usuario):
    recomendacion = obtener_recomendacion(db, id, usuario)
    if not recomendacion:
        return None
    
    # Cargar información del diagnóstico
    diagnostico_info = None
    if recomendacion.diagnostico:
        diagnostico_info = {
            "id": recomendacion.diagnostico.id,
            "tipo": recomendacion.diagnostico.tipo,
            "descripcion": recomendacion.diagnostico.descripcion,
            "estudiante_nombre": recomendacion.diagnostico.estudiante.nombre if recomendacion.diagnostico.estudiante else None,
            "fecha_creacion": recomendacion.diagnostico.fecha_creacion
        }
    
    # Cargar labores con información extendida
    labores_detalladas = []
    for labor in recomendacion.labores:
        labor_info = {
            "id": labor.id,
            "estado": labor.estado,
            "avance_porcentaje": labor.avance_porcentaje,
            "comentario": labor.comentario,
            "fecha_asignacion": labor.fecha_asignacion,
            "fecha_finalizacion": labor.fecha_finalizacion,
            "trabajador": {
                "id": labor.trabajador.id,
                "nombre": labor.trabajador.nombre,
                "email": labor.trabajador.email
            } if labor.trabajador else None,
            "lote": {
                "id": labor.lote.id,
                "nombre": labor.lote.nombre
            } if labor.lote else None,
            "recursos_asignados": {
                "herramientas": len(labor.uso_herramientas),
                "insumos": len(labor.uso_insumos)
            }
        }
        labores_detalladas.append(labor_info)
    
    # Agregar la información extendida a la recomendación
    recomendacion.diagnostico_info = diagnostico_info
    recomendacion.labores_detalladas = labores_detalladas
    
    return recomendacion