from pydantic import BaseModel, Field, validator
from typing import Optional
from datetime import datetime

class HerramientaBase(BaseModel):
    nombre: str = Field(..., min_length=1, max_length=100, description="Nombre de la herramienta")
    descripcion: Optional[str] = Field(None, max_length=255, description="Descripción opcional")
    categoria_id: Optional[int] = Field(None, gt=0, description="ID de la categoría")
    cantidad_total: int = Field(0, ge=0, description="Cantidad total en inventario")
    cantidad_disponible: int = Field(0, ge=0, description="Cantidad disponible para uso")
    estado: str = Field("disponible", description="Estado de la herramienta")

    @validator('nombre')
    def nombre_no_vacio(cls, v):
        if not v.strip():
            raise ValueError('El nombre no puede estar vacío')
        return v.strip()

    @validator('estado')
    def estado_valido(cls, v):
        estados_permitidos = ['disponible', 'no_disponible', 'en_mantenimiento', 'dada_de_baja']
        if v not in estados_permitidos:
            raise ValueError(f'Estado debe ser uno de: {", ".join(estados_permitidos)}')
        return v

    @validator('cantidad_disponible')
    def cantidad_disponible_valida(cls, v, values):
        if 'cantidad_total' in values and v > values['cantidad_total']:
            raise ValueError('La cantidad disponible no puede ser mayor que la cantidad total')
        return v

    @validator('cantidad_total')
    def cantidad_total_valida(cls, v):
        if v < 0:
            raise ValueError('La cantidad total no puede ser negativa')
        return v

class HerramientaCreate(HerramientaBase):
    pass

class HerramientaUpdate(BaseModel):
    nombre: Optional[str] = Field(None, min_length=1, max_length=100, description="Nombre de la herramienta")
    descripcion: Optional[str] = Field(None, max_length=255, description="Descripción opcional")
    categoria_id: Optional[int] = Field(None, gt=0, description="ID de la categoría")
    cantidad_total: Optional[int] = Field(None, ge=0, description="Cantidad total en inventario")
    cantidad_disponible: Optional[int] = Field(None, ge=0, description="Cantidad disponible para uso")
    estado: Optional[str] = Field(None, description="Estado de la herramienta")

    @validator('nombre')
    def nombre_no_vacio(cls, v):
        if v is not None and not v.strip():
            raise ValueError('El nombre no puede estar vacío')
        return v.strip() if v else v

    @validator('estado')
    def estado_valido(cls, v):
        if v is not None:
            estados_permitidos = ['disponible', 'no_disponible', 'en_mantenimiento', 'dada_de_baja']
            if v not in estados_permitidos:
                raise ValueError(f'Estado debe ser uno de: {", ".join(estados_permitidos)}')
        return v

    @validator('cantidad_disponible')
    def cantidad_disponible_valida(cls, v, values):
        if v is not None and 'cantidad_total' in values and values['cantidad_total'] is not None:
            if v > values['cantidad_total']:
                raise ValueError('La cantidad disponible no puede ser mayor que la cantidad total')
        return v

    @validator('cantidad_total')
    def cantidad_total_valida(cls, v):
        if v is not None and v < 0:
            raise ValueError('La cantidad total no puede ser negativa')
        return v

class HerramientaResponse(HerramientaBase):
    id: int
    fecha_creacion: Optional[datetime] = None

    class Config:
        from_attributes = True

class HerramientaListResponse(BaseModel):
    items: list[HerramientaResponse]
    total: int

    class Config:
        from_attributes = True

# Schemas para movimientos de herramientas
class MovimientoHerramientaBase(BaseModel):
    herramienta_id: int = Field(..., gt=0, description="ID de la herramienta")
    labor_id: Optional[int] = Field(None, gt=0, description="ID de la labor asociada")
    cantidad: int = Field(..., gt=0, description="Cantidad movida")
    tipo_movimiento: str = Field(..., description="Tipo de movimiento")
    observaciones: Optional[str] = Field(None, max_length=500, description="Observaciones del movimiento")

    @validator('tipo_movimiento')
    def tipo_movimiento_valido(cls, v):
        tipos_permitidos = ['entrada', 'salida', 'ajuste', 'asignacion', 'devolucion']
        if v not in tipos_permitidos:
            raise ValueError(f'Tipo de movimiento debe ser uno de: {", ".join(tipos_permitidos)}')
        return v

    @validator('cantidad')
    def cantidad_positiva(cls, v):
        if v <= 0:
            raise ValueError('La cantidad debe ser mayor a 0')
        return v

class MovimientoHerramientaCreate(MovimientoHerramientaBase):
    pass

class MovimientoHerramientaUpdate(BaseModel):
    cantidad: Optional[int] = Field(None, gt=0, description="Cantidad movida")
    tipo_movimiento: Optional[str] = Field(None, description="Tipo de movimiento")
    observaciones: Optional[str] = Field(None, max_length=500, description="Observaciones del movimiento")

    @validator('tipo_movimiento')
    def tipo_movimiento_valido(cls, v):
        if v is not None:
            tipos_permitidos = ['entrada', 'salida', 'ajuste', 'asignacion', 'devolucion']
            if v not in tipos_permitidos:
                raise ValueError(f'Tipo de movimiento debe ser uno de: {", ".join(tipos_permitidos)}')
        return v

    @validator('cantidad')
    def cantidad_positiva(cls, v):
        if v is not None and v <= 0:
            raise ValueError('La cantidad debe ser mayor a 0')
        return v

class MovimientoHerramientaResponse(MovimientoHerramientaBase):
    id: int
    fecha_movimiento: datetime

    class Config:
        from_attributes = True

# Schema para incluir movimientos en la respuesta de herramienta
class HerramientaWithMovimientosResponse(HerramientaResponse):
    movimientos: list[MovimientoHerramientaResponse] = []
    categoria_nombre: Optional[str] = None

    class Config:
        from_attributes = True

# Schema para asignación de herramientas
class AsignacionHerramientaBase(BaseModel):
    herramienta_id: int = Field(..., gt=0, description="ID de la herramienta")
    labor_id: int = Field(..., gt=0, description="ID de la labor")
    cantidad: int = Field(1, gt=0, description="Cantidad a asignar")

    @validator('cantidad')
    def cantidad_positiva(cls, v):
        if v <= 0:
            raise ValueError('La cantidad debe ser mayor a 0')
        return v

class AsignacionHerramientaCreate(AsignacionHerramientaBase):
    pass

class AsignacionHerramientaResponse(AsignacionHerramientaBase):
    id: int
    fecha_asignacion: datetime

    class Config:
        from_attributes = True