from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List

from app.db.models import CultivoEspecie, Lote, LoteCultivo
from app.db.database import get_db
from app.core.dependencies import require_any_role
from app.CRUD.cultivos_especies import (
    get_all, get_by_id, create, update, delete
)
from app.schemas.cultivo_especie_schema import (
    CultivoEspecieCreate, CultivoEspecieUpdate, 
    CultivoEspecieResponse, CultivoEspecieDetailResponse
)

router = APIRouter(prefix="/cultivos", tags=["Cultivos / Especies"])

role_required = Depends(require_any_role(["admin"]))

@router.get("/", response_model=List[CultivoEspecieResponse])
def listar(
    db: Session = Depends(get_db), 
    _=role_required
):
    """Listar todos los cultivos con conteo de lotes"""
    cultivos = get_all(db)
    
    # Agregar conteo de lotes para cada cultivo
    resultado = []
    for c in cultivos:
        c_dict = {
            "id": c.id,
            "nombre": c.nombre,
            "tipo": c.tipo,
            "descripcion": c.descripcion,
            "duracion_dias": c.duracion_dias,
            "granja_id": c.granja_id,
            "estado": c.estado,
            "created_at": c.created_at if hasattr(c, 'created_at') else None,
            "updated_at": c.updated_at if hasattr(c, 'updated_at') else None,
            "lotes_count": len(c.lotes_asignados) if hasattr(c, 'lotes_asignados') else 0
        }
        resultado.append(c_dict)
    
    return resultado

@router.get("/{id}", response_model=CultivoEspecieDetailResponse)
def obtener(
    id: int, 
    db: Session = Depends(get_db), 
    _=role_required
):
    """Obtener un cultivo por su ID con detalles de lotes"""
    item = get_by_id(db, id)
    if not item:
        raise HTTPException(404, "No encontrado")
    
    # Construir respuesta detallada
    item_dict = {
        "id": item.id,
        "nombre": item.nombre,
        "tipo": item.tipo,
        "descripcion": item.descripcion,
        "duracion_dias": item.duracion_dias,
        "granja_id": item.granja_id,
        "estado": item.estado,
        "created_at": item.created_at if hasattr(item, 'created_at') else None,
        "updated_at": item.updated_at if hasattr(item, 'updated_at') else None,
        "lotes_count": len(item.lotes_asignados) if hasattr(item, 'lotes_asignados') else 0,
        "lotes_asignados": []
    }
    
    # 👇 CORREGIDO: Acceder a través de lotes_asignados (relación muchos a muchos)
    for lc in item.lotes_asignados:
        lote_info = {
            "id": lc.lote.id,
            "nombre": lc.lote.nombre,
            "programa_id": lc.lote.programa_id,
            "granja_id": lc.lote.granja_id,
            "estado": lc.lote.estado,
            "fecha_inicio": lc.lote.fecha_inicio
            # 👇 ELIMINADOS: estos campos ya no existen en la tabla pivote
            # "fecha_siembra": lc.fecha_siembra,
            # "fecha_estimada_cosecha": lc.fecha_estimada_cosecha,
            # "area_sembrada": lc.area_sembrada,
            # "densidad_siembra": lc.densidad_siembra
        }
        item_dict["lotes_asignados"].append(lote_info)
    
    return item_dict

@router.post("/", response_model=CultivoEspecieResponse, status_code=201)
def crear(
    data: CultivoEspecieCreate, 
    db: Session = Depends(get_db), 
    _=role_required
):
    """Crear un nuevo cultivo"""
    return create(db, data)

@router.put("/{id}", response_model=CultivoEspecieResponse)
def editar(
    id: int, 
    data: CultivoEspecieUpdate, 
    db: Session = Depends(get_db), 
    _=role_required
):
    """Actualizar un cultivo existente"""
    item = get_by_id(db, id)
    if not item:
        raise HTTPException(404, "No encontrado")
    return update(db, item, data)

