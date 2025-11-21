from sqlalchemy.orm import Session
from sqlalchemy import and_, func
from datetime import datetime
from fastapi import HTTPException
from app.db.models import (
    Labor, Usuario, Recomendacion, Lote, Herramienta, Insumo,
    MovimientoHerramienta, MovimientoInsumo, AsignacionHerramienta,
    Evidencia, TipoLabor, Granja  # ✅ AGREGADO: Granja para relaciones
)
from app.schemas.labor_schema import (
    LaborCreate, LaborUpdate, AsignacionHerramientaRequest,
    AsignacionInsumoRequest, RegistroAvanceRequest
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
    
    # ✅ NUEVO: Verificar que el tipo de labor existe
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
        # Obtener programa del trabajador
        trabajador_programa = db.query(Usuario).filter(Usuario.id == data.trabajador_id).first()
        if not trabajador_programa or trabajador_programa.programa_id != usuario.programa_id:
            raise HTTPException(403, "Solo puede asignar labores a trabajadores de su programa")
    
    labor = Labor(
        estado=data.estado,
        avance_porcentaje=data.avance_porcentaje,
        comentario=data.comentario,
        recomendacion_id=data.recomendacion_id,
        trabajador_id=data.trabajador_id,
        lote_id=data.lote_id,
        tipo_labor_id=data.tipo_labor_id  # ✅ AGREGADO
    )
    
    db.add(labor)
    db.commit()
    db.refresh(labor)
    _cargar_relaciones_labor(labor)
    
    return labor

def listar_labores_crud(
    db: Session, 
    skip: int = 0, 
    limit: int = 100,
    estado: str = None,
    trabajador_id: int = None,
    lote_id: int = None,
    recomendacion_id: int = None,
    tipo_labor_id: int = None,  # ✅ OPCIONAL: Filtro por tipo de labor
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
    if tipo_labor_id:  # ✅ NUEVO: Filtro por tipo de labor
        query = query.filter(Labor.tipo_labor_id == tipo_labor_id)
    
    # Permisos según rol
    if usuario.rol.nombre == "trabajador":
        query = query.filter(Labor.trabajador_id == usuario.id)
    elif usuario.rol.nombre == "docente":
        query = query.join(Recomendacion).filter(Recomendacion.docente_id == usuario.id)
    elif usuario.rol.nombre == "talento_humano":
        # Filtrar por trabajadores del mismo programa
        query = query.join(Usuario, Labor.trabajador_id == Usuario.id).filter(Usuario.programa_id == usuario.programa_id)
    
    total = query.count()
    items = query.offset(skip).limit(limit).all()
    
    for item in items:
        _cargar_relaciones_labor(item)
        _cargar_recursos_labor(db, item)
    
    return {
        "items": items,
        "total": total,
        "paginas": (total + limit - 1) // limit
    }

def obtener_labor_crud(db: Session, id: int, usuario: Usuario = None):
    labor = db.query(Labor).filter(Labor.id == id).first()
    if labor:
        _cargar_relaciones_labor(labor)
        _cargar_recursos_labor(db, labor)
        
        # Verificar permisos
        if usuario.rol.nombre == "trabajador" and labor.trabajador_id != usuario.id:
            return None
        elif usuario.rol.nombre == "docente":
            recomendacion = db.query(Recomendacion).filter(Recomendacion.id == labor.recomendacion_id).first()
            if not recomendacion or recomendacion.docente_id != usuario.id:
                return None
        elif usuario.rol.nombre == "talento_humano":
            trabajador = db.query(Usuario).filter(Usuario.id == labor.trabajador_id).first()
            if not trabajador or trabajador.programa_id != usuario.programa_id:
                return None
                
    return labor

def actualizar_labor_crud(db: Session, labor: Labor, data: LaborUpdate, usuario: Usuario):
    # Verificar permisos
    _verificar_permisos_labor(labor, usuario, "editar")
    
    update_data = data.dict(exclude_unset=True)
    
    # ✅ NUEVO: Si se actualiza tipo_labor_id, verificar que existe
    if 'tipo_labor_id' in update_data:
        tipo_labor = db.query(TipoLabor).filter(TipoLabor.id == update_data['tipo_labor_id']).first()
        if not tipo_labor:
            raise HTTPException(404, "Tipo de labor no encontrado")
    
    # Si se completa la labor, establecer fecha de finalización
    if update_data.get("estado") == "completada" and not labor.fecha_finalizacion:
        update_data["fecha_finalizacion"] = datetime.utcnow()
        update_data["avance_porcentaje"] = 100
    
    for attr, value in update_data.items():
        setattr(labor, attr, value)
    
    db.commit()
    db.refresh(labor)
    _cargar_relaciones_labor(labor)
    
    return labor

def eliminar_labor_crud(db: Session, labor: Labor, usuario: Usuario):
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
    
    return labor

def asignar_insumo_crud(db: Session, labor: Labor, data: AsignacionInsumoRequest, usuario: Usuario):
    _verificar_permisos_labor(labor, usuario, "asignar_recursos")
    
    insumo = db.query(Insumo).filter(Insumo.id == data.insumo_id).first()
    if not insumo:
        raise HTTPException(404, "Insumo no encontrado")
    
    if insumo.cantidad_disponible < data.cantidad:
        raise HTTPException(400, f"No hay suficiente disponibilidad. Disponible: {insumo.cantidad_disponible}")
    
    if labor.recomendacion and labor.recomendacion.lote and labor.recomendacion.lote.programa_id != insumo.programa_id:
        raise HTTPException(400, "El insumo no pertenece al programa de esta labor")
    
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
    
    return labor

def registrar_avance_crud(db: Session, labor: Labor, data: RegistroAvanceRequest, usuario: Usuario):
    if labor.trabajador_id != usuario.id:
        raise HTTPException(403, "Solo el trabajador asignado puede registrar avance")
    
    labor.avance_porcentaje = data.avance_porcentaje
    labor.comentario = data.comentario
    
    if data.avance_porcentaje == 100:
        labor.estado = "completada"
        labor.fecha_finalizacion = datetime.utcnow()
    elif data.avance_porcentaje > 0 and labor.estado == "pendiente":
        labor.estado = "en_progreso"
    
    db.commit()
    db.refresh(labor)
    _cargar_relaciones_labor(labor)
    
    return labor

def completar_labor_crud(db: Session, labor: Labor, usuario: Usuario):
    _verificar_permisos_labor(labor, usuario, "completar")
    
    labor.estado = "completada"
    labor.avance_porcentaje = 100
    labor.fecha_finalizacion = datetime.utcnow()
    
    db.commit()
    db.refresh(labor)
    _cargar_relaciones_labor(labor)
    
    return labor

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

# === FUNCIONES ADICIONALES ===

def listar_labores_por_trabajador(db: Session, trabajador_id: int, skip: int = 0, limit: int = 100, estado: str = None, usuario: Usuario = None):
    if usuario.rol.nombre != "admin" and usuario.id != trabajador_id:
        raise HTTPException(403, "No puede ver labores de otros trabajadores")
    
    query = db.query(Labor).filter(Labor.trabajador_id == trabajador_id)
    
    if estado:
        query = query.filter(Labor.estado == estado)
    
    total = query.count()
    items = query.offset(skip).limit(limit).all()
    
    # ✅ CORREGIDO: Convertir a diccionarios en lugar de retornar objetos SQLAlchemy directamente
    labores_dict = []
    for item in items:
        _cargar_relaciones_labor(item)
        _cargar_recursos_labor(db, item)
        
        # Convertir a diccionario
        labor_dict = {
            "id": item.id,
            "estado": item.estado,
            "avance_porcentaje": item.avance_porcentaje,
            "comentario": item.comentario,
            "lote_id": item.lote_id,
            "tipo_labor_id": item.tipo_labor_id,
            "recomendacion_id": item.recomendacion_id,
            "trabajador_id": item.trabajador_id,
            "fecha_asignacion": item.fecha_asignacion,
            "fecha_finalizacion": item.fecha_finalizacion,
            "trabajador_nombre": item.trabajador_nombre,
            "recomendacion_titulo": item.recomendacion_titulo,
            "lote_nombre": item.lote_nombre,
            "granja_nombre": item.granja_nombre,
            "tipo_labor_nombre": item.tipo_labor_nombre,
            "tipo_labor_descripcion": item.tipo_labor_descripcion
        }
        labores_dict.append(labor_dict)
    
    return {
        "items": labores_dict,  # ✅ Ahora son diccionarios, no objetos SQLAlchemy
        "total": total,
        "paginas": (total + limit - 1) // limit
    }

def listar_labores_por_recomendacion(db: Session, recomendacion_id: int, skip: int = 0, limit: int = 100, usuario: Usuario = None):
    query = db.query(Labor).filter(Labor.recomendacion_id == recomendacion_id)
    
    if usuario.rol.nombre == "docente":
        recomendacion = db.query(Recomendacion).filter(Recomendacion.id == recomendacion_id).first()
        if not recomendacion or recomendacion.docente_id != usuario.id:
            raise HTTPException(403, "No tiene permisos para ver estas labores")
    
    total = query.count()
    items = query.offset(skip).limit(limit).all()
    
    for item in items:
        _cargar_relaciones_labor(item)
        _cargar_recursos_labor(db, item)
    
    return {
        "items": items,
        "total": total,
        "paginas": (total + limit - 1) // limit
    }

def obtener_estadisticas_labores_crud(db: Session, usuario: Usuario):
    query = db.query(Labor)
    
    if usuario.rol.nombre == "trabajador":
        query = query.filter(Labor.trabajador_id == usuario.id)
    elif usuario.rol.nombre == "docente":
        query = query.join(Recomendacion).filter(Recomendacion.docente_id == usuario.id)
    elif usuario.rol.nombre == "talento_humano":
        query = query.join(Usuario, Labor.trabajador_id == Usuario.id).filter(Usuario.programa_id == usuario.programa_id)
    
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
        if accion in ["asignar_recursos", "editar"]:
            trabajador = labor.trabajador
            if trabajador and trabajador.programa_id == usuario.programa_id:
                return
            raise HTTPException(403, f"Solo puede {accion} labores de su programa")
        raise HTTPException(403, f"No tiene permisos para {accion} esta labor")
    
    if rol == "docente":
        recomendacion = labor.recomendacion
        if recomendacion and recomendacion.docente_id == usuario.id:
            if accion in ["editar", "completar"]:
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
    # ✅ NUEVO: Cargar información del tipo de labor
    if labor.tipo_labor:
        labor.tipo_labor_nombre = labor.tipo_labor.nombre
        labor.tipo_labor_descripcion = labor.tipo_labor.descripcion

def _cargar_recursos_labor(db: Session, labor: Labor):
    # Cargar herramientas asignadas
    movimientos_herramientas = db.query(MovimientoHerramienta).filter(
        MovimientoHerramienta.labor_id == labor.id
    ).all()
    
    labor.herramientas_asignadas = []
    for mov in movimientos_herramientas:
        herramienta_info = {
            "movimiento_id": mov.id,
            "herramienta_id": mov.herramienta_id,
            "herramienta_nombre": mov.herramienta.nombre if mov.herramienta else None,
            "cantidad": mov.cantidad,
            "tipo_movimiento": mov.tipo_movimiento,
            "fecha_movimiento": mov.fecha_movimiento
        }
        labor.herramientas_asignadas.append(herramienta_info)
    
    # Cargar insumos asignados
    movimientos_insumos = db.query(MovimientoInsumo).filter(
        MovimientoInsumo.labor_id == labor.id
    ).all()
    
    labor.insumos_asignados = []
    for mov in movimientos_insumos:
        insumo_info = {
            "movimiento_id": mov.id,
            "insumo_id": mov.insumo_id,
            "insumo_nombre": mov.insumo.nombre if mov.insumo else None,
            "cantidad": mov.cantidad,
            "tipo_movimiento": mov.tipo_movimiento,
            "fecha_movimiento": mov.fecha_movimiento
        }
        labor.insumos_asignados.append(insumo_info)
    
    # Cargar evidencias
    evidencias = db.query(Evidencia).filter(Evidencia.labor_id == labor.id).all()
    
    labor.evidencias = []
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
        labor.evidencias.append(evidencia_info)