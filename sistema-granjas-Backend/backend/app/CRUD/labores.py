# app/CRUD/labores.py
from sqlalchemy.orm import Session
from sqlalchemy import and_, func
from datetime import datetime, timedelta
from fastapi import HTTPException
from app.db.models import (
    Labor, Usuario, Recomendacion, Lote,
    Evidencia, TipoLabor, Granja, Programa, usuario_programa, ItemInventarioPrograma
)
from app.schemas.labor_schema import (
    LaborCreate, LaborUpdate, AsignacionHerramientaRequest,
    AsignacionInsumoRequest, RegistroAvanceRequest, LaborWithRecursosResponse,
    LaborListResponse, LaborResponse
)

# Nota: Los modelos Herramienta, Insumo, MovimientoHerramienta, MovimientoInsumo, AsignacionHerramienta
# han sido eliminados. La funcionalidad de inventario será reemplazada por el nuevo sistema de
# inventario dinámico. Las funciones de asignación de recursos serán migradas posteriormente.

def crear_labor_crud(db: Session, data: LaborCreate, usuario: Usuario):
    recomendacion = db.query(Recomendacion).filter(Recomendacion.id == data.recomendacion_id).first()
    if not recomendacion:
        raise HTTPException(404, "Recomendación no encontrada")
    
    # Verificar tipo de labor
    tipo_labor = db.query(TipoLabor).filter(TipoLabor.id == data.tipo_labor_id).first()
    if not tipo_labor:
        raise HTTPException(404, "Tipo de labor no encontrado")
    
    # Solo verificar trabajador si se proporciona
    if data.trabajador_id:
        trabajador = db.query(Usuario).filter(Usuario.id == data.trabajador_id).first()
        if not trabajador or trabajador.rol.nombre != "trabajador":
            raise HTTPException(404, "Trabajador no encontrado o no tiene rol válido")
        
        if usuario.rol.nombre == "talento_humano":
            trabajador_programa_ids = {p.id for p in trabajador.programas}
            usuario_programa_ids = {p.id for p in usuario.programas}
            if not trabajador_programa_ids.intersection(usuario_programa_ids):
                raise HTTPException(403, "Solo puede asignar labores a trabajadores de su programa")
    
    if data.lote_id:
        lote = db.query(Lote).filter(Lote.id == data.lote_id).first()
        if not lote:
            raise HTTPException(404, "Lote no encontrado")
        
    labor = Labor(
        estado=data.estado,
        avance_porcentaje=data.avance_porcentaje,
        comentario=data.comentario,
        recomendacion_id=data.recomendacion_id,
        trabajador_id=data.trabajador_id,
        lote_id=data.lote_id,
        tipo_labor_id=data.tipo_labor_id,
        formulario_labor=data.formulario_labor
    )
    
    db.add(labor)
    db.commit()
    db.refresh(labor)
    _cargar_relaciones_labor(labor)
    
    return _labor_a_dict_con_recursos(labor)

def listar_labores_crud(
    db: Session, 
    skip: int = 0, 
    limit: int = 100,
    estado: str = None,
    trabajador_id: int = None,
    lote_id: int = None,
    recomendacion_id: int = None,
    tipo_labor_id: int = None,
    usuario: Usuario = None
):
    query = db.query(Labor)
    
    # Filtros opcionales
    if estado:
        query = query.filter(Labor.estado == estado)
    if trabajador_id:
        query = query.filter(Labor.trabajador_id == trabajador_id)
    if lote_id:
        query = query.filter(Labor.lote_id == lote_id)
    if recomendacion_id:
        query = query.filter(Labor.recomendacion_id == recomendacion_id)
    if tipo_labor_id:
        query = query.filter(Labor.tipo_labor_id == tipo_labor_id)
    
    # Permisos según rol
    if usuario.rol.nombre == "trabajador":
        query = query.filter(Labor.trabajador_id == usuario.id)
    elif usuario.rol.nombre == "docente" or usuario.rol.nombre == "asesor":
        query = query.join(Recomendacion).filter(Recomendacion.docente_id == usuario.id)
    elif usuario.rol.nombre == "talento_humano":
        # Obtener IDs de programas del usuario de talento_humano
        programa_ids = [programa.id for programa in usuario.programas]
        
        if programa_ids:
            # Filtrar trabajadores que tengan al menos uno de los mismos programas
            query = query.join(Usuario, Labor.trabajador_id == Usuario.id)\
                        .join(usuario_programa, Usuario.id == usuario_programa.c.usuario_id)\
                        .filter(usuario_programa.c.programa_id.in_(programa_ids))
        else:
            # Si el usuario no tiene programas, no muestra nada
            query = query.filter(False)
    
    total = query.count()
    items = query.offset(skip).limit(limit).all()
    
    # Convertir a diccionarios con recursos
    labores_dict = []
    for item in items:
        _cargar_relaciones_labor(item)
        _cargar_recursos_labor(db, item)
        labor_dict = _labor_a_dict_con_recursos(item)
        labores_dict.append(labor_dict)
    
    return {
        "items": labores_dict,
        "total": total,
        "paginas": (total + limit - 1) // limit
    }

