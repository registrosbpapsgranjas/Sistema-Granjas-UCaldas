from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime

class EstadoRecomendacion(str):
    pass

ESTADOS_RECOMENDACION = ["pendiente", "aprobada", "en_ejecucion", "completada", "cancelada"]

class RecomendacionItemCreate(BaseModel):
    inventario_item_id: Optional[int] = Field(None, gt=0)
    cantidad_sugerida: Optional[float] = Field(None, gt=0)
    descripcion: Optional[str] = Field(None, max_length=200)

class RecomendacionItemResponse(BaseModel):
    id: int
    recomendacion_id: int
    inventario_item_id: Optional[int] = None
    cantidad_sugerida: Optional[float] = None
    descripcion: Optional[str] = None
    inventario_item_nombre: Optional[str] = None
    inventario_item_unidad: Optional[str] = None
    inventario_item_disponible: Optional[float] = None

    class Config:
        from_attributes = True

class RecomendacionBase(BaseModel):
    titulo: str = Field(..., min_length=5, max_length=200)
    descripcion: str = Field(..., min_length=10, max_length=2000)
    tipo: Optional[str] = Field(None, max_length=150)
    estado: str = Field("pendiente")
    lote_id: int = Field(..., gt=0)
    diagnostico_id: Optional[int] = Field(None, gt=0)
    inventario_item_id: Optional[int] = Field(None, gt=0)
    cantidad_sugerida: Optional[float] = Field(None, gt=0)

    @validator('titulo')
    def titulo_no_vacio(cls, v):
        if not v.strip():
            raise ValueError('El título no puede estar vacío')
        return v.strip()

    @validator('descripcion')
    def descripcion_minima(cls, v):
        if len(v.strip()) < 10:
            raise ValueError('La descripción debe tener al menos 10 caracteres')
        return v.strip()

    @validator('estado')
    def validar_estado(cls, v):
        if v not in ESTADOS_RECOMENDACION:
            raise ValueError(f"Estado debe ser uno de: {', '.join(ESTADOS_RECOMENDACION)}")
        return v

class RecomendacionCreate(RecomendacionBase):
    docente_id: int = Field(..., gt=0)
    items_sugeridos: List[RecomendacionItemCreate] = []

class RecomendacionUpdate(BaseModel):
    titulo: Optional[str] = Field(None, min_length=5, max_length=200)
    descripcion: Optional[str] = Field(None, min_length=10, max_length=2000)
    tipo: Optional[str] = Field(None, max_length=150)
    estado: Optional[str] = None
    diagnostico_id: Optional[int] = Field(None, gt=0)
    fecha_aprobacion: Optional[datetime] = None
    inventario_item_id: Optional[int] = Field(None, gt=0)
    cantidad_sugerida: Optional[float] = Field(None, gt=0)

    @validator('titulo')
    def titulo_no_vacio(cls, v):
        if v is not None and not v.strip():
            raise ValueError('El título no puede estar vacío')
        return v.strip() if v else v

    @validator('descripcion')
    def descripcion_minima(cls, v):
        if v is not None and len(v.strip()) < 10:
            raise ValueError('La descripción debe tener al menos 10 caracteres')
        return v.strip() if v else v

    @validator('estado')
    def validar_estado(cls, v):
        if v is not None and v not in ESTADOS_RECOMENDACION:
            raise ValueError(f"Estado debe ser uno de: {', '.join(ESTADOS_RECOMENDACION)}")
        return v

class RecomendacionResponse(RecomendacionBase):
    id: int
    docente_id: int
    fecha_creacion: datetime
    fecha_aprobacion: Optional[datetime] = None
    docente_nombre: Optional[str] = None
    lote_nombre: Optional[str] = None
    granja_nombre: Optional[str] = None
    programa_nombre: Optional[str] = None
    programa_id: Optional[int] = None
    diagnostico_tipo: Optional[str] = None
    inventario_item_nombre: Optional[str] = None
    inventario_item_unidad: Optional[str] = None
    inventario_item_disponible: Optional[float] = None
    items_sugeridos: List[RecomendacionItemResponse] = []

    class Config:
        from_attributes = True

class RecomendacionListResponse(BaseModel):
    items: List[RecomendacionResponse]
    total: int
    paginas: int

    class Config:
        from_attributes = True

class AprobacionRecomendacionRequest(BaseModel):
    aprobar: bool = Field(..., description="True para aprobar, False para rechazar")
    observaciones: Optional[str] = Field(None, max_length=1000)

    @validator('observaciones')
    def observaciones_no_vacias(cls, v):
        if v is not None and not v.strip():
            raise ValueError('Las observaciones no pueden estar vacías')
        return v.strip() if v else v

class EstadisticasRecomendacionesResponse(BaseModel):
    total: int
    pendientes: int
    aprobadas: int
    en_ejecucion: int
    completadas: int
    canceladas: int
    por_tipo: dict = {}

    class Config:
        from_attributes = True

class RecomendacionWithLaboresDetalladasResponse(RecomendacionResponse):
    labores_detalladas: List[dict] = []
    diagnostico_info: Optional[dict] = None

    class Config:
        from_attributes = True
