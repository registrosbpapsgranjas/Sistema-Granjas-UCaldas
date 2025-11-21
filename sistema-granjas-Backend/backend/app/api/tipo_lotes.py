from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_db
from app.core.dependencies import require_role
from app.CRUD.tipo_lotes import (
    get_tipos_lote, get_tipo_lote,
    create_tipo_lote, update_tipo_lote, delete_tipo_lote
)
from app.schemas.tipo_lote_schema import (
    TipoLoteCreate, TipoLoteUpdate, TipoLoteResponse
)

router = APIRouter(prefix="/tipos-lote", tags=["Tipos de Lote"])

# ✅ Solo el Admin gestiona tipos de lote
role_required = Depends(require_role(["admin"]))

@router.get("/", response_model=List[TipoLoteResponse])
def listar_tipos_lote(db: Session = Depends(get_db), _=role_required):
    return get_tipos_lote(db)

@router.get("/{tipo_lote_id}", response_model=TipoLoteResponse)
def obtener_tipo_lote(tipo_lote_id: int, db: Session = Depends(get_db), _=role_required):
    tipo = get_tipo_lote(db, tipo_lote_id)
    if not tipo:
        raise HTTPException(404, "Tipo de lote no encontrado")
    return tipo

@router.post("/", response_model=TipoLoteResponse, status_code=201)
def crear_tipo_lote(data: TipoLoteCreate, db: Session = Depends(get_db), _=role_required):
    return create_tipo_lote(db, data)

@router.put("/{tipo_lote_id}", response_model=TipoLoteResponse)
def actualizar_tipo_lote(tipo_lote_id: int, data: TipoLoteUpdate, db: Session = Depends(get_db), _=role_required):
    tipo = get_tipo_lote(db, tipo_lote_id)
    if not tipo:
        raise HTTPException(404, "Tipo de lote no encontrado")
    return update_tipo_lote(db, tipo_lote_id, data)

@router.delete("/{tipo_lote_id}")
def eliminar_tipo_lote(tipo_lote_id: int, db: Session = Depends(get_db), _=role_required):
    tipo = get_tipo_lote(db, tipo_lote_id)
    if not tipo:
        raise HTTPException(404, "Tipo de lote no encontrado")
    delete_tipo_lote(db, tipo_lote_id)
    return {"message": "✅ Tipo de lote eliminado correctamente"}
