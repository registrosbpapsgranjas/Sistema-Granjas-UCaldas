from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db.database import get_db
from app.core.dependencies import require_any_role
from app.CRUD import plantas as crud
from app.schemas.planta_schema import PlantaCreate, PlantaUpdate, PlantaResponse, GenerarPlantasResponse

from app.db.models import Lote  # 👈 IMPORTACIÓN FALTANTE

router = APIRouter(prefix="/plantas", tags=["Plantas"])
role_required = Depends(require_any_role(["admin", "docente", "asesor"]))

@router.get("/", response_model=List[PlantaResponse])
def listar_plantas(
    lote_id: Optional[int] = Query(None),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    _=role_required
):
    return crud.get_plantas(db, lote_id, skip, limit)

@router.get("/{planta_id}", response_model=PlantaResponse)
def obtener_planta(planta_id: int, db: Session = Depends(get_db), _=role_required):
    planta = crud.get_planta(db, planta_id)
    if not planta:
        raise HTTPException(404, "Planta no encontrada")
    return planta

@router.post("/", response_model=PlantaResponse, status_code=201)
def crear_planta(data: PlantaCreate, db: Session = Depends(get_db), _=role_required):
    try:
        return crud.create_planta(db, data)
    except ValueError as e:
        raise HTTPException(400, str(e))

@router.put("/{planta_id}", response_model=PlantaResponse)
def actualizar_planta(planta_id: int, data: PlantaUpdate, db: Session = Depends(get_db), _=role_required):
    planta = crud.get_planta(db, planta_id)
    if not planta:
        raise HTTPException(404, "Planta no encontrada")
    return crud.update_planta(db, planta, data)

@router.delete("/{planta_id}")
def eliminar_planta(planta_id: int, db: Session = Depends(get_db), _=role_required):
    planta = crud.get_planta(db, planta_id)
    if not planta:
        raise HTTPException(404, "Planta no encontrada")
    crud.delete_planta(db, planta)
    return {"message": "Planta eliminada correctamente"}

@router.post("/generar-para-lote/{lote_id}", response_model=GenerarPlantasResponse)
def generar_plantas_lote(lote_id: int, db: Session = Depends(get_db), _=role_required):
    try:
        plantas = crud.crear_plantas_para_lote(db, lote_id)
        lote = db.query(Lote).filter(Lote.id == lote_id).first()
        total_esperadas = lote.surcos * lote.plantas_por_surco if lote else 0
        return GenerarPlantasResponse(
            mensaje=f"Se generaron {len(plantas)} plantas nuevas",
            creadas=len(plantas),
            total_esperadas=total_esperadas,
            plantas=plantas
        )
    except ValueError as e:
        raise HTTPException(400, str(e))