from pydantic import BaseModel, field_validator, model_validator
from typing import Optional
import re

class TipoLaborBase(BaseModel):
    nombre: str
    descripcion: Optional[str] = None

    @field_validator('nombre')
    def validar_nombre(cls, v):
        if not v or len(v.strip()) == 0:
            raise ValueError('El nombre del tipo de labor no puede estar vacío')
        
        if len(v.strip()) < 3:
            raise ValueError('El nombre del tipo de labor debe tener al menos 3 caracteres')
        
        if len(v) > 100:
            raise ValueError('El nombre del tipo de labor no puede tener más de 100 caracteres')
        
        # Validar formato del nombre (letras, números, espacios, guiones, paréntesis)
        if not re.match(r'^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s\-\'\.\(\)0-9]+$', v):
            raise ValueError('El nombre del tipo de labor contiene caracteres no permitidos')
        
        # Validar que no sea solo números
        if v.strip().replace(' ', '').isdigit():
            raise ValueError('El nombre del tipo de labor no puede ser solo números')
        
        # Validar que sea descriptivo y específico
        palabras_vagas = ['labor', 'trabajo', 'actividad', 'tarea', 'proceso']
        if any(palabra == v.strip().lower() for palabra in palabras_vagas):
            raise ValueError('El nombre del tipo de labor debe ser específico y descriptivo')
        
        return v.strip().title()  # Estandarizar a formato título

    @field_validator('descripcion')
    def validar_descripcion(cls, v):
        if v is not None:
            if len(v.strip()) < 10:
                raise ValueError('La descripción debe tener al menos 10 caracteres')
            
            if len(v) > 500:
                raise ValueError('La descripción no puede tener más de 500 caracteres')
            
            # Validar que la descripción sea informativa
            if len(v.strip().split()) < 3:
                raise ValueError('La descripción debe ser más detallada')
        
        return v

class TipoLaborCreate(TipoLaborBase):
    pass

class TipoLaborUpdate(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None

    @field_validator('nombre')
    def validar_nombre_update(cls, v):
        if v is not None:
            if len(v.strip()) < 3:
                raise ValueError('El nombre del tipo de labor debe tener al menos 3 caracteres')
            
            if len(v) > 100:
                raise ValueError('El nombre del tipo de labor no puede tener más de 100 caracteres')
            
            if not re.match(r'^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s\-\'\.\(\)0-9]+$', v):
                raise ValueError('El nombre del tipo de labor contiene caracteres no permitidos')
            
            if v.strip().replace(' ', '').isdigit():
                raise ValueError('El nombre del tipo de labor no puede ser solo números')
            
            palabras_vagas = ['labor', 'trabajo', 'actividad', 'tarea', 'proceso']
            if any(palabra == v.strip().lower() for palabra in palabras_vagas):
                raise ValueError('El nombre del tipo de labor debe ser específico y descriptivo')
            
        return v

    @field_validator('descripcion')
    def validar_descripcion_update(cls, v):
        if v is not None:
            if len(v.strip()) < 10:
                raise ValueError('La descripción debe tener al menos 10 caracteres')
            
            if len(v) > 500:
                raise ValueError('La descripción no puede tener más de 500 caracteres')
            
            if len(v.strip().split()) < 3:
                raise ValueError('La descripción debe ser más detallada')
        
        return v

    @model_validator(mode='after')
    def validar_al_menos_un_campo(cls, values):
        if values.nombre is None and values.descripcion is None:
            raise ValueError('Debe proporcionar al menos un campo para actualizar (nombre o descripción)')
        
        return values

class TipoLaborResponse(TipoLaborBase):
    id: int

    class Config:
        from_attributes = True