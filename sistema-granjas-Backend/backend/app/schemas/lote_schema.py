from pydantic import BaseModel, field_validator, model_validator
from typing import Optional, List
from datetime import datetime
import re

# ===== SCHEMAS PARA LA TABLA INTERMEDIA LOTE-CULTIVO =====

class LoteCultivoBase(BaseModel):
    lote_id: int
    cultivo_id: int

class LoteCultivoCreate(LoteCultivoBase):
    pass

class LoteCultivoUpdate(BaseModel):
    lote_id: Optional[int] = None
    cultivo_id: Optional[int] = None

    @model_validator(mode='after')
    def validar_al_menos_un_campo(self):
        if self.lote_id is None and self.cultivo_id is None:
            raise ValueError('Debe proporcionar al menos un campo para actualizar')
        return self

class LoteCultivoResponse(LoteCultivoBase):
    class Config:
        from_attributes = True

# ===== SCHEMAS PARA LOTE =====

class LoteBase(BaseModel):
    nombre: str
    tipo_lote_id: int
    granja_id: int
    programa_id: int
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

    @field_validator('estado')
    def validar_estado(cls, v):
        if v is not None:
            estados_permitidos = ['activo', 'inactivo', 'pendiente', 'completado']
            v_lower = v.lower()
            if v_lower not in estados_permitidos:
                raise ValueError(f'Estado no válido. Estados permitidos: {", ".join(estados_permitidos)}')
            return v_lower
        return v

    @model_validator(mode='after')
    def validar_fechas_coherentes(self):
        fecha_inicio = self.fecha_inicio
        
        if fecha_inicio:
            from datetime import datetime as dt
            if fecha_inicio > dt.now().replace(year=dt.now().year + 5):
                raise ValueError('La fecha de inicio no puede ser más de 5 años en el futuro')
        
        return self

class LoteCreate(LoteBase):
    cultivos_ids: List[int]

    @field_validator('cultivos_ids')
    def validar_cultivos_ids(cls, v):
        if not v or len(v) == 0:
            raise ValueError('Debe seleccionar al menos un cultivo para el lote')
        
        for cultivo_id in v:
            if cultivo_id < 1:
                raise ValueError('IDs de cultivos inválidos')
        
        return v

class LoteUpdate(BaseModel):
    nombre: Optional[str] = None
    tipo_lote_id: Optional[int] = None
    granja_id: Optional[int] = None
    programa_id: Optional[int] = None
    fecha_inicio: Optional[datetime] = None
    estado: Optional[str] = None
    cultivos_ids: Optional[List[int]] = None

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

    @field_validator('estado')
    def validar_estado_update(cls, v):
        if v is not None:
            estados_permitidos = ['activo', 'inactivo', 'pendiente', 'completado']
            v_lower = v.lower()
            if v_lower not in estados_permitidos:
                raise ValueError(f'Estado no válido. Estados permitidos: {", ".join(estados_permitidos)}')
            return v_lower
        return v

    @field_validator('cultivos_ids')
    def validar_cultivos_ids_update(cls, v):
        if v is not None:
            if len(v) == 0:
                raise ValueError('Si proporciona cultivos, debe seleccionar al menos uno')
            
            for cultivo_id in v:
                if cultivo_id < 1:
                    raise ValueError('IDs de cultivos inválidos')
        
        return v

    @model_validator(mode='after')
    def validar_al_menos_un_campo(self):
        campos = [
            'nombre', 'tipo_lote_id', 'granja_id', 'programa_id',
            'fecha_inicio', 'estado', 'cultivos_ids'
        ]
        
        tiene_campo = False
        for campo in campos:
            if getattr(self, campo, None) is not None:
                tiene_campo = True
                break
        
        if not tiene_campo:
            raise ValueError('Debe proporcionar al menos un campo para actualizar')
        
        return self

# 👇 RESPONSE AHORA INCLUYE cultivos_ids
class LoteResponse(LoteBase):
    id: int
    fecha_creacion: Optional[datetime] = None
    cultivos_ids: List[int] = []  # IDs de cultivos asignados
    
    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

# ===== SCHEMAS AUXILIARES PARA RELACIONES =====

class CultivoEspecieSimpleResponse(BaseModel):
    id: int
    nombre: str
    tipo: str
    
    class Config:
        from_attributes = True

class TipoLoteSimpleResponse(BaseModel):
    id: int
    nombre: str
    
    class Config:
        from_attributes = True

class GranjaSimpleResponse(BaseModel):
    id: int
    nombre: str
    ubicacion: str
    
    class Config:
        from_attributes = True

class ProgramaSimpleResponse(BaseModel):
    id: int
    nombre: str
    tipo: str
    
    class Config:
        from_attributes = True

class LoteWithRelations(LoteResponse):
    tipo_lote: Optional[TipoLoteSimpleResponse] = None
    granja: Optional[GranjaSimpleResponse] = None
    programa: Optional[ProgramaSimpleResponse] = None
    cultivos_detalle: List[CultivoEspecieSimpleResponse] = []