from sqlalchemy.orm import Session
from app.db.models import Insumo
from app.schemas.insumo_schema import InsumoCreate, InsumoUpdate

def get_all(db: Session):
    return db.query(Insumo).all()

def create(db: Session, data: InsumoCreate):
    new = Insumo(**data.dict())
    db.add(new)
    db.commit()
    db.refresh(new)
    return new

def update(db: Session, id: int, data: InsumoUpdate):
    insumo = db.query(Insumo).filter(Insumo.id == id).first()
    if not insumo:
        return None
    for key, value in data.dict(exclude_unset=True).items():
        setattr(insumo, key, value)
    db.commit()
    db.refresh(insumo)
    return insumo

def delete(db: Session, id: int):
    insumo = db.query(Insumo).filter(Insumo.id == id).first()
    if not insumo:
        return None
    db.delete(insumo)
    db.commit()
    return True
