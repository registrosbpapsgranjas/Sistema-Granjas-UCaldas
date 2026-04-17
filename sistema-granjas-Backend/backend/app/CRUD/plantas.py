import datetime
from sqlalchemy.orm import Session
from app.db.models import Planta, Lote
from app.schemas.planta_schema import PlantaCreate, PlantaUpdate
from typing import List, Optional

def generar_codigo_planta(lote_nombre: str, surco: int, numero: int) -> str:
    nombre_limpio = lote_nombre.replace(" ", "_").upper()
    return f"{nombre_limpio}-S{surco:02d}P{numero:02d}"

def get_plantas(db: Session, lote_id: Optional[int] = None, skip: int = 0, limit: int = 100) -> List[Planta]:
    # Excluir plantas marcadas como "para_eliminar" o "punto_vacio"? Depende del requerimiento.
    # Por ahora mostramos todas excepto las lógicamente eliminadas (si usas estado "eliminada").
    # Ajusta según tu lógica de negocio.
    query = db.query(Planta)  # si quieres filtrar por no eliminadas, agrega .filter(Planta.estado != "eliminada")
    if lote_id:
        query = query.filter(Planta.lote_id == lote_id)
    return query.offset(skip).limit(limit).all()

def get_planta(db: Session, planta_id: int) -> Optional[Planta]:
    return db.query(Planta).filter(Planta.id == planta_id).first()

def get_planta_by_codigo(db: Session, codigo: str) -> Optional[Planta]:
    return db.query(Planta).filter(Planta.codigo == codigo).first()

def create_planta(db: Session, data: PlantaCreate) -> Planta:
    lote = db.query(Lote).filter(Lote.id == data.lote_id).first()
    if not lote:
        raise ValueError("Lote no encontrado")

    existente = db.query(Planta).filter(
        Planta.lote_id == data.lote_id,
        Planta.surco == data.surco,
        Planta.numero == data.numero
    ).first()
    if existente:
        raise ValueError(f"Ya existe una planta en surco {data.surco}, número {data.numero}")

    codigo = data.codigo or generar_codigo_planta(lote.nombre, data.surco, data.numero)
    # Usar estado enviado o por defecto "productivo"
    estado = data.estado if data.estado else "productivo"
    planta = Planta(
        lote_id=data.lote_id,
        surco=data.surco,
        numero=data.numero,
        codigo=codigo,
        estado=estado
    )
    db.add(planta)
    db.commit()
    db.refresh(planta)
    return planta

def update_planta(db: Session, planta: Planta, data: PlantaUpdate) -> Planta:
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(planta, key, value)
    planta.updated_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(planta)
    return planta

def delete_planta(db: Session, planta: Planta) -> None:
    # Cambia el estado a "para_eliminar" en lugar de borrar físicamente
    db.delete(planta)  # Si quieres eliminar físicamente, usa esto. Si solo quieres marcar, comenta esta línea y descomenta la siguiente.
    db.commit()

def crear_plantas_para_lote(db: Session, lote_id: int) -> List[Planta]:
    lote = db.query(Lote).filter(Lote.id == lote_id).first()
    if not lote:
        raise ValueError("Lote no encontrado")
    if not lote.surcos or not lote.plantas_por_surco:
        raise ValueError("El lote no tiene definidos surcos o plantas por surco")

    plantas_creadas = []
    for surco in range(1, lote.surcos + 1):
        for numero in range(1, lote.plantas_por_surco + 1):
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
                    estado="productivo"  # Estado por defecto para plantas generadas
                )
                db.add(nueva)
                plantas_creadas.append(nueva)
    db.commit()
    for p in plantas_creadas:
        db.refresh(p)
    return plantas_creadas