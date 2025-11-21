from sqlalchemy.orm import Session
from app.db.models import TipoLote
from app.schemas.tipo_lote_schema import TipoLoteCreate, TipoLoteUpdate

def get_tipos_lote(db: Session):
    return db.query(TipoLote).all()

def get_tipo_lote(db: Session, tipo_lote_id: int):
    return db.query(TipoLote).filter(TipoLote.id == tipo_lote_id).first()

def create_tipo_lote(db: Session, tipo_data: TipoLoteCreate):
    tipo = TipoLote(**tipo_data.dict())
    db.add(tipo)
    db.commit()
    db.refresh(tipo)
    return tipo

def update_tipo_lote(db: Session, tipo_lote_id: int, tipo_data: TipoLoteUpdate):
    tipo = get_tipo_lote(db, tipo_lote_id)
    if tipo:
        for key, value in tipo_data.dict().items():
            setattr(tipo, key, value)
        db.commit()
        db.refresh(tipo)
    return tipo

def delete_tipo_lote(db: Session, tipo_lote_id: int):
    tipo = get_tipo_lote(db, tipo_lote_id)
    if tipo:
        db.delete(tipo)
        db.commit()
    return tipo