# ========== FUNCIONES SEPARADAS PARA OBJETO Y DICCIONARIO ==========

def obtener_labor_objeto(db: Session, id: int, usuario: Usuario = None):
    """Obtiene el objeto Labor de SQLAlchemy (para actualizar/eliminar)"""
    labor = db.query(Labor).filter(Labor.id == id).first()
    if not labor:
        return None
    
    # Cargar relaciones básicas
    if labor.trabajador:
        labor.trabajador_nombre = labor.trabajador.nombre
    if labor.recomendacion:
        labor.recomendacion_titulo = labor.recomendacion.titulo
        # Cargar lote desde la recomendación si labor no tiene lote_id
        if labor.recomendacion.lote:
            labor.lote_nombre = labor.recomendacion.lote.nombre
            if labor.recomendacion.lote.granja:
                labor.granja_nombre = labor.recomendacion.lote.granja.nombre
    # Si labor tiene lote directamente
    if labor.lote:
        labor.lote_nombre = labor.lote.nombre
        if labor.lote.granja:
            labor.granja_nombre = labor.lote.granja.nombre
    if labor.tipo_labor:
        labor.tipo_labor_nombre = labor.tipo_labor.nombre
        labor.tipo_labor_descripcion = labor.tipo_labor.descripcion
    
    # Verificar permisos
    if usuario:
        if usuario.rol.nombre == "trabajador" and labor.trabajador_id != usuario.id:
            return None
        elif usuario.rol.nombre == "docente" or usuario.rol.nombre == "asesor":
            recomendacion = labor.recomendacion
            if not recomendacion or recomendacion.docente_id != usuario.id:
                return None
        elif usuario.rol.nombre == "talento_humano":
            trabajador = labor.trabajador
            if not trabajador:
                return None
            
            # CORREGIDO: Verificar que comparten al menos un programa
            # Obtener IDs de programas del trabajador
            trabajador_programa_ids = {programa.id for programa in trabajador.programas}
            
            # Obtener IDs de programas del usuario de talento_humano
            usuario_programa_ids = {programa.id for programa in usuario.programas}
            
            # Verificar que comparten al menos un programa
            if not trabajador_programa_ids.intersection(usuario_programa_ids):
                return None
    
    return labor

def obtener_labor_dict(db: Session, id: int, usuario: Usuario = None):
    """Obtiene la labor como diccionario (para respuestas API)"""
    labor = obtener_labor_objeto(db, id, usuario)
    if not labor:
        return None
    
    _cargar_recursos_labor(db, labor)
    return _labor_a_dict_con_recursos(labor)

# ========== FUNCIONES DE ACTUALIZACIÓN ==========

