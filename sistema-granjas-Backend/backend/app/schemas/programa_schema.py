from pydantic import BaseModel, field_validator, model_validator
from typing import Optional
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
        
        # Validar formato del nombre
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
        nombre = values.nombre.lower()
        tipo = values.tipo.lower()
        
        # Validar que el nombre refleje el tipo de programa
        if tipo == 'académico' and 'académico' not in nombre and 'academico' not in nombre:
            raise ValueError('Los programas académicos deben incluir "Académico" en el nombre')
        
        if tipo == 'investigación' and 'investigación' not in nombre and 'investigacion' not in nombre:
            raise ValueError('Los programas de investigación deben incluir "Investigación" en el nombre')
        
        return values

class ProgramaCreate(ProgramaBase):
    pass

class ProgramaUpdate(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    tipo: Optional[str] = None
    activo: Optional[bool] = None

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
            tipos_permitidos = ['pecuario', 'agricola', 'prueba']
            
            if v.lower() not in tipos_permitidos:
                raise ValueError(f'Tipo de programa no válido. Tipos permitidos: {", ".join(tipos_permitidos)}')
            
        return v.lower() if v else v

    @model_validator(mode='after')
    def validar_al_menos_un_campo(cls, values):
        nombre = values.nombre
        descripcion = values.descripcion
        tipo = values.tipo
        activo = values.activo
        
        if nombre is None and descripcion is None and tipo is None and activo is None:
            raise ValueError('Debe proporcionar al menos un campo para actualizar')
        
        return values

class ProgramaResponse(ProgramaBase):
    id: int
    activo: bool
    fecha_creacion: datetime

    class Config:
        from_attributes = True