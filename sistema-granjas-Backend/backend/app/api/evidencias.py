from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.core.dependencies import get_current_user
from app.schemas.evidencia_schema import EvidenciaCreate, EvidenciaResponse, EvidenciaListResponse
from app.CRUD.evidencias import crear_evidencia_crud, listar_evidencias_entidad_crud, eliminar_evidencia_crud

router = APIRouter(prefix="/evidencias", tags=["Evidencias"])

@router.post("/", response_model=EvidenciaResponse)
def crear_evidencia(
    data: EvidenciaCreate,
    db: Session = Depends(get_db),
    usuario = Depends(get_current_user)
):
    """Crear una nueva evidencia para cualquier entidad"""
    return crear_evidencia_crud(db, data, usuario)

@router.get("/{tipo_entidad}/{entidad_id}", response_model=EvidenciaListResponse)
def listar_evidencias_entidad(
    tipo_entidad: str,  # labor, diagnostico, recomendacion
    entidad_id: int,
    db: Session = Depends(get_db),
    usuario = Depends(get_current_user)
):
    """Listar evidencias de una entidad específica"""
    return listar_evidencias_entidad_crud(db, tipo_entidad, entidad_id)

@router.delete("/{evidencia_id}")
def eliminar_evidencia(
    evidencia_id: int,
    db: Session = Depends(get_db),
    usuario = Depends(get_current_user)
):
    """Eliminar una evidencia"""
    return eliminar_evidencia_crud(db, evidencia_id, usuario)