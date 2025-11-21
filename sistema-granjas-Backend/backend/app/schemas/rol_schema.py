from pydantic import BaseModel, Field
from typing import Optional

class RolBase(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    nivel_permiso: int = Field(ge=0, le=100)

class RolCreate(RolBase):
    pass

class RolUpdate(BaseModel):
    descripcion: Optional[str] = None
    nivel_permiso: Optional[int] = Field(None, ge=0, le=100)
    activo: Optional[bool] = None

class RolResponse(RolBase):
    id: int
    activo: bool
    
    class Config:
        from_attributes = True

class RolParaRegistro(BaseModel):
    id: int
    nombre: str
    descripcion: Optional[str]
    
    class Config:
        from_attributes = True