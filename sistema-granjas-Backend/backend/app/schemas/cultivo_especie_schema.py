from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime
import re

class CultivoEspecieBase(BaseModel):
    nombre: str
    tipo: str
    granja_id: int
    descripcion: Optional[str] = None
    estado: Optional[str] = "activo"

    @field_validator('nombre')
    def validar_nombre(cls, v):
        if not v or len(v.strip()) == 0:
            raise ValueError('El nombre del cultivo/especie no puede estar vacío')
        if len(v.strip()) < 3:
            raise ValueError('El nombre del cultivo/especie debe tener al menos 3 caracteres')
        if len(v) > 150:
            raise ValueError('El nombre del cultivo/especie no puede tener más de 150 caracteres')
        if not re.match(r'^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s\-\'\.\(\)0-9]+$', v):
            raise ValueError('El nombre del cultivo/especie contiene caracteres no permitidos')
        return v.strip()

    @field_validator('tipo')
    def validar_tipo(cls, v):
        tipos_permitidos = ['agricola', 'pecuario']
        v_lower = v.lower()
        if v_lower not in tipos_permitidos:
            raise ValueError(f'Tipo no válido. Tipos permitidos: {", ".join(tipos_permitidos)}')
        return v_lower

    @field_validator('granja_id')
    def validar_granja_id(cls, v):
        if v < 1:
            raise ValueError('La granja_id debe ser un número positivo')
        return v

    @field_validator('descripcion')
    def validar_descripcion(cls, v):
        if v is not None:
            if len(v.strip()) < 10:
                raise ValueError('La descripción debe tener al menos 10 caracteres')
            if len(v) > 500:
                raise ValueError('La descripción no puede tener más de 500 caracteres')
        return v

    @field_validator('estado')
    def validar_estado(cls, v):
        if v is not None:
            estados_permitidos = ['activo', 'inactivo']
            if v.lower() not in estados_permitidos:
                raise ValueError(f'Estado no válido. Estados permitidos: {", ".join(estados_permitidos)}')
        return v

class CultivoEspecieCreate(CultivoEspecieBase):
    pass

class CultivoEspecieUpdate(BaseModel):
    nombre: Optional[str] = None
    tipo: Optional[str] = None
    descripcion: Optional[str] = None
    estado: Optional[str] = None

    @field_validator('nombre')
    def validar_nombre_update(cls, v):
        if v is not None:
            if len(v.strip()) < 3:
                raise ValueError('El nombre del cultivo/especie debe tener al menos 3 caracteres')
            if len(v) > 150:
                raise ValueError('El nombre del cultivo/especie no puede tener más de 150 caracteres')
            if not re.match(r'^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s\-\'\.\(\)0-9]+$', v):
                raise ValueError('El nombre del cultivo/especie contiene caracteres no permitidos')
        return v

    @field_validator('tipo')
    def validar_tipo_update(cls, v):
        if v is not None:
            tipos_permitidos = ['agricola', 'pecuario']
            v_lower = v.lower()
            if v_lower not in tipos_permitidos:
                raise ValueError(f'Tipo no válido')
        return v

class CultivoEspecieResponse(CultivoEspecieBase):
    id: int

    class Config:
        from_attributes = True