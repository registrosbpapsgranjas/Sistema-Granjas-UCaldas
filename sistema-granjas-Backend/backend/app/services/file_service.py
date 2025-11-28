from fastapi import UploadFile, HTTPException
from pathlib import Path
from app.core.config import settings

class FileService:

    @staticmethod
    async def save_file(file: UploadFile) -> str:
        if not file.filename:
            raise HTTPException(status_code=400, detail="Archivo inválido")

        file_path = Path(settings.UPLOAD_DIR) / file.filename

        with open(file_path, "wb") as buffer:
            buffer.write(await file.read())

        return file.filename

    @staticmethod
    def get_file_path(filename: str) -> Path:
        file_path = Path(settings.UPLOAD_DIR) / filename
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="Archivo no encontrado")
        return file_path
