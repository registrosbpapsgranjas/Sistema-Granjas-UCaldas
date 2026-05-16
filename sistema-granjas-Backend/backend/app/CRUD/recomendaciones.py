from sqlalchemy.orm import Session
from sqlalchemy import and_
from datetime import datetime, timedelta
from app.db.models import Recomendacion, RecomendacionItem, ProductoRecomendacion, Labor, Usuario, Lote, Diagnostico, ItemInventarioPrograma, DiagnosticoTipo  # noqa: F401
from app.schemas.recomendacion_schema import RecomendacionCreate, RecomendacionUpdate, AprobacionRecomendacionRequest
from fastapi import HTTPException


def _nombre_item(item: ItemInventarioPrograma) -> str:
    v = item.valores or {}
    return v.get("nombre") or v.get("producto") or v.get("Nombre") or f"Ítem #{item.id}"


def _cargar_items_sugeridos(recomendacion: Recomendacion):
    items_data = []
    for ri in (recomendacion.items_sugeridos or []):
        d = {
            "id": ri.id,
            "recomendacion_id": ri.recomendacion_id,
            "inventario_item_id": ri.inventario_item_id,
            "cantidad_sugerida": ri.cantidad_sugerida,
            "descripcion": ri.descripcion,
            "inventario_item_nombre": None,
            "inventario_item_unidad": None,
            "inventario_item_disponible": None,
        }
        if ri.inventario_item:
            d["inventario_item_nombre"] = _nombre_item(ri.inventario_item)
            d["inventario_item_unidad"] = ri.inventario_item.unidad_medida
            d["inventario_item_disponible"] = ri.inventario_item.cantidad_disponible
        items_data.append(d)
    recomendacion.items_sugeridos_data = items_data


def _cargar_productos_recomendacion(recomendacion: Recomendacion):
    productos_data = []
    for pr in (recomendacion.productos or []):
        d = {
            "id": pr.id,
            "recomendacion_id": pr.recomendacion_id,
            "inventario_item_id": pr.inventario_item_id,
            "cantidad_sugerida": pr.cantidad_sugerida,
            "descripcion": pr.descripcion,
            "created_at": pr.created_at,
            "inventario_item_nombre": None,
            "inventario_item_unidad": None,
            "inventario_item_disponible": None,
        }
        if pr.inventario_item:
            d["inventario_item_nombre"] = _nombre_item(pr.inventario_item)
            d["inventario_item_unidad"] = pr.inventario_item.unidad_medida
            d["inventario_item_disponible"] = pr.inventario_item.cantidad_disponible
        productos_data.append(d)
    recomendacion.productos_data = productos_data


def _cargar_relaciones_recomendacion(recomendacion: Recomendacion):
    if recomendacion.docente:
        recomendacion.docente_nombre = recomendacion.docente.nombre
    if recomendacion.lote:
        recomendacion.lote_nombre = recomendacion.lote.nombre
        if recomendacion.lote.granja:
            recomendacion.granja_nombre = recomendacion.lote.granja.nombre
        if recomendacion.lote.programa:
            recomendacion.programa_nombre = recomendacion.lote.programa.nombre
            recomendacion.programa_id = recomendacion.lote.programa.id
    if recomendacion.diagnostico:
        recomendacion.diagnostico_tipo = recomendacion.diagnostico.tipo_diagnostico
    if recomendacion.subtipo:
        recomendacion.subtipo_nombre = recomendacion.subtipo.nombre
        if recomendacion.subtipo.monitoreo:
            recomendacion.tipo_monitoreo_nombre = recomendacion.subtipo.monitoreo.nombre
    if recomendacion.inventario_item:
        item = recomendacion.inventario_item
        recomendacion.inventario_item_nombre = _nombre_item(item)
        recomendacion.inventario_item_unidad = item.unidad_medida
        recomendacion.inventario_item_disponible = item.cantidad_disponible
    _cargar_items_sugeridos(recomendacion)
    _cargar_productos_recomendacion(recomendacion)
    recomendacion.items_sugeridos = getattr(recomendacion, 'items_sugeridos_data', [])
    recomendacion.productos = getattr(recomendacion, 'productos_data', [])


