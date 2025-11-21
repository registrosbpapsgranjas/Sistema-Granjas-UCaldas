from pydantic import BaseModel
from typing import Optional

class TipoLoteBase(BaseModel):
    nombre: str
    descripcion: Optional[str] = None

class TipoLoteCreate(TipoLoteBase):
    pass

class TipoLoteUpdate(BaseModel):  # Cambiar de TipoLoteBase
    nombre: Optional[str] = None
    descripcion: Optional[str] = None

class TipoLoteResponse(TipoLoteBase):
    id: int

    class Config:
        from_attributes = True  # Cambiar de orm_mode