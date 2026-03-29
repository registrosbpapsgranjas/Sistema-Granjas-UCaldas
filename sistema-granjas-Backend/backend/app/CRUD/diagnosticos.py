from sqlalchemy.orm import Session
from app.db.models import Diagnostico
from app.schemas.diagnostico_schema import DiagnosticoCreate, DiagnosticoUpdate


def get_diagnosticos(db: Session):
    return db.query(Diagnostico).order_by(Diagnostico.fecha_creacion.desc()).all()


def get_diagnostico(db: Session, diagnostico_id: int):
    return db.query(Diagnostico).filter(Diagnostico.id == diagnostico_id).first()


def get_diagnosticos_por_usuario(db: Session, usuario_id: int):
    return (
        db.query(Diagnostico)
        .filter(Diagnostico.usuario_id == usuario_id)
        .order_by(Diagnostico.fecha_creacion.desc())
        .all()
    )


def get_diagnosticos_por_programa(db: Session, programa_id: int):
    return (
        db.query(Diagnostico)
        .filter(Diagnostico.programa_id == programa_id)
        .order_by(Diagnostico.fecha_creacion.desc())
        .all()
    )


def get_diagnosticos_por_lote(db: Session, lote_id: int):
    return (
        db.query(Diagnostico)
        .filter(Diagnostico.lote_id == lote_id)
        .order_by(Diagnostico.fecha_creacion.desc())
        .all()
    )


def create_diagnostico(db: Session, data: DiagnosticoCreate) -> Diagnostico:
    nuevo = Diagnostico(**data.dict())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


def update_diagnostico(db: Session, diagnostico: Diagnostico, data: DiagnosticoUpdate) -> Diagnostico:
    for field, value in data.dict(exclude_unset=True).items():
        setattr(diagnostico, field, value)
    db.commit()
    db.refresh(diagnostico)
    return diagnostico


def delete_diagnostico(db: Session, diagnostico: Diagnostico) -> None:
    db.delete(diagnostico)
    db.commit()