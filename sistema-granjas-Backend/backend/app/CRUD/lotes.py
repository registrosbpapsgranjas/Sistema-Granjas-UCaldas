from sqlalchemy.orm import Session
from app.db.models import Lote
from app.schemas.lote_schema import LoteCreate, LoteUpdate

def get_lotes(db: Session):
    return db.query(Lote).filter(Lote.estado != "eliminado").all()

def get_lote(db: Session, lote_id: int):
    return db.query(Lote).filter(Lote.id == lote_id, Lote.estado != "eliminado").first()

def create_lote(db: Session, data: LoteCreate):
    lote = Lote(**data.model_dump())
    db.add(lote)
    db.commit()
    db.refresh(lote)
    return lote

def update_lote(db: Session, lote: Lote, data: LoteUpdate):
    for key, value in data.model_dump(exclude_none=True).items():
        setattr(lote, key, value)
    db.commit()
    db.refresh(lote)
    return lote

def delete_lote(db: Session, lote: Lote):
    lote.estado = "eliminado"
    db.commit()
    return lote
