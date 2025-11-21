from sqlalchemy.orm import Session
from datetime import datetime
from app.db.models import Diagnostico
from app.schemas.diagnostico_schema import (
    DiagnosticoCreate, DiagnosticoUpdate, DiagnosticoValidate
)

def get_diagnosticos(db: Session):
    return db.query(Diagnostico).all()

def get_diagnostico(db: Session, diagnostico_id: int):
    return db.query(Diagnostico).filter(Diagnostico.id == diagnostico_id).first()

def get_diagnosticos_por_estudiante(db: Session, estudiante_id: int):
    return db.query(Diagnostico).filter(Diagnostico.estudiante_id == estudiante_id).all()

def create_diagnostico(db: Session, data: DiagnosticoCreate):
    nuevo = Diagnostico(**data.dict())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo

def update_diagnostico(db: Session, diagnostico: Diagnostico, data: DiagnosticoUpdate):
    for field, value in data.dict(exclude_unset=True).items():
        setattr(diagnostico, field, value)
    db.commit()
    db.refresh(diagnostico)
    return diagnostico

def validate_diagnostico(db: Session, diagnostico: Diagnostico, data: DiagnosticoValidate):
    diagnostico.docente_id = data.docente_id
    diagnostico.observaciones = data.observaciones
    diagnostico.estado = data.estado
    diagnostico.fecha_revision = datetime.utcnow()
    db.commit()
    db.refresh(diagnostico)
    return diagnostico

def delete_diagnostico(db: Session, diagnostico: Diagnostico):
    db.delete(diagnostico)
    db.commit()
