from pydantic import BaseModel, field_validator
from typing import Optional, List
from datetime import datetime
import re


class GranjaBase(BaseModel):

    nombre: str
    ubicacion: str

    @field_validator("nombre")
    def validar_nombre(cls, v):

        v = v.strip()

        if len(v) < 3:
            raise ValueError("El nombre debe tener al menos 3 caracteres")

        if len(v) > 100:
            raise ValueError("El nombre no puede superar 100 caracteres")

        if not re.match(r"^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s\-\.]+$", v):
            raise ValueError("Nombre contiene caracteres inválidos")

        return v.title()

    @field_validator("ubicacion")
    def validar_ubicacion(cls, v):

        v = v.strip()

        if len(v) < 5:
            raise ValueError("Ubicación demasiado corta")

        if len(v) > 150:
            raise ValueError("Ubicación demasiado larga")

        return v


class GranjaCreate(GranjaBase):
    pass


class GranjaUpdate(BaseModel):

    nombre: Optional[str] = None
    ubicacion: Optional[str] = None
    activo: Optional[bool] = None


class GranjaResponse(GranjaBase):

    id: int
    activo: bool
    fecha_creacion: datetime

    class Config:
        from_attributes = True


class AsignacionUsuarioGranja(BaseModel):

    usuario_id: int


class AsignacionProgramaGranja(BaseModel):

    programa_id: int


class GranjaWithRelations(GranjaResponse):

    cultivos: List[dict] = []
    usuarios: List[dict] = []
    programas: List[dict] = []
    lotes: List[dict] = []

    class Config:
        from_attributes = True