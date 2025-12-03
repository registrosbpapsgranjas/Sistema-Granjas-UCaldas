from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.db.models import Granja, Usuario, Programa
from app.schemas.granja_schema import GranjaCreate, GranjaUpdate

# Funciones existentes (las mantienes)
def get_all(db: Session, skip: int = 0, limit: int = 50):
    return db.query(Granja).offset(skip).limit(limit).all()

def get_by_id(db: Session, granja_id: int):
    return db.query(Granja).filter(Granja.id == granja_id).first()

def create(db: Session, granja_data: GranjaCreate):
    nueva_granja = Granja(**granja_data.dict())
    db.add(nueva_granja)
    db.commit()
    db.refresh(nueva_granja)
    return nueva_granja

def update(db: Session, granja: Granja, data: GranjaUpdate):
    update_data = data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(granja, field, value)
    db.commit()
    db.refresh(granja)
    return granja

def delete(db: Session, granja: Granja):
    db.delete(granja)
    db.commit()

# === NUEVAS FUNCIONES PARA ASIGNACIÓN DE USUARIOS Y PROGRAMAS ===

def asignar_usuario_granja(db: Session, granja_id: int, usuario_id: int):
    granja = db.query(Granja).filter(Granja.id == granja_id).first()
    if not granja:
        raise HTTPException(status_code=404, detail="Granja no encontrada")
    
    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    # Verificar si ya está asignado
    if usuario in granja.usuarios:
        raise HTTPException(status_code=400, detail="El usuario ya está asignado a esta granja")
    
    granja.usuarios.append(usuario)
    db.commit()
    
    return granja

def desasignar_usuario_granja(db: Session, granja_id: int, usuario_id: int):
    granja = db.query(Granja).filter(Granja.id == granja_id).first()
    if not granja:
        raise HTTPException(status_code=404, detail="Granja no encontrada")
    
    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    # Verificar si está asignado
    if usuario not in granja.usuarios:
        raise HTTPException(status_code=400, detail="El usuario no está asignado a esta granja")
    
    granja.usuarios.remove(usuario)
    db.commit()
    
    return {"message": "Usuario desasignado correctamente de la granja"}

def listar_usuarios_granja(db: Session, granja_id: int):
    granja = db.query(Granja).filter(Granja.id == granja_id).first()
    if not granja:
        raise HTTPException(status_code=404, detail="Granja no encontrada")
    
    usuarios_info = []
    for usuario in granja.usuarios:
        usuario_info = {
            "id": usuario.id,
            "nombre": usuario.nombre,
            "email": usuario.email,
            "rol": usuario.rol.nombre if usuario.rol else None,
            "activo": usuario.activo
        }
        usuarios_info.append(usuario_info)
    
    return usuarios_info

def asignar_programa_granja(db: Session, granja_id: int, programa_id: int):
    granja = db.query(Granja).filter(Granja.id == granja_id).first()
    if not granja:
        raise HTTPException(status_code=404, detail="Granja no encontrada")
    
    programa = db.query(Programa).filter(Programa.id == programa_id).first()
    if not programa:
        raise HTTPException(status_code=404, detail="Programa no encontrado")
    
    # Verificar si ya está asignado
    if programa in granja.programas:
        raise HTTPException(status_code=400, detail="El programa ya está asignado a esta granja")
    
    granja.programas.append(programa)
    db.commit()
    
    return granja

def desasignar_programa_granja(db: Session, granja_id: int, programa_id: int):
    granja = db.query(Granja).filter(Granja.id == granja_id).first()
    if not granja:
        raise HTTPException(status_code=404, detail="Granja no encontrada")
    
    programa = db.query(Programa).filter(Programa.id == programa_id).first()
    if not programa:
        raise HTTPException(status_code=404, detail="Programa no encontrado")
    
    # Verificar si está asignado
    if programa not in granja.programas:
        raise HTTPException(status_code=400, detail="El programa no está asignado a esta granja")
    
    granja.programas.remove(programa)
    db.commit()
    
    return {"message": "Programa desasignado correctamente de la granja"}

def listar_programas_granja(db: Session, granja_id: int):
    granja = db.query(Granja).filter(Granja.id == granja_id).first()
    if not granja:
        raise HTTPException(status_code=404, detail="Granja no encontrada")
    
    programas_info = []
    for programa in granja.programas:
        programa_info = {
            "id": programa.id,
            "nombre": programa.nombre,
            "tipo": programa.tipo,
            "descripcion": programa.descripcion,
            "activo": programa.activo
        }
        programas_info.append(programa_info)
    
    return programas_info

# Función auxiliar para convertir granja a diccionario con relaciones
def _granja_a_dict(granja: Granja):
    """Convierte granja a diccionario con relaciones cargadas"""
    usuarios_info = []
    for usuario in granja.usuarios:
        usuarios_info.append({
            "id": usuario.id,
            "nombre": usuario.nombre,
            "email": usuario.email,
            "rol": usuario.rol.nombre if usuario.rol else None
        })
    
    programas_info = []
    for programa in granja.programas:
        programas_info.append({
            "id": programa.id,
            "nombre": programa.nombre,
            "tipo": programa.tipo
        })
    
    lotes_info = []
    for lote in granja.lotes:
        lotes_info.append({
            "id": lote.id,
            "nombre": lote.nombre,
            "estado": lote.estado,
            "cultivo": lote.nombre_cultivo
        })
    
    return {
        "id": granja.id,
        "nombre": granja.nombre,
        "ubicacion": granja.ubicacion,
        "activo": granja.activo,
        "fecha_creacion": granja.fecha_creacion,
        "usuarios": usuarios_info,
        "programas": programas_info,
        "lotes": lotes_info
    }