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
        v_lower = v.lower()
        if v_lower not in tipos_permitidos:
            raise ValueError(f'Tipo de programa no válido. Tipos permitidos: {", ".join(tipos_permitidos)}')
        return v_lower

    @model_validator(mode='after')
    def validar_coherencia_nombre_tipo(self):
        # Validación opcional de coherencia
        return self

class ProgramaCreate(ProgramaBase):
    granjas_ids: List[int] = []

    @field_validator('granjas_ids')
    def validar_granjas_ids(cls, v):
        if v is not None:
            for granja_id in v:
                if granja_id < 1:
                    raise ValueError(f'ID de granja inválido: {granja_id}. Debe ser un número positivo')
        return v

class ProgramaUpdate(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    tipo: Optional[str] = None
    activo: Optional[bool] = None
    granjas_ids: Optional[List[int]] = None

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
            v_lower = v.lower()
            if v_lower not in tipos_permitidos:
                raise ValueError(f'Tipo de programa no válido. Tipos permitidos: {", ".join(tipos_permitidos)}')
            return v_lower
        return v

    @field_validator('granjas_ids')
    def validar_granjas_ids_update(cls, v):
        if v is not None:
            for granja_id in v:
                if granja_id < 1:
                    raise ValueError(f'ID de granja inválido: {granja_id}. Debe ser un número positivo')
        return v

    @model_validator(mode='after')
    def validar_al_menos_un_campo(self):
        """Validar que se envíe al menos un campo para actualizar"""
        campos = ['nombre', 'descripcion', 'tipo', 'activo', 'granjas_ids']
        tiene_campo = False
        
        for campo in campos:
            valor = getattr(self, campo, None)
            if valor is not None:
                tiene_campo = True
                break
        
        if not tiene_campo:
            raise ValueError('Debe proporcionar al menos un campo para actualizar')
        
        return self

class ProgramaResponse(ProgramaBase):
    id: int
    activo: bool
    fecha_creacion: datetime

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class AsignacionUsuarioPrograma(BaseModel):
    usuario_id: int

    @field_validator('usuario_id')
    def validar_usuario_id(cls, v):
        if v < 1:
            raise ValueError('El ID del usuario debe ser un número positivo')
        return v

class AsignacionGranjaPrograma(BaseModel):
    granja_id: int

    @field_validator('granja_id')
    def validar_granja_id(cls, v):
        if v < 1:
            raise ValueError('El ID de la granja debe ser un número positivo')
        return v

class ProgramaWithRelations(ProgramaResponse):
    usuarios: List[dict] = []
    granjas: List[dict] = []
    lotes: List[dict] = []
    insumos: List[dict] = []

    class Config:
        from_attributes = True

    @model_validator(mode='after')
    def validar_relaciones(self):
        """Validar que las relaciones tengan datos mínimos requeridos"""
        if hasattr(self, 'usuarios') and self.usuarios:
            for usuario in self.usuarios:
                if 'id' not in usuario:
                    raise ValueError('Usuario sin ID en la respuesta')
        
        if hasattr(self, 'granjas') and self.granjas:
            for granja in self.granjas:
                if 'id' not in granja:
                    raise ValueError('Granja sin ID en la respuesta')
        
        return self