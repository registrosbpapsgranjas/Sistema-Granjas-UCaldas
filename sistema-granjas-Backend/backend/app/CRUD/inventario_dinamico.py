from sqlalchemy.orm import Session
from app.db.models import ProgramaInventarioTipo, InventarioCampo, ItemInventarioPrograma

# ----- tipos -----
def get_tipo(db: Session, tipo_id: int):
    return db.query(ProgramaInventarioTipo).filter(ProgramaInventarioTipo.id == tipo_id).first()

def get_tipos_por_programa(db: Session, programa_id: int, skip=0, limit=100):
    return db.query(ProgramaInventarioTipo).filter(ProgramaInventarioTipo.programa_id == programa_id, ProgramaInventarioTipo.activo == True).order_by(ProgramaInventarioTipo.orden).offset(skip).limit(limit).all()

def create_tipo(db: Session, data):
    tipo = ProgramaInventarioTipo(**data.dict())
    db.add(tipo)
    db.commit()
    db.refresh(tipo)
    return tipo

def update_tipo(db: Session, tipo: ProgramaInventarioTipo, data):
    for key, value in data.dict(exclude_unset=True).items():
        setattr(tipo, key, value)
    db.commit()
    db.refresh(tipo)
    return tipo

def delete_tipo(db: Session, tipo: ProgramaInventarioTipo):
    db.delete(tipo)
    db.commit()

# ----- campos -----
def get_campo(db: Session, campo_id: int):
    return db.query(InventarioCampo).filter(InventarioCampo.id == campo_id).first()

def get_campos_por_tipo(db: Session, tipo_id: int):
    return db.query(InventarioCampo).filter(InventarioCampo.tipo_id == tipo_id).order_by(InventarioCampo.orden).all()

def create_campo(db: Session, data):
    campo = InventarioCampo(**data.dict())
    db.add(campo)
    db.commit()
    db.refresh(campo)
    return campo

def update_campo(db: Session, campo: InventarioCampo, data):
    for key, value in data.dict(exclude_unset=True).items():
        setattr(campo, key, value)
    db.commit()
    db.refresh(campo)
    return campo

def delete_campo(db: Session, campo: InventarioCampo):
    db.delete(campo)
    db.commit()

# ----- items -----
def get_item(db: Session, item_id: int):
    return db.query(ItemInventarioPrograma).filter(ItemInventarioPrograma.id == item_id).first()

def get_items_por_tipo(db: Session, tipo_id: int, skip=0, limit=500):
    return db.query(ItemInventarioPrograma).filter(ItemInventarioPrograma.tipo_id == tipo_id).order_by(ItemInventarioPrograma.fecha_inventario.desc()).offset(skip).limit(limit).all()

def create_item(db: Session, data):
    item = ItemInventarioPrograma(**data.dict())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

def update_item(db: Session, item: ItemInventarioPrograma, data):
    for key, value in data.dict(exclude_unset=True).items():
        setattr(item, key, value)
    db.commit()
    db.refresh(item)
    return item

def delete_item(db: Session, item: ItemInventarioPrograma):
    db.delete(item)
    db.commit()