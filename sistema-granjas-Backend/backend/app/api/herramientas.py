from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_db
from app.core.dependencies import require_role
from app.CRUD.herramientas import (
    get_all, get, create, update, delete
)
from app.schemas.herramienta_schema import (
    HerramientaCreate, HerramientaUpdate, HerramientaResponse
)

router = APIRouter(prefix="/herramientas", tags=["Herramientas"])

# ✅ Permisos
role_admin_th = Depends(require_role(["admin", "talento_humano", "asesor"]))


@router.get("/", response_model=List[HerramientaResponse])
def listar_herramientas(db: Session = Depends(get_db)):
    return get_all(db)


@router.get("/{id}", response_model=HerramientaResponse)
def obtener_herramienta(id: int, db: Session = Depends(get_db)):
    herramienta = get(db, id)
    if not herramienta:
        raise HTTPException(404, "Herramienta no encontrada")
    return herramienta


@router.post("/", response_model=HerramientaResponse, status_code=201)
def crear_herramienta(data: HerramientaCreate, db: Session = Depends(get_db), _=role_admin_th):
    return create(db, data)


@router.put("/{id}", response_model=HerramientaResponse)
def editar_herramienta(id: int, data: HerramientaUpdate, db: Session = Depends(get_db), _=role_admin_th):
    herramienta = update(db, id, data)
    if not herramienta:
        raise HTTPException(404, "Herramienta no encontrada")
    return herramienta


@router.delete("/{id}")
def eliminar_herramienta(id: int, db: Session = Depends(get_db), _=role_admin_th):
    success = delete(db, id)
    if not success:
        raise HTTPException(404, "Herramienta no encontrada")
    return {"message": "✅ Herramienta eliminada correctamente"}
