from sqlalchemy.orm import Session
from app.db.models import TipoLabor
from app.schemas.tipo_labor_schema import (
    TipoLaborCreate, TipoLaborUpdate
)

def get_all(db: Session):
    return db.query(TipoLabor).all()

def get_by_id(db: Session, id: int):
    return db.query(TipoLabor).filter(TipoLabor.id == id).first()

def create(db: Session, data: TipoLaborCreate):
    new = TipoLabor(**data.dict())
    db.add(new)
    db.commit()
    db.refresh(new)
    return new

def update(db: Session, entity: TipoLabor, data: TipoLaborUpdate):
    for field, value in data.dict(exclude_unset=True).items():
        setattr(entity, field, value)
    db.commit()
    db.refresh(entity)
    return entity

def delete(db: Session, entity: TipoLabor):
    db.delete(entity)
    db.commit()
