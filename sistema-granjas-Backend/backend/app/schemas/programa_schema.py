from pydantic import BaseModel, field_validator, model_validator
from typing import Optional, List
from datetime import datetime
import re

class ProgramaBase(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    tipo: str

    @field_validator('nombre')
    def validar_nombre(cls, v):
        if not v or len(v.strip()) == 0:
            raise ValueError('El nombre del programa no puede estar vacío')
        if len(v.strip()) < 5:
            raise ValueError('El nombre del programa debe tener al menos 5 caracteres')
        if len(v) > 100:
            raise ValueError('El nombre del programa no puede tener más de 100 caracteres')
        if not re.match(r'^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s\-\'\.\(\)0-9:]+$', v):
            raise ValueError('El nombre del programa contiene caracteres no permitidos')
        return v.strip()

    @field_validator('descripcion')
    def validar_descripcion(cls, v):
        if v is not None:
            if len(v.strip()) < 10:
                raise ValueError('La descripción debe tener al menos 10 caracteres')
            if len(v) > 500:
                raise ValueError('La descripción no puede tener más de 500 caracteres')
        return v

    @field_validator('tipo')
    def validar_tipo(cls, v):
        tipos_permitidos = ['pecuario', 'agricola', 'prueba']
        if v.lower() not in tipos_permitidos:
            raise ValueError(f'Tipo de programa no válido. Tipos permitidos: {", ".join(tipos_permitidos)}')
        return v.lower()

    @model_validator(mode='after')
    def validar_coherencia_nombre_tipo(cls, values):
        # Puedes ajustar o eliminar esta validación según necesidades reales
        return values

class ProgramaCreate(ProgramaBase):
    granjas_ids: List[int] = []  # IDs de granjas a las que se asignará el programa

class ProgramaUpdate(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    tipo: Optional[str] = None
    activo: Optional[bool] = None
    granjas_ids: Optional[List[int]] = None  # Si se envía, reemplaza las asignaciones

    @field_validator('nombre')
    def validar_nombre_update(cls, v):
        if v is not None:
            if len(v.strip()) < 5:
                raise ValueError('El nombre del programa debe tener al menos 5 caracteres')
            if len(v) > 100:
                raise ValueError('El nombre del programa no puede tener más de 100 caracteres')
            if not re.match(r'^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s\-\'\.\(\)0-9:]+$', v):
                raise ValueError('El nombre del programa contiene caracteres no permitidos')
        return v

    @field_validator('descripcion')
    def validar_descripcion_update(cls, v):
        if v is not None:
            if len(v.strip()) < 10:
                raise ValueError('La descripción debe tener al menos 10 caracteres')
            if len(v) > 500:
                raise ValueError('La descripción no puede tener más de 500 caracteres')
        return v

    @field_validator('tipo')
    def validar_tipo_update(cls, v):
        if v is not None:
            tipos_permitidos = ['pecuario', 'agricola']
            if v.lower() not in tipos_permitidos:
                raise ValueError(f'Tipo de programa no válido. Tipos permitidos: {", ".join(tipos_permitidos)}')
        return v.lower() if v else v

    @model_validator(mode='after')
    def validar_al_menos_un_campo(cls, values):
        if all(values.get(f) is None for f in ['nombre', 'descripcion', 'tipo', 'activo', 'granjas_ids']):
            raise ValueError('Debe proporcionar al menos un campo para actualizar')
        return values

class ProgramaResponse(ProgramaBase):
    id: int
    activo: bool
    fecha_creacion: datetime

    class Config:
        from_attributes = True

class AsignacionUsuarioPrograma(BaseModel):
    usuario_id: int

class AsignacionGranjaPrograma(BaseModel):
    granja_id: int

class ProgramaWithRelations(ProgramaResponse):
    usuarios: List[dict] = []
    granjas: List[dict] = []
    lotes: List[dict] = []
    insumos: List[dict] = []

    class Config:
        from_attributes = True