from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_db
from app.core.dependencies import require_role
from app.CRUD.lotes import (
    get_lotes, get_lote, create_lote, update_lote, delete_lote
)
from app.schemas.lote_schema import (
    LoteCreate, LoteUpdate, LoteResponse
)

router = APIRouter(prefix="/lotes", tags=["Lotes"])

# ✅ Solo Admin gestiona lotes
role_required = Depends(require_role(["admin"]))

@router.get("/", response_model=List[LoteResponse])
def listar_lotes(db: Session = Depends(get_db), _=role_required):
    return get_lotes(db)

@router.get("/{lote_id}", response_model=LoteResponse)
def obtener_lote(lote_id: int, db: Session = Depends(get_db), _=role_required):
    lote = get_lote(db, lote_id)
    if not lote:
        raise HTTPException(404, "Lote no encontrado")
    return lote

@router.post("/", response_model=LoteResponse, status_code=201)
def crear_lote(data: LoteCreate, db: Session = Depends(get_db), _=role_required):
    return create_lote(db, data)

@router.put("/{lote_id}", response_model=LoteResponse)
def editar_lote(lote_id: int, data: LoteUpdate, db: Session = Depends(get_db), _=role_required):
    lote = get_lote(db, lote_id)
    if not lote:
        raise HTTPException(404, "Lote no encontrado")
    return update_lote(db, lote, data)

@router.delete("/{lote_id}")
def eliminar_lote(lote_id: int, db: Session = Depends(get_db), _=role_required):
    lote = get_lote(db, lote_id)
    if not lote:
        raise HTTPException(404, "Lote no encontrado")
    delete_lote(db, lote)
    return {"message": "✅ Lote eliminado correctamente"}
