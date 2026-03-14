from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from sqlalchemy import func

from app.db.database import get_db
from app.core.dependencies import require_any_role
from app.CRUD.lotes import (
    get_lotes, get_lote, create_lote, update_lote, delete_lote,
    get_lotes_por_programa, get_lotes_por_granja, get_lotes_activos,
    buscar_lotes_por_nombre, get_estadisticas_lotes,
    get_lotes_por_cultivo
)
from app.CRUD import lote_cultivos
from app.schemas.lote_schema import (
    LoteCreate, LoteUpdate, LoteResponse, LoteWithRelations,
    LoteCultivoResponse, LoteCultivoCreate, LoteCultivoUpdate
)
from app.db.models import Lote, LoteCultivo

router = APIRouter(prefix="/lotes", tags=["Lotes"])

# Roles permitidos
role_required = Depends(require_any_role(["admin", "docente", "asesor", "talento_humano", "estudiante", "trabajador"]))

@router.get("/", response_model=List[LoteResponse])
def listar_lotes(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    programa_id: Optional[int] = Query(None, description="Filtrar por programa ID"),
    granja_id: Optional[int] = Query(None, description="Filtrar por granja ID"),
    cultivo_id: Optional[int] = Query(None, description="Filtrar por cultivo ID"),
    estado: Optional[str] = Query(None, description="Filtrar por estado"),
    db: Session = Depends(get_db),
    _=role_required
):
    """
    Listar todos los lotes con filtros opcionales:
    - programa_id: Filtrar por programa específico
    - granja_id: Filtrar por granja específica
    - cultivo_id: Filtrar por cultivo específico
    - estado: Filtrar por estado (activo, inactivo, etc.)
    """
    return get_lotes(
        db, 
        skip=skip, 
        limit=limit, 
        programa_id=programa_id, 
        granja_id=granja_id,
        cultivo_id=cultivo_id,
        estado=estado
    )

@router.get("/{lote_id}", response_model=LoteResponse)
def obtener_lote(
    lote_id: int, 
    db: Session = Depends(get_db), 
    _=role_required
):
    """Obtener un lote por su ID"""
    lote = get_lote(db, lote_id)
    if not lote:
        raise HTTPException(status_code=404, detail="Lote no encontrado")
    return lote

@router.get("/{lote_id}/detalle", response_model=LoteWithRelations)
def obtener_lote_detalle(
    lote_id: int,
    db: Session = Depends(get_db),
    _=role_required
):
    """Obtener un lote con todas sus relaciones (cultivos, tipo, granja, programa)"""
    lote = get_lote(db, lote_id)
    if not lote:
        raise HTTPException(status_code=404, detail="Lote no encontrado")
    
    # Convertir a dict y agregar relaciones
    lote_dict = {
        "id": lote.id,
        "nombre": lote.nombre,
        "tipo_lote_id": lote.tipo_lote_id,
        "granja_id": lote.granja_id,
        "programa_id": lote.programa_id,
        "fecha_inicio": lote.fecha_inicio,
        "estado": lote.estado,
        "fecha_creacion": lote.created_at if hasattr(lote, 'created_at') else None,
        "cultivos_asignados": [],
        "cultivos_detalle": [],
        "tipo_lote": None,
        "granja": None,
        "programa": None
    }
    
    # 👇 CORREGIDO: Acceder a través de cultivos_asignados
    for lc in lote.cultivos_asignados:
        # Relación LoteCultivo (tabla pivote)
        lote_dict["cultivos_asignados"].append({
            "lote_id": lc.lote_id,
            "cultivo_id": lc.cultivo_id
        })
        
        if lc.cultivo:
            lote_dict["cultivos_detalle"].append({
                "id": lc.cultivo.id,
                "nombre": lc.cultivo.nombre,
                "tipo": lc.cultivo.tipo
            })
    
    # Agregar relaciones simples
    if lote.tipo_lote:
        lote_dict["tipo_lote"] = {
            "id": lote.tipo_lote.id,
            "nombre": lote.tipo_lote.nombre
        }
    
    if lote.granja:
        lote_dict["granja"] = {
            "id": lote.granja.id,
            "nombre": lote.granja.nombre,
            "ubicacion": lote.granja.ubicacion
        }
    
    if lote.programa:
        lote_dict["programa"] = {
            "id": lote.programa.id,
            "nombre": lote.programa.nombre,
            "tipo": lote.programa.tipo
        }
    
    return lote_dict

@router.post("/", response_model=LoteResponse, status_code=201)
def crear_lote(
    data: LoteCreate, 
    db: Session = Depends(get_db), 
    _=role_required
):
    """Crear un nuevo lote con sus cultivos"""
    return create_lote(db, data)

@router.put("/{lote_id}", response_model=LoteResponse)
def editar_lote(
    lote_id: int, 
    data: LoteUpdate, 
    db: Session = Depends(get_db), 
    _=role_required
):
    """Actualizar un lote existente y sus cultivos"""
    lote = get_lote(db, lote_id)
    if not lote:
        raise HTTPException(status_code=404, detail="Lote no encontrado")
    return update_lote(db, lote, data)

