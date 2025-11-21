from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.core.dependencies import require_role
from app.CRUD.tipo_labores import get_all, get_by_id, create, update, delete
from app.schemas.tipo_labor_schema import (
    TipoLaborCreate, TipoLaborUpdate, TipoLaborResponse
)

router = APIRouter(prefix="/tipos-labor", tags=["Tipos de Labor"])

role_required = Depends(require_role(["admin", "asesor"]))

@router.get("/", response_model=List[TipoLaborResponse])
def listar(db: Session = Depends(get_db), _=role_required):
    return get_all(db)

@router.get("/{id}", response_model=TipoLaborResponse)
def obtener(id: int, db: Session = Depends(get_db), _=role_required):
    item = get_by_id(db, id)
    if not item:
        raise HTTPException(404, "Tipo de labor no encontrado")
    return item

@router.post("/", response_model=TipoLaborResponse, status_code=201)
def crear(data: TipoLaborCreate, db: Session = Depends(get_db), _=role_required):
    return create(db, data)

@router.put("/{id}", response_model=TipoLaborResponse)
def editar(id: int, data: TipoLaborUpdate, db: Session = Depends(get_db), _=role_required):
    item = get_by_id(db, id)
    if not item:
        raise HTTPException(404, "Tipo de labor no encontrado")
    return update(db, item, data)

@router.delete("/{id}")
def eliminar(id: int, db: Session = Depends(get_db), _=role_required):
    item = get_by_id(db, id)
    if not item:
        raise HTTPException(404, "Tipo de labor no encontrado")
    delete(db, item)
    return {"message": "✅ Eliminado correctamente"}
