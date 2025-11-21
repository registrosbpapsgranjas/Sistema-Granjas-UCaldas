from sqlalchemy.orm import Session
from app.db.models import CultivoEspecie
from app.schemas.cultivo_especie_schema import (
    CultivoEspecieCreate, CultivoEspecieUpdate
)

def get_all(db: Session):
    return db.query(CultivoEspecie).all()

def get_by_id(db: Session, id: int):
    return db.query(CultivoEspecie).filter(CultivoEspecie.id == id).first()

def create(db: Session, data: CultivoEspecieCreate):
    nuevo = CultivoEspecie(**data.dict())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo

def update(db: Session, entity: CultivoEspecie, data: CultivoEspecieUpdate):
    for field, value in data.dict(exclude_unset=True).items():
        setattr(entity, field, value)
    db.commit()
    db.refresh(entity)
    return entity

def delete(db: Session, entity: CultivoEspecie):
    db.delete(entity)
    db.commit()
