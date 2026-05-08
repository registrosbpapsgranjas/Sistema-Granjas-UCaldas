from pydantic import BaseModel, Field, validator
from typing import Optional, List, Any
from datetime import datetime

TIPOS_DATO_PERMITIDOS = ["text", "number", "date", "select", "multiselect", "boolean", "textarea"]


class DiagnosticoCampoCreate(BaseModel):
    tipo_id: int = Field(..., gt=0)
    nombre_campo: str = Field(..., min_length=1, max_length=100)
    etiqueta: str = Field(..., min_length=1, max_length=150)
    tipo_dato: str = Field(..., description=f"Uno de: {', '.join(TIPOS_DATO_PERMITIDOS)}")
    requerido: bool = False
    opciones: Optional[List[str]] = None
    orden: int = 0
    campo_padre_id: Optional[int] = None
    opciones_padre: Optional[List[str]] = None
    patron_arvenses: bool = False

    @validator("tipo_dato")
    def validar_tipo_dato(cls, v):
        if v not in TIPOS_DATO_PERMITIDOS:
            raise ValueError(f"tipo_dato debe ser uno de: {', '.join(TIPOS_DATO_PERMITIDOS)}")
        return v

    @validator("nombre_campo")
    def normalizar_nombre(cls, v):
        return v.strip().lower().replace(" ", "_")

    @validator("opciones")
    def validar_opciones(cls, v, values):
        tipo = values.get("tipo_dato")
        if tipo in ("select", "multiselect") and (not v or len(v) == 0):
            raise ValueError(f"Para tipo '{tipo}', las opciones son requeridas")
        return v


class DiagnosticoCampoUpdate(BaseModel):
    nombre_campo: Optional[str] = Field(None, min_length=1, max_length=100)
    etiqueta: Optional[str] = Field(None, min_length=1, max_length=150)
    tipo_dato: Optional[str] = None
    requerido: Optional[bool] = None
    opciones: Optional[List[str]] = None
    orden: Optional[int] = None
    campo_padre_id: Optional[int] = None
    opciones_padre: Optional[List[str]] = None

    @validator("tipo_dato")
    def validar_tipo_dato(cls, v):
        if v is not None and v not in TIPOS_DATO_PERMITIDOS:
            raise ValueError(f"tipo_dato debe ser uno de: {', '.join(TIPOS_DATO_PERMITIDOS)}")
        return v


class DiagnosticoCampoResponse(BaseModel):
    id: int
    tipo_id: int
    nombre_campo: str
    etiqueta: str
    tipo_dato: str
    requerido: bool
    opciones: Optional[List[str]] = None
    orden: int
    campo_padre_id: Optional[int] = None
    opciones_padre: Optional[List[str]] = None

    class Config:
        from_attributes = True


# ---------- CampoRecomendacion ----------

class CampoRecomendacionCreate(BaseModel):
    subtipo_id: int = Field(..., gt=0)
    nombre_campo: str = Field(..., min_length=1, max_length=100)
    etiqueta: str = Field(..., min_length=1, max_length=150)
    tipo_dato: str = Field(..., description=f"Uno de: {', '.join(TIPOS_DATO_PERMITIDOS)}")
    requerido: bool = False
    opciones: Optional[List[str]] = None
    orden: int = 0
    campo_padre_id: Optional[int] = None
    opciones_padre: Optional[List[str]] = None

    @validator("tipo_dato")
    def validar_tipo_dato(cls, v):
        if v not in TIPOS_DATO_PERMITIDOS:
            raise ValueError(f"tipo_dato debe ser uno de: {', '.join(TIPOS_DATO_PERMITIDOS)}")
        return v

    @validator("nombre_campo")
    def normalizar_nombre(cls, v):
        return v.strip().lower().replace(" ", "_")

    @validator("opciones")
    def validar_opciones(cls, v, values):
        tipo = values.get("tipo_dato")
        if tipo in ("select", "multiselect") and (not v or len(v) == 0):
            raise ValueError(f"Para tipo '{tipo}', las opciones son requeridas")
        return v


class CampoRecomendacionUpdate(BaseModel):
    nombre_campo: Optional[str] = Field(None, min_length=1, max_length=100)
    etiqueta: Optional[str] = Field(None, min_length=1, max_length=150)
    tipo_dato: Optional[str] = None
    requerido: Optional[bool] = None
    opciones: Optional[List[str]] = None
    orden: Optional[int] = None
    campo_padre_id: Optional[int] = None
    opciones_padre: Optional[List[str]] = None

    @validator("tipo_dato")
    def validar_tipo_dato(cls, v):
        if v is not None and v not in TIPOS_DATO_PERMITIDOS:
            raise ValueError(f"tipo_dato debe ser uno de: {', '.join(TIPOS_DATO_PERMITIDOS)}")
        return v


class CampoRecomendacionResponse(BaseModel):
    id: int
    subtipo_id: int
    nombre_campo: str
    etiqueta: str
    tipo_dato: str
    requerido: bool
    opciones: Optional[List[str]] = None
    orden: int
    campo_padre_id: Optional[int] = None
    opciones_padre: Optional[List[str]] = None

    class Config:
        from_attributes = True


# ---------- DiagnosticoTipo ----------

class DiagnosticoTipoCreate(BaseModel):
    programa_id: int = Field(..., gt=0)
    monitoreo_id: Optional[int] = Field(None, gt=0)
    nombre: str = Field(..., min_length=1, max_length=100)
    descripcion: Optional[str] = None
    orden: int = 0
    activo: bool = True
    patron_arvenses: bool = False


class DiagnosticoTipoUpdate(BaseModel):
    nombre: Optional[str] = Field(None, min_length=1, max_length=100)
    descripcion: Optional[str] = None
    monitoreo_id: Optional[int] = None
    orden: Optional[int] = None
    activo: Optional[bool] = None
    patron_arvenses: Optional[bool] = None


class DiagnosticoTipoResponse(BaseModel):
    id: int
    programa_id: int
    monitoreo_id: Optional[int] = None
    nombre: str
    descripcion: Optional[str] = None
    orden: int
    activo: bool
    patron_arvenses: bool = False
    created_at: datetime

    class Config:
        from_attributes = True


class DiagnosticoTipoConCamposResponse(DiagnosticoTipoResponse):
    campos: List[DiagnosticoCampoResponse] = []
    campos_recomendacion: List[CampoRecomendacionResponse] = []

    class Config:
        from_attributes = True
