from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.CRUD import programas as crud
from app.schemas.programa import ProgramaCreate, ProgramaUpdate

class ProgramaService:

    @staticmethod
    def listar_programas(db: Session, skip: int = 0, limit: int = 100):
        return crud.get_all(db, skip, limit)

    @staticmethod
    def obtener_programa(db: Session, programa_id: int):
        programa = crud.get_by_id(db, programa_id)
        if not programa:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Programa no encontrado")
        return programa

    @staticmethod
    def crear_programa(db: Session, programa_data: ProgramaCreate):
        # Opcional: validar que los IDs de granjas existan
        return crud.create(db, programa_data)

    @staticmethod
    def actualizar_programa(db: Session, programa_id: int, programa_data: ProgramaUpdate):
        programa = crud.get_by_id(db, programa_id)
        if not programa:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Programa no encontrado")
        return crud.update(db, programa, programa_data)

    @staticmethod
    def eliminar_programa(db: Session, programa_id: int):
        programa = crud.get_by_id(db, programa_id)
        if not programa:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Programa no encontrado")
        crud.delete(db, programa)
        return {"message": "Programa eliminado con éxito"}