def crear_recomendacion(db: Session, data: RecomendacionCreate, usuario_id: int):
    rec = Recomendacion(
        titulo=data.titulo,
        descripcion=data.descripcion,
        tipo=data.tipo,
        estado=data.estado,
        lote_id=data.lote_id,
        diagnostico_id=data.diagnostico_id,
        subtipo_id=data.subtipo_id,
        formulario_recomendacion=data.formulario_recomendacion,
        docente_id=data.docente_id,
        inventario_item_id=data.inventario_item_id,
        cantidad_sugerida=data.cantidad_sugerida,
    )
    db.add(rec)
    db.flush()

    # Mark the linked diagnosis as revisado
    if data.diagnostico_id:
        diag = db.query(Diagnostico).filter(Diagnostico.id == data.diagnostico_id).first()
        if diag:
            diag.estado_revision = "revisado"

    for item_data in (data.items_sugeridos or []):
        ri = RecomendacionItem(
            recomendacion_id=rec.id,
            inventario_item_id=item_data.inventario_item_id,
            cantidad_sugerida=item_data.cantidad_sugerida,
            descripcion=item_data.descripcion,
        )
        db.add(ri)
        pr = ProductoRecomendacion(
            recomendacion_id=rec.id,
            inventario_item_id=item_data.inventario_item_id,
            cantidad_sugerida=item_data.cantidad_sugerida,
            descripcion=item_data.descripcion,
        )
        db.add(pr)

    db.commit()
    db.refresh(rec)
    _cargar_relaciones_recomendacion(rec)
    return rec


