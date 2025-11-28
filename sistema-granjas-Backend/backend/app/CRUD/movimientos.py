from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from datetime import datetime, timedelta
from typing import Optional
from fastapi import HTTPException

from app.db.models import MovimientoHerramienta, MovimientoInsumo, Herramienta, Insumo, Labor

def listar_movimientos_herramientas_crud(
    db: Session, 
    skip: int = 0, 
    limit: int = 100,
    herramienta_id: Optional[int] = None,
    labor_id: Optional[int] = None,
    tipo_movimiento: Optional[str] = None,
    fecha_desde: Optional[datetime] = None,
    fecha_hasta: Optional[datetime] = None
):
    query = db.query(MovimientoHerramienta)
    
    # Aplicar filtros
    if herramienta_id:
        query = query.filter(MovimientoHerramienta.herramienta_id == herramienta_id)
    
    if labor_id:
        query = query.filter(MovimientoHerramienta.labor_id == labor_id)
    
    if tipo_movimiento:
        query = query.filter(MovimientoHerramienta.tipo_movimiento == tipo_movimiento)
    
    if fecha_desde:
        query = query.filter(MovimientoHerramienta.fecha_movimiento >= fecha_desde)
    
    if fecha_hasta:
        # Agregar un día para incluir la fecha hasta
        fecha_hasta_fin = fecha_hasta.replace(hour=23, minute=59, second=59)
        query = query.filter(MovimientoHerramienta.fecha_movimiento <= fecha_hasta_fin)
    
    total = query.count()
    movimientos = query.order_by(MovimientoHerramienta.fecha_movimiento.desc()).offset(skip).limit(limit).all()
    
    # Cargar información relacionada
    movimientos_con_info = []
    for mov in movimientos:
        movimiento_dict = {
            "id": mov.id,
            "herramienta_id": mov.herramienta_id,
            "labor_id": mov.labor_id,
            "cantidad": mov.cantidad,
            "tipo_movimiento": mov.tipo_movimiento,
            "fecha_movimiento": mov.fecha_movimiento,
            "observaciones": mov.observaciones,
            "herramienta_nombre": mov.herramienta.nombre if mov.herramienta else None,
            "labor_descripcion": f"Labor {mov.labor_id}" if mov.labor else None
        }
        movimientos_con_info.append(movimiento_dict)
    
    return {
        "items": movimientos_con_info,
        "total": total,
        "paginas": (total + limit - 1) // limit
    }

def listar_movimientos_insumos_crud(
    db: Session, 
    skip: int = 0, 
    limit: int = 100,
    insumo_id: Optional[int] = None,
    labor_id: Optional[int] = None,
    tipo_movimiento: Optional[str] = None,
    fecha_desde: Optional[datetime] = None,
    fecha_hasta: Optional[datetime] = None
):
    query = db.query(MovimientoInsumo)
    
    # Aplicar filtros
    if insumo_id:
        query = query.filter(MovimientoInsumo.insumo_id == insumo_id)
    
    if labor_id:
        query = query.filter(MovimientoInsumo.labor_id == labor_id)
    
    if tipo_movimiento:
        query = query.filter(MovimientoInsumo.tipo_movimiento == tipo_movimiento)
    
    if fecha_desde:
        query = query.filter(MovimientoInsumo.fecha_movimiento >= fecha_desde)
    
    if fecha_hasta:
        fecha_hasta_fin = fecha_hasta.replace(hour=23, minute=59, second=59)
        query = query.filter(MovimientoInsumo.fecha_movimiento <= fecha_hasta_fin)
    
    total = query.count()
    movimientos = query.order_by(MovimientoInsumo.fecha_movimiento.desc()).offset(skip).limit(limit).all()
    
    # Cargar información relacionada
    movimientos_con_info = []
    for mov in movimientos:
        movimiento_dict = {
            "id": mov.id,
            "insumo_id": mov.insumo_id,
            "labor_id": mov.labor_id,
            "cantidad": mov.cantidad,
            "tipo_movimiento": mov.tipo_movimiento,
            "fecha_movimiento": mov.fecha_movimiento,
            "observaciones": mov.observaciones,
            "insumo_nombre": mov.insumo.nombre if mov.insumo else None,
            "labor_descripcion": f"Labor {mov.labor_id}" if mov.labor else None,
            "unidad_medida": mov.insumo.unidad_medida if mov.insumo else None
        }
        movimientos_con_info.append(movimiento_dict)
    
    return {
        "items": movimientos_con_info,
        "total": total,
        "paginas": (total + limit - 1) // limit
    }

