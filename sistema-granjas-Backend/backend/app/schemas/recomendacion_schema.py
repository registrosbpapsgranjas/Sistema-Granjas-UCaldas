from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime
from enum import Enum

class TipoRecomendacion(str, Enum):
    APLICACIÓN_AL_SUELO = "Aplicación al suelo"
    APLICACIÓN_FOLIAR = "Aplicación foliar"
    PODAS = "podas"
    COSECHA_Y_SANEAMIENTO = "Cosecha y saneamiento"
    MANEJO_DE_ARVENSES = "Manejo de arvenses"
    CENSO_POBLACIONAL = "Censo poblacional"
    HORMIGA_ARRIERA = "Hormiga arriera"
    OTRO = "otro"

class EstadoRecomendacion(str, Enum):
    PENDIENTE = "pendiente"
    APROBADA = "aprobada"
    EN_EJECUCION = "en_ejecucion"
    COMPLETADA = "completada"
    CANCELADA = "cancelada"

class RecomendacionBase(BaseModel):
    titulo: str = Field(..., min_length=5, max_length=200, description="Título de la recomendación")
    descripcion: str = Field(..., min_length=10, max_length=2000, description="Descripción detallada")
    tipo: TipoRecomendacion = Field(..., description="Tipo de recomendación")
    estado: EstadoRecomendacion = Field(EstadoRecomendacion.PENDIENTE, description="Estado de la recomendación")
    lote_id: int = Field(..., gt=0, description="ID del lote donde aplicar")
    diagnostico_id: Optional[int] = Field(None, gt=0, description="ID del diagnóstico relacionado")
    inventario_item_id: Optional[int] = Field(None, gt=0, description="Item de inventario sugerido")
    cantidad_sugerida: Optional[float] = Field(None, gt=0, description="Cantidad sugerida del insumo")

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

class RecomendacionCreate(RecomendacionBase):
    docente_id: int = Field(..., gt=0, description="ID del docente/asesor/administrador que genera la recomendación")

    @validator('docente_id')
    def docente_valido(cls, v):
        if v <= 0:
            raise ValueError('ID de usuario debe ser mayor a 0')
        return v

class RecomendacionUpdate(BaseModel):
    titulo: Optional[str] = Field(None, min_length=5, max_length=200, description="Título de la recomendación")
    descripcion: Optional[str] = Field(None, min_length=10, max_length=2000, description="Descripción detallada")
    tipo: Optional[TipoRecomendacion] = Field(None, description="Tipo de recomendación")
    estado: Optional[EstadoRecomendacion] = Field(None, description="Estado de la recomendación")
    diagnostico_id: Optional[int] = Field(None, gt=0, description="ID del diagnóstico relacionado")  # ← AÑADIR
    fecha_aprobacion: Optional[datetime] = Field(None, description="Fecha de aprobación")

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

class RecomendacionResponse(RecomendacionBase):
    id: int
    docente_id: int
    fecha_creacion: datetime
    fecha_aprobacion: Optional[datetime] = None
    
    # Información relacionada
    docente_nombre: Optional[str] = None
    lote_nombre: Optional[str] = None
    granja_nombre: Optional[str] = None
    programa_nombre: Optional[str] = None
    diagnostico_tipo: Optional[str] = None
    inventario_item_nombre: Optional[str] = None
    inventario_item_unidad: Optional[str] = None
    inventario_item_disponible: Optional[float] = None
    
    class Config:
        from_attributes = True

class RecomendacionListResponse(BaseModel):
    items: List[RecomendacionResponse]
    total: int
    paginas: int
    
    class Config:
        from_attributes = True

# Schema para aprobación de recomendación
class AprobacionRecomendacionRequest(BaseModel):
    aprobar: bool = Field(..., description="True para aprobar, False para rechazar")
    observaciones: Optional[str] = Field(None, max_length=1000, description="Observaciones de aprobación/rechazo")

    @validator('observaciones')
    def observaciones_no_vacias(cls, v):
        if v is not None and not v.strip():
            raise ValueError('Las observaciones no pueden estar vacías')
        return v.strip() if v else v

# Schema para estadísticas de recomendaciones
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
        
# En recomendacion_schema.py - Agregar este schema
class RecomendacionWithLaboresDetalladasResponse(RecomendacionResponse):
    labores_detalladas: List[dict] = []  # Labores con info extendida
    diagnostico_info: Optional[dict] = None
    
    class Config:
        from_attributes = True