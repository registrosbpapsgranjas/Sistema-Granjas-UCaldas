from sqlalchemy.orm import Session
from app.db.models import Lote, LoteCultivo
from app.schemas.lote_schema import LoteCreate, LoteUpdate
from typing import List, Optional
from . import lote_cultivos

def get_lotes(
    db: Session, 
    skip: int = 0, 
    limit: int = 100,
    programa_id: Optional[int] = None,
    granja_id: Optional[int] = None,
    cultivo_id: Optional[int] = None,
    estado: Optional[str] = None
) -> List[Lote]:
    """
    Obtener todos los lotes con filtros opcionales
    - programa_id: Filtrar por programa
    - granja_id: Filtrar por granja
    - cultivo_id: Filtrar por cultivo (a través de la tabla pivote)
    - estado: Filtrar por estado específico
    """
    query = db.query(Lote).filter(Lote.estado != "eliminado")
    
    if programa_id:
        query = query.filter(Lote.programa_id == programa_id)
    
    if granja_id:
        query = query.filter(Lote.granja_id == granja_id)
    
    if cultivo_id:
        query = query.join(Lote.cultivos_asignados).filter(LoteCultivo.cultivo_id == cultivo_id)
    
    if estado:
        query = query.filter(Lote.estado == estado)
    
    return query.offset(skip).limit(limit).all()

def get_lote(db: Session, lote_id: int) -> Optional[Lote]:
    """Obtener un lote por su ID (incluye cultivos asignados)"""
    return db.query(Lote).filter(
        Lote.id == lote_id, 
        Lote.estado != "eliminado"
    ).first()

def create_lote(db: Session, data: LoteCreate) -> Lote:
    """Crear un nuevo lote con sus cultivos"""
    cultivo_ids = data.cultivos_ids
    lote_data = data.model_dump(exclude={"cultivos_ids"})
    
    lote = Lote(**lote_data)
    db.add(lote)
    db.flush()
    
    if cultivo_ids:
        lote_cultivos.create_lote_cultivos(db, lote.id, cultivo_ids)
    
    db.commit()
    db.refresh(lote)
    return lote

def update_lote(db: Session, lote: Lote, data: LoteUpdate) -> Lote:
    """Actualizar un lote existente y sus cultivos"""
    update_data = data.model_dump(exclude_unset=True, exclude={"cultivos_ids"})
    
    for key, value in update_data.items():
        setattr(lote, key, value)
    
    if hasattr(data, 'cultivos_ids') and data.cultivos_ids is not None:
        lote_cultivos.delete_lote_cultivos(db, lote.id)
        if data.cultivos_ids:
            lote_cultivos.create_lote_cultivos(db, lote.id, data.cultivos_ids)
    
    db.commit()
    db.refresh(lote)
    return lote

def delete_lote(db: Session, lote: Lote) -> dict:
    """Eliminar (marcar como eliminado) un lote"""
    lote.estado = "eliminado"
    db.commit()
    return {"message": "Lote eliminado correctamente"}

# === FUNCIONES ESPECÍFICAS ===

def get_lotes_por_programa(db: Session, programa_id: int, skip: int = 0, limit: int = 100) -> List[Lote]:
    return db.query(Lote).filter(
        Lote.programa_id == programa_id,
        Lote.estado != "eliminado"
    ).offset(skip).limit(limit).all()

def get_lotes_por_granja(db: Session, granja_id: int, skip: int = 0, limit: int = 100) -> List[Lote]:
    return db.query(Lote).filter(
        Lote.granja_id == granja_id,
        Lote.estado != "eliminado"
    ).offset(skip).limit(limit).all()

def get_lotes_por_cultivo(db: Session, cultivo_id: int, skip: int = 0, limit: int = 100) -> List[Lote]:
    return db.query(Lote).join(Lote.cultivos_asignados).filter(
        LoteCultivo.cultivo_id == cultivo_id,
        Lote.estado != "eliminado"
    ).offset(skip).limit(limit).all()

def get_lotes_activos(db: Session, skip: int = 0, limit: int = 100) -> List[Lote]:
    return db.query(Lote).filter(
        Lote.estado == "activo"
    ).offset(skip).limit(limit).all()

def buscar_lotes_por_nombre(db: Session, nombre: str, skip: int = 0, limit: int = 100) -> List[Lote]:
    return db.query(Lote).filter(
        Lote.nombre.ilike(f"%{nombre}%"),
        Lote.estado != "eliminado"
    ).offset(skip).limit(limit).all()

def contar_lotes_por_programa(db: Session, programa_id: int) -> int:
    return db.query(Lote).filter(
        Lote.programa_id == programa_id,
        Lote.estado != "eliminado"
    ).count()

def get_estadisticas_lotes(db: Session) -> dict:
    total = db.query(Lote).filter(Lote.estado != "eliminado").count()
    activos = db.query(Lote).filter(Lote.estado == "activo").count()
    inactivos = db.query(Lote).filter(Lote.estado == "inactivo").count()
    completados = db.query(Lote).filter(Lote.estado == "completado").count()
    pendientes = db.query(Lote).filter(Lote.estado == "pendiente").count()
    eliminados = db.query(Lote).filter(Lote.estado == "eliminado").count()
    
    total_cultivos_asignados = db.query(LoteCultivo).count()
    
    return {
        "total": total,
        "activos": activos,
        "inactivos": inactivos,
        "completados": completados,
        "pendientes": pendientes,
        "eliminados": eliminados,
        "total_cultivos_asignados": total_cultivos_asignados,
        "promedio_cultivos_por_lote": round(total_cultivos_asignados / total, 2) if total > 0 else 0
    }