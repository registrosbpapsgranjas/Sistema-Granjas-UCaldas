from sqlalchemy.orm import Session
from app.db.models import TipoRecomendacion
from app.schemas.tipo_recomendacion_schema import TipoRecomendacionCreate, TipoRecomendacionUpdate

def get_all(db: Session):
    return db.query(TipoRecomendacion).order_by(TipoRecomendacion.nombre).all()

def get_by_id(db: Session, id: int):
    return db.query(TipoRecomendacion).filter(TipoRecomendacion.id == id).first()

def create(db: Session, data: TipoRecomendacionCreate):
    obj = TipoRecomendacion(**data.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

def update(db: Session, entity: TipoRecomendacion, data: TipoRecomendacionUpdate):
    for field, value in data.dict(exclude_unset=True).items():
        setattr(entity, field, value)
    db.commit()
    db.refresh(entity)
    return entity

def delete(db: Session, entity: TipoRecomendacion):
    db.delete(entity)
    db.commit()