def actualizar_labor_crud(db: Session, labor: Labor, data: LaborUpdate, usuario: Usuario):
    """Actualiza una labor existente"""
    # Verificar permisos
    _verificar_permisos_labor(labor, usuario, "editar")
    
    update_data = data.dict(exclude_unset=True)
    
    # Si se actualiza tipo_labor_id, verificar que existe
    if 'tipo_labor_id' in update_data and update_data['tipo_labor_id']:
        tipo_labor = db.query(TipoLabor).filter(TipoLabor.id == update_data['tipo_labor_id']).first()
        if not tipo_labor:
            raise HTTPException(404, "Tipo de labor no encontrado")
    
    # Si se completa la labor, establecer fecha de finalización
    if update_data.get("estado") == "completada" and not labor.fecha_finalizacion:
        update_data["fecha_finalizacion"] = (datetime.utcnow() - timedelta(hours=5)) 
        update_data["avance_porcentaje"] = 100
    
    for attr, value in update_data.items():
        setattr(labor, attr, value)
    
    db.commit()
    db.refresh(labor)
    _cargar_relaciones_labor(labor)
    _cargar_recursos_labor(db, labor)
    
    return _labor_a_dict_con_recursos(labor)

def eliminar_labor_crud(db: Session, labor: Labor, usuario: Usuario):
    """Elimina una labor"""
    _verificar_permisos_labor(labor, usuario, "eliminar")
    
    # Verificar que no tenga evidencias asociadas
    evidencias = db.query(Evidencia).filter(Evidencia.labor_id == labor.id).count()
    
    if evidencias > 0:
        raise HTTPException(400, "No se puede eliminar labor con evidencias asociadas")
    
    db.delete(labor)
    db.commit()

# === FUNCIONES DE ASIGNACIÓN DE RECURSOS (MIGRACIÓN PENDIENTE) ===

def asignar_herramienta_crud(db: Session, labor: Labor, data: AsignacionHerramientaRequest, usuario: Usuario):
    """
    ⚠️ FUNCIONALIDAD DESCONTINUADA: La gestión de herramientas e insumos será migrada al nuevo sistema de inventario dinámico.
    Por favor, utiliza la nueva API de inventario dinámico (/api/inventario-dinamico) para gestionar recursos.
    """
    raise HTTPException(501, "La asignación de herramientas está siendo migrada. Próximamente disponible en el nuevo módulo de inventario dinámico.")

def asignar_insumo_crud(db: Session, labor: Labor, data: AsignacionInsumoRequest, usuario: Usuario):
    """
    ⚠️ FUNCIONALIDAD DESCONTINUADA: La gestión de herramientas e insumos será migrada al nuevo sistema de inventario dinámico.
    Por favor, utiliza la nueva API de inventario dinámico (/api/inventario-dinamico) para gestionar recursos.
    """
    raise HTTPException(501, "La asignación de insumos está siendo migrada. Próximamente disponible en el nuevo módulo de inventario dinámico.")

def registrar_avance_crud(db: Session, labor: Labor, data: RegistroAvanceRequest, usuario: Usuario):
    if labor.trabajador_id != usuario.id:
        raise HTTPException(403, "Solo el trabajador asignado puede registrar avance")
    
    ya_estaba_completada = labor.estado == "completada"
    labor.avance_porcentaje = data.avance_porcentaje
    labor.comentario = data.comentario
    
    if data.avance_porcentaje == 100:
        labor.estado = "completada"
        labor.fecha_finalizacion = (datetime.utcnow() - timedelta(hours=5))
        # Descontar inventario si recién se completa
        if not ya_estaba_completada:
            item_id = labor.inventario_item_id
            cantidad = labor.cantidad_usada
            if not item_id and labor.recomendacion:
                item_id = labor.recomendacion.inventario_item_id
                if not cantidad:
                    cantidad = labor.recomendacion.cantidad_sugerida
            if item_id and cantidad:
                item = db.query(ItemInventarioPrograma).filter(ItemInventarioPrograma.id == item_id).first()
                if item:
                    item.cantidad_disponible = max(0.0, item.cantidad_disponible - cantidad)
    elif data.avance_porcentaje > 0 and labor.estado == "pendiente":
        labor.estado = "en_progreso"
    
    db.commit()
    db.refresh(labor)
    _cargar_relaciones_labor(labor)
    _cargar_recursos_labor(db, labor)
    
    return _labor_a_dict_con_recursos(labor)

