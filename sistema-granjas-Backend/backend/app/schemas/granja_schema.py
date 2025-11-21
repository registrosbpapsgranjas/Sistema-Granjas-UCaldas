from pydantic import BaseModel, field_validator, model_validator
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
        
        # Validar que el nombre sea descriptivo
        if not re.match(r'^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s\-\'\.\(\)0-9]+$', v):
            raise ValueError('El nombre de la granja contiene caracteres no permitidos')
        
        # Validar que no sea solo números
        if v.strip().isdigit():
            raise ValueError('El nombre de la granja no puede ser solo números')
        
        return v.strip()

    @field_validator('ubicacion')
    def validar_ubicacion(cls, v):
        if not v or len(v.strip()) == 0:
            raise ValueError('La ubicación no puede estar vacía')
        
        if len(v.strip()) < 5:
            raise ValueError('La ubicación debe tener al menos 5 caracteres')
        
        if len(v) > 150:
            raise ValueError('La ubicación no puede tener más de 150 caracteres')
        
        # Validar formato de ubicación (debe contener ciudad y departamento)
        if not re.match(r'^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s\-\'\.\,0-9]+$', v):
            raise ValueError('La ubicación contiene caracteres no permitidos')
        
        return v.strip()

    @model_validator(mode='after')
    def validar_nombre_estandarizado(cls, values):
        """Estandarizar el formato del nombre de la granja"""
        nombre = values.nombre
        
        # Asegurar que empiece con mayúscula
        values.nombre = nombre.title()
        
        # Validar que incluya "Granja" en el nombre
        if 'granja' not in nombre.lower():
            raise ValueError('El nombre de la granja debe incluir la palabra "Granja" (ej: Granja Experimental Central)')
        
        return values

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
            
            if v.strip().isdigit():
                raise ValueError('El nombre de la granja no puede ser solo números')
            
            if 'granja' not in v.lower():
                raise ValueError('El nombre de la granja debe incluir la palabra "Granja"')
            
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
            
            if ',' not in v:
                raise ValueError('La ubicación debe incluir ciudad y departamento separados por coma')
            
        return v

    @model_validator(mode='after')
    def validar_al_menos_un_campo(cls, values):
        """Validar que se envíe al menos un campo para actualizar"""
        nombre = values.nombre
        ubicacion = values.ubicacion
        activo = values.activo
        
        if nombre is None and ubicacion is None and activo is None:
            raise ValueError('Debe proporcionar al menos un campo para actualizar (nombre, ubicación o activo)')
        
        return values

class GranjaResponse(GranjaBase):
    id: int
    activo: bool
    fecha_creacion: datetime

    class Config:
        from_attributes = True

# Schema extendido para respuestas con relaciones
class GranjaWithRelations(GranjaResponse):
    cultivos: List['CultivoEspecieResponse'] = []
    usuarios: List['UsuarioResponse'] = []
    programas: List['ProgramaResponse'] = []
    lotes: List['LoteResponse'] = []

    @model_validator(mode='after')
    def validar_estado_granja(cls, values):
        """Validaciones adicionales para granjas con relaciones"""
        # Si la granja está inactiva, no debería tener cultivos activos
        if not values.activo:
            cultivos_activos = [c for c in values.cultivos if c.estado == 'activo']
            if cultivos_activos:
                raise ValueError('No se puede desactivar una granja con cultivos activos')
        
        return values