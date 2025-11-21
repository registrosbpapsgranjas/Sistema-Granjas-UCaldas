from datetime import datetime
from typing import Optional
from pydantic import BaseModel, field_validator, model_validator
import re

class CultivoEspecieBase(BaseModel):
    nombre: str
    tipo: str
    granja_id: int
    fecha_inicio: Optional[datetime] = None
    duracion_dias: Optional[int] = None
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
        
        # Validar formato del nombre (letras, números, espacios, guiones, paréntesis)
        if not re.match(r'^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s\-\'\.\(\)0-9]+$', v):
            raise ValueError('El nombre del cultivo/especie contiene caracteres no permitidos')
        
        # Validar que no sea solo números
        if v.strip().replace(' ', '').isdigit():
            raise ValueError('El nombre del cultivo/especie no puede ser solo números')
        
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

    @field_validator('duracion_dias')
    def validar_duracion_dias(cls, v):
        if v is not None:
            if v < 1:
                raise ValueError('La duración en días debe ser al menos 1')
            
            if v > 3650:  # 10 años máximo
                raise ValueError('La duración en días no puede ser mayor a 3650 (10 años)')
        
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
            if fecha_inicio > dt.now().replace(year=dt.now().year + 2):
                raise ValueError('La fecha de inicio no puede ser más de 2 años en el futuro')
            
            # Validar que no sea en el pasado muy lejano (más de 10 años)
            if fecha_inicio < dt.now().replace(year=dt.now().year - 10):
                raise ValueError('La fecha de inicio no puede ser hace más de 10 años')
        
        return values

class CultivoEspecieCreate(CultivoEspecieBase):
    pass

class CultivoEspecieUpdate(BaseModel):
    nombre: Optional[str] = None
    tipo: Optional[str] = None
    fecha_inicio: Optional[datetime] = None
    duracion_dias: Optional[int] = None
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
            
            if v.strip().replace(' ', '').isdigit():
                raise ValueError('El nombre del cultivo/especie no puede ser solo números')
            
        return v

    @field_validator('tipo')
    def validar_tipo_update(cls, v):
        if v is not None:
            tipos_permitidos = ['agricola', 'pecuario']
            
            v_lower = v.lower()
            if v_lower not in tipos_permitidos:
                raise ValueError(f'Tipo no válido. Tipos permitidos: {", ".join(tipos_permitidos)}')
            
        return v

    @field_validator('duracion_dias')
    def validar_duracion_dias_update(cls, v):
        if v is not None:
            if v < 1:
                raise ValueError('La duración en días debe ser al menos 1')
            
            if v > 3650:
                raise ValueError('La duración en días no puede ser mayor a 3650 (10 años)')
        
        return v

    @field_validator('descripcion')
    def validar_descripcion_update(cls, v):
        if v is not None:
            if len(v.strip()) < 10:
                raise ValueError('La descripción debe tener al menos 10 caracteres')
            
            if len(v) > 500:
                raise ValueError('La descripción no puede tener más de 500 caracteres')
        
        return v

    @model_validator(mode='after')
    def validar_al_menos_un_campo(cls, values):
        campos = [
            values.nombre, values.tipo, values.fecha_inicio,
            values.duracion_dias, values.descripcion, values.estado
        ]
        
        if all(campo is None for campo in campos):
            raise ValueError('Debe proporcionar al menos un campo para actualizar')
        
        return values

class CultivoEspecieResponse(CultivoEspecieBase):
    id: int

    class Config:
        from_attributes = True