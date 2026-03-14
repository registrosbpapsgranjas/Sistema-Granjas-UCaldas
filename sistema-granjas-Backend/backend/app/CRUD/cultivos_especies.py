from sqlalchemy.orm import Session
from app.db.models import CultivoEspecie
from app.schemas.cultivo_especie_schema import (
    CultivoEspecieCreate, CultivoEspecieUpdate
)
from typing import Optional, List

def get_all(db: Session) -> List[CultivoEspecie]:
    """Obtener todos los cultivos"""
    return db.query(CultivoEspecie).all()

def get_by_id(db: Session, id: int) -> Optional[CultivoEspecie]:
    """Obtener un cultivo por su ID"""
    return db.query(CultivoEspecie).filter(CultivoEspecie.id == id).first()

def get_by_granja(db: Session, granja_id: int) -> List[CultivoEspecie]:
    """Obtener cultivos por granja"""
    return db.query(CultivoEspecie).filter(
        CultivoEspecie.granja_id == granja_id,
        CultivoEspecie.estado == "activo"
    ).all()

def create(db: Session, data: CultivoEspecieCreate) -> CultivoEspecie:
    """Crear un nuevo cultivo"""
    nuevo = CultivoEspecie(**data.model_dump())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo

def update(db: Session, entity: CultivoEspecie, data: CultivoEspecieUpdate) -> CultivoEspecie:
    """Actualizar un cultivo existente"""
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(entity, field, value)
    db.commit()
    db.refresh(entity)
    return entity

def delete(db: Session, entity: CultivoEspecie) -> None:
    """Eliminar un cultivo"""
    db.delete(entity)
    db.commit()

def count_lotes_asignados(db: Session, cultivo_id: int) -> int:
    """Contar cuántos lotes usan un cultivo específico"""
    from app.db.models import LoteCultivo
    return db.query(LoteCultivo).filter(LoteCultivo.cultivo_id == cultivo_id).count()