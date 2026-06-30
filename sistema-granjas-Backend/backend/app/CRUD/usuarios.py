from sqlalchemy.orm import Session
from sqlalchemy import or_
from sqlalchemy.exc import IntegrityError
from app.db.models import Usuario
from app.schemas.usuario_schema import UsuarioCreate, UsuarioUpdate
from app.core.security import get_password_hash

def get_usuario_by_id(db: Session, usuario_id: int, incluir_inactivos: bool = True):
    query = db.query(Usuario).filter(Usuario.id == usuario_id)
    if not incluir_inactivos:
        query = query.filter(Usuario.activo == True)
    return query.first()

def get_usuario_by_email(db: Session, email: str):
    # Para autenticación, siempre buscar incluso si está inactivo
    return db.query(Usuario).filter(Usuario.email == email).first()

def get_usuarios(db: Session, skip: int = 0, limit: int = 100, incluir_inactivos: bool = True):
    query = db.query(Usuario)
    if not incluir_inactivos:
        query = query.filter(Usuario.activo == True)
    return query.offset(skip).limit(limit).all()

def create_usuario(db: Session, usuario: UsuarioCreate, password: str = None, auth_provider: str = "traditional"):
    db_usuario = Usuario(
        nombre=usuario.nombre,
        email=usuario.email,
        rol_id=usuario.rol_id,
        activo=True,
        auth_provider=auth_provider
    )
    
    if password:
        db_usuario.password_hash = get_password_hash(password)
    
    db.add(db_usuario)
    db.commit()
    db.refresh(db_usuario)
    return db_usuario

def update_usuario(db: Session, usuario_id: int, usuario_update: UsuarioUpdate):
    # Usar get_usuario_by_id con incluir_inactivos=True para poder actualizar inactivos
    db_usuario = get_usuario_by_id(db, usuario_id, incluir_inactivos=True)
    if db_usuario:
        update_data = usuario_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_usuario, field, value)
        db.commit()
        db.refresh(db_usuario)
    return db_usuario

def delete_usuario(db: Session, usuario_id: int):
    """Soft-delete: desactiva el usuario sin eliminarlo de la BD."""
    db_usuario = get_usuario_by_id(db, usuario_id, incluir_inactivos=True)
    if db_usuario:
        db_usuario.activo = False
        db.commit()
        return True
    return False


def hard_delete_usuario(db: Session, usuario_id: int) -> dict:
    """
    Elimina permanentemente el usuario de la BD.

    Flujo:
    1. Verifica que el usuario exista.
    2. Comprueba si tiene registros en tablas con FK NOT NULL (recomendaciones,
       diagnósticos, evidencias). Si los tiene, devuelve {'ok': False, 'reason': ...}.
    3. Limpia relaciones muchos-a-muchos (granjas, programas) y nullifica
       labores.trabajador_id (FK nullable).
    4. Elimina el usuario (ChatSesion se elimina en cascada por ondelete=CASCADE).
    """
    from app.db.models import Recomendacion, Diagnostico, Evidencia, Labor

    db_usuario = get_usuario_by_id(db, usuario_id, incluir_inactivos=True)
    if not db_usuario:
        return {'ok': False, 'reason': 'not_found'}

    # Verificar registros bloqueantes
    tiene_recomendaciones = db.query(Recomendacion).filter(
        Recomendacion.docente_id == usuario_id
    ).first()
    tiene_diagnosticos = db.query(Diagnostico).filter(
        Diagnostico.usuario_id == usuario_id
    ).first()
    tiene_evidencias = db.query(Evidencia).filter(
        Evidencia.usuario_id == usuario_id
    ).first()

    bloqueantes = []
    if tiene_recomendaciones:
        bloqueantes.append("recomendaciones")
    if tiene_diagnosticos:
        bloqueantes.append("diagnósticos")
    if tiene_evidencias:
        bloqueantes.append("evidencias")

    if bloqueantes:
        return {
            'ok': False,
            'reason': 'has_records',
            'records': bloqueantes,
        }

    # Limpiar relaciones muchos-a-muchos
    db_usuario.granjas.clear()
    db_usuario.programas.clear()

    # Nullificar FK nullable en labores
    db.query(Labor).filter(Labor.trabajador_id == usuario_id).update(
        {'trabajador_id': None}, synchronize_session='fetch'
    )

    # Eliminar el usuario (ChatSesion se borra por CASCADE en la BD)
    db.delete(db_usuario)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        return {
            'ok': False,
            'reason': 'has_records',
            'records': ['registros asociados'],
        }
    return {'ok': True}

def cambiar_rol_usuario(db: Session, usuario_id: int, nuevo_rol_id: int):
    # Usar get_usuario_by_id con incluir_inactivos=True para poder cambiar rol de inactivos
    db_usuario = get_usuario_by_id(db, usuario_id, incluir_inactivos=True)
    if db_usuario:
        db_usuario.rol_id = nuevo_rol_id
        db.commit()
        db.refresh(db_usuario)
        return db_usuario
    return None

def search_usuarios(db: Session, query: str, incluir_inactivos: bool = True):
    db_query = db.query(Usuario).filter(
        or_(
            Usuario.nombre.ilike(f"%{query}%"),
            Usuario.email.ilike(f"%{query}%")
        )
    )
    if not incluir_inactivos:
        db_query = db_query.filter(Usuario.activo == True)
    return db_query.all()

def get_trabajadores(db: Session, programa_ids: list = None, incluir_inactivos: bool = True):
    from app.db.models import Rol, usuario_programa
    query = db.query(Usuario).join(Rol, Usuario.rol_id == Rol.id).filter(
        Rol.nombre == "trabajador"
    )
    if not incluir_inactivos:
        query = query.filter(Usuario.activo == True)
    if programa_ids is not None and len(programa_ids) > 0:
        query = query.join(usuario_programa, Usuario.id == usuario_programa.c.usuario_id)\
                     .filter(usuario_programa.c.programa_id.in_(programa_ids))
    return query.all()

def update_password(db: Session, usuario_id: int, new_password: str):
    # Usar get_usuario_by_id con incluir_inactivos=True para poder actualizar contraseña de inactivos
    db_usuario = get_usuario_by_id(db, usuario_id, incluir_inactivos=True)
    if db_usuario:
        db_usuario.password_hash = get_password_hash(new_password)
        db.commit()
        return True
    return False