from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.db.models import Usuario
from app.schemas.usuario_schema import UsuarioCreate, UsuarioUpdate
from app.core.security import get_password_hash

def get_usuario_by_id(db: Session, usuario_id: int):
    return db.query(Usuario).filter(Usuario.id == usuario_id, Usuario.activo == True).first()

def get_usuario_by_email(db: Session, email: str):
    return db.query(Usuario).filter(Usuario.email == email, Usuario.activo == True).first()

def get_usuarios(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Usuario).filter(Usuario.activo == True).offset(skip).limit(limit).all()

def create_usuario(db: Session, usuario: UsuarioCreate, password: str = None, auth_provider: str = "traditional"):
    db_usuario = Usuario(
        nombre=usuario.nombre,
        email=usuario.email,
        rol_id=usuario.rol_id,
        activo=True,
        auth_provider=auth_provider
    )
    
    # Si se proporciona password, hashearlo
    if password:
        db_usuario.password_hash = get_password_hash(password)
    
    db.add(db_usuario)
    db.commit()
    db.refresh(db_usuario)
    return db_usuario

def update_usuario(db: Session, usuario_id: int, usuario_update: UsuarioUpdate):
    db_usuario = get_usuario_by_id(db, usuario_id)
    if db_usuario:
        update_data = usuario_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_usuario, field, value)
        db.commit()
        db.refresh(db_usuario)
    return db_usuario

def delete_usuario(db: Session, usuario_id: int):
    db_usuario = get_usuario_by_id(db, usuario_id)
    if db_usuario:
        db_usuario.activo = False
        db.commit()
        return True
    return False

def cambiar_rol_usuario(db: Session, usuario_id: int, nuevo_rol_id: int):
    db_usuario = get_usuario_by_id(db, usuario_id)
    if db_usuario:
        db_usuario.rol_id = nuevo_rol_id
        db.commit()
        db.refresh(db_usuario)
        return db_usuario
    return None

def search_usuarios(db: Session, query: str):
    return db.query(Usuario).filter(
        Usuario.activo == True,
        or_(
            Usuario.nombre.ilike(f"%{query}%"),
            Usuario.email.ilike(f"%{query}%")
        )
    ).all()

def update_password(db: Session, usuario_id: int, new_password: str):
    db_usuario = get_usuario_by_id(db, usuario_id)
    if db_usuario:
        db_usuario.password_hash = get_password_hash(new_password)
        db.commit()
        return True
    return False