from sqlalchemy.orm import Session
from app.db.models import CategoriaInventario
from app.schemas.categoria_inventario_schema import (
    CategoriaInventarioCreate,
    CategoriaInventarioUpdate
)

def get_all(db: Session):
    return db.query(CategoriaInventario).all()

def create(db: Session, data: CategoriaInventarioCreate):
    new = CategoriaInventario(**data.dict())
    db.add(new)
    db.commit()
    db.refresh(new)
    return new

def update(db: Session, id: int, data: CategoriaInventarioUpdate):
    categoria = db.query(CategoriaInventario).filter(CategoriaInventario.id == id).first()
    if not categoria:
        return None
    
    for field, value in data.dict(exclude_unset=True).items():
        setattr(categoria, field, value)

    db.commit()
    db.refresh(categoria)
    return categoria

def delete(db: Session, id: int):
    categoria = db.query(CategoriaInventario).filter(CategoriaInventario.id == id).first()
    if not categoria:
        return None
    
    db.delete(categoria)
    db.commit()
    return True
