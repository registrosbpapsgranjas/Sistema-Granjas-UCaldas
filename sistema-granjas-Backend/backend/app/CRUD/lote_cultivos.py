# app/CRUD/lote_cultivos.py
from sqlalchemy.orm import Session
from app.db.models import LoteCultivo
from app.schemas.lote_schema import LoteCultivoCreate, LoteCultivoUpdate
from typing import List, Optional

def get_lote_cultivos(db: Session, lote_id: int) -> List[LoteCultivo]:
    """Obtener todas las relaciones de un lote"""
    return db.query(LoteCultivo).filter(LoteCultivo.lote_id == lote_id).all()

def get_lote_cultivo(db: Session, lote_cultivo_id: int) -> Optional[LoteCultivo]:
    """Obtener una relación específica por su ID"""
    return db.query(LoteCultivo).filter(LoteCultivo.id == lote_cultivo_id).first()

def get_cultivo_lotes(db: Session, cultivo_id: int) -> List[LoteCultivo]:
    """Obtener todos los lotes que usan un cultivo específico"""
    return db.query(LoteCultivo).filter(LoteCultivo.cultivo_id == cultivo_id).all()

def create_lote_cultivo(db: Session, data: LoteCultivoCreate) -> LoteCultivo:
    """Crear una relación lote-cultivo"""
    db_item = LoteCultivo(**data.model_dump())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

def create_lote_cultivos(db: Session, lote_id: int, cultivo_ids: List[int]) -> List[LoteCultivo]:
    """Crear múltiples relaciones lote-cultivo (para asignación masiva)"""
    items = []
    for cultivo_id in cultivo_ids:
        # Verificar si ya existe
        existente = db.query(LoteCultivo).filter(
            LoteCultivo.lote_id == lote_id,
            LoteCultivo.cultivo_id == cultivo_id
        ).first()
        
        if not existente:
            db_item = LoteCultivo(lote_id=lote_id, cultivo_id=cultivo_id)
            db.add(db_item)
            items.append(db_item)
    
    db.commit()
    for item in items:
        db.refresh(item)
    return items

def update_lote_cultivo(db: Session, db_item: LoteCultivo, data: LoteCultivoUpdate) -> LoteCultivo:
    """Actualizar una relación existente"""
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_item, key, value)
    db.commit()
    db.refresh(db_item)
    return db_item

def delete_lote_cultivo(db: Session, lote_cultivo_id: int):
    """Eliminar una relación específica"""
    db_item = db.query(LoteCultivo).filter(LoteCultivo.id == lote_cultivo_id).first()
    if db_item:
        db.delete(db_item)
        db.commit()
    return {"message": "Relación eliminada"}

def delete_lote_cultivos(db: Session, lote_id: int):
    """Eliminar todas las relaciones de un lote"""
    db.query(LoteCultivo).filter(LoteCultivo.lote_id == lote_id).delete()
    db.commit()

def contar_lotes_por_cultivo(db: Session) -> List[dict]:
    """Contar cuántos lotes usan cada cultivo"""
    from sqlalchemy import func
    
    resultados = db.query(
        LoteCultivo.cultivo_id,
        func.count(LoteCultivo.id).label('total')
    ).group_by(
        LoteCultivo.cultivo_id
    ).all()
    
    return [
        {"cultivo_id": r[0], "total": r[1]} for r in resultados
    ]