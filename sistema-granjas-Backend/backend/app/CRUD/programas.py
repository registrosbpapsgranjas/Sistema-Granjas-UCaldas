from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException
from app.db.models import Programa, Usuario, Granja
from app.schemas.programa_schema import ProgramaCreate, ProgramaUpdate
from typing import List, Optional

def get_programas(db: Session, skip: int = 0, limit: int = 100, solo_activos: bool = True):
    """Obtener todos los programas con paginación"""
    query = db.query(Programa)
    if solo_activos:
        query = query.filter(Programa.activo == True)
    return query.offset(skip).limit(limit).all()

def get_programa(db: Session, programa_id: int):
    """Obtener un programa por su ID"""
    return db.query(Programa).filter(Programa.id == programa_id).first()

def get_programa_con_relaciones(db: Session, programa_id: int):
    """Obtener un programa con sus relaciones (usuarios y granjas)"""
    programa = db.query(Programa).options(
        joinedload(Programa.usuarios),
        joinedload(Programa.granjas)
    ).filter(Programa.id == programa_id).first()
    
    if not programa:
        raise HTTPException(status_code=404, detail="Programa no encontrado")
    
    return programa

def create_programa(db: Session, data: ProgramaCreate):
    """Crear un nuevo programa"""
    # Validar que el tipo sea correcto
    tipos_permitidos = ['agricola', 'pecuario', 'prueba']
    if data.tipo not in tipos_permitidos:
        raise HTTPException(status_code=400, detail=f"Tipo no válido. Permitidos: {tipos_permitidos}")
    
    programa = Programa(
        nombre=data.nombre,
        descripcion=data.descripcion,
        tipo=data.tipo,
        activo=True
    )
    db.add(programa)
    db.flush()

    # Asignar granjas si se proporcionaron
    if data.granjas_ids:
        granjas = db.query(Granja).filter(Granja.id.in_(data.granjas_ids)).all()
        if len(granjas) != len(data.granjas_ids):
            db.rollback()
            raise HTTPException(status_code=400, detail="Algunas granjas no existen")
        programa.granjas = granjas

    db.commit()
    db.refresh(programa)
    return programa

def update_programa(db: Session, programa: Programa, data: ProgramaUpdate):
    """Actualizar un programa existente"""
    update_data = data.dict(exclude_unset=True)
    
    for field, value in update_data.items():
        if field != 'granjas_ids':
            setattr(programa, field, value)

    # Validar tipo si se está actualizando
    if 'tipo' in update_data and data.tipo:
        tipos_permitidos = ['agricola', 'pecuario', 'prueba']
        if data.tipo not in tipos_permitidos:
            raise HTTPException(status_code=400, detail=f"Tipo no válido. Permitidos: {tipos_permitidos}")

    if 'granjas_ids' in update_data and data.granjas_ids is not None:
        if data.granjas_ids:  # Si hay IDs, validar que existan
            granjas = db.query(Granja).filter(Granja.id.in_(data.granjas_ids)).all()
            if len(granjas) != len(data.granjas_ids):
                db.rollback()
                raise HTTPException(status_code=400, detail="Algunas granjas no existen")
            programa.granjas = granjas
        else:  # Si es lista vacía, remover todas las asignaciones
            programa.granjas = []

    db.commit()
    db.refresh(programa)
    return programa

def delete_programa(db: Session, programa: Programa):
    """Eliminar (desactivar) un programa"""
    programa.activo = False
    db.commit()
    return {"message": "Programa desactivado correctamente"}

# === ASIGNACIÓN DE USUARIOS ===
def asignar_usuario_programa(db: Session, programa_id: int, usuario_id: int):
    """Asignar un usuario a un programa"""
    programa = get_programa(db, programa_id)
    if not programa:
        raise HTTPException(status_code=404, detail="Programa no encontrado")
    
    if not programa.activo:
        raise HTTPException(status_code=400, detail="No se pueden asignar usuarios a un programa inactivo")
    
    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    if not usuario.activo:
        raise HTTPException(status_code=400, detail="No se puede asignar un usuario inactivo")
    
    if usuario in programa.usuarios:
        raise HTTPException(status_code=400, detail="El usuario ya está asignado a este programa")
    
    programa.usuarios.append(usuario)
    db.commit()
    return {"message": "Usuario asignado correctamente"}

