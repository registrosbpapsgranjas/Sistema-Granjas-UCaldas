from pydantic import BaseModel, field_validator
from typing import Optional, List
from datetime import datetime
import re

class LoteBase(BaseModel):
    nombre: str
    tipo_lote_id: int
    granja_id: int
    programa_id: int
    cultivo_id: Optional[int] = None
    nombre_cultivo: Optional[str] = None
    fecha_inicio: Optional[datetime] = None
    estado: Optional[str] = "activo"

    @field_validator('nombre')
    def validar_nombre(cls, v):
        if not v or len(v.strip()) == 0:
            raise ValueError('El nombre del lote no puede estar vacío')
        if len(v.strip()) < 3:
            raise ValueError('El nombre del lote debe tener al menos 3 caracteres')
        if len(v) > 100:
            raise ValueError('El nombre del lote no puede tener más de 100 caracteres')
        if not re.match(r'^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s\-.,()]+$', v):
            raise ValueError('El nombre del lote contiene caracteres no permitidos')
        return v.strip()

    @field_validator('tipo_lote_id')
    def validar_tipo_lote_id(cls, v):
        if v < 1:
            raise ValueError('El tipo_lote_id debe ser un número positivo')
        return v

    @field_validator('granja_id')
    def validar_granja_id(cls, v):
        if v < 1:
            raise ValueError('La granja_id debe ser un número positivo')
        return v

    @field_validator('programa_id')
    def validar_programa_id(cls, v):
        if v < 1:
            raise ValueError('El programa_id debe ser un número positivo')
        return v

    @field_validator('cultivo_id')
    def validar_cultivo_id(cls, v):
        if v is not None and v < 1:
            raise ValueError('El cultivo_id debe ser un número positivo')
        return v

    @field_validator('estado')
    def validar_estado(cls, v):
        if v is not None:
            estados_permitidos = ['activo', 'inactivo']
            if v.lower() not in estados_permitidos:
                raise ValueError(f'Estado no válido. Estados permitidos: {", ".join(estados_permitidos)}')
        return v

class LoteCreate(LoteBase):
    pass

class LoteUpdate(BaseModel):
    nombre: Optional[str] = None
    tipo_lote_id: Optional[int] = None
    granja_id: Optional[int] = None
    programa_id: Optional[int] = None
    cultivo_id: Optional[int] = None
    nombre_cultivo: Optional[str] = None
    fecha_inicio: Optional[datetime] = None
    estado: Optional[str] = None

    @field_validator('nombre')
    def validar_nombre_update(cls, v):
        if v is not None:
            if len(v.strip()) < 3:
                raise ValueError('El nombre del lote debe tener al menos 3 caracteres')
            if len(v) > 100:
                raise ValueError('El nombre del lote no puede tener más de 100 caracteres')
            if not re.match(r'^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s\-\_0-9.,()]+$', v):
                raise ValueError('El nombre del lote contiene caracteres no permitidos')
        return v

    @field_validator('estado')
    def validar_estado_update(cls, v):
        if v is not None:
            estados_permitidos = ['activo', 'inactivo']
            if v.lower() not in estados_permitidos:
                raise ValueError(f'Estado no válido')
        return v

class LoteResponse(LoteBase):
    id: int
    fecha_creacion: Optional[datetime] = None
    
    class Config:
        from_attributes = True