from pydantic import BaseModel, field_validator, model_validator
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
    tipo_gestion: Optional[str] = None
    fecha_inicio: Optional[datetime] = None
    duracion_dias: Optional[int] = None
    estado: Optional[str] = "activo"

    @field_validator('nombre')
    def validar_nombre(cls, v):
        if not v or len(v.strip()) == 0:
            raise ValueError('El nombre del lote no puede estar vacío')
        
        if len(v.strip()) < 3:
            raise ValueError('El nombre del lote debe tener al menos 3 caracteres')
        
        if len(v) > 100:
            raise ValueError('El nombre del lote no puede tener más de 100 caracteres')
        
        # Validar formato del nombre (letras, números, espacios, guiones)
        if not re.match(r'^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s\-\_0-9]+$', v):
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

    @field_validator('nombre_cultivo')
    def validar_nombre_cultivo(cls, v):
        if v is not None:
            if len(v.strip()) < 2:
                raise ValueError('El nombre del cultivo debe tener al menos 2 caracteres')
            
            if len(v) > 150:
                raise ValueError('El nombre del cultivo no puede tener más de 150 caracteres')
            
            if not re.match(r'^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s\-\'\.0-9]+$', v):
                raise ValueError('El nombre del cultivo contiene caracteres no permitidos')
        
        return v

    @field_validator('duracion_dias')
    def validar_duracion_dias(cls, v):
        if v is not None:
            if v < 1:
                raise ValueError('La duración en días debe ser al menos 1')
            
            if v > 3650:  # 10 años máximo
                raise ValueError('La duración en días no puede ser mayor a 3650 (10 años)')
        
        return v
    @field_validator('estado')
    def validar_estado(cls, v):
        estados_permitidos = ['activo', 'inactivo']
        
        if v.lower() not in estados_permitidos:
            raise ValueError(f'Estado no válido. Estados permitidos: {", ".join(estados_permitidos)}')
        
        return v.lower()

    @model_validator(mode='after')
    def validar_fechas_coherentes(cls, values):
        fecha_inicio = values.fecha_inicio
        duracion_dias = values.duracion_dias
        
        # Si se proporciona duración pero no fecha de inicio
        if duracion_dias and not fecha_inicio:
            raise ValueError('Si especifica duración en días, debe proporcionar fecha de inicio')
        
        # Validar que la fecha de inicio no sea en el futuro muy lejano
        if fecha_inicio:
            from datetime import datetime as dt
            if fecha_inicio > dt.now().replace(year=dt.now().year + 5):
                raise ValueError('La fecha de inicio no puede ser más de 5 años en el futuro')
        
        return values

    @model_validator(mode='after')
    def validar_cultivo_consistente(cls, values):
        cultivo_id = values.cultivo_id
        nombre_cultivo = values.nombre_cultivo
        
        # Si se proporciona cultivo_id, también debería tener nombre_cultivo
        if cultivo_id and not nombre_cultivo:
            raise ValueError('Si especifica cultivo_id, debe proporcionar nombre_cultivo')
        
        return values

class LoteCreate(LoteBase):
    pass

class LoteUpdate(BaseModel):
    nombre: Optional[str] = None
    tipo_lote_id: Optional[int] = None
    granja_id: Optional[int] = None
    programa_id: Optional[int] = None
    cultivo_id: Optional[int] = None
    nombre_cultivo: Optional[str] = None
    tipo_gestion: Optional[str] = None
    fecha_inicio: Optional[datetime] = None
    duracion_dias: Optional[int] = None
    estado: Optional[str] = None

    @field_validator('nombre')
    def validar_nombre_update(cls, v):
        if v is not None:
            if len(v.strip()) < 3:
                raise ValueError('El nombre del lote debe tener al menos 3 caracteres')
            
            if len(v) > 100:
                raise ValueError('El nombre del lote no puede tener más de 100 caracteres')
            
            if not re.match(r'^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s\-\_0-9]+$', v):
                raise ValueError('El nombre del lote contiene caracteres no permitidos')
            
        return v

    @field_validator('estado')
    def validar_estado_update(cls, v):
        if v is not None:
            estados_permitidos = ['activo', 'inactivo']
            
            if v.lower() not in estados_permitidos:
                raise ValueError(f'Estado no válido. Estados permitidos: {", ".join(estados_permitidos)}')
        
        return v

    @model_validator(mode='after')
    def validar_al_menos_un_campo(cls, values):
        campos = [
            values.nombre, values.tipo_lote_id, values.granja_id, 
            values.programa_id, values.cultivo_id, values.nombre_cultivo,
            values.tipo_gestion, values.fecha_inicio, values.duracion_dias, values.estado
        ]
        
        if all(campo is None for campo in campos):
            raise ValueError('Debe proporcionar al menos un campo para actualizar')
        
        return values

class LoteResponse(LoteBase):
    id: int
    estado: str
    fecha_creacion: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class LoteWithRelations(LoteResponse):
    cultivo: Optional['CultivoEspecieResponse'] = None
    tipo_lote: Optional['TipoLoteResponse'] = None
    granja: Optional['GranjaResponse'] = None
    programa: Optional['ProgramaResponse'] = None