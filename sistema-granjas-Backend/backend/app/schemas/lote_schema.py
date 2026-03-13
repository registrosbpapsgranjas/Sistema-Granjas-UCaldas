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
        
        # Validar formato del nombre (letras, números, espacios, puntos, guiones, paréntesis)
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
    
    @field_validator('estado')
    def validar_estado(cls, v):
        if v is not None:
            estados_permitidos = ['activo', 'inactivo']
            v_lower = v.lower()
            if v_lower not in estados_permitidos:
                raise ValueError(f'Estado no válido. Estados permitidos: {", ".join(estados_permitidos)}')
            return v_lower
        return v

    @model_validator(mode='after')
    def validar_fechas_coherentes(self):
        fecha_inicio = self.fecha_inicio
        
        # Validar que la fecha de inicio no sea en el futuro muy lejano
        if fecha_inicio:
            from datetime import datetime as dt
            if fecha_inicio > dt.now().replace(year=dt.now().year + 5):
                raise ValueError('La fecha de inicio no puede ser más de 5 años en el futuro')
        
        return self

    @model_validator(mode='after')
    def validar_cultivo_consistente(self):
        cultivo_id = self.cultivo_id
        nombre_cultivo = self.nombre_cultivo
        
        # Si se proporciona cultivo_id, también debería tener nombre_cultivo
        if cultivo_id and not nombre_cultivo:
            raise ValueError('Si especifica cultivo_id, debe proporcionar nombre_cultivo')
        
        return self

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

    @field_validator('tipo_lote_id')
    def validar_tipo_lote_id_update(cls, v):
        if v is not None and v < 1:
            raise ValueError('El tipo_lote_id debe ser un número positivo')
        return v

    @field_validator('granja_id')
    def validar_granja_id_update(cls, v):
        if v is not None and v < 1:
            raise ValueError('La granja_id debe ser un número positivo')
        return v

    @field_validator('programa_id')
    def validar_programa_id_update(cls, v):
        if v is not None and v < 1:
            raise ValueError('El programa_id debe ser un número positivo')
        return v

    @field_validator('cultivo_id')
    def validar_cultivo_id_update(cls, v):
        if v is not None and v < 1:
            raise ValueError('El cultivo_id debe ser un número positivo')
        return v

    @field_validator('nombre_cultivo')
    def validar_nombre_cultivo_update(cls, v):
        if v is not None:
            if len(v.strip()) < 2:
                raise ValueError('El nombre del cultivo debe tener al menos 2 caracteres')
            
            if len(v) > 150:
                raise ValueError('El nombre del cultivo no puede tener más de 150 caracteres')
            
            if not re.match(r'^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s\-\'\.0-9]+$', v):
                raise ValueError('El nombre del cultivo contiene caracteres no permitidos')
        
        return v

    @field_validator('estado')
    def validar_estado_update(cls, v):
        if v is not None:
            estados_permitidos = ['activo', 'inactivo']
            v_lower = v.lower()
            if v_lower not in estados_permitidos:
                raise ValueError(f'Estado no válido. Estados permitidos: {", ".join(estados_permitidos)}')
            return v_lower
        return v

    @model_validator(mode='after')
    def validar_al_menos_un_campo(self):
        """Validar que se envíe al menos un campo para actualizar"""
        campos = [
            'nombre', 'tipo_lote_id', 'granja_id', 'programa_id', 
            'cultivo_id', 'nombre_cultivo', 'fecha_inicio', 'estado'
        ]
        
        tiene_campo = False
        for campo in campos:
            if getattr(self, campo, None) is not None:
                tiene_campo = True
                break
        
        if not tiene_campo:
            raise ValueError('Debe proporcionar al menos un campo para actualizar')
        
        return self

    @model_validator(mode='after')
    def validar_cultivo_consistente_update(self):
        cultivo_id = self.cultivo_id
        nombre_cultivo = self.nombre_cultivo
        
        # Si se actualiza cultivo_id sin nombre_cultivo
        if cultivo_id is not None and nombre_cultivo is None:
            # Esta validación se hará mejor en el servicio/endpoint
            pass
        
        return self

class LoteResponse(LoteBase):
    id: int
    estado: str
    fecha_creacion: Optional[datetime] = None
    
    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

# Definiciones adelantadas para las referencias circulares
class CultivoEspecieResponse(BaseModel):
    id: int
    nombre: str
    tipo: str
    class Config:
        from_attributes = True

class TipoLoteResponse(BaseModel):
    id: int
    nombre: str
    class Config:
        from_attributes = True

class GranjaResponse(BaseModel):
    id: int
    nombre: str
    ubicacion: str
    class Config:
        from_attributes = True

class ProgramaResponse(BaseModel):
    id: int
    nombre: str
    tipo: str
    class Config:
        from_attributes = True

class LoteWithRelations(LoteResponse):
    cultivo: Optional['CultivoEspecieResponse'] = None
    tipo_lote: Optional['TipoLoteResponse'] = None
    granja: Optional['GranjaResponse'] = None
    programa: Optional['ProgramaResponse'] = None
    
    class Config:
        from_attributes = True