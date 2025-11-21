from sqlalchemy.orm import Session
from app.db.models import Herramienta
from app.schemas.herramienta_schema import HerramientaCreate, HerramientaUpdate

def get_all(db: Session):
    return db.query(Herramienta).all()

def get(db: Session, id: int):
    return db.query(Herramienta).filter(Herramienta.id == id).first()

def create(db: Session, data: HerramientaCreate):
    # SOLUCIÓN: Usar data.dict() directamente sin duplicar cantidad_disponible
    herramienta = Herramienta(**data.dict())
    db.add(herramienta)
    db.commit()
    db.refresh(herramienta)
    return herramienta

def update(db: Session, id: int, data: HerramientaUpdate):
    herramienta = get(db, id)
    if not herramienta:
        return None
    update_data = data.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(herramienta, key, value)
    db.commit()
    db.refresh(herramienta)
    return herramienta

def delete(db: Session, id: int):
    herramienta = get(db, id)
    if not herramienta:
        return False
    db.delete(herramienta)
    db.commit()
    return True