def obtener_movimiento_herramienta_crud(db: Session, movimiento_id: int):
    movimiento = db.query(MovimientoHerramienta).filter(MovimientoHerramienta.id == movimiento_id).first()
    
    if movimiento:
        movimiento_dict = {
            "id": movimiento.id,
            "herramienta_id": movimiento.herramienta_id,
            "labor_id": movimiento.labor_id,
            "cantidad": movimiento.cantidad,
            "tipo_movimiento": movimiento.tipo_movimiento,
            "fecha_movimiento": movimiento.fecha_movimiento,
            "observaciones": movimiento.observaciones,
            "herramienta_nombre": movimiento.herramienta.nombre if movimiento.herramienta else None,
            "labor_descripcion": f"Labor {movimiento.labor_id}" if movimiento.labor else None
        }
        return movimiento_dict
    
    return None

def obtener_movimiento_insumo_crud(db: Session, movimiento_id: int):
    movimiento = db.query(MovimientoInsumo).filter(MovimientoInsumo.id == movimiento_id).first()
    
    if movimiento:
        movimiento_dict = {
            "id": movimiento.id,
            "insumo_id": movimiento.insumo_id,
            "labor_id": movimiento.labor_id,
            "cantidad": movimiento.cantidad,
            "tipo_movimiento": movimiento.tipo_movimiento,
            "fecha_movimiento": movimiento.fecha_movimiento,
            "observaciones": movimiento.observaciones,
            "insumo_nombre": movimiento.insumo.nombre if movimiento.insumo else None,
            "labor_descripcion": f"Labor {movimiento.labor_id}" if movimiento.labor else None,
            "unidad_medida": movimiento.insumo.unidad_medida if movimiento.insumo else None
        }
        return movimiento_dict
    
    return None

def obtener_estadisticas_movimientos_crud(db: Session, dias: int = 30):
    fecha_inicio = datetime.utcnow() - timedelta(days=dias)
    
    # Estadísticas de herramientas
    movimientos_herramientas = db.query(MovimientoHerramienta).filter(
        MovimientoHerramienta.fecha_movimiento >= fecha_inicio
    ).all()
    
    # Estadísticas de insumos
    movimientos_insumos = db.query(MovimientoInsumo).filter(
        MovimientoInsumo.fecha_movimiento >= fecha_inicio
    ).all()
    
    total_salidas_herramientas = sum(m.cantidad for m in movimientos_herramientas if m.tipo_movimiento == "salida")
    total_entradas_herramientas = sum(m.cantidad for m in movimientos_herramientas if m.tipo_movimiento == "entrada")
    
    total_salidas_insumos = sum(m.cantidad for m in movimientos_insumos if m.tipo_movimiento == "salida")
    total_entradas_insumos = sum(m.cantidad for m in movimientos_insumos if m.tipo_movimiento == "entrada")
    
    return {
        "periodo_dias": dias,
        "herramientas": {
            "total_movimientos": len(movimientos_herramientas),
            "salidas": total_salidas_herramientas,
            "entradas": total_entradas_herramientas,
            "movimientos_por_tipo": {
                "salida": len([m for m in movimientos_herramientas if m.tipo_movimiento == "salida"]),
                "entrada": len([m for m in movimientos_herramientas if m.tipo_movimiento == "entrada"])
            }
        },
        "insumos": {
            "total_movimientos": len(movimientos_insumos),
            "salidas": total_salidas_insumos,
            "entradas": total_entradas_insumos,
            "movimientos_por_tipo": {
                "salida": len([m for m in movimientos_insumos if m.tipo_movimiento == "salida"]),
                "entrada": len([m for m in movimientos_insumos if m.tipo_movimiento == "entrada"])
            }
        }
    }