@router.delete("/{id}")
def eliminar(
    id: int, 
    db: Session = Depends(get_db), 
    _=role_required
):
    """Eliminar un cultivo"""
    item = get_by_id(db, id)
    if not item:
        raise HTTPException(404, "No encontrado")
    
    # Verificar si tiene lotes asignados
    if hasattr(item, 'lotes_asignados') and len(item.lotes_asignados) > 0:
        raise HTTPException(400, "No se puede eliminar porque tiene lotes asignados")
    
    delete(db, item)
    return {"message": "✅ Eliminado correctamente"}

@router.get("/granja/{granja_id}", response_model=List[CultivoEspecieResponse])
def obtener_cultivos_por_granja(
    granja_id: int, 
    db: Session = Depends(get_db), 
    _=role_required
):
    """
    Obtener todos los cultivos de una granja específica
    """
    cultivos = db.query(CultivoEspecie).filter(
        CultivoEspecie.granja_id == granja_id,
        CultivoEspecie.estado == "activo"
    ).all()
    
    # Agregar conteo de lotes
    resultado = []
    for c in cultivos:
        c_dict = {
            "id": c.id,
            "nombre": c.nombre,
            "tipo": c.tipo,
            "descripcion": c.descripcion,
            "duracion_dias": c.duracion_dias,
            "granja_id": c.granja_id,
            "estado": c.estado,
            "created_at": c.created_at if hasattr(c, 'created_at') else None,
            "updated_at": c.updated_at if hasattr(c, 'updated_at') else None,
            "lotes_count": len(c.lotes_asignados) if hasattr(c, 'lotes_asignados') else 0
        }
        resultado.append(c_dict)
    
    return resultado

@router.get("/{id}/lotes/estadisticas", response_model=dict)
def obtener_estadisticas_lotes_cultivo(
    id: int,
    db: Session = Depends(get_db),
    _=role_required
):
    """
    Obtener estadísticas de lotes para un cultivo específico:
    - total_lotes: número total de lotes que usan este cultivo
    - lotes_activos: lotes activos con este cultivo
    - lotes_inactivos: lotes inactivos con este cultivo
    - lotes_completados: lotes completados con este cultivo
    - distribucion_por_programa: cuántos lotes por programa
    """
    # Verificar que el cultivo existe
    cultivo = get_by_id(db, id)
    if not cultivo:
        raise HTTPException(404, "Cultivo no encontrado")
    
    # Consultar lotes a través de la tabla pivote
    lotes_query = db.query(Lote).join(LoteCultivo).filter(
        LoteCultivo.cultivo_id == id,
        Lote.estado != "eliminado"
    )
    
    total_lotes = lotes_query.count()
    lotes_activos = lotes_query.filter(Lote.estado == "activo").count()
    lotes_inactivos = lotes_query.filter(Lote.estado == "inactivo").count()
    lotes_completados = lotes_query.filter(Lote.estado == "completado").count()
    lotes_pendientes = lotes_query.filter(Lote.estado == "pendiente").count()
    
    # Obtener distribución por programa
    por_programa = db.query(
        Lote.programa_id,
        func.count(Lote.id).label('cantidad')
    ).join(LoteCultivo).filter(
        LoteCultivo.cultivo_id == id,
        Lote.programa_id.isnot(None),
        Lote.estado != "eliminado"
    ).group_by(
        Lote.programa_id
    ).all()
    
    return {
        "cultivo_id": id,
        "cultivo_nombre": cultivo.nombre,
        "total_lotes": total_lotes,
        "lotes_activos": lotes_activos,
        "lotes_inactivos": lotes_inactivos,
        "lotes_completados": lotes_completados,
        "lotes_pendientes": lotes_pendientes,
        "distribucion_por_programa": [
            {"programa_id": p[0], "cantidad": p[1]} for p in por_programa
        ]
    }