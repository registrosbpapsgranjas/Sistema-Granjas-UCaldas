from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime
from enum import Enum

class TipoEvidencia(str, Enum):
    IMAGEN = "imagen"
    VIDEO = "video"
    DOCUMENTO = "documento"
    AUDIO = "audio"
    OTRO = "otro"

class TipoEntidad(str, Enum):
    LABOR = "labor"
    DIAGNOSTICO = "diagnostico"
    RECOMENDACION = "recomendacion"

class EvidenciaBase(BaseModel):
    tipo: TipoEvidencia = Field(..., description="Tipo de evidencia")
    descripcion: str = Field(..., min_length=5, max_length=500, description="Descripción de la evidencia")
    url_archivo: str = Field(..., min_length=1, max_length=500, description="URL o path del archivo")
    tipo_entidad: TipoEntidad = Field(..., description="Tipo de entidad a la que pertenece")

    @validator('descripcion')
    def descripcion_no_vacia(cls, v):
        if not v.strip():
            raise ValueError('La descripción no puede estar vacía')
        return v.strip()

    @validator('url_archivo')
    def url_no_vacia(cls, v):
        if not v.strip():
            raise ValueError('La URL no puede estar vacía')
        return v.strip()

class EvidenciaCreate(EvidenciaBase):
    entidad_id: int = Field(..., gt=0, description="ID de la entidad (labor, diagnóstico o recomendación)")
    usuario_id: int = Field(..., gt=0, description="ID del usuario que sube la evidencia")

    @validator('entidad_id')
    def entidad_valida(cls, v):
        if v <= 0:
            raise ValueError('ID de entidad debe ser mayor a 0')
        return v

class EvidenciaResponse(EvidenciaBase):
    id: int
    entidad_id: int
    usuario_id: int
    fecha_creacion: datetime
    
    # Información relacionada
    usuario_nombre: Optional[str] = None
    entidad_nombre: Optional[str] = None
    
    class Config:
        from_attributes = True

class EvidenciaListResponse(BaseModel):
    items: List[EvidenciaResponse]
    total: int
    
    class Config:
        from_attributes = True