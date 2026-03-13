from pydantic import BaseModel, field_validator
from typing import Optional, List
from datetime import datetime
import re

class GranjaBase(BaseModel):
    nombre: str
    ubicacion: str

    @field_validator('nombre')
    def validar_nombre(cls, v):
        if not v or len(v.strip()) == 0:
            raise ValueError('El nombre de la granja no puede estar vacío')
        if len(v.strip()) < 3:
            raise ValueError('El nombre de la granja debe tener al menos 3 caracteres')
        if len(v) > 100:
            raise ValueError('El nombre de la granja no puede tener más de 100 caracteres')
        if not re.match(r'^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s\-\'\.\(\)0-9]+$', v):
            raise ValueError('El nombre de la granja contiene caracteres no permitidos')
        return v.strip()

    @field_validator('ubicacion')
    def validar_ubicacion(cls, v):
        if not v or len(v.strip()) == 0:
            raise ValueError('La ubicación no puede estar vacía')
        if len(v.strip()) < 5:
            raise ValueError('La ubicación debe tener al menos 5 caracteres')
        if len(v) > 150:
            raise ValueError('La ubicación no puede tener más de 150 caracteres')
        if not re.match(r'^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s\-\'\.\,0-9]+$', v):
            raise ValueError('La ubicación contiene caracteres no permitidos')
        # SIN VALIDACIÓN ESTRICTA DE COMA
        return v.strip()

class GranjaCreate(GranjaBase):
    pass

class GranjaUpdate(BaseModel):
    nombre: Optional[str] = None
    ubicacion: Optional[str] = None
    activo: Optional[bool] = None

    @field_validator('nombre')
    def validar_nombre_update(cls, v):
        if v is not None:
            if len(v.strip()) < 3:
                raise ValueError('El nombre de la granja debe tener al menos 3 caracteres')
            if len(v) > 100:
                raise ValueError('El nombre de la granja no puede tener más de 100 caracteres')
            if not re.match(r'^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s\-\'\.\(\)0-9]+$', v):
                raise ValueError('El nombre de la granja contiene caracteres no permitidos')
        return v

    @field_validator('ubicacion')
    def validar_ubicacion_update(cls, v):
        if v is not None:
            if len(v.strip()) < 5:
                raise ValueError('La ubicación debe tener al menos 5 caracteres')
            if len(v) > 150:
                raise ValueError('La ubicación no puede tener más de 150 caracteres')
            if not re.match(r'^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s\-\'\.\,0-9]+$', v):
                raise ValueError('La ubicación contiene caracteres no permitidos')
        return v

class GranjaResponse(GranjaBase):
    id: int
    activo: bool
    fecha_creacion: datetime

    class Config:
        from_attributes = True