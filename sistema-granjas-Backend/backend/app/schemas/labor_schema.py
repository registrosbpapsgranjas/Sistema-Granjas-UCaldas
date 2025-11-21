from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime
from enum import Enum


class EstadoLabor(str, Enum):
    PENDIENTE = "pendiente"
    EN_PROGRESO = "en_progreso"
    COMPLETADA = "completada"
    CANCELADA = "cancelada"


# ============================================================
# BASE
# ============================================================
class LaborBase(BaseModel):
    estado: EstadoLabor = Field(EstadoLabor.PENDIENTE, description="Estado de la labor")
    avance_porcentaje: int = Field(0, ge=0, le=100, description="Porcentaje de avance (0-100)")
    comentario: Optional[str] = Field(None, max_length=2000, description="Comentarios o evidencia")
    lote_id: Optional[int] = Field(None, gt=0, description="ID del lote asociado")
    tipo_labor_id: int = Field(..., gt=0, description="ID del tipo de labor")

    @validator("avance_porcentaje")
    def validar_avance(cls, v):
        if not 0 <= v <= 100:
            raise ValueError("El avance debe estar entre 0 y 100")
        return v

    @validator("comentario")
    def validar_comentario(cls, v):
        if v is not None and not v.strip():
            raise ValueError("El comentario no puede estar vacío")
        return v.strip() if v else v


# ============================================================
# CREATE
# ============================================================
class LaborCreate(LaborBase):
    recomendacion_id: int = Field(..., gt=0, description="ID de la recomendación asociada")
    trabajador_id: int = Field(..., gt=0, description="ID del trabajador asignado")


# ============================================================
# UPDATE
# ============================================================
class LaborUpdate(BaseModel):
    estado: Optional[EstadoLabor] = None
    avance_porcentaje: Optional[int] = Field(None, ge=0, le=100)
    comentario: Optional[str] = Field(None, max_length=2000)
    fecha_finalizacion: Optional[datetime] = None
    tipo_labor_id: Optional[int] = Field(None, gt=0)

    @validator("avance_porcentaje")
    def validar_avance(cls, v):
        if v is not None and not 0 <= v <= 100:
            raise ValueError("El avance debe estar entre 0 y 100")
        return v

    @validator("comentario")
    def validar_comentario(cls, v):
        if v is not None and not v.strip():
            raise ValueError("El comentario no puede estar vacío")
        return v.strip() if v else v


# ============================================================
# ASIGNACIÓN DE RECURSOS
# ============================================================
class AsignacionHerramientaRequest(BaseModel):
    herramienta_id: int = Field(..., gt=0)
    cantidad: int = Field(..., gt=0)


class AsignacionInsumoRequest(BaseModel):
    insumo_id: int = Field(..., gt=0)
    cantidad: float = Field(..., gt=0)


class RegistroAvanceRequest(BaseModel):
    avance_porcentaje: int = Field(..., ge=0, le=100)
    comentario: Optional[str] = Field(None, max_length=2000)


# ============================================================
# EVIDENCIAS
# ============================================================
class EvidenciaBasicResponse(BaseModel):
    id: int
    tipo: str
    descripcion: str
    url_archivo: str
    fecha_creacion: datetime
    creado_por_nombre: Optional[str] = None

    class Config:
        from_attributes = True


# ============================================================
# RESPUESTAS
# ============================================================
class LaborResponse(LaborBase):
    id: int
    recomendacion_id: int
    trabajador_id: int
    fecha_asignacion: datetime
    fecha_finalizacion: Optional[datetime] = None

    # información extra
    trabajador_nombre: Optional[str] = None
    recomendacion_titulo: Optional[str] = None
    lote_nombre: Optional[str] = None
    granja_nombre: Optional[str] = None
    tipo_labor_nombre: Optional[str] = None
    tipo_labor_descripcion: Optional[str] = None

    class Config:
        from_attributes = True


class LaborWithRecursosResponse(LaborResponse):
    herramientas_asignadas: List[dict] = []
    insumos_asignados: List[dict] = []
    movimientos_herramientas: List[dict] = []
    movimientos_insumos: List[dict] = []
    evidencias: List[EvidenciaBasicResponse] = []

    class Config:
        from_attributes = True


class LaborListResponse(BaseModel):
    items: List[LaborResponse]
    total: int
    paginas: int

    class Config:
        from_attributes = True


class EstadisticasLaboresResponse(BaseModel):
    total: int
    pendientes: int
    en_progreso: int
    completadas: int
    canceladas: int
    promedio_avance: float

    class Config:
        from_attributes = True
