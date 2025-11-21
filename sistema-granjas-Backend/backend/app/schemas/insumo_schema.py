from pydantic import BaseModel, field_validator, model_validator
from typing import Optional
import re

class InsumoBase(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    programa_id: int
    cantidad_total: float = 0.0
    cantidad_disponible: float = 0.0
    unidad_medida: Optional[str] = None
    nivel_alerta: float = 0.0
    estado: Optional[str] = "disponible"

    @field_validator('nombre')
    def validar_nombre(cls, v):
        if not v or len(v.strip()) == 0:
            raise ValueError('El nombre del insumo no puede estar vacío')
        
        if len(v.strip()) < 3:
            raise ValueError('El nombre del insumo debe tener al menos 3 caracteres')
        
        if len(v) > 100:
            raise ValueError('El nombre del insumo no puede tener más de 100 caracteres')
        
        # Validar formato del nombre
        if not re.match(r'^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s\-\'\.\(\)0-9/%]+$', v):
            raise ValueError('El nombre del insumo contiene caracteres no permitidos')
        
        return v.strip()

    @field_validator('descripcion')
    def validar_descripcion(cls, v):
        if v is not None:
            if len(v.strip()) < 10:
                raise ValueError('La descripción debe tener al menos 10 caracteres')
            
            if len(v) > 500:
                raise ValueError('La descripción no puede tener más de 500 caracteres')
        
        return v

    @field_validator('programa_id')
    def validar_programa_id(cls, v):
        if v < 1:
            raise ValueError('El programa_id debe ser un número positivo')
        return v

    @field_validator('cantidad_total')
    def validar_cantidad_total(cls, v):
        if v < 0:
            raise ValueError('La cantidad total no puede ser negativa')
        
        if v > 1000000:  # Límite razonable
            raise ValueError('La cantidad total no puede ser mayor a 1,000,000')
        
        return v

    @field_validator('cantidad_disponible')
    def validar_cantidad_disponible(cls, v):
        if v < 0:
            raise ValueError('La cantidad disponible no puede ser negativa')
        
        if v > 1000000:
            raise ValueError('La cantidad disponible no puede ser mayor a 1,000,000')
        
        return v

    @field_validator('unidad_medida')
    def validar_unidad_medida(cls, v):
        if v is not None:
            unidades_permitidas = [
                'kg', 'g', 'lb', 'ton', 'l', 'ml', 'gal', 'm³', 
                'unidades', 'paquetes', 'cajas', 'sacos', 'bolsas'
            ]
            
            if v.lower() not in unidades_permitidas:
                raise ValueError(f'Unidad de medida no válida. Unidades permitidas: {", ".join(unidades_permitidas)}')
        
        return v

    @field_validator('nivel_alerta')
    def validar_nivel_alerta(cls, v):
        if v < 0:
            raise ValueError('El nivel de alerta no puede ser negativo')
        
        if v > 100000:
            raise ValueError('El nivel de alerta no puede ser mayor a 100,000')
        
        return v

    @field_validator('estado')
    def validar_estado(cls, v):
        if v is not None:
            estados_permitidos = ['disponible', 'agotado', 'bajo_stock', 'vencido', 'inactivo']
            
            if v.lower() not in estados_permitidos:
                raise ValueError(f'Estado no válido. Estados permitidos: {", ".join(estados_permitidos)}')
        
        return v

    @model_validator(mode='after')
    def validar_coherencia_cantidades(cls, values):
        cantidad_total = values.cantidad_total
        cantidad_disponible = values.cantidad_disponible
        
        # La cantidad disponible no puede ser mayor que la cantidad total
        if cantidad_disponible > cantidad_total:
            raise ValueError('La cantidad disponible no puede ser mayor que la cantidad total')
        
        # Validar estado automático basado en cantidades
        if cantidad_disponible == 0:
            values.estado = 'agotado'
        elif cantidad_disponible <= values.nivel_alerta:
            values.estado = 'bajo_stock'
        else:
            values.estado = 'disponible'
        
        return values

class InsumoCreate(InsumoBase):
    pass

class InsumoUpdate(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    cantidad_total: Optional[float] = None
    cantidad_disponible: Optional[float] = None
    unidad_medida: Optional[str] = None
    nivel_alerta: Optional[float] = None
    estado: Optional[str] = None

    @field_validator('nombre')
    def validar_nombre_update(cls, v):
        if v is not None:
            if len(v.strip()) < 3:
                raise ValueError('El nombre del insumo debe tener al menos 3 caracteres')
            
            if len(v) > 100:
                raise ValueError('El nombre del insumo no puede tener más de 100 caracteres')
            
            if not re.match(r'^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s\-\'\.\(\)0-9/%]+$', v):
                raise ValueError('El nombre del insumo contiene caracteres no permitidos')
            
        return v

    @field_validator('cantidad_total')
    def validar_cantidad_total_update(cls, v):
        if v is not None:
            if v < 0:
                raise ValueError('La cantidad total no puede ser negativa')
            
            if v > 1000000:
                raise ValueError('La cantidad total no puede ser mayor a 1,000,000')
            
        return v

    @field_validator('cantidad_disponible')
    def validar_cantidad_disponible_update(cls, v):
        if v is not None:
            if v < 0:
                raise ValueError('La cantidad disponible no puede ser negativa')
            
            if v > 1000000:
                raise ValueError('La cantidad disponible no puede ser mayor a 1,000,000')
            
        return v

    @field_validator('nivel_alerta')
    def validar_nivel_alerta_update(cls, v):
        if v is not None:
            if v < 0:
                raise ValueError('El nivel de alerta no puede ser negativo')
            
            if v > 100000:
                raise ValueError('El nivel de alerta no puede ser mayor a 100,000')
            
        return v

    @model_validator(mode='after')
    def validar_al_menos_un_campo(cls, values):
        campos = [
            values.nombre, values.descripcion, values.cantidad_total,
            values.cantidad_disponible, values.unidad_medida, 
            values.nivel_alerta, values.estado
        ]
        
        if all(campo is None for campo in campos):
            raise ValueError('Debe proporcionar al menos un campo para actualizar')
        
        return values

class InsumoResponse(InsumoBase):
    id: int

    class Config:
        from_attributes = True