import datetime

from sqlalchemy.orm import Session
from app.db.models import Planta, Lote
from app.schemas.planta_schema import PlantaCreate, PlantaUpdate
from typing import List, Optional

def generar_codigo_planta(lote_nombre: str, surco: int, numero: int) -> str:
    """Genera código único para la planta: LOTE-S01P02"""
    nombre_limpio = lote_nombre.replace(" ", "_").upper()
    return f"{nombre_limpio}-S{surco:02d}P{numero:02d}"

def get_plantas(db: Session, lote_id: Optional[int] = None, skip: int = 0, limit: int = 100) -> List[Planta]:
    query = db.query(Planta).filter(Planta.estado != "eliminada")
    if lote_id:
        query = query.filter(Planta.lote_id == lote_id)
    return query.offset(skip).limit(limit).all()

def get_planta(db: Session, planta_id: int) -> Optional[Planta]:
    return db.query(Planta).filter(Planta.id == planta_id, Planta.estado != "eliminada").first()

def get_planta_by_codigo(db: Session, codigo: str) -> Optional[Planta]:
    return db.query(Planta).filter(Planta.codigo == codigo, Planta.estado != "eliminada").first()

def create_planta(db: Session, data: PlantaCreate) -> Planta:
    lote = db.query(Lote).filter(Lote.id == data.lote_id).first()
    if not lote:
        raise ValueError("Lote no encontrado")
    # Verificar que no exista ya esa planta en el mismo lote/surco/numero
    existente = db.query(Planta).filter(
        Planta.lote_id == data.lote_id,
        Planta.surco == data.surco,
        Planta.numero == data.numero
    ).first()
    if existente:
        raise ValueError(f"Ya existe una planta en surco {data.surco}, número {data.numero}")
    codigo = data.codigo or generar_codigo_planta(lote.nombre, data.surco, data.numero)
    planta = Planta(**data.model_dump(), codigo=codigo)
    db.add(planta)
    db.commit()
    db.refresh(planta)
    return planta

def update_planta(db: Session, planta: Planta, data: PlantaUpdate) -> Planta:
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(planta, key, value)
    planta.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(planta)
    return planta

def delete_planta(db: Session, planta: Planta) -> None:
    planta.estado = "eliminada"
    db.commit()

def crear_plantas_para_lote(db: Session, lote_id: int) -> List[Planta]:
    """Genera todas las plantas de un lote según surcos y plantas_por_surco."""
    lote = db.query(Lote).filter(Lote.id == lote_id).first()
    if not lote:
        raise ValueError("Lote no encontrado")
    if not lote.surcos or not lote.plantas_por_surco:
        raise ValueError("El lote no tiene definidos surcos o plantas por surco")

    plantas_creadas = []
    for surco in range(1, lote.surcos + 1):
        for numero in range(1, lote.plantas_por_surco + 1):
            # Evitar duplicados
            existente = db.query(Planta).filter(
                Planta.lote_id == lote_id,
                Planta.surco == surco,
                Planta.numero == numero
            ).first()
            if not existente:
                codigo = generar_codigo_planta(lote.nombre, surco, numero)
                nueva = Planta(
                    lote_id=lote_id,
                    surco=surco,
                    numero=numero,
                    codigo=codigo,
                    estado="Árbol Productivo"
                )
                db.add(nueva)
                plantas_creadas.append(nueva)
    db.commit()
    for p in plantas_creadas:
        db.refresh(p)
    return plantas_creadas