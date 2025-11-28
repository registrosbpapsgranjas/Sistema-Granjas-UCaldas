from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from app.services.file_service import FileService
from app.services.storage_service import upload_file_r2

router = APIRouter(prefix="/files", tags=["Archivos"])

@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    try:
        contents = await file.read()

        url = upload_file_r2(
            file_bytes=contents,
            file_name=file.filename,
            content_type=file.content_type
        )

        return {"message": "Archivo subido correctamente", "url": url}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/upload/local")
async def upload_file_local(file: UploadFile = File(...)):
    filename = await FileService.save_file(file)
    return {"filename": filename, "url": f"/files/{filename}"}


@router.get("/{filename}")
async def get_file(filename: str):
    path = FileService.get_file_path(filename)
    return FileResponse(path)
