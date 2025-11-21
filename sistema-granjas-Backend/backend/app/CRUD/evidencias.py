from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.db.models import Evidencia, Usuario, Labor, Diagnostico, Recomendacion
from app.schemas.evidencia_schema import EvidenciaCreate

def crear_evidencia_crud(db: Session, data: EvidenciaCreate, usuario: Usuario):
    # Verificar que la entidad existe según el tipo
    entidad = None
    entidad_nombre = ""
    
    if data.tipo_entidad == "labor":
        entidad = db.query(Labor).filter(Labor.id == data.entidad_id).first()
        if entidad:
            entidad_nombre = f"Labor: {entidad.id}"
    elif data.tipo_entidad == "diagnostico":
        entidad = db.query(Diagnostico).filter(Diagnostico.id == data.entidad_id).first()
        if entidad:
            entidad_nombre = f"Diagnóstico: {entidad.tipo}"
    elif data.tipo_entidad == "recomendacion":
        entidad = db.query(Recomendacion).filter(Recomendacion.id == data.entidad_id).first()
        if entidad:
            entidad_nombre = f"Recomendación: {entidad.titulo}"
    
    if not entidad:
        raise HTTPException(404, f"{data.tipo_entidad.capitalize()} no encontrado")
    
    # Crear evidencia
    evidencia = Evidencia(
        tipo=data.tipo,
        descripcion=data.descripcion,
        url_archivo=data.url_archivo,
        usuario_id=data.usuario_id
    )
    
    # Asignar a la entidad correspondiente
    if data.tipo_entidad == "labor":
        evidencia.labor_id = data.entidad_id
    elif data.tipo_entidad == "diagnostico":
        evidencia.diagnostico_id = data.entidad_id
    elif data.tipo_entidad == "recomendacion":
        evidencia.recomendacion_id = data.entidad_id
    
    db.add(evidencia)
    db.commit()
    db.refresh(evidencia)
    
    # Cargar relaciones para respuesta
    _cargar_relaciones_evidencia(db, evidencia)
    
    return evidencia

def listar_evidencias_entidad_crud(db: Session, tipo_entidad: str, entidad_id: int):
    query = db.query(Evidencia)
    
    if tipo_entidad == "labor":
        query = query.filter(Evidencia.labor_id == entidad_id)
    elif tipo_entidad == "diagnostico":
        query = query.filter(Evidencia.diagnostico_id == entidad_id)
    elif tipo_entidad == "recomendacion":
        query = query.filter(Evidencia.recomendacion_id == entidad_id)
    else:
        raise HTTPException(400, "Tipo de entidad no válido")
    
    evidencias = query.all()
    
    for evidencia in evidencias:
        _cargar_relaciones_evidencia(db, evidencia)
    
    return {
        "items": evidencias,
        "total": len(evidencias)
    }

def eliminar_evidencia_crud(db: Session, evidencia_id: int, usuario: Usuario):
    evidencia = db.query(Evidencia).filter(Evidencia.id == evidencia_id).first()
    
    if not evidencia:
        raise HTTPException(404, "Evidencia no encontrada")
    
    # Solo el creador o admin puede eliminar
    if evidencia.usuario_id != usuario.id and usuario.rol.nombre != "admin":
        raise HTTPException(403, "Solo el creador o administrador puede eliminar la evidencia")
    
    db.delete(evidencia)
    db.commit()
    
    return {"message": "✅ Evidencia eliminada correctamente"}

def _cargar_relaciones_evidencia(db: Session, evidencia: Evidencia):
    """Cargar información relacionada de la evidencia"""
    if evidencia.usuario:
        evidencia.usuario_nombre = evidencia.usuario.nombre
    
    # Determinar nombre de la entidad
    if evidencia.labor_id:
        evidencia.entidad_id = evidencia.labor_id
        evidencia.tipo_entidad = "labor"
        labor = db.query(Labor).filter(Labor.id == evidencia.labor_id).first()
        if labor and labor.recomendacion:
            evidencia.entidad_nombre = f"Labor: {labor.recomendacion.titulo if labor.recomendacion else labor.id}"
    elif evidencia.diagnostico_id:
        evidencia.entidad_id = evidencia.diagnostico_id
        evidencia.tipo_entidad = "diagnostico"
        diagnostico = db.query(Diagnostico).filter(Diagnostico.id == evidencia.diagnostico_id).first()
        if diagnostico:
            evidencia.entidad_nombre = f"Diagnóstico: {diagnostico.tipo}"
    elif evidencia.recomendacion_id:
        evidencia.entidad_id = evidencia.recomendacion_id
        evidencia.tipo_entidad = "recomendacion"
        recomendacion = db.query(Recomendacion).filter(Recomendacion.id == evidencia.recomendacion_id).first()
        if recomendacion:
            evidencia.entidad_nombre = f"Recomendación: {recomendacion.titulo}"