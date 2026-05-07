from sqlalchemy.orm import Session
from app.db.models import DiagnosticoTipo, DiagnosticoCampo, CampoRecomendacion
from app.schemas.diagnostico_dinamico_schema import (
    DiagnosticoTipoCreate, DiagnosticoTipoUpdate,
    DiagnosticoCampoCreate, DiagnosticoCampoUpdate,
    CampoRecomendacionCreate, CampoRecomendacionUpdate,
)


# ---------- DiagnosticoTipo ----------

def get_tipos_por_programa(db: Session, programa_id: int):
    return db.query(DiagnosticoTipo).filter(
        DiagnosticoTipo.programa_id == programa_id
    ).order_by(DiagnosticoTipo.orden, DiagnosticoTipo.nombre).all()


def get_subtipos_por_monitoreo(db: Session, monitoreo_id: int):
    return db.query(DiagnosticoTipo).filter(
        DiagnosticoTipo.monitoreo_id == monitoreo_id
    ).order_by(DiagnosticoTipo.orden, DiagnosticoTipo.nombre).all()


def get_tipo(db: Session, tipo_id: int):
    return db.query(DiagnosticoTipo).filter(DiagnosticoTipo.id == tipo_id).first()


def create_tipo(db: Session, data: DiagnosticoTipoCreate):
    tipo = DiagnosticoTipo(**data.dict())
    db.add(tipo)
    db.commit()
    db.refresh(tipo)
    return tipo


def update_tipo(db: Session, tipo: DiagnosticoTipo, data: DiagnosticoTipoUpdate):
    for k, v in data.dict(exclude_unset=True).items():
        setattr(tipo, k, v)
    db.commit()
    db.refresh(tipo)
    return tipo


def delete_tipo(db: Session, tipo: DiagnosticoTipo):
    db.delete(tipo)
    db.commit()


# ---------- DiagnosticoCampo ----------

def get_campos_por_tipo(db: Session, tipo_id: int):
    return db.query(DiagnosticoCampo).filter(
        DiagnosticoCampo.tipo_id == tipo_id
    ).order_by(DiagnosticoCampo.orden, DiagnosticoCampo.nombre_campo).all()


def get_campo(db: Session, campo_id: int):
    return db.query(DiagnosticoCampo).filter(DiagnosticoCampo.id == campo_id).first()


def create_campo(db: Session, data: DiagnosticoCampoCreate):
    campo = DiagnosticoCampo(**data.dict())
    campo.nombre_campo += str(campo.id)
    db.add(campo)
    db.commit()
    db.refresh(campo)
    return campo


def update_campo(db: Session, campo: DiagnosticoCampo, data: DiagnosticoCampoUpdate):
    for k, v in data.dict(exclude_unset=True).items():
        setattr(campo, k, v)
    db.commit()
    db.refresh(campo)
    return campo


def delete_campo(db: Session, campo: DiagnosticoCampo):
    db.delete(campo)
    db.commit()


# ---------- CampoRecomendacion ----------

def get_campos_recomendacion_por_subtipo(db: Session, subtipo_id: int):
    return db.query(CampoRecomendacion).filter(
        CampoRecomendacion.subtipo_id == subtipo_id
    ).order_by(CampoRecomendacion.orden, CampoRecomendacion.nombre_campo).all()


def get_campo_recomendacion(db: Session, campo_id: int):
    return db.query(CampoRecomendacion).filter(CampoRecomendacion.id == campo_id).first()


def create_campo_recomendacion(db: Session, data: CampoRecomendacionCreate):
    campo = CampoRecomendacion(**data.dict())
    db.add(campo)
    db.commit()
    db.refresh(campo)
    return campo


def update_campo_recomendacion(db: Session, campo: CampoRecomendacion, data: CampoRecomendacionUpdate):
    for k, v in data.dict(exclude_unset=True).items():
        setattr(campo, k, v)
    db.commit()
    db.refresh(campo)
    return campo


def delete_campo_recomendacion(db: Session, campo: CampoRecomendacion):
    db.delete(campo)
    db.commit()
