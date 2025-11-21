from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.CRUD.granjas import get_all, get_by_id, create, update, delete

class GranjaService:

    @staticmethod
    def listar_granjas(db: Session, skip=0, limit=50):
        return get_all(db, skip, limit)

    @staticmethod
    def obtener_granja(db: Session, granja_id: int):
        granja = get_by_id(db, granja_id)
        if not granja:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Granja no encontrada")
        return granja

    @staticmethod
    def crear_granja(db: Session, granja_data):
        return create(db, granja_data)

    @staticmethod
    def actualizar_granja(db: Session, granja_id: int, data):
        granja = get_by_id(db, granja_id)
        if not granja:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Granja no encontrada")
        return update(db, granja, data)

    @staticmethod
    def eliminar_granja(db: Session, granja_id: int):
        granja = get_by_id(db, granja_id)
        if not granja:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Granja no encontrada")
        delete(db, granja)
        return {"message": "Granja eliminada con éxito"}