def completar_labor_crud(db: Session, labor: Labor, usuario: Usuario, data=None):
    _verificar_permisos_labor(labor, usuario, "completar")
    
    labor.estado = "completada"
    labor.avance_porcentaje = 100
    labor.fecha_finalizacion = (datetime.utcnow() - timedelta(hours=5))

    if data:
        if getattr(data, 'comentario', None):
            labor.comentario = data.comentario
        if getattr(data, 'inventario_item_id', None):
            labor.inventario_item_id = data.inventario_item_id
        if getattr(data, 'cantidad_usada', None):
            labor.cantidad_usada = data.cantidad_usada
        if getattr(data, 'dosis_aplicada', None):
            labor.dosis_aplicada = data.dosis_aplicada
        if getattr(data, 'unidad_dosis', None):
            labor.unidad_dosis = data.unidad_dosis

    # Descontar del inventario usando dosis_aplicada si existe, sino cantidad_usada
    item_id = labor.inventario_item_id
    cantidad_a_descontar = labor.dosis_aplicada or labor.cantidad_usada
    if not item_id and labor.recomendacion:
        item_id = labor.recomendacion.inventario_item_id
        if not cantidad_a_descontar and labor.recomendacion:
            cantidad_a_descontar = labor.recomendacion.cantidad_sugerida
    
    if item_id and cantidad_a_descontar:
        item = db.query(ItemInventarioPrograma).filter(ItemInventarioPrograma.id == item_id).first()
        if item:
            item.cantidad_disponible = max(0.0, item.cantidad_disponible - cantidad_a_descontar)
    
    db.commit()
    db.refresh(labor)
    _cargar_relaciones_labor(labor)
    _cargar_recursos_labor(db, labor)
    
    return _labor_a_dict_con_recursos(labor)

def devolver_herramienta_crud(db: Session, labor: Labor, movimiento_id: int, cantidad: int, usuario: Usuario):
    """
    ⚠️ FUNCIONALIDAD DESCONTINUADA: La gestión de herramientas e insumos será migrada al nuevo sistema de inventario dinámico.
    """
    raise HTTPException(501, "La devolución de herramientas está siendo migrada. Próximamente disponible en el nuevo módulo de inventario dinámico.")

def devolver_insumo_crud(db: Session, labor: Labor, movimiento_id: int, cantidad: float, usuario: Usuario):
    """
    ⚠️ FUNCIONALIDAD DESCONTINUADA: La gestión de herramientas e insumos será migrada al nuevo sistema de inventario dinámico.
    """
    raise HTTPException(501, "La devolución de insumos está siendo migrada. Próximamente disponible en el nuevo módulo de inventario dinámico.")

# === FUNCIONES ADICIONALES ===

def listar_labores_por_trabajador(db: Session, trabajador_id: int, skip: int = 0, limit: int = 100, estado: str = None, usuario: Usuario = None):
    if usuario.rol.nombre != "admin" and usuario.id != trabajador_id:
        raise HTTPException(403, "No puede ver labores de otros trabajadores")
    
    query = db.query(Labor).filter(Labor.trabajador_id == trabajador_id)
    
    if estado:
        query = query.filter(Labor.estado == estado)
    
    total = query.count()
    items = query.offset(skip).limit(limit).all()
    
    # Convertir a diccionarios con recursos
    labores_dict = []
    for item in items:
        _cargar_relaciones_labor(item)
        _cargar_recursos_labor(db, item)
        labor_dict = _labor_a_dict_con_recursos(item)
        labores_dict.append(labor_dict)
    
    return {
        "items": labores_dict,
        "total": total,
        "paginas": (total + limit - 1) // limit
    }

