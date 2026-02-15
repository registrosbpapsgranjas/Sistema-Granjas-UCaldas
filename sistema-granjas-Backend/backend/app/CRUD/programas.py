from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.db.models import Programa, Usuario, Granja
from app.schemas.programa_schema import ProgramaCreate, ProgramaUpdate

# Funciones existentes (las mantienes)
def get_programas(db: Session):
    return db.query(Programa).filter(Programa.activo == True).all()

def get_programa(db: Session, programa_id: int):
    return db.query(Programa).filter(Programa.id == programa_id).first()

def create_programa(db: Session, data: ProgramaCreate):
    # Crear programa sin las granjas
    programa = Programa(
        nombre=data.nombre,
        descripcion=data.descripcion,
        tipo=data.tipo,
        activo=True
    )
    db.add(programa)
    db.flush()  # Para obtener el ID antes de commit

    # Asignar granjas si se proporcionaron
    if data.granjas_ids:
        granjas = db.query(Granja).filter(Granja.id.in_(data.granjas_ids)).all()
        # Verificar que todos los IDs existan
        if len(granjas) != len(data.granjas_ids):
            raise HTTPException(status_code=400, detail="Algunas granjas no existen")
        programa.granjas = granjas  # Asignar la lista de objetos Granja

    db.commit()
    db.refresh(programa)
    return programa

def update_programa(db: Session, programa: Programa, data: ProgramaUpdate):
    # Actualizar campos básicos
    update_data = data.dict(exclude_unset=True)
    for field, value in update_data.items():
        if field != 'granjas_ids':
            setattr(programa, field, value)

    # Manejar actualización de granjas si se envió el campo
    if 'granjas_ids' in update_data and data.granjas_ids is not None:
        granjas = db.query(Granja).filter(Granja.id.in_(data.granjas_ids)).all()
        if len(granjas) != len(data.granjas_ids):
            raise HTTPException(status_code=400, detail="Algunas granjas no existen")
        programa.granjas = granjas  # Reemplaza la lista de granjas

    db.commit()
    db.refresh(programa)
    return programa

def delete_programa(db: Session, programa: Programa):
    programa.activo = False
    db.commit()
    return programa

# === NUEVAS FUNCIONES PARA ASIGNACIÓN DE USUARIOS ===

def asignar_usuario_programa(db: Session, programa_id: int, usuario_id: int):
    programa = db.query(Programa).filter(Programa.id == programa_id).first()
    if not programa:
        raise HTTPException(status_code=404, detail="Programa no encontrado")
    
    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    # Verificar si ya está asignado
    if usuario in programa.usuarios:
        raise HTTPException(status_code=400, detail="El usuario ya está asignado a este programa")
    
    programa.usuarios.append(usuario)
    db.commit()
    
    return programa

def desasignar_usuario_programa(db: Session, programa_id: int, usuario_id: int):
    programa = db.query(Programa).filter(Programa.id == programa_id).first()
    if not programa:
        raise HTTPException(status_code=404, detail="Programa no encontrado")
    
    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    # Verificar si está asignado
    if usuario not in programa.usuarios:
        raise HTTPException(status_code=400, detail="El usuario no está asignado a este programa")
    
    programa.usuarios.remove(usuario)
    db.commit()
    
    return {"message": "Usuario desasignado correctamente del programa"}

def listar_usuarios_programa(db: Session, programa_id: int):
    programa = db.query(Programa).filter(Programa.id == programa_id).first()
    if not programa:
        raise HTTPException(status_code=404, detail="Programa no encontrado")
    
    usuarios_info = []
    for usuario in programa.usuarios:
        usuario_info = {
            "id": usuario.id,
            "nombre": usuario.nombre,
            "email": usuario.email,
            "rol": usuario.rol.nombre if usuario.rol else None,
            "activo": usuario.activo
        }
        usuarios_info.append(usuario_info)
    
    return usuarios_info

# === FUNCIONES PARA GRANJAS (asignación individual) ===

def asignar_granja_programa(db: Session, programa_id: int, granja_id: int):
    programa = db.query(Programa).filter(Programa.id == programa_id).first()
    if not programa:
        raise HTTPException(status_code=404, detail="Programa no encontrado")
    
    granja = db.query(Granja).filter(Granja.id == granja_id).first()
    if not granja:
        raise HTTPException(status_code=404, detail="Granja no encontrada")
    
    # Verificar si ya está asignada
    if granja in programa.granjas:
        raise HTTPException(status_code=400, detail="La granja ya está asignada a este programa")
    
    programa.granjas.append(granja)
    db.commit()
    
    return programa

def desasignar_granja_programa(db: Session, programa_id: int, granja_id: int):
    programa = db.query(Programa).filter(Programa.id == programa_id).first()
    if not programa:
        raise HTTPException(status_code=404, detail="Programa no encontrado")
    
    granja = db.query(Granja).filter(Granja.id == granja_id).first()
    if not granja:
        raise HTTPException(status_code=404, detail="Granja no encontrada")
    
    # Verificar si está asignada
    if granja not in programa.granjas:
        raise HTTPException(status_code=400, detail="La granja no está asignada a este programa")
    
    programa.granjas.remove(granja)
    db.commit()
    
    return {"message": "Granja desasignada correctamente del programa"}

def listar_granjas_programa(db: Session, programa_id: int):
    programa = db.query(Programa).filter(Programa.id == programa_id).first()
    if not programa:
        raise HTTPException(status_code=404, detail="Programa no encontrado")
    
    granjas_info = []
    for granja in programa.granjas:
        granja_info = {
            "id": granja.id,
            "nombre": granja.nombre,
            "ubicacion": granja.ubicacion,
            "activo": granja.activo
        }
        granjas_info.append(granja_info)
    
    return granjas_info

# Función auxiliar para convertir programa a diccionario con relaciones
def _programa_a_dict(programa: Programa):
    """Convierte programa a diccionario con relaciones cargadas"""
    usuarios_info = []
    for usuario in programa.usuarios:
        usuarios_info.append({
            "id": usuario.id,
            "nombre": usuario.nombre,
            "email": usuario.email,
            "rol": usuario.rol.nombre if usuario.rol else None
        })
    
    granjas_info = []
    for granja in programa.granjas:
        granjas_info.append({
            "id": granja.id,
            "nombre": granja.nombre,
            "ubicacion": granja.ubicacion
        })
    
    return {
        "id": programa.id,
        "nombre": programa.nombre,
        "descripcion": programa.descripcion,
        "tipo": programa.tipo,
        "activo": programa.activo,
        "fecha_creacion": programa.fecha_creacion,
        "usuarios": usuarios_info,
        "granjas": granjas_info
    }