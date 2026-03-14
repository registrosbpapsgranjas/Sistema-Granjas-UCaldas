from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.models import LoteCultivo
from typing import List, Optional

def get_lote_cultivos(db: Session, lote_id: int) -> List[LoteCultivo]:
    """Obtener todas las relaciones de un lote"""
    return db.query(LoteCultivo).filter(LoteCultivo.lote_id == lote_id).all()

def get_cultivo_lotes(db: Session, cultivo_id: int) -> List[LoteCultivo]:
    """Obtener todos los lotes que usan un cultivo específico"""
    return db.query(LoteCultivo).filter(LoteCultivo.cultivo_id == cultivo_id).all()

def create_lote_cultivos(db: Session, lote_id: int, cultivo_ids: List[int]) -> List[LoteCultivo]:
    """Crear múltiples relaciones lote-cultivo"""
    items = []
    for cultivo_id in cultivo_ids:
        existente = db.query(LoteCultivo).filter(
            LoteCultivo.lote_id == lote_id,
            LoteCultivo.cultivo_id == cultivo_id
        ).first()
        
        if not existente:
            db_item = LoteCultivo(lote_id=lote_id, cultivo_id=cultivo_id)
            db.add(db_item)
            items.append(db_item)
    
    if items:
        db.commit()
    return items

def delete_lote_cultivos(db: Session, lote_id: int) -> None:
    """Eliminar todas las relaciones de un lote"""
    db.query(LoteCultivo).filter(LoteCultivo.lote_id == lote_id).delete()
    db.commit()

def delete_lote_cultivo(db: Session, lote_id: int, cultivo_id: int) -> None:
    """Eliminar una relación específica"""
    db.query(LoteCultivo).filter(
        LoteCultivo.lote_id == lote_id,
        LoteCultivo.cultivo_id == cultivo_id
    ).delete()
    db.commit()

def contar_lotes_por_cultivo(db: Session) -> List[dict]:
    """Contar cuántos lotes usan cada cultivo"""
    resultados = db.query(
        LoteCultivo.cultivo_id,
        func.count(LoteCultivo.lote_id).label('total')
    ).group_by(
        LoteCultivo.cultivo_id
    ).all()
    
    return [
        {"cultivo_id": r[0], "total": r[1]} for r in resultados
    ]

def cultivo_tiene_lotes(db: Session, cultivo_id: int) -> bool:
    """Verificar si un cultivo tiene lotes asignados"""
    return db.query(LoteCultivo).filter(
        LoteCultivo.cultivo_id == cultivo_id
    ).first() is not None