def listar_labores_por_recomendacion(db: Session, recomendacion_id: int, skip: int = 0, limit: int = 100, usuario: Usuario = None):
    query = db.query(Labor).filter(Labor.recomendacion_id == recomendacion_id)
    
    if usuario.rol.nombre == "docente" or usuario.rol.nombre == "asesor":
        recomendacion = db.query(Recomendacion).filter(Recomendacion.id == recomendacion_id).first()
        if not recomendacion or recomendacion.docente_id != usuario.id:
            raise HTTPException(403, "No tiene permisos para ver estas labores")
    
    total = query.count()
    items = query.offset(skip).limit(limit).all()
    
    # Convertir a diccionarios con recursos
    labores_dict = []
    for item in items:
        _cargar_relaciones_labor(item)
        _cargar_recursos_labor(db, item)
        labor_dict = _labor_a_dict_con_recursos(item)
        labores_dict.append(labor_dict)
    
    return {
        "items": labores_dict,
        "total": total,
        "paginas": (total + limit - 1) // limit
    }

def obtener_estadisticas_labores_crud(db: Session, usuario: Usuario):
    query = db.query(Labor)
    
    if usuario.rol.nombre == "trabajador":
        query = query.filter(Labor.trabajador_id == usuario.id)
    elif usuario.rol.nombre == "docente" or usuario.rol.nombre == "asesor":
        query = query.join(Recomendacion).filter(Recomendacion.docente_id == usuario.id)
    elif usuario.rol.nombre == "talento_humano":
        # CORREGIDO: Filtrar por programas del usuario (relación many-to-many)
        # Obtener IDs de programas del usuario
        programa_ids = [programa.id for programa in usuario.programas]
        
        if programa_ids:
            # Filtrar trabajadores que compartan al menos un programa
            query = query.join(Usuario, Labor.trabajador_id == Usuario.id)\
                         .join(usuario_programa, Usuario.id == usuario_programa.c.usuario_id)\
                         .filter(usuario_programa.c.programa_id.in_(programa_ids))
        else:
            # Usuario sin programas asignados - no muestra nada
            query = query.filter(False)
    
    total = query.count()
    
    estados = ["pendiente", "en_progreso", "completada", "cancelada"]
    stats = {estado: query.filter(Labor.estado == estado).count() for estado in estados}
    
    promedio_avance = query.with_entities(func.avg(Labor.avance_porcentaje)).scalar() or 0
    
    return {
        "total": total,
        "pendientes": stats["pendiente"],
        "en_progreso": stats["en_progreso"],
        "completadas": stats["completada"],
        "canceladas": stats["cancelada"],
        "promedio_avance": round(float(promedio_avance), 2)
    }

# === FUNCIONES AUXILIARES ===

def _verificar_permisos_labor(labor: Labor, usuario: Usuario, accion: str):
    rol = usuario.rol.nombre
    
    if rol == "admin":
        return
    
    if rol == "talento_humano":
        if accion in ["asignar_recursos", "editar", "eliminar", "devolver", "completar"]:
            trabajador = labor.trabajador
            if not trabajador:
                raise HTTPException(403, f"No tiene permisos para {accion} esta labor")
            
            # CORREGIDO: Verificar que comparten al menos un programa
            trabajador_programa_ids = {programa.id for programa in trabajador.programas}
            usuario_programa_ids = {programa.id for programa in usuario.programas}
            
            if not trabajador_programa_ids.intersection(usuario_programa_ids):
                raise HTTPException(403, f"Solo puede {accion} labores de su programa")
            return
        
        raise HTTPException(403, f"No tiene permisos para {accion} esta labor")
    
    if rol == "docente" or rol == "asesor":
        recomendacion = labor.recomendacion
        if recomendacion and recomendacion.docente_id == usuario.id:
            if accion in ["editar", "completar", "asignar_recursos"]:
                return
        raise HTTPException(403, f"No tiene permisos para {accion} esta labor")
    
    if rol == "trabajador" and labor.trabajador_id == usuario.id:
        if accion in ["registrar_avance", "completar"]:
            return
        raise HTTPException(403, f"No tiene permisos para {accion} esta labor")
    
    raise HTTPException(403, f"No tiene permisos para {accion} esta labor")

def _cargar_relaciones_labor(labor: Labor):
    if labor.trabajador:
        labor.trabajador_nombre = labor.trabajador.nombre
    if labor.recomendacion:
        labor.recomendacion_titulo = labor.recomendacion.titulo
    if labor.lote:
        labor.lote_nombre = labor.lote.nombre
        if labor.lote.granja:
            labor.granja_nombre = labor.lote.granja.nombre
    if labor.tipo_labor:
        labor.tipo_labor_nombre = labor.tipo_labor.nombre
        labor.tipo_labor_descripcion = labor.tipo_labor.descripcion