def desasignar_usuario_programa(db: Session, programa_id: int, usuario_id: int):
    """Desasignar un usuario de un programa"""
    programa = get_programa(db, programa_id)
    if not programa:
        raise HTTPException(status_code=404, detail="Programa no encontrado")
    
    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    if usuario not in programa.usuarios:
        raise HTTPException(status_code=400, detail="El usuario no está asignado a este programa")
    
    programa.usuarios.remove(usuario)
    db.commit()
    return {"message": "Usuario desasignado correctamente"}

def listar_usuarios_programa(db: Session, programa_id: int):
    """Listar todos los usuarios asignados a un programa"""
    programa = get_programa(db, programa_id)
    if not programa:
        raise HTTPException(status_code=404, detail="Programa no encontrado")
    
    return programa.usuarios

# === ASIGNACIÓN DE GRANJAS ===
def asignar_granja_programa(db: Session, programa_id: int, granja_id: int):
    """Asignar una granja a un programa"""
    programa = get_programa(db, programa_id)
    if not programa:
        raise HTTPException(status_code=404, detail="Programa no encontrado")
    
    if not programa.activo:
        raise HTTPException(status_code=400, detail="No se pueden asignar granjas a un programa inactivo")
    
    granja = db.query(Granja).filter(Granja.id == granja_id).first()
    if not granja:
        raise HTTPException(status_code=404, detail="Granja no encontrada")
    
    if not granja.activo:
        raise HTTPException(status_code=400, detail="No se puede asignar una granja inactiva")
    
    if granja in programa.granjas:
        raise HTTPException(status_code=400, detail="La granja ya está asignada a este programa")
    
    programa.granjas.append(granja)
    db.commit()
    return {"message": "Granja asignada correctamente"}

def desasignar_granja_programa(db: Session, programa_id: int, granja_id: int):
    """Desasignar una granja de un programa"""
    programa = get_programa(db, programa_id)
    if not programa:
        raise HTTPException(status_code=404, detail="Programa no encontrado")
    
    granja = db.query(Granja).filter(Granja.id == granja_id).first()
    if not granja:
        raise HTTPException(status_code=404, detail="Granja no encontrada")
    
    if granja not in programa.granjas:
        raise HTTPException(status_code=400, detail="La granja no está asignada a este programa")
    
    programa.granjas.remove(granja)
    db.commit()
    return {"message": "Granja desasignada correctamente"}

def listar_granjas_programa(db: Session, programa_id: int):
    """Listar todas las granjas asignadas a un programa"""
    programa = get_programa(db, programa_id)
    if not programa:
        raise HTTPException(status_code=404, detail="Programa no encontrado")
    
    return programa.granjas

# === FUNCIONES DE FILTRADO ===
def get_programas_por_granja(db: Session, granja_id: int):
    """Obtener todos los programas asignados a una granja específica"""
    return db.query(Programa).join(
        Programa.granjas
    ).filter(
        Granja.id == granja_id,
        Programa.activo == True
    ).all()

def get_programas_con_granjas(db: Session, skip: int = 0, limit: int = 100):
    """Obtener programas con sus granjas asignadas"""
    programas = db.query(Programa).options(
        joinedload(Programa.granjas)
    ).filter(Programa.activo == True).offset(skip).limit(limit).all()
    
    return programas

def get_programas_por_granja_con_granjas(db: Session, granja_id: int):
    """Obtener programas filtrados por granja con sus granjas asignadas"""
    programas = db.query(Programa).options(
        joinedload(Programa.granjas)
    ).join(
        Programa.granjas
    ).filter(
        Granja.id == granja_id,
        Programa.activo == True
    ).all()
    
    return programas