from sqlalchemy.orm import Session
from app.core.config import settings
from app.db.models import (
    Rol, Granja, Programa, TipoLote, CategoriaInventario # Eliminamos TipoLabor de la importación
)

def inicializar_datos_por_defecto(db: Session):
    """Inicializar todos los datos por defecto del sistema"""
    
    datos_inicializados = {
        "roles": inicializar_roles(db),
        "granjas": inicializar_granjas(db),
        "programas": inicializar_programas(db),
        "tipos_lote": inicializar_tipos_lote(db),
        "categorias_inventario": inicializar_categorias_inventario(db),
        # Se elimina la inicialización de labores
    }
    
    return datos_inicializados

# ----------------------------------------------------------------------
# FUNCIONES QUE LEEN DEL .env (CON VERIFICACIÓN DE EXISTENCIA)
# ----------------------------------------------------------------------

def inicializar_roles(db: Session):
    """Inicializar roles del sistema (si están definidos en el .env)"""
    roles_creados = []
    
    # AÑADIMOS ESTA VERIFICACIÓN
    if settings.ROLES_POR_DEFECTO is None:
        return roles_creados # Retorna lista vacía si el dato no se cargó del .env
        
    for nombre_rol, info in settings.ROLES_POR_DEFECTO.items():
        rol_existente = db.query(Rol).filter(Rol.nombre == nombre_rol).first()
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

def inicializar_granjas(db: Session):
    """Inicializar granjas predefinidas (si están definidas en el .env)"""
    granjas_creadas = []
    
    # AÑADIMOS ESTA VERIFICACIÓN
    if settings.GRANJAS_PREDEFINIDAS is None:
        return granjas_creadas # Retorna lista vacía si el dato no se cargó del .env
        
    for granja_data in settings.GRANJAS_PREDEFINIDAS:
        granja_existente = db.query(Granja).filter(Granja.nombre == granja_data["nombre"]).first()
        if not granja_existente:
            db_granja = Granja(
                nombre=granja_data["nombre"],
                ubicacion=granja_data["ubicacion"]
            )
            db.add(db_granja)
            granjas_creadas.append(granja_data["nombre"])
    
    if granjas_creadas:
        db.commit()
    
    return granjas_creadas

def inicializar_programas(db: Session):
    """Inicializar programas agrícolas y pecuarios (si están definidos en el .env)"""
    programas_creados = []
    
    # Programas agrícolas
    # AÑADIMOS ESTA VERIFICACIÓN
    if settings.PROGRAMAS_AGRICOLAS is not None:
        for programa_data in settings.PROGRAMAS_AGRICOLAS:
            programa_existente = db.query(Programa).filter(Programa.nombre == programa_data["nombre"]).first()
            if not programa_existente:
                db_programa = Programa(
                    nombre=programa_data["nombre"],
                    tipo=programa_data["tipo"],
                    descripcion=f"Programa de {programa_data['nombre']}"
                )
                db.add(db_programa)
                programas_creados.append(programa_data["nombre"])
    
    # Programas pecuarios
    # AÑADIMOS ESTA VERIFICACIÓN
    if settings.PROGRAMAS_PECUARIOS is not None:
        for programa_data in settings.PROGRAMAS_PECUARIOS:
            programa_existente = db.query(Programa).filter(Programa.nombre == programa_data["nombre"]).first()
            if not programa_existente:
                db_programa = Programa(
                    nombre=programa_data["nombre"],
                    tipo=programa_data["tipo"],
                    descripcion=f"Programa de {programa_data['nombre']}"
                )
                db.add(db_programa)
                programas_creados.append(programa_data["nombre"])
    
    if programas_creados:
        db.commit()
    
    return programas_creados

# ----------------------------------------------------------------------
# FUNCIONES QUE AÚN TIENEN DATOS PREDEFINIDOS EN EL CÓDIGO
# ----------------------------------------------------------------------

def inicializar_tipos_lote(db: Session):
    """Inicializar tipos de lote"""
    tipos = [
        {"nombre": "Lote", "descripcion": "Área de cultivo agrícola"},
        {"nombre": "Galpon", "descripcion": "Instalación para producción pecuaria"}
    ]
    
    tipos_creados = []
    for tipo_data in tipos:
        tipo_existente = db.query(TipoLote).filter(TipoLote.nombre == tipo_data["nombre"]).first()
        if not tipo_existente:
            db_tipo = TipoLote(**tipo_data)
            db.add(db_tipo)
            tipos_creados.append(tipo_data["nombre"])
    
    if tipos_creados:
        db.commit()
    
    return tipos_creados

def inicializar_categorias_inventario(db: Session):
    """Inicializar categorías de inventario"""
    categorias = [
        {"nombre": "herramienta", "descripcion": "Herramientas y equipos"},
        {"nombre": "insumo", "descripcion": "Insumos y materiales"}
    ]
    
    categorias_creadas = []
    for categoria_data in categorias:
        categoria_existente = db.query(CategoriaInventario).filter(
            CategoriaInventario.nombre == categoria_data["nombre"]
        ).first()
        if not categoria_existente:
            db_categoria = CategoriaInventario(**categoria_data)
            db.add(db_categoria)
            categorias_creadas.append(categoria_data["nombre"])
    
    if categorias_creadas:
        db.commit()
    
    return categorias_creadas
