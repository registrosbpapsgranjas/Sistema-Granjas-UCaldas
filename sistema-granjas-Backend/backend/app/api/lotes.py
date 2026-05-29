from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

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
    LoteCreate, LoteUpdate, LoteResponse, LoteWithRelations
)
from app.db.models import Lote, LoteCultivo, CultivoEspecie

router = APIRouter(prefix="/lotes", tags=["Lotes"])

role_required = Depends(require_any_role(["admin", "docente", "asesor", "talento_humano", "jefe_talento_humano", "estudiante", "trabajador"]))


# 🔹 FUNCIÓN AUXILIAR PARA NO REPETIR CÓDIGO
def construir_lote_dict(lote: Lote):
    return {
        "id": lote.id,
        "nombre": lote.nombre,
        "tipo_lote_id": lote.tipo_lote_id,
        "granja_id": lote.granja_id,
        "programa_id": lote.programa_id,
        "fecha_inicio": lote.fecha_inicio,
        "estado": lote.estado,
        "fecha_creacion": lote.created_at if hasattr(lote, 'created_at') else None,

        # 👇 NUEVOS CAMPOS
        "surcos": lote.surcos,
        "plantas_por_surco": lote.plantas_por_surco,

        "cultivos_ids": [lc.cultivo_id for lc in lote.cultivos_asignados]
    }


@router.get("/", response_model=List[LoteResponse])
def listar_lotes(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    programa_id: Optional[int] = Query(None),
    granja_id: Optional[int] = Query(None),
    cultivo_id: Optional[int] = Query(None),
    estado: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    _=role_required
):
    lotes = get_lotes(db, skip, limit, programa_id, granja_id, cultivo_id, estado)
    return [construir_lote_dict(l) for l in lotes]


@router.get("/{lote_id}", response_model=LoteResponse)
def obtener_lote(lote_id: int, db: Session = Depends(get_db), _=role_required):
    lote = get_lote(db, lote_id)
    if not lote:
        raise HTTPException(status_code=404, detail="Lote no encontrado")
    return construir_lote_dict(lote)


