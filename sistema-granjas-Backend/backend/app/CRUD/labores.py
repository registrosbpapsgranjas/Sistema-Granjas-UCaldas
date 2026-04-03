from sqlalchemy.orm import Session
from sqlalchemy import and_, func
from datetime import datetime, timedelta
from fastapi import HTTPException
from app.db.models import (
    Labor, Usuario, Recomendacion, Lote, Herramienta, Insumo,
    MovimientoHerramienta, MovimientoInsumo, AsignacionHerramienta,
    Evidencia, TipoLabor, Granja, Programa, usuario_programa
)
from app.schemas.labor_schema import (
    LaborCreate, LaborUpdate, AsignacionHerramientaRequest,
    AsignacionInsumoRequest, RegistroAvanceRequest, LaborWithRecursosResponse,
    LaborListResponse, LaborResponse
)

def crear_labor_crud(db: Session, data: LaborCreate, usuario: Usuario):
    # Verificar que la recomendación existe
    recomendacion = db.query(Recomendacion).filter(Recomendacion.id == data.recomendacion_id).first()
    if not recomendacion:
        raise HTTPException(404, "Recomendación no encontrada")
    
    # Verificar que el trabajador existe y es trabajador
    trabajador = db.query(Usuario).filter(Usuario.id == data.trabajador_id).first()
    if not trabajador or trabajador.rol.nombre != "trabajador":
        raise HTTPException(404, "Trabajador no encontrado o no tiene rol válido")
    
    # Verificar que el tipo de labor existe
    tipo_labor = db.query(TipoLabor).filter(TipoLabor.id == data.tipo_labor_id).first()
    if not tipo_labor:
        raise HTTPException(404, "Tipo de labor no encontrado")
    
    # Verificar lote si se proporciona
    if data.lote_id:
        lote = db.query(Lote).filter(Lote.id == data.lote_id).first()
        if not lote:
            raise HTTPException(404, "Lote no encontrado")
    
    # Verificar que talento_humano solo asigne a trabajadores de su programa
    if usuario.rol.nombre == "talento_humano":
        # Obtener el trabajador
        trabajador_obj = db.query(Usuario).filter(Usuario.id == data.trabajador_id).first()
        if not trabajador_obj:
            raise HTTPException(404, "Trabajador no encontrado")
        
        # Obtener IDs de programas del trabajador
        trabajador_programa_ids = {programa.id for programa in trabajador_obj.programas}
        
        # Obtener IDs de programas del usuario de talento_humano
        usuario_programa_ids = {programa.id for programa in usuario.programas}
        
        # Verificar que comparten al menos un programa
        if not trabajador_programa_ids.intersection(usuario_programa_ids):
            raise HTTPException(403, "Solo puede asignar labores a trabajadores de su programa")
        
    labor = Labor(
        estado=data.estado,
        avance_porcentaje=data.avance_porcentaje,
        comentario=data.comentario,
        recomendacion_id=data.recomendacion_id,
        trabajador_id=data.trabajador_id,
        lote_id=data.lote_id,
        tipo_labor_id=data.tipo_labor_id
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
    
    # Verificar que no tenga movimientos asociados
    mov_herramientas = db.query(MovimientoHerramienta).filter(MovimientoHerramienta.labor_id == labor.id).count()
    mov_insumos = db.query(MovimientoInsumo).filter(MovimientoInsumo.labor_id == labor.id).count()
    
    # Verificar que no tenga evidencias asociadas
    evidencias = db.query(Evidencia).filter(Evidencia.labor_id == labor.id).count()
    
    if mov_herramientas > 0 or mov_insumos > 0 or evidencias > 0:
        raise HTTPException(400, "No se puede eliminar labor con movimientos de inventario o evidencias asociadas")
    
    db.delete(labor)
    db.commit()

# === FUNCIONES DE ASIGNACIÓN DE RECURSOS ===

def asignar_herramienta_crud(db: Session, labor: Labor, data: AsignacionHerramientaRequest, usuario: Usuario):
    _verificar_permisos_labor(labor, usuario, "asignar_recursos")
    
    herramienta = db.query(Herramienta).filter(Herramienta.id == data.herramienta_id).first()
    if not herramienta:
        raise HTTPException(404, "Herramienta no encontrada")
    
    if herramienta.cantidad_disponible < data.cantidad:
        raise HTTPException(400, f"No hay suficiente disponibilidad. Disponible: {herramienta.cantidad_disponible}")
    
    movimiento = MovimientoHerramienta(
        herramienta_id=data.herramienta_id,
        labor_id=labor.id,
        cantidad=data.cantidad,
        tipo_movimiento="salida",
        observaciones=f"Asignado a labor {labor.id}"
    )
    
    herramienta.cantidad_disponible -= data.cantidad
    
    db.add(movimiento)
    db.commit()
    db.refresh(labor)
    _cargar_relaciones_labor(labor)
    _cargar_recursos_labor(db, labor)
    
    return _labor_a_dict_con_recursos(labor)

def asignar_insumo_crud(db: Session, labor: Labor, data: AsignacionInsumoRequest, usuario: Usuario):
    _verificar_permisos_labor(labor, usuario, "asignar_recursos")
    
    insumo = db.query(Insumo).filter(Insumo.id == data.insumo_id).first()
    if not insumo:
        raise HTTPException(404, "Insumo no encontrado")
    
    if insumo.cantidad_disponible < data.cantidad:
        raise HTTPException(400, f"No hay suficiente disponibilidad. Disponible: {insumo.cantidad_disponible}")
    
    # ========== CORRECCIÓN: Verificación de programa del insumo ==========
    # Necesitamos obtener el programa del lote o de la recomendación
    programa_id_labor = None
    
    # Primero intentar obtener desde el lote directo de la labor
    if labor.lote_id:
        lote = db.query(Lote).filter(Lote.id == labor.lote_id).first()
        if lote:
            programa_id_labor = lote.programa_id
    
    # Si no tiene lote directo, intentar desde la recomendación
    if not programa_id_labor and labor.recomendacion_id:
        recomendacion = db.query(Recomendacion).filter(Recomendacion.id == labor.recomendacion_id).first()
        if recomendacion and recomendacion.lote_id:
            lote_rec = db.query(Lote).filter(Lote.id == recomendacion.lote_id).first()
            if lote_rec:
                programa_id_labor = lote_rec.programa_id
    
    # Si aún no tenemos programa_id, obtenerlo del trabajador
    if not programa_id_labor:
        trabajador = db.query(Usuario).filter(Usuario.id == labor.trabajador_id).first()
        if trabajador and trabajador.programa_id:
            programa_id_labor = trabajador.programa_id
    
    # Verificar que el insumo pertenece al programa de la labor
    if programa_id_labor and insumo.programa_id != programa_id_labor:
        # Obtener nombres para el mensaje de error
        programa_insumo = db.query(Programa).filter(Programa.id == insumo.programa_id).first()
        programa_labor = db.query(Programa).filter(Programa.id == programa_id_labor).first()
        
        raise HTTPException(400, 
            f"El insumo '{insumo.nombre}' pertenece al programa '{programa_insumo.nombre if programa_insumo else 'Desconocido'}', "
            f"pero la labor está asociada al programa '{programa_labor.nombre if programa_labor else 'Desconocido'}'. "
            f"Solo puedes asignar insumos del mismo programa."
        )
    
    # ========== FIN CORRECCIÓN ==========
    
    movimiento = MovimientoInsumo(
        insumo_id=data.insumo_id,
        labor_id=labor.id,
        cantidad=data.cantidad,
        tipo_movimiento="salida",
        observaciones=f"Consumido en labor {labor.id}"
    )
    
    insumo.cantidad_disponible -= data.cantidad
    
    db.add(movimiento)
    db.commit()
    db.refresh(labor)
    _cargar_relaciones_labor(labor)
    _cargar_recursos_labor(db, labor)
    
    return _labor_a_dict_con_recursos(labor)

def registrar_avance_crud(db: Session, labor: Labor, data: RegistroAvanceRequest, usuario: Usuario):
    if labor.trabajador_id != usuario.id:
        raise HTTPException(403, "Solo el trabajador asignado puede registrar avance")
    
    labor.avance_porcentaje = data.avance_porcentaje
    labor.comentario = data.comentario
    
    if data.avance_porcentaje == 100:
        labor.estado = "completada"
        labor.fecha_finalizacion = (datetime.utcnow() - timedelta(hours=5)) 
    elif data.avance_porcentaje > 0 and labor.estado == "pendiente":
        labor.estado = "en_progreso"
    
    db.commit()
    db.refresh(labor)
    _cargar_relaciones_labor(labor)
    _cargar_recursos_labor(db, labor)
    
    return _labor_a_dict_con_recursos(labor)

def completar_labor_crud(db: Session, labor: Labor, usuario: Usuario):
    _verificar_permisos_labor(labor, usuario, "completar")
    
    labor.estado = "completada"
    labor.avance_porcentaje = 100
    labor.fecha_finalizacion = (datetime.utcnow() - timedelta(hours=5)) 
    
    db.commit()
    db.refresh(labor)
    _cargar_relaciones_labor(labor)
    _cargar_recursos_labor(db, labor)
    
    return _labor_a_dict_con_recursos(labor)

def devolver_herramienta_crud(db: Session, labor: Labor, movimiento_id: int, cantidad: int, usuario: Usuario):
    _verificar_permisos_labor(labor, usuario, "devolver")
    
    movimiento = db.query(MovimientoHerramienta).filter(
        and_(
            MovimientoHerramienta.id == movimiento_id,
            MovimientoHerramienta.labor_id == labor.id,
            MovimientoHerramienta.tipo_movimiento == "salida"
        )
    ).first()
    
    if not movimiento:
        raise HTTPException(404, "Movimiento no encontrado")
    
    if cantidad > movimiento.cantidad:
        raise HTTPException(400, "No puede devolver más de lo asignado")
    
    movimiento_devolucion = MovimientoHerramienta(
        herramienta_id=movimiento.herramienta_id,
        labor_id=labor.id,
        cantidad=cantidad,
        tipo_movimiento="entrada",
        observaciones=f"Devolución de labor {labor.id}"
    )
    
    herramienta = db.query(Herramienta).filter(Herramienta.id == movimiento.herramienta_id).first()
    if herramienta:
        herramienta.cantidad_disponible += cantidad
    
    db.add(movimiento_devolucion)
    db.commit()
    
    return {"message": "✅ Herramienta devuelta correctamente"}


def devolver_insumo_crud(db: Session, labor: Labor, movimiento_id: int, cantidad: float, usuario: Usuario):
    """
    Devuelve insumos que fueron consumidos en una labor.
    Similar a devolver_herramienta_crud pero para insumos.
    """
    _verificar_permisos_labor(labor, usuario, "devolver")
    
    # Buscar el movimiento de salida (consumo)
    movimiento = db.query(MovimientoInsumo).filter(
        and_(
            MovimientoInsumo.id == movimiento_id,
            MovimientoInsumo.labor_id == labor.id,
            MovimientoInsumo.tipo_movimiento == "salida"
        )
    ).first()
    
    if not movimiento:
        raise HTTPException(404, "Movimiento de insumo no encontrado")
    
    if cantidad > movimiento.cantidad:
        raise HTTPException(400, f"No puede devolver más de lo consumido. Consumido: {movimiento.cantidad}")
    
    # Crear movimiento de entrada (devolución)
    movimiento_devolucion = MovimientoInsumo(
        insumo_id=movimiento.insumo_id,
        labor_id=labor.id,
        cantidad=cantidad,
        tipo_movimiento="entrada",
        observaciones=f"Devolución de insumo de labor {labor.id}"
    )
    
    # Actualizar disponibilidad del insumo
    insumo = db.query(Insumo).filter(Insumo.id == movimiento.insumo_id).first()
    if insumo:
        insumo.cantidad_disponible += cantidad
    
    db.add(movimiento_devolucion)
    db.commit()
    
    return {"message": "✅ Insumo devuelto correctamente"}

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
    ✅ CORREGIDO: Carga recursos de la labor y calcula cantidades netas
    """
    print(f"Cargando recursos para labor ID: {labor.id}")
    # Cargar movimientos de herramientas y calcular cantidades netas
    movimientos_herramientas = db.query(MovimientoHerramienta).filter(
        MovimientoHerramienta.labor_id == labor.id
    ).all()
    
    herramientas_info = []
    herramientas_totales = {}
    
    for mov in movimientos_herramientas:
        herramienta_id = mov.herramienta_id
        
        # Calcular cantidad neta por herramienta
        if mov.tipo_movimiento == "salida":  # ✅ SALIDA = Asignación a labor
            herramientas_totales[herramienta_id] = herramientas_totales.get(herramienta_id, 0) + mov.cantidad
        elif mov.tipo_movimiento == "entrada":  # ✅ ENTRADA = Devolución a inventario
            herramientas_totales[herramienta_id] = herramientas_totales.get(herramienta_id, 0) - mov.cantidad
        
        herramienta_info = {
            "movimiento_id": mov.id,
            "herramienta_id": herramienta_id,
            "herramienta_nombre": mov.herramienta.nombre if mov.herramienta else None,
            "cantidad": mov.cantidad,
            "tipo_movimiento": mov.tipo_movimiento,
            "fecha_movimiento": mov.fecha_movimiento,
            "observaciones": mov.observaciones
        }
        herramientas_info.append(herramienta_info)
    
    # Crear resumen de herramientas asignadas (cantidad neta actual)
    herramientas_resumen = []
    for herramienta_id, cantidad_neta in herramientas_totales.items():
        if cantidad_neta > 0:  # Solo mostrar herramientas que aún están asignadas
            herramienta = db.query(Herramienta).filter(Herramienta.id == herramienta_id).first()
            herramientas_resumen.append({
                "herramienta_id": herramienta_id,
                "herramienta_nombre": herramienta.nombre if herramienta else None,
                "cantidad_actual": cantidad_neta,
                "unidad_medida": "unidades"
            })
    
    labor.herramientas_asignadas_info = herramientas_info
    labor.herramientas_resumen = herramientas_resumen
    
    # Cargar movimientos de insumos y calcular cantidades netas
    movimientos_insumos = db.query(MovimientoInsumo).filter(
        MovimientoInsumo.labor_id == labor.id
    ).all()
    
    insumos_info = []
    insumos_totales = {}
    
    for mov in movimientos_insumos:
        insumo_id = mov.insumo_id
        
        # Calcular cantidad neta por insumo
        if mov.tipo_movimiento == "salida":  # ✅ SALIDA = Consumo en labor
            insumos_totales[insumo_id] = insumos_totales.get(insumo_id, 0) + mov.cantidad
        elif mov.tipo_movimiento == "entrada":  # ✅ ENTRADA = Devolución a inventario
            insumos_totales[insumo_id] = insumos_totales.get(insumo_id, 0) - mov.cantidad
        
        insumo_info = {
            "movimiento_id": mov.id,
            "insumo_id": insumo_id,
            "insumo_nombre": mov.insumo.nombre if mov.insumo else None,
            "cantidad": mov.cantidad,
            "tipo_movimiento": mov.tipo_movimiento,
            "fecha_movimiento": mov.fecha_movimiento,
            "observaciones": mov.observaciones,
            "unidad_medida": mov.insumo.unidad_medida if mov.insumo else None
        }
        insumos_info.append(insumo_info)
    
    # Crear resumen de insumos consumidos (cantidad neta)
    insumos_resumen = []
    for insumo_id, cantidad_neta in insumos_totales.items():
        if cantidad_neta > 0:  # Solo mostrar insumos que fueron consumidos
            insumo = db.query(Insumo).filter(Insumo.id == insumo_id).first()
            insumos_resumen.append({
                "insumo_id": insumo_id,
                "insumo_nombre": insumo.nombre if insumo else None,
                "cantidad_consumida": cantidad_neta,
                "unidad_medida": insumo.unidad_medida if insumo else "unidades"
            })
    
    labor.insumos_asignados_info = insumos_info
    labor.insumos_resumen = insumos_resumen
    
    # Cargar evidencias
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

def _labor_a_dict_con_recursos(labor: Labor):
    """
    ✅ NUEVA FUNCIÓN: Convierte objeto Labor a diccionario compatible con LaborWithRecursosResponse
    """
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
        "trabajador_nombre": getattr(labor, 'trabajador_nombre', None),
        "recomendacion_titulo": getattr(labor, 'recomendacion_titulo', None),
        "lote_nombre": getattr(labor, 'lote_nombre', None),
        "granja_nombre": getattr(labor, 'granja_nombre', None),
        "tipo_labor_nombre": getattr(labor, 'tipo_labor_nombre', None),
        "tipo_labor_descripcion": getattr(labor, 'tipo_labor_descripcion', None),
        # ✅ INCLUIR RECURSOS según el schema LaborWithRecursosResponse
        "herramientas_asignadas": getattr(labor, 'herramientas_resumen', []),
        "insumos_asignados": getattr(labor, 'insumos_resumen', []),
        "evidencias": getattr(labor, 'evidencias_info', []),
        "movimientos_herramientas": getattr(labor, 'herramientas_asignadas_info', []),
        "movimientos_insumos": getattr(labor, 'insumos_asignados_info', [])
    }