def _cargar_recursos_labor(db: Session, labor: Labor):
    """
    ✅ Carga evidencias de la labor (los recursos de inventario se migrarán al sistema dinámico)
    """
    # Evidencias
    evidencias = db.query(Evidencia).filter(Evidencia.labor_id == labor.id).all()
    evidencias_info = []
    for evidencia in evidencias:
        usuario_creador = db.query(Usuario).filter(Usuario.id == evidencia.usuario_id).first()
        creado_por_nombre = usuario_creador.nombre if usuario_creador else None
        evidencia_info = {
            "id": evidencia.id,
            "tipo": evidencia.tipo,
            "url_archivo": evidencia.url_archivo,
            "descripcion": evidencia.descripcion,
            "fecha_creacion": evidencia.fecha_creacion,
            "creado_por_nombre": creado_por_nombre
        }
        evidencias_info.append(evidencia_info)
    labor.evidencias_info = evidencias_info

    # Los recursos de inventario (herramientas, insumos) serán migrados
    labor.herramientas_resumen = []
    labor.insumos_resumen = []
    labor.herramientas_asignadas_info = []
    labor.insumos_asignados_info = []

def _labor_a_dict_con_recursos(labor: Labor):
    # Enriquecer con info del item de inventario si existe
    inventario_item_nombre = None
    inventario_item_unidad = None
    if labor.inventario_item:
        v = labor.inventario_item.valores or {}
        inventario_item_nombre = v.get("nombre") or v.get("producto") or v.get("Nombre") or f"Ítem #{labor.inventario_item_id}"
        inventario_item_unidad = labor.inventario_item.unidad_medida
    elif getattr(labor, 'recomendacion', None) and labor.recomendacion.inventario_item:
        v = labor.recomendacion.inventario_item.valores or {}
        inventario_item_nombre = v.get("nombre") or v.get("producto") or v.get("Nombre") or f"Ítem #{labor.recomendacion.inventario_item_id}"
        inventario_item_unidad = labor.recomendacion.inventario_item.unidad_medida

    return {
        "id": labor.id,
        "estado": labor.estado,
        "avance_porcentaje": labor.avance_porcentaje,
        "comentario": labor.comentario,
        "lote_id": labor.lote_id,
        "tipo_labor_id": labor.tipo_labor_id,
        "recomendacion_id": labor.recomendacion_id,
        "trabajador_id": labor.trabajador_id,
        "fecha_asignacion": labor.fecha_asignacion,
        "fecha_finalizacion": labor.fecha_finalizacion,
        "inventario_item_id": labor.inventario_item_id,
        "cantidad_usada": labor.cantidad_usada,
        "dosis_aplicada": labor.dosis_aplicada,
        "unidad_dosis": labor.unidad_dosis,
        "trabajador_nombre": getattr(labor, 'trabajador_nombre', None),
        "recomendacion_titulo": getattr(labor, 'recomendacion_titulo', None),
        "lote_nombre": getattr(labor, 'lote_nombre', None),
        "granja_nombre": getattr(labor, 'granja_nombre', None),
        "tipo_labor_nombre": getattr(labor, 'tipo_labor_nombre', None),
        "tipo_labor_descripcion": getattr(labor, 'tipo_labor_descripcion', None),
        "formulario_labor": labor.formulario_labor,
        "inventario_item_nombre": inventario_item_nombre,
        "inventario_item_unidad": inventario_item_unidad,
        "herramientas_asignadas": getattr(labor, 'herramientas_resumen', []),
        "insumos_asignados": getattr(labor, 'insumos_resumen', []),
        "evidencias": getattr(labor, 'evidencias_info', []),
        "movimientos_herramientas": getattr(labor, 'herramientas_asignadas_info', []),
        "movimientos_insumos": getattr(labor, 'insumos_asignados_info', [])
    }