@router.get("/{lote_id}/estructura")
def obtener_estructura_lote(
    lote_id: int,
    db: Session = Depends(get_db),
    _=role_required
):
    """
    Obtiene la estructura completa de un lote incluyendo surcos y plantas.
    Útil para los formularios de diagnóstico que necesitan conocer la disposición
    de plantas en el lote.
    """
    lote = get_lote(db, lote_id)
    if not lote:
        raise HTTPException(status_code=404, detail="Lote no encontrado")
    
    # Generar la estructura de plantas basada en surcos y plantas_por_surco
    plantas = []
    
    if lote.surcos and lote.plantas_por_surco:
        # Limitar la cantidad de plantas para no sobrecargar el frontend
        # Mostrar máximo 1000 plantas (o ajustar según necesidad)
        MAX_PLANTAS = 1000
        total_plantas = lote.surcos * lote.plantas_por_surco
        
        if total_plantas <= MAX_PLANTAS:
            # Si hay pocas plantas, generarlas todas
            for surco in range(1, lote.surcos + 1):
                for planta in range(1, lote.plantas_por_surco + 1):
                    plantas.append({
                        "codigo": f"{surco}-{planta}",
                        "label": f"Surco {surco}, Planta {planta}",
                        "surco": surco,
                        "planta": planta
                    })
        else:
            # Si hay muchas plantas, generar una muestra representativa
            # Por ejemplo, tomar cada N plantas
            intervalo_surco = max(1, lote.surcos // 10)
            intervalo_planta = max(1, lote.plantas_por_surco // 10)
            
            for surco in range(1, lote.surcos + 1, intervalo_surco):
                for planta in range(1, lote.plantas_por_surco + 1, intervalo_planta):
                    plantas.append({
                        "codigo": f"{surco}-{planta}",
                        "label": f"Surco {surco}, Planta {planta}",
                        "surco": surco,
                        "planta": planta
                    })
            
            # Asegurar que no excedamos el límite
            if len(plantas) > MAX_PLANTAS:
                plantas = plantas[:MAX_PLANTAS]
    
    # Obtener información de cultivos asignados al lote
    cultivos_info = []
    for lc in lote.cultivos_asignados:
        if lc.cultivo:
            cultivos_info.append({
                "id": lc.cultivo.id,
                "nombre": lc.cultivo.nombre,
                "tipo": lc.cultivo.tipo,
                "descripcion": getattr(lc.cultivo, 'descripcion', None)
            })
    
    return {
        "id": lote.id,
        "nombre": lote.nombre,
        "surcos": lote.surcos,
        "plantas_por_surco": lote.plantas_por_surco,
        "total_plantas": lote.surcos * lote.plantas_por_surco if lote.surcos and lote.plantas_por_surco else 0,
        "plantas": plantas,
        "cultivos": cultivos_info,
        "granja": {
            "id": lote.granja_id,
            "nombre": lote.granja.nombre if lote.granja else None
        },
        "programa": {
            "id": lote.programa_id,
            "nombre": lote.programa.nombre if lote.programa else None
        },
        "estado": lote.estado,
        "fecha_inicio": lote.fecha_inicio,
        "muestra_completa": len(plantas) == (lote.surcos * lote.plantas_por_surco) if lote.surcos and lote.plantas_por_surco else False,
        "total_plantas_muestreadas": len(plantas)
    }


@router.get("/{lote_id}/detalle", response_model=LoteWithRelations)
def obtener_lote_detalle(
    lote_id: int,
    db: Session = Depends(get_db),
    _=role_required
):
    lote = get_lote(db, lote_id)
    if not lote:
        raise HTTPException(status_code=404, detail="Lote no encontrado")

    lote_dict = construir_lote_dict(lote)

    lote_dict.update({
        "cultivos_detalle": [],
        "tipo_lote": None,
        "granja": None,
        "programa": None
    })

    for lc in lote.cultivos_asignados:
        if lc.cultivo:
            lote_dict["cultivos_detalle"].append({
                "id": lc.cultivo.id,
                "nombre": lc.cultivo.nombre,
                "tipo": lc.cultivo.tipo
            })

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
def crear_lote(data: LoteCreate, db: Session = Depends(get_db), _=role_required):
    return create_lote(db, data)


@router.put("/{lote_id}", response_model=LoteResponse)
def editar_lote(
    lote_id: int,
    data: LoteUpdate,
    db: Session = Depends(get_db),
    _=role_required
):
    lote = get_lote(db, lote_id)
    if not lote:
        raise HTTPException(status_code=404, detail="Lote no encontrado")
    return update_lote(db, lote, data)


@router.delete("/{lote_id}")
def eliminar_lote(lote_id: int, db: Session = Depends(get_db), _=role_required):
    lote = get_lote(db, lote_id)
    if not lote:
        raise HTTPException(status_code=404, detail="Lote no encontrado")
    delete_lote(db, lote)
    return {"message": "✅ Lote eliminado correctamente"}


# ===== CULTIVOS =====

@router.get("/{lote_id}/cultivos", response_model=List[dict])
def listar_cultivos_del_lote(lote_id: int, db: Session = Depends(get_db), _=role_required):
    lote = get_lote(db, lote_id)
    if not lote:
        raise HTTPException(status_code=404, detail="Lote no encontrado")

    return [
        {
            "cultivo_id": lc.cultivo.id,
            "nombre": lc.cultivo.nombre,
            "tipo": lc.cultivo.tipo
        }
        for lc in lote.cultivos_asignados if lc.cultivo
    ]


@router.post("/{lote_id}/cultivos", response_model=List[dict])
def agregar_cultivos_a_lote(
    lote_id: int,
    cultivos_ids: List[int],
    db: Session = Depends(get_db),
    _=role_required
):
    lote = get_lote(db, lote_id)
    if not lote:
        raise HTTPException(status_code=404, detail="Lote no encontrado")

    creados = []

    for cultivo_id in cultivos_ids:
        existente = db.query(LoteCultivo).filter(
            LoteCultivo.lote_id == lote_id,
            LoteCultivo.cultivo_id == cultivo_id
        ).first()

        if not existente:
            relacion = LoteCultivo(lote_id=lote_id, cultivo_id=cultivo_id)
            db.add(relacion)
            db.flush()

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
    relacion = db.query(LoteCultivo).filter(
        LoteCultivo.lote_id == lote_id,
        LoteCultivo.cultivo_id == cultivo_id
    ).first()

    if not relacion:
        raise HTTPException(status_code=404, detail="El cultivo no está asignado a este lote")

    db.delete(relacion)
    db.commit()

    return {"message": "✅ Cultivo eliminado del lote correctamente"}


# ===== FILTROS =====

@router.get("/por-programa/{programa_id}", response_model=List[LoteResponse])
def listar_lotes_por_programa(programa_id: int, db: Session = Depends(get_db), _=role_required):
    return [construir_lote_dict(l) for l in get_lotes_por_programa(db, programa_id)]


@router.get("/por-granja/{granja_id}", response_model=List[LoteResponse])
def listar_lotes_por_granja(granja_id: int, db: Session = Depends(get_db), _=role_required):
    return [construir_lote_dict(l) for l in get_lotes_por_granja(db, granja_id)]


@router.get("/por-cultivo/{cultivo_id}", response_model=List[LoteResponse])
def listar_lotes_por_cultivo(cultivo_id: int, db: Session = Depends(get_db), _=role_required):
    return [construir_lote_dict(l) for l in get_lotes_por_cultivo(db, cultivo_id)]


@router.get("/estado/activos", response_model=List[LoteResponse])
def listar_lotes_activos(db: Session = Depends(get_db), _=role_required):
    return [construir_lote_dict(l) for l in get_lotes_activos(db)]


@router.get("/buscar/{nombre}", response_model=List[LoteResponse])
def buscar_lotes(nombre: str, db: Session = Depends(get_db), _=role_required):
    return [construir_lote_dict(l) for l in buscar_lotes_por_nombre(db, nombre)]


@router.get("/conteo/por-cultivo")
def contar_lotes_por_cultivo(db: Session = Depends(get_db), _=role_required):
    return lote_cultivos.contar_lotes_por_cultivo(db)


@router.get("/estadisticas/resumen")
def obtener_estadisticas(db: Session = Depends(get_db), _=role_required):
    return get_estadisticas_lotes(db)