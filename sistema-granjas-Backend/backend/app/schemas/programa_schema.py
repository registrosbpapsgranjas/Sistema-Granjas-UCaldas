from pydantic import BaseModel, field_validator, model_validator
from typing import Optional, List, Dict, Any
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
        
        # Validar que no sea solo números
        if v.strip().replace(' ', '').isdigit():
            raise ValueError('El nombre del programa no puede ser solo números')
        
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
    def validar_coherencia_nombre_tipo(cls, values):
        """Validar que el nombre sea coherente con el tipo"""
        nombre = values.nombre.lower()
        tipo = values.tipo
        
        # Ejemplo: Si es tipo pecuario, el nombre debería sugerirlo (opcional)
        if tipo == 'pecuario' and not any(palabra in nombre for palabra in ['ganado', 'leche', 'carne', 'pecuario', 'bovino']):
            # Solo advertencia, no error
            print(f"⚠️ El nombre '{values.nombre}' podría no ser coherente con el tipo pecuario")
        
        return values

class ProgramaCreate(ProgramaBase):
    granjas_ids: List[int] = []  # IDs de granjas a las que se asignará el programa

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
    granjas_ids: Optional[List[int]] = None  # Si se envía, reemplaza las asignaciones

    @field_validator('nombre')
    def validar_nombre_update(cls, v):
        if v is not None:
            if len(v.strip()) < 5:
                raise ValueError('El nombre del programa debe tener al menos 5 caracteres')
            if len(v) > 100:
                raise ValueError('El nombre del programa no puede tener más de 100 caracteres')
            if not re.match(r'^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s\-\'\.\(\)0-9:]+$', v):
                raise ValueError('El nombre del programa contiene caracteres no permitidos')
            if v.strip().replace(' ', '').isdigit():
                raise ValueError('El nombre del programa no puede ser solo números')
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
    def validar_al_menos_un_campo(cls, values):
        if all(values.get(f) is None for f in ['nombre', 'descripcion', 'tipo', 'activo', 'granjas_ids']):
            raise ValueError('Debe proporcionar al menos un campo para actualizar')
        return values

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
    usuarios: List[Dict[str, Any]] = []
    granjas: List[Dict[str, Any]] = []
    lotes: List[Dict[str, Any]] = []
    insumos: List[Dict[str, Any]] = []

    class Config:
        from_attributes = True

    @model_validator(mode='after')
    def validar_relaciones(cls, values):
        """Validar que las relaciones tengan datos mínimos requeridos"""
        # Validar usuarios
        if hasattr(values, 'usuarios') and values.usuarios:
            for usuario in values.usuarios:
                if 'id' not in usuario:
                    raise ValueError('Usuario sin ID en la respuesta')
        
        # Validar granjas
        if hasattr(values, 'granjas') and values.granjas:
            for granja in values.granjas:
                if 'id' not in granja:
                    raise ValueError('Granja sin ID en la respuesta')
                if 'nombre' not in granja:
                    raise ValueError('Granja sin nombre en la respuesta')
        
        # Validar lotes
        if hasattr(values, 'lotes') and values.lotes:
            for lote in values.lotes:
                if 'id' not in lote:
                    raise ValueError('Lote sin ID en la respuesta')
        
        return values

# Schema para estadísticas de programas
class ProgramaStats(BaseModel):
    total_programas: int
    programas_activos: int
    programas_inactivos: int
    agricolas: int
    pecuarios: int
    prueba: int
    total_granjas_asignadas: int
    total_usuarios_asignados: int
    total_lotes: int

# Schema para listado paginado
class ProgramaListResponse(BaseModel):
    items: List[ProgramaResponse]
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
class ProgramaFilter(BaseModel):
    tipo: Optional[str] = None
    activo: Optional[bool] = None
    granja_id: Optional[int] = None
    search: Optional[str] = None

    @field_validator('tipo')
    def validar_tipo_filter(cls, v):
        if v is not None:
            tipos_permitidos = ['pecuario', 'agricola', 'prueba']
            if v.lower() not in tipos_permitidos:
                raise ValueError(f'Tipo de programa no válido para filtro')
        return v

    @field_validator('granja_id')
    def validar_granja_id_filter(cls, v):
        if v is not None and v < 1:
            raise ValueError('El ID de granja debe ser un número positivo')
        return v