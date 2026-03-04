from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import GranjaPrograma
from pydantic import BaseModel
from typing import List

router = APIRouter(prefix="/asignaciones", tags=["Asignaciones"])

class RelacionProgramaGranja(BaseModel):
    programa_id: int
    granja_id: int

@router.get("/programa-granja", response_model=List[RelacionProgramaGranja])
def obtener_relaciones(db: Session = Depends(get_db)):
    """
    Devuelve todas las relaciones programa-granja desde la tabla pivote.
    """
    relaciones = db.query(GranjaPrograma).all()
    return relaciones