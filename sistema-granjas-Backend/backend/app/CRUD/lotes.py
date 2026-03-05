from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.db.models import Lote
from app.schemas.lote_schema import LoteCreate, LoteUpdate
from typing import List, Optional

def get_lotes(db: Session, skip: int = 0, limit: int = 100):
    """Obtener todos los lotes con paginación"""
    return db.query(Lote).filter(Lote.estado != "eliminado").offset(skip).limit(limit).all()

def get_lote(db: Session, lote_id: int):
    """Obtener un lote por su ID"""
    return db.query(Lote).filter(Lote.id == lote_id, Lote.estado != "eliminado").first()

def create_lote(db: Session, data: LoteCreate):
    """Crear un nuevo lote"""
    lote = Lote(**data.model_dump())
    db.add(lote)
    db.commit()
    db.refresh(lote)
    return lote

def update_lote(db: Session, lote: Lote, data: LoteUpdate):
    """Actualizar un lote existente"""
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(lote, key, value)
    db.commit()
    db.refresh(lote)
    return lote

def delete_lote(db: Session, lote: Lote):
    """Eliminar (marcar como eliminado) un lote"""
    lote.estado = "eliminado"
    db.commit()
    return {"message": "Lote eliminado correctamente"}

# === FUNCIONES ESPECÍFICAS ===

def get_lotes_por_programa(db: Session, programa_id: int, skip: int = 0, limit: int = 100):
    """Obtener todos los lotes de un programa específico"""
    return db.query(Lote).filter(
        Lote.programa_id == programa_id,
        Lote.estado != "eliminado"
    ).offset(skip).limit(limit).all()

def get_lotes_por_granja(db: Session, granja_id: int, skip: int = 0, limit: int = 100):
    """Obtener todos los lotes de una granja específica"""
    return db.query(Lote).filter(
        Lote.granja_id == granja_id,
        Lote.estado != "eliminado"
    ).offset(skip).limit(limit).all()

def get_lotes_activos(db: Session, skip: int = 0, limit: int = 100):
    """Obtener solo lotes activos"""
    return db.query(Lote).filter(
        Lote.estado == "activo"
    ).offset(skip).limit(limit).all()

def buscar_lotes_por_nombre(db: Session, nombre: str, skip: int = 0, limit: int = 100):
    """Buscar lotes por nombre (búsqueda parcial)"""
    return db.query(Lote).filter(
        Lote.nombre.ilike(f"%{nombre}%"),
        Lote.estado != "eliminado"
    ).offset(skip).limit(limit).all()

def contar_lotes_por_programa(db: Session, programa_id: int):
    """Contar cuántos lotes tiene un programa"""
    return db.query(Lote).filter(
        Lote.programa_id == programa_id,
        Lote.estado != "eliminado"
    ).count()

def get_estadisticas_lotes(db: Session):
    """Obtener estadísticas de lotes"""
    total = db.query(Lote).filter(Lote.estado != "eliminado").count()
    activos = db.query(Lote).filter(Lote.estado == "activo").count()
    inactivos = db.query(Lote).filter(Lote.estado == "inactivo").count()
    eliminados = db.query(Lote).filter(Lote.estado == "eliminado").count()
    
    return {
        "total": total,
        "activos": activos,
        "inactivos": inactivos,
        "eliminados": eliminados
    }