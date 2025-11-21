from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.core.dependencies import require_role
from app.schemas.categoria_inventario_schema import (
    CategoriaInventarioCreate, CategoriaInventarioUpdate, CategoriaInventarioResponse
)
from app.CRUD import categorias_inventario as crud

router = APIRouter(prefix="/categorias", tags=["Categorías Inventario"])

# ✅ Solo Admin y Talento Humano
role_required = Depends(require_role(["admin","docente","asesor", "talento_humano"]))

@router.get("/", response_model=list[CategoriaInventarioResponse])
def listar(db: Session = Depends(get_db), _=role_required):
    return crud.get_all(db)

@router.post("/", response_model=CategoriaInventarioResponse, status_code=201)
def crear(data: CategoriaInventarioCreate, db: Session = Depends(get_db), _=role_required):
    return crud.create(db, data)

@router.put("/{id}", response_model=CategoriaInventarioResponse)
def actualizar(id: int, data: CategoriaInventarioUpdate, db: Session = Depends(get_db), _=role_required):
    updated = crud.update(db, id, data)
    if not updated:
        raise HTTPException(404, "Categoría no encontrada")
    return updated

@router.delete("/{id}")
def eliminar(id: int, db: Session = Depends(get_db), _=role_required):
    deleted = crud.delete(db, id)
    if not deleted:
        raise HTTPException(404, "Categoría no encontrada")
    return {"message": "✅ Categoría eliminada correctamente"}
