from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_db
from app.services.granjas_service import GranjaService
from app.schemas.granja_schema import GranjaCreate, GranjaUpdate, GranjaResponse
from app.core.dependencies import get_current_user

router = APIRouter(
    prefix="/granjas",
    tags=["Granjas"]
)

@router.get("/", response_model=List[GranjaResponse])
def listar(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    return GranjaService.listar_granjas(db, skip, limit)

@router.get("/{granja_id}", response_model=GranjaResponse)
def obtener(granja_id: int, db: Session = Depends(get_db)):
    return GranjaService.obtener_granja(db, granja_id)

@router.post("/", response_model=GranjaResponse)
def crear(data: GranjaCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    return GranjaService.crear_granja(db, data)

@router.put("/{granja_id}", response_model=GranjaResponse)
def actualizar(granja_id: int, data: GranjaUpdate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    return GranjaService.actualizar_granja(db, granja_id, data)

@router.delete("/{granja_id}")
def eliminar(granja_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    return GranjaService.eliminar_granja(db, granja_id)
