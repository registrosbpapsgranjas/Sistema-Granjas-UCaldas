from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_db
from app.core.dependencies import require_role
from app.schemas.programa_schema import ProgramaCreate, ProgramaResponse
from app.CRUD.programas import (
    get_programas, get_programa,
    create_programa, update_programa, delete_programa
)

router = APIRouter(prefix="/programas", tags=["Programas"])

@router.get("/", response_model=List[ProgramaResponse])
def listar_programas(db: Session = Depends(get_db),
                     current_user: dict = Depends(require_role(["admin"]))):
    return get_programas(db)

@router.get("/{programa_id}", response_model=ProgramaResponse)
def obtener_programa(programa_id: int, db: Session = Depends(get_db),
                     current_user: dict = Depends(require_role(["admin"]))):
    programa = get_programa(db, programa_id)
    if not programa:
        raise HTTPException(404, "Programa no encontrado")
    return programa

@router.post("/", response_model=ProgramaResponse, status_code=201)
def crear_programa(data: ProgramaCreate, db: Session = Depends(get_db),
                   current_user: dict = Depends(require_role(["admin"]))):
    return create_programa(db, data)

@router.put("/{programa_id}", response_model=ProgramaResponse)
def actualizar_programa(programa_id: int, data: ProgramaCreate,
                        db: Session = Depends(get_db),
                        current_user: dict = Depends(require_role(["admin"]))):
    programa = get_programa(db, programa_id)
    if not programa:
        raise HTTPException(404, "Programa no encontrado")
    return update_programa(db, programa, data)

@router.delete("/{programa_id}")
def eliminar_programa(programa_id: int, db: Session = Depends(get_db),
                      current_user: dict = Depends(require_role(["admin"]))):
    programa = get_programa(db, programa_id)
    if not programa:
        raise HTTPException(404, "Programa no encontrado")
    delete_programa(db, programa)
    return {"message": "Programa eliminado correctamente"}
