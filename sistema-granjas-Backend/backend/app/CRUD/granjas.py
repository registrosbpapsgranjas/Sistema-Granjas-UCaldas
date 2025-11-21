from sqlalchemy.orm import Session
from app.db.models import Granja, Usuario

def get_all(db: Session, skip: int = 0, limit: int = 50):
    return db.query(Granja).offset(skip).limit(limit).all()

def get_by_id(db: Session, granja_id: int):
    return db.query(Granja).filter(Granja.id == granja_id).first()

def create(db: Session, granja_data):
    nueva_granja = Granja(**granja_data.dict())
    db.add(nueva_granja)
    db.commit()
    db.refresh(nueva_granja)
    return nueva_granja

def update(db: Session, granja, data):
    for field, value in data.dict(exclude_unset=True).items():
        setattr(granja, field, value)
    db.commit()
    db.refresh(granja)
    return granja

def delete(db: Session, granja):
    db.delete(granja)
    db.commit()
