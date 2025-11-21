from pydantic import BaseModel
from typing import Optional

class CategoriaInventarioBase(BaseModel):
    nombre: str
    descripcion: Optional[str] = None

class CategoriaInventarioCreate(CategoriaInventarioBase):
    pass

class CategoriaInventarioUpdate(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None

class CategoriaInventarioResponse(CategoriaInventarioBase):
    id: int

    class Config:
        from_attributes = True
