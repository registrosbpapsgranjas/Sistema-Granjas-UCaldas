from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.core.dependencies import require_any_role
from app.CRUD.tipo_recomendaciones import get_all, get_by_id, create, update, delete
from app.schemas.tipo_recomendacion_schema import (
    TipoRecomendacionCreate, TipoRecomendacionUpdate, TipoRecomendacionResponse
)

router = APIRouter(prefix="/tipos-recomendacion", tags=["Tipos de Recomendación"])

role_read = Depends(require_any_role(["admin", "docente", "asesor", "talento_humano", "estudiante", "trabajador"]))
role_write = Depends(require_any_role(["admin", "docente", "asesor"]))

@router.get("/", response_model=List[TipoRecomendacionResponse])
def listar(db: Session = Depends(get_db), _=role_read):
    return get_all(db)

@router.get("/{id}", response_model=TipoRecomendacionResponse)
def obtener(id: int, db: Session = Depends(get_db), _=role_read):
    item = get_by_id(db, id)
    if not item:
        raise HTTPException(404, "Tipo de recomendación no encontrado")
    return item

@router.post("/", response_model=TipoRecomendacionResponse, status_code=201)
def crear(data: TipoRecomendacionCreate, db: Session = Depends(get_db), _=role_write):
    return create(db, data)

@router.put("/{id}", response_model=TipoRecomendacionResponse)
def editar(id: int, data: TipoRecomendacionUpdate, db: Session = Depends(get_db), _=role_write):
    item = get_by_id(db, id)
    if not item:
        raise HTTPException(404, "Tipo de recomendación no encontrado")
    return update(db, item, data)

@router.delete("/{id}")
def eliminar(id: int, db: Session = Depends(get_db), _=role_write):
    item = get_by_id(db, id)
    if not item:
        raise HTTPException(404, "Tipo de recomendación no encontrado")
    delete(db, item)
    return {"message": "Eliminado correctamente"}
