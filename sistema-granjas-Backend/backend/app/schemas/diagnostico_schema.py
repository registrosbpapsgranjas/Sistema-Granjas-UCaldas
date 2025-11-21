from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime
from enum import Enum

class TipoDiagnostico(str, Enum):
    NUTRICIONAL = "nutricional"
    PLAGAS = "plagas"
    BIOLÓGICO = "biológico"
    FENOLOGÍA = "fenología"

class EstadoDiagnostico(str, Enum):
    ABIERTO = "abierto"
    EN_REVISION = "en_revision"
    CERRADO = "cerrado"

# Schema base para herencia
class DiagnosticoBase(BaseModel):
    tipo: TipoDiagnostico = Field(..., description="Tipo de diagnóstico")
    descripcion: str = Field(..., min_length=10, max_length=1000, description="Descripción detallada del diagnóstico")
    lote_id: int = Field(..., gt=0, description="ID del lote asociado")
    estado: EstadoDiagnostico = Field(EstadoDiagnostico.ABIERTO, description="Estado del diagnóstico")
    observaciones: Optional[str] = Field(None, max_length=1000, description="Observaciones del docente")

    @validator('descripcion')
    def descripcion_minima(cls, v):
        if len(v.strip()) < 10:
            raise ValueError('La descripción debe tener al menos 10 caracteres')
        return v.strip()

    @validator('observaciones')
    def observaciones_no_vacias(cls, v):
        if v is not None and not v.strip():
            raise ValueError('Las observaciones no pueden estar vacías')
        return v.strip() if v else v

# Schema para creación - con docente_id opcional
class DiagnosticoCreate(BaseModel):
    tipo: TipoDiagnostico = Field(..., description="Tipo de diagnóstico")
    descripcion: str = Field(..., min_length=10, max_length=1000, description="Descripción detallada")
    estudiante_id: int = Field(..., gt=0, description="ID del estudiante que crea el diagnóstico")
    lote_id: int = Field(..., gt=0, description="ID del lote asociado")
    docente_id: Optional[int] = Field(None, gt=0, description="ID del docente que revisa")  # OPCIONAL

    @validator('descripcion')
    def descripcion_minima(cls, v):
        if len(v.strip()) < 10:
            raise ValueError('La descripción debe tener al menos 10 caracteres')
        return v.strip()

# Schema para actualización - campos opcionales
class DiagnosticoUpdate(BaseModel):
    tipo: Optional[TipoDiagnostico] = Field(None, description="Tipo de diagnóstico")
    descripcion: Optional[str] = Field(None, min_length=10, max_length=1000, description="Descripción detallada")
    docente_id: Optional[int] = Field(None, gt=0, description="ID del docente que revisa")
    estado: Optional[EstadoDiagnostico] = Field(None, description="Estado del diagnóstico")
    observaciones: Optional[str] = Field(None, max_length=1000, description="Observaciones del docente")

    @validator('descripcion')
    def descripcion_minima(cls, v):
        if v is not None and len(v.strip()) < 10:
            raise ValueError('La descripción debe tener al menos 10 caracteres')
        return v.strip() if v else v

    @validator('observaciones')
    def observaciones_no_vacias(cls, v):
        if v is not None and not v.strip():
            raise ValueError('Las observaciones no pueden estar vacías')
        return v.strip() if v else v

# Schema para respuesta
class DiagnosticoResponse(DiagnosticoBase):
    id: int
    estudiante_id: int
    docente_id: Optional[int] = None
    fecha_creacion: datetime
    fecha_revision: Optional[datetime] = None
    
    # Información relacionada (no se almacenan en DB, se calculan)
    estudiante_nombre: Optional[str] = None
    docente_nombre: Optional[str] = None
    lote_nombre: Optional[str] = None
    granja_nombre: Optional[str] = None
    programa_nombre: Optional[str] = None
    
    class Config:
        from_attributes = True

# Schema para respuesta con recomendaciones
class RecomendacionBasicResponse(BaseModel):
    id: int
    titulo: str
    tipo: Optional[str] = None
    estado: str
    fecha_creacion: datetime
    
    class Config:
        from_attributes = True

class DiagnosticoWithRecomendacionesResponse(DiagnosticoResponse):
    recomendaciones: List[RecomendacionBasicResponse] = []
    
    class Config:
        from_attributes = True

# Schema para listado paginado
class DiagnosticoListResponse(BaseModel):
    items: List[DiagnosticoResponse]
    total: int
    paginas: int
    
    class Config:
        from_attributes = True

# Schema específico para asignación de docente
class AsignacionDocenteRequest(BaseModel):
    docente_id: int = Field(..., gt=0, description="ID del docente a asignar")

# Schema específico para cierre de diagnóstico
class CierreDiagnosticoRequest(BaseModel):
    observaciones: str = Field(..., min_length=1, max_length=1000, description="Observaciones de cierre")
    
    @validator('observaciones')
    def observaciones_no_vacias(cls, v):
        if not v.strip():
            raise ValueError('Las observaciones no pueden estar vacías')
        return v.strip()

# Schema para estadísticas
class EstadisticasDiagnosticosResponse(BaseModel):
    total: int
    abiertos: int
    en_revision: int
    cerrados: int
    por_tipo: dict = {}
    
    class Config:
        from_attributes = True