from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, field_validator, model_validator
import re

class CultivoEspecieBase(BaseModel):
    nombre: str
    tipo: str
    granja_id: int
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
            v_lower = v.lower()
            if v_lower not in estados_permitidos:
                raise ValueError(f'Estado no válido. Estados permitidos: {", ".join(estados_permitidos)}')
            return v_lower
        return v

    @model_validator(mode='after')
    def validar_coherencia_tipo_nombre(cls, values):
        """Validar que el nombre sea coherente con el tipo (opcional)"""
        nombre = values.nombre.lower()
        tipo = values.tipo
        
        # Si es tipo pecuario, validar que el nombre no sugiera cultivo agrícola
        if tipo == 'pecuario':
            terminos_agricolas = ['café', 'maíz', 'arroz', 'frijol', 'tomate', 'papa', 'hortaliza']
            for termino in terminos_agricolas:
                if termino in nombre:
                    print(f"⚠️ Advertencia: El nombre '{values.nombre}' contiene el término '{termino}' pero es tipo pecuario")
        
        # Si es tipo agrícola, validar que el nombre no sugiera pecuario
        if tipo == 'agricola':
            terminos_pecuarios = ['ganado', 'vacuno', 'porcino', 'avícola', 'bovino', 'ovino']
            for termino in terminos_pecuarios:
                if termino in nombre:
                    print(f"⚠️ Advertencia: El nombre '{values.nombre}' contiene el término '{termino}' pero es tipo agrícola")
        
        return values

class CultivoEspecieCreate(CultivoEspecieBase):
    pass

class CultivoEspecieUpdate(BaseModel):
    nombre: Optional[str] = None
    tipo: Optional[str] = None
    descripcion: Optional[str] = None
    estado: Optional[str] = None
    granja_id: Optional[int] = None

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
            
            return v_lower
        return v

    @field_validator('descripcion')
    def validar_descripcion_update(cls, v):
        if v is not None:
            if len(v.strip()) < 10:
                raise ValueError('La descripción debe tener al menos 10 caracteres')
            
            if len(v) > 500:
                raise ValueError('La descripción no puede tener más de 500 caracteres')
        
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

    @field_validator('granja_id')
    def validar_granja_id_update(cls, v):
        if v is not None and v < 1:
            raise ValueError('El ID de granja debe ser un número positivo')
        return v

    @model_validator(mode='after')
    def validar_al_menos_un_campo(cls, values):
        if all(values.get(f) is None for f in ['nombre', 'tipo', 'descripcion', 'estado', 'granja_id']):
            raise ValueError('Debe proporcionar al menos un campo para actualizar')
        return values

class CultivoEspecieResponse(CultivoEspecieBase):
    id: int
    fecha_creacion: Optional[datetime] = None

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

# Schema para respuesta con relaciones (lotes asociados)
class CultivoEspecieWithRelations(CultivoEspecieResponse):
    lotes: List[Dict[str, Any]] = []
    granja_nombre: Optional[str] = None

    @model_validator(mode='after')
    def validar_lotes(cls, values):
        """Validar que los lotes tengan datos mínimos"""
        if hasattr(values, 'lotes') and values.lotes:
            for lote in values.lotes:
                if 'id' not in lote:
                    raise ValueError('Lote sin ID en la respuesta')
        return values

# Schema para estadísticas de cultivos/especies
class CultivoEspecieStats(BaseModel):
    total: int
    agricolas: int
    pecuarios: int
    activos: int
    inactivos: int
    total_lotes_asociados: int
    granjas_con_cultivos: int

# Schema para listado paginado
class CultivoEspecieListResponse(BaseModel):
    items: List[CultivoEspecieResponse]
    total: int
    page: int
    size: int
    pages: int

    @model_validator(mode='after')
    def calcular_pages(cls, values):
        """Calcular número total de páginas"""
        if hasattr(values, 'total') and hasattr(values, 'size') and values.size > 0:
            values.pages = (values.total + values.size - 1) // values.size
        return values

# Schema para filtros de búsqueda
class CultivoEspecieFilter(BaseModel):
    tipo: Optional[str] = None
    estado: Optional[str] = None
    granja_id: Optional[int] = None
    search: Optional[str] = None

    @field_validator('tipo')
    def validar_tipo_filter(cls, v):
        if v is not None:
            tipos_permitidos = ['agricola', 'pecuario']
            if v.lower() not in tipos_permitidos:
                raise ValueError('Tipo no válido para filtro')
        return v

    @field_validator('estado')
    def validar_estado_filter(cls, v):
        if v is not None:
            estados_permitidos = ['activo', 'inactivo']
            if v.lower() not in estados_permitidos:
                raise ValueError('Estado no válido para filtro')
        return v

    @field_validator('granja_id')
    def validar_granja_id_filter(cls, v):
        if v is not None and v < 1:
            raise ValueError('El ID de granja debe ser un número positivo')
        return v

# Schema para asignación de cultivos a lotes
class AsignacionCultivoLote(BaseModel):
    lote_id: int
    fecha_asignacion: Optional[datetime] = None

    @field_validator('lote_id')
    def validar_lote_id(cls, v):
        if v < 1:
            raise ValueError('El ID del lote debe ser un número positivo')
        return v