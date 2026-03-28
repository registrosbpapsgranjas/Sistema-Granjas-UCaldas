from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.db.models import Monitoreo, Programa
from app.schemas.monitoreo_schema import MonitoreoCreate, MonitoreoUpdate

def get_monitoreos(db: Session, skip: int = 0, limit: int = 100):
    """Obtener todos los monitoreos con paginación"""
    return db.query(Monitoreo).offset(skip).limit(limit).all()

def get_monitoreo(db: Session, monitoreo_id: int):
    """Obtener un monitoreo por ID"""
    return db.query(Monitoreo).filter(Monitoreo.id == monitoreo_id).first()

def get_monitoreos_por_programa(db: Session, programa_id: int):
    """Obtener todos los monitoreos de un programa específico"""
    return db.query(Monitoreo).filter(Monitoreo.programa_id == programa_id).all()

def create_monitoreo(db: Session, data: MonitoreoCreate):
    """Crear un nuevo monitoreo"""
    # Verificar que el programa existe
    programa = db.query(Programa).filter(Programa.id == data.programa_id).first()
    if not programa:
        raise HTTPException(status_code=404, detail="Programa no encontrado")
    
    monitoreo = Monitoreo(**data.model_dump())
    db.add(monitoreo)
    db.commit()
    db.refresh(monitoreo)
    return monitoreo

def update_monitoreo(db: Session, monitoreo: Monitoreo, data: MonitoreoUpdate):
    """Actualizar un monitoreo existente"""
    update_data = data.model_dump(exclude_unset=True)
    
    # Si se cambia programa_id, verificar que el nuevo programa exista
    if 'programa_id' in update_data:
        programa = db.query(Programa).filter(Programa.id == update_data['programa_id']).first()
        if not programa:
            raise HTTPException(status_code=404, detail="Programa no encontrado")
    
    for field, value in update_data.items():
        setattr(monitoreo, field, value)
    
    db.commit()
    db.refresh(monitoreo)
    return monitoreo

def delete_monitoreo(db: Session, monitoreo: Monitoreo):
    """Eliminar un monitoreo (borrado físico)"""
    db.delete(monitoreo)
    db.commit()
    return {"message": "Monitoreo eliminado correctamente"}