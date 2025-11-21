from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_db
from app.core.dependencies import require_role
from app.CRUD.cultivos_especies import (
    get_all, get_by_id, create, update, delete
)
from app.schemas.cultivo_especie_schema import (
    CultivoEspecieCreate, CultivoEspecieUpdate, CultivoEspecieResponse
)

router = APIRouter(prefix="/cultivos", tags=["Cultivos / Especies"])

role_required = Depends(require_role(["admin"]))

@router.get("/", response_model=List[CultivoEspecieResponse])
def listar(db: Session = Depends(get_db), _=role_required):
    return get_all(db)

@router.get("/{id}", response_model=CultivoEspecieResponse)
def obtener(id: int, db: Session = Depends(get_db), _=role_required):
    item = get_by_id(db, id)
    if not item:
        raise HTTPException(404, "No encontrado")
    return item

@router.post("/", response_model=CultivoEspecieResponse, status_code=201)
def crear(data: CultivoEspecieCreate, db: Session = Depends(get_db), _=role_required):
    return create(db, data)

@router.put("/{id}", response_model=CultivoEspecieResponse)
def editar(id: int, data: CultivoEspecieUpdate, db: Session = Depends(get_db), _=role_required):
    item = get_by_id(db, id)
    if not item:
        raise HTTPException(404, "No encontrado")
    return update(db, item, data)

@router.delete("/{id}")
def eliminar(id: int, db: Session = Depends(get_db), _=role_required):
    item = get_by_id(db, id)
    if not item:
        raise HTTPException(404, "No encontrado")
    delete(db, item)
    return {"message": "✅ Eliminado correctamente"}
