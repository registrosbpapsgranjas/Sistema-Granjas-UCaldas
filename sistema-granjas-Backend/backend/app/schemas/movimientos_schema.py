from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class MovimientoHerramientaBase(BaseModel):
    herramienta_id: int
    labor_id: int
    cantidad: int
    tipo_movimiento: str
    observaciones: Optional[str] = None

class MovimientoHerramientaResponse(MovimientoHerramientaBase):
    id: int
    fecha_movimiento: datetime
    herramienta_nombre: Optional[str] = None
    labor_descripcion: Optional[str] = None
    
    class Config:
        from_attributes = True

class MovimientoInsumoBase(BaseModel):
    insumo_id: int
    labor_id: int
    cantidad: float
    tipo_movimiento: str
    observaciones: Optional[str] = None

class MovimientoInsumoResponse(MovimientoInsumoBase):
    id: int
    fecha_movimiento: datetime
    insumo_nombre: Optional[str] = None
    labor_descripcion: Optional[str] = None
    unidad_medida: Optional[str] = None
    
    class Config:
        from_attributes = True

class MovimientosListResponse(BaseModel):
    herramientas: List[MovimientoHerramientaResponse]
    insumos: List[MovimientoInsumoResponse]
    total_herramientas: int
    total_insumos: int

    class Config:
        from_attributes = True