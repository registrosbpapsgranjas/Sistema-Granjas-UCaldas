from sqlalchemy.orm import Session
from app.db.models import Rol
from app.schemas.rol_schema import RolCreate, RolUpdate
from app.core.config import settings

def get_rol_by_nombre(db: Session, nombre: str):
    return db.query(Rol).filter(Rol.nombre == nombre, Rol.activo == True).first()

def get_rol_by_id(db: Session, rol_id: int):
    return db.query(Rol).filter(Rol.id == rol_id, Rol.activo == True).first()

def get_roles_activos(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Rol).filter(Rol.activo == True).offset(skip).limit(limit).all()

def get_roles_para_registro(db: Session):
    """Obtiene roles que pueden ser seleccionados en el registro"""
    return db.query(Rol).filter(
        Rol.activo == True, 
        Rol.nombre.in_(settings.ROLES_PERMITIDOS_REGISTRO)
    ).all()

def create_rol(db: Session, rol: RolCreate):
    db_rol = Rol(**rol.dict())
    db.add(db_rol)
    db.commit()
    db.refresh(db_rol)
    return db_rol

def inicializar_roles_por_defecto(db: Session):
    """Inicializa los roles por defecto en la base de datos"""
    roles_creados = []
    for nombre_rol, info in settings.ROLES_POR_DEFECTO.items():
        rol_existente = get_rol_by_nombre(db, nombre_rol)
        if not rol_existente:
            db_rol = Rol(
                nombre=nombre_rol,
                descripcion=info["descripcion"],
                nivel_permiso=info["nivel_permiso"]
            )
            db.add(db_rol)
            roles_creados.append(nombre_rol)
    
    if roles_creados:
        db.commit()
    
    return roles_creados