@router.delete("/{lote_id}")
def eliminar_lote(
    lote_id: int, 
    db: Session = Depends(get_db), 
    _=role_required
):
    """Eliminar (marcar como eliminado) un lote"""
    lote = get_lote(db, lote_id)
    if not lote:
        raise HTTPException(status_code=404, detail="Lote no encontrado")
    delete_lote(db, lote)
    return {"message": "✅ Lote eliminado correctamente"}

# === ENDPOINTS PARA GESTIÓN DE CULTIVOS DEL LOTE ===

@router.get("/{lote_id}/cultivos", response_model=List[dict])
def listar_cultivos_del_lote(
    lote_id: int,
    db: Session = Depends(get_db),
    _=role_required
):
    """Listar todos los cultivos asignados a un lote"""
    # Verificar que el lote existe
    lote = get_lote(db, lote_id)
    if not lote:
        raise HTTPException(status_code=404, detail="Lote no encontrado")
    
    # Obtener cultivos a través de la tabla pivote
    resultados = []
    for lc in lote.cultivos_asignados:
        if lc.cultivo:
            resultados.append({
                "cultivo_id": lc.cultivo.id,
                "nombre": lc.cultivo.nombre,
                "tipo": lc.cultivo.tipo
            })
    
    return resultados

@router.post("/{lote_id}/cultivos", response_model=List[dict])
def agregar_cultivos_a_lote(
    lote_id: int,
    cultivos_ids: List[int],
    db: Session = Depends(get_db),
    _=role_required
):
    """Agregar múltiples cultivos a un lote"""
    # Verificar que el lote existe
    lote = get_lote(db, lote_id)
    if not lote:
        raise HTTPException(status_code=404, detail="Lote no encontrado")
    
    # Crear relaciones
    creados = []
    for cultivo_id in cultivos_ids:
        # Verificar si ya existe
        existente = db.query(LoteCultivo).filter(
            LoteCultivo.lote_id == lote_id,
            LoteCultivo.cultivo_id == cultivo_id
        ).first()
        
        if not existente:
            relacion = LoteCultivo(lote_id=lote_id, cultivo_id=cultivo_id)
            db.add(relacion)
            db.flush()
            
            # Obtener información del cultivo
            cultivo = db.query(CultivoEspecie).filter(CultivoEspecie.id == cultivo_id).first()
            if cultivo:
                creados.append({
                    "cultivo_id": cultivo_id,
                    "nombre": cultivo.nombre,
                    "tipo": cultivo.tipo
                })
    
    db.commit()
    return creados

@router.delete("/{lote_id}/cultivos/{cultivo_id}")
def eliminar_cultivo_de_lote(
    lote_id: int,
    cultivo_id: int,
    db: Session = Depends(get_db),
    _=role_required
):
    """Eliminar un cultivo específico de un lote"""
    # Buscar la relación
    relacion = db.query(LoteCultivo).filter(
        LoteCultivo.lote_id == lote_id,
        LoteCultivo.cultivo_id == cultivo_id
    ).first()
    
    if not relacion:
        raise HTTPException(status_code=404, detail="El cultivo no está asignado a este lote")
    
    db.delete(relacion)
    db.commit()
    
    return {"message": "✅ Cultivo eliminado del lote correctamente"}

# === ENDPOINTS ESPECÍFICOS EXISTENTES ===

@router.get("/por-programa/{programa_id}", response_model=List[LoteResponse])
def listar_lotes_por_programa(
    programa_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    _=role_required
):
    """Listar todos los lotes de un programa específico"""
    return get_lotes_por_programa(db, programa_id, skip=skip, limit=limit)

@router.get("/por-granja/{granja_id}", response_model=List[LoteResponse])
def listar_lotes_por_granja(
    granja_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    _=role_required
):
    """Listar todos los lotes de una granja específica"""
    return get_lotes_por_granja(db, granja_id, skip=skip, limit=limit)

@router.get("/por-cultivo/{cultivo_id}", response_model=List[LoteResponse])
def listar_lotes_por_cultivo(
    cultivo_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    _=role_required
):
    """Listar todos los lotes de un cultivo específico"""
    return get_lotes_por_cultivo(db, cultivo_id, skip=skip, limit=limit)

@router.get("/conteo/por-cultivo", response_model=List[dict])
def contar_lotes_por_cultivo(
    db: Session = Depends(get_db),
    _=role_required
):
    """
    Retorna el conteo de lotes agrupados por cultivo_id
    Útil para mostrar en la tabla de cultivos cuántos lotes usan cada cultivo
    """
    from app.CRUD.lote_cultivos import contar_lotes_por_cultivo
    return contar_lotes_por_cultivo(db)

@router.get("/estado/activos", response_model=List[LoteResponse])
def listar_lotes_activos(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    _=role_required
):
    """Listar solo lotes activos"""
    return get_lotes_activos(db, skip=skip, limit=limit)

@router.get("/buscar/{nombre}", response_model=List[LoteResponse])
def buscar_lotes(
    nombre: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    _=role_required
):
    """Buscar lotes por nombre (búsqueda parcial)"""
    return buscar_lotes_por_nombre(db, nombre, skip=skip, limit=limit)

@router.get("/estadisticas/resumen")
def obtener_estadisticas(
    db: Session = Depends(get_db),
    _=role_required
):
    """Obtener estadísticas de lotes"""
    return get_estadisticas_lotes(db)