def listar_recomendaciones(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    estado: str = None,
    tipo: str = None,
    lote_id: int = None,
    docente_id: int = None,
    programa_id: int = None,
    usuario: Usuario = None
):
    query = db.query(Recomendacion)

    if estado:
        query = query.filter(Recomendacion.estado == estado)
    if tipo:
        query = query.filter(Recomendacion.tipo == tipo)
    if lote_id:
        query = query.filter(Recomendacion.lote_id == lote_id)
    if docente_id:
        query = query.filter(Recomendacion.docente_id == docente_id)
    if programa_id:
        query = query.join(Lote, Recomendacion.lote_id == Lote.id).filter(Lote.programa_id == programa_id)

    if usuario and usuario.rol.nombre == "docente":
        query = query.filter(Recomendacion.docente_id == usuario.id)

    total = query.count()
    items = query.order_by(Recomendacion.fecha_creacion.desc()).offset(skip).limit(limit).all()

    for item in items:
        _cargar_relaciones_recomendacion(item)

    return {"items": items, "total": total, "paginas": (total + limit - 1) // limit}


def obtener_recomendacion(db: Session, id: int, usuario: Usuario = None):
    rec = db.query(Recomendacion).filter(Recomendacion.id == id).first()
    if rec:
        _cargar_relaciones_recomendacion(rec)
        if usuario and usuario.rol.nombre == "docente" and rec.docente_id != usuario.id:
            return None
    return rec


def actualizar_recomendacion(db: Session, recomendacion: Recomendacion, data: RecomendacionUpdate, usuario: Usuario = None):
    if usuario and usuario.rol.nombre == "docente" and recomendacion.docente_id != usuario.id:
        raise HTTPException(403, "No puede editar recomendaciones de otros docentes")

    update_data = data.dict(exclude_unset=True)

    if update_data.get("estado") == "aprobada" and not recomendacion.fecha_aprobacion:
        update_data["fecha_aprobacion"] = (datetime.utcnow() - timedelta(hours=5))

    if "diagnostico_id" in update_data and update_data["diagnostico_id"] is None:
        labores_count = db.query(Labor).filter(Labor.recomendacion_id == recomendacion.id).count()
        if labores_count > 0:
            raise HTTPException(400, "No se puede desasignar diagnóstico si hay labores asociadas")

    for attr, value in update_data.items():
        setattr(recomendacion, attr, value)

    db.commit()
    db.refresh(recomendacion)
    _cargar_relaciones_recomendacion(recomendacion)
    return recomendacion


def eliminar_recomendacion(db: Session, recomendacion: Recomendacion, usuario: Usuario = None):
    labores_count = db.query(Labor).filter(Labor.recomendacion_id == recomendacion.id).count()
    if labores_count > 0:
        raise HTTPException(400, "No se puede eliminar recomendación con labores asociadas")
    db.delete(recomendacion)
    db.commit()


def aprobar_recomendacion_crud(db: Session, id: int, data: AprobacionRecomendacionRequest, usuario: Usuario):
    rec = db.query(Recomendacion).filter(Recomendacion.id == id).first()
    if not rec:
        raise HTTPException(404, "Recomendación no encontrada")

    if data.aprobar:
        rec.estado = "aprobada"
        rec.fecha_aprobacion = (datetime.utcnow() - timedelta(hours=5))
    else:
        rec.estado = "cancelada"

    db.commit()
    db.refresh(rec)
    _cargar_relaciones_recomendacion(rec)
    return rec


def obtener_recomendacion_con_labores(db: Session, id: int, usuario: Usuario):
    rec = db.query(Recomendacion).filter(Recomendacion.id == id).first()
    if rec:
        _cargar_relaciones_recomendacion(rec)
        rec.labores = db.query(Labor).filter(Labor.recomendacion_id == id).all()
        for labor in rec.labores:
            if labor.trabajador:
                labor.trabajador_nombre = labor.trabajador.nombre
    return rec


def listar_recomendaciones_por_diagnostico(db: Session, diagnostico_id: int, skip: int = 0, limit: int = 100, usuario: Usuario = None):
    query = db.query(Recomendacion).filter(Recomendacion.diagnostico_id == diagnostico_id)
    if usuario and usuario.rol.nombre == "docente":
        query = query.filter(Recomendacion.docente_id == usuario.id)
    total = query.count()
    items = query.offset(skip).limit(limit).all()
    for item in items:
        _cargar_relaciones_recomendacion(item)
    return {"items": items, "total": total, "paginas": (total + limit - 1) // limit}


def listar_recomendaciones_por_lote(db: Session, lote_id: int, skip: int = 0, limit: int = 100, estado: str = None, usuario: Usuario = None):
    query = db.query(Recomendacion).filter(Recomendacion.lote_id == lote_id)
    if estado:
        query = query.filter(Recomendacion.estado == estado)
    if usuario and usuario.rol.nombre == "docente":
        query = query.filter(Recomendacion.docente_id == usuario.id)
    total = query.count()
    items = query.offset(skip).limit(limit).all()
    for item in items:
        _cargar_relaciones_recomendacion(item)
    return {"items": items, "total": total, "paginas": (total + limit - 1) // limit}


def listar_recomendaciones_por_usuario(db: Session, usuario_id: int, skip: int = 0, limit: int = 100, usuario_actual: Usuario = None):
    if usuario_actual.rol.nombre != "admin" and usuario_actual.id != usuario_id:
        raise HTTPException(403, "No puede ver recomendaciones de otros usuarios")
    query = db.query(Recomendacion).filter(Recomendacion.docente_id == usuario_id)
    total = query.count()
    items = query.offset(skip).limit(limit).all()
    for item in items:
        _cargar_relaciones_recomendacion(item)
    return {"items": items, "total": total, "paginas": (total + limit - 1) // limit}


def obtener_estadisticas_recomendaciones(db: Session, usuario: Usuario):
    query = db.query(Recomendacion)
    if usuario.rol.nombre == "docente":
        query = query.filter(Recomendacion.docente_id == usuario.id)
    total = query.count()
    estados = ["pendiente", "aprobada", "en_ejecucion", "completada", "cancelada"]
    stats = {estado: query.filter(Recomendacion.estado == estado).count() for estado in estados}
    tipos = db.query(Recomendacion.tipo).distinct().all()
    por_tipo = {tipo[0]: query.filter(Recomendacion.tipo == tipo[0]).count() for tipo in tipos if tipo[0]}
    return {
        "total": total,
        "pendientes": stats["pendiente"],
        "aprobadas": stats["aprobada"],
        "en_ejecucion": stats["en_ejecucion"],
        "completadas": stats["completada"],
        "canceladas": stats["cancelada"],
        "por_tipo": por_tipo
    }


def actualizar_estado_por_labores(db: Session, recomendacion_id: int):
    labores = db.query(Labor).filter(Labor.recomendacion_id == recomendacion_id).all()
    if not labores:
        return
    if all(l.estado == "completada" for l in labores):
        rec = db.query(Recomendacion).filter(Recomendacion.id == recomendacion_id).first()
        if rec:
            rec.estado = "completada"
            db.commit()


def agregar_item_recomendacion(db: Session, recomendacion_id: int, inventario_item_id: int, cantidad_sugerida: float = None, descripcion: str = None, usuario: Usuario = None):
    rec = db.query(Recomendacion).filter(Recomendacion.id == recomendacion_id).first()
    if not rec:
        raise HTTPException(404, "Recomendación no encontrada")
    if usuario and usuario.rol.nombre == "docente" and rec.docente_id != usuario.id:
        raise HTTPException(403, "No tiene permisos")
    ri = RecomendacionItem(
        recomendacion_id=recomendacion_id,
        inventario_item_id=inventario_item_id,
        cantidad_sugerida=cantidad_sugerida,
        descripcion=descripcion,
    )
    db.add(ri)
    db.commit()
    db.refresh(ri)
    return ri


def eliminar_item_recomendacion(db: Session, recomendacion_id: int, item_id: int, usuario: Usuario = None):
    rec = db.query(Recomendacion).filter(Recomendacion.id == recomendacion_id).first()
    if not rec:
        raise HTTPException(404, "Recomendación no encontrada")
    if usuario and usuario.rol.nombre == "docente" and rec.docente_id != usuario.id:
        raise HTTPException(403, "No tiene permisos")
    ri = db.query(RecomendacionItem).filter(
        RecomendacionItem.id == item_id,
        RecomendacionItem.recomendacion_id == recomendacion_id
    ).first()
    if not ri:
        raise HTTPException(404, "Ítem no encontrado")
    db.delete(ri)
    db.commit()


def agregar_producto_recomendacion(
    db: Session,
    recomendacion_id: int,
    inventario_item_id: int = None,
    cantidad_sugerida: float = None,
    descripcion: str = None,
    usuario: Usuario = None
):
    rec = db.query(Recomendacion).filter(Recomendacion.id == recomendacion_id).first()
    if not rec:
        raise HTTPException(404, "Recomendación no encontrada")
    if usuario and usuario.rol.nombre == "docente" and rec.docente_id != usuario.id:
        raise HTTPException(403, "No tiene permisos")
    producto = ProductoRecomendacion(
        recomendacion_id=recomendacion_id,
        inventario_item_id=inventario_item_id,
        cantidad_sugerida=cantidad_sugerida,
        descripcion=descripcion,
    )
    db.add(producto)
    db.commit()
    db.refresh(producto)
    return producto


def eliminar_producto_recomendacion(db: Session, recomendacion_id: int, producto_id: int, usuario: Usuario = None):
    rec = db.query(Recomendacion).filter(Recomendacion.id == recomendacion_id).first()
    if not rec:
        raise HTTPException(404, "Recomendación no encontrada")
    if usuario and usuario.rol.nombre == "docente" and rec.docente_id != usuario.id:
        raise HTTPException(403, "No tiene permisos")
    producto = db.query(ProductoRecomendacion).filter(
        ProductoRecomendacion.id == producto_id,
        ProductoRecomendacion.recomendacion_id == recomendacion_id
    ).first()
    if not producto:
        raise HTTPException(404, "Producto no encontrado")
    db.delete(producto)
    db.commit()


def listar_productos_recomendacion(db: Session, recomendacion_id: int, usuario: Usuario = None):
    rec = db.query(Recomendacion).filter(Recomendacion.id == recomendacion_id).first()
    if not rec:
        raise HTTPException(404, "Recomendación no encontrada")
    if usuario and usuario.rol.nombre == "docente" and rec.docente_id != usuario.id:
        raise HTTPException(403, "No tiene permisos")
    productos = db.query(ProductoRecomendacion).filter(
        ProductoRecomendacion.recomendacion_id == recomendacion_id
    ).all()
    result = []
    for pr in productos:
        d = {
            "id": pr.id,
            "recomendacion_id": pr.recomendacion_id,
            "inventario_item_id": pr.inventario_item_id,
            "cantidad_sugerida": pr.cantidad_sugerida,
            "descripcion": pr.descripcion,
            "created_at": pr.created_at,
            "inventario_item_nombre": None,
            "inventario_item_unidad": None,
            "inventario_item_disponible": None,
        }
        if pr.inventario_item:
            d["inventario_item_nombre"] = _nombre_item(pr.inventario_item)
            d["inventario_item_unidad"] = pr.inventario_item.unidad_medida
            d["inventario_item_disponible"] = pr.inventario_item.cantidad_disponible
        result.append(d)
    return result


def obtener_recomendacion_vista_completa(db: Session, id: int, usuario: Usuario):
    recomendacion = obtener_recomendacion(db, id, usuario)
    if not recomendacion:
        return None

    diagnostico_info = None
    if recomendacion.diagnostico:
        diag = recomendacion.diagnostico
        diagnostico_info = {
            "id": diag.id,
            "tipo": diag.tipo_diagnostico,
            "fecha_creacion": diag.fecha_creacion,
            "usuario_nombre": diag.usuario.nombre if diag.usuario else None,
        }

    labores_detalladas = []
    for labor in recomendacion.labores:
        labor_info = {
            "id": labor.id,
            "estado": labor.estado,
            "avance_porcentaje": labor.avance_porcentaje,
            "comentario": labor.comentario,
            "fecha_asignacion": labor.fecha_asignacion,
            "fecha_finalizacion": labor.fecha_finalizacion,
            "trabajador": {"id": labor.trabajador.id, "nombre": labor.trabajador.nombre} if labor.trabajador else None,
            "lote": {"id": labor.lote.id, "nombre": labor.lote.nombre} if labor.lote else None,
        }
        labores_detalladas.append(labor_info)

    recomendacion.diagnostico_info = diagnostico_info
    recomendacion.labores_detalladas = labores_detalladas
    return recomendacion
