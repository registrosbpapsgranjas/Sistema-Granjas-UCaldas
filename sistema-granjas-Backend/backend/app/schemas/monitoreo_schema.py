from pydantic import BaseModel, Field, field_validator
from datetime import datetime
from typing import Optional
import re

# ========== BASES ==========
class MonitoreoBase(BaseModel):
    nombre: str
    programa_id: int

    @field_validator('nombre')
    def validar_nombre(cls, v):
        if not v or len(v.strip()) == 0:
            raise ValueError('El nombre del monitoreo no puede estar vacío')
        if len(v.strip()) < 3:
            raise ValueError('El nombre debe tener al menos 3 caracteres')
        if len(v) > 100:
            raise ValueError('El nombre no puede tener más de 100 caracteres')
        if not re.match(r'^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s\-\'\.\(\)0-9:]+$', v):
            raise ValueError('El nombre contiene caracteres no permitidos')
        return v.strip()

    @field_validator('programa_id')
    def validar_programa_id(cls, v):
        if v < 1:
            raise ValueError('El ID del programa debe ser un número positivo')
        return v


class MonitoreoCreate(MonitoreoBase):
    pass


class MonitoreoUpdate(BaseModel):
    nombre: Optional[str] = None
    programa_id: Optional[int] = None

    @field_validator('nombre')
    def validar_nombre_update(cls, v):
        if v is not None:
            if len(v.strip()) < 3:
                raise ValueError('El nombre debe tener al menos 3 caracteres')
            if len(v) > 100:
                raise ValueError('El nombre no puede tener más de 100 caracteres')
        return v

    @field_validator('programa_id')
    def validar_programa_id_update(cls, v):
        if v is not None and v < 1:
            raise ValueError('El ID del programa debe ser un número positivo')
        return v


class MonitoreoResponse(MonitoreoBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }