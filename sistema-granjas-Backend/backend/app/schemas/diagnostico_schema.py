from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime, date

CONDICIONES_DIA_PERMITIDAS = ["Soleado", "Nublado", "Lluvia"]

TIPOS_DIAGNOSTICO_PERMITIDOS = [
    "censo_poblacional",
    "monitoreo_fenologico",
    "artropodos",
    "enfermedades",
    "arvenses",
    "controladores_biologicos",
    "polinizadores",
]


# ── CREATE ────────────────────────────────────────────────────────────────────
class DiagnosticoCreate(BaseModel):
    programa_id:       int            = Field(..., gt=0)
    tipo_monitoreo_id: int            = Field(..., gt=0)
    lote_id:           int            = Field(..., gt=0)
    usuario_id:        int            = Field(..., gt=0)
    tipo_diagnostico:  str            = Field(..., description="Tipo de diagnóstico")
    condiciones_dia:   str            = Field(..., description="Condiciones climáticas del día")
    formulario:        Optional[Dict[str, Any]] = Field(None, description="Datos del formulario en JSON")

    @validator("tipo_diagnostico")
    def validar_tipo(cls, v):
        if v not in TIPOS_DIAGNOSTICO_PERMITIDOS:
            raise ValueError(f"tipo_diagnostico debe ser uno de: {', '.join(TIPOS_DIAGNOSTICO_PERMITIDOS)}")
        return v

    @validator("condiciones_dia")
    def validar_condiciones(cls, v):
        if v not in CONDICIONES_DIA_PERMITIDAS:
            raise ValueError(f"condiciones_dia debe ser uno de: {', '.join(CONDICIONES_DIA_PERMITIDAS)}")
        return v


# ── UPDATE ────────────────────────────────────────────────────────────────────
class DiagnosticoUpdate(BaseModel):
    tipo_diagnostico: Optional[str]            = None
    condiciones_dia:  Optional[str]            = None
    formulario:       Optional[Dict[str, Any]] = None

    @validator("tipo_diagnostico")
    def validar_tipo(cls, v):
        if v is not None and v not in TIPOS_DIAGNOSTICO_PERMITIDOS:
            raise ValueError(f"tipo_diagnostico debe ser uno de: {', '.join(TIPOS_DIAGNOSTICO_PERMITIDOS)}")
        return v

    @validator("condiciones_dia")
    def validar_condiciones(cls, v):
        if v is not None and v not in CONDICIONES_DIA_PERMITIDAS:
            raise ValueError(f"condiciones_dia debe ser uno de: {', '.join(CONDICIONES_DIA_PERMITIDAS)}")
        return v


# ── RESPONSE ──────────────────────────────────────────────────────────────────
class DiagnosticoResponse(BaseModel):
    id:               int
    programa_id:      int
    tipo_monitoreo_id: int
    lote_id:          int
    usuario_id:       int
    tipo_diagnostico: str
    condiciones_dia:  str
    formulario:       Optional[Dict[str, Any]] = None
    fecha_creacion:   datetime

    # Campos enriquecidos (calculados en el router)
    programa_nombre:       Optional[str] = None
    tipo_monitoreo_nombre: Optional[str] = None
    lote_nombre:           Optional[str] = None
    granja_nombre:         Optional[str] = None
    usuario_nombre:        Optional[str] = None

    class Config:
        from_attributes = True


# ── RESPONSE CON RECOMENDACIONES ──────────────────────────────────────────────
class RecomendacionBasicResponse(BaseModel):
    id:             int
    titulo:         str
    tipo:           Optional[str] = None
    estado:         str
    fecha_creacion: datetime

    class Config:
        from_attributes = True


class DiagnosticoWithRecomendacionesResponse(DiagnosticoResponse):
    recomendaciones: List[RecomendacionBasicResponse] = []

    class Config:
        from_attributes = True


# ── LISTA PAGINADA ────────────────────────────────────────────────────────────
class DiagnosticoListResponse(BaseModel):
    items:   List[DiagnosticoResponse]
    total:   int
    paginas: int

    class Config:
        from_attributes = True


# ── ESTADÍSTICAS ──────────────────────────────────────────────────────────────
class EstadisticasDiagnosticosResponse(BaseModel):
    total:    int
    por_tipo: Dict[str, int] = {}
    por_lote: Dict[str, int] = {}

    class Config:
        from_attributes = True