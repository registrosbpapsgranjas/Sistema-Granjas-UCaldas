from sqlalchemy.orm import Session
from app.db.models import Programa
from app.schemas.programa_schema import ProgramaCreate

def get_programas(db: Session):
    return db.query(Programa).filter(Programa.activo == True).all()

def get_programa(db: Session, programa_id: int):
    return db.query(Programa).filter(Programa.id == programa_id).first()

def create_programa(db: Session, data: ProgramaCreate):
    programa = Programa(
        nombre=data.nombre,
        descripcion=data.descripcion,
        tipo=data.tipo,
        activo=True
    )
    db.add(programa)
    db.commit()
    db.refresh(programa)
    return programa

def update_programa(db: Session, programa: Programa, data: ProgramaCreate):
    programa.nombre = data.nombre
    programa.descripcion = data.descripcion
    programa.tipo = data.tipo
    db.commit()
    db.refresh(programa)
    return programa

def delete_programa(db: Session, programa: Programa):
    programa.activo = False
    db.commit()
    return programa
