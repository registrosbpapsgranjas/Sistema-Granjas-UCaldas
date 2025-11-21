from pydantic import BaseModel, EmailStr, field_validator, model_validator
from typing import Optional
from datetime import datetime
import re

class UsuarioBase(BaseModel):
    nombre: str
    email: EmailStr
    rol_id: int

    @field_validator('nombre')
    def validar_nombre(cls, v):
        if not v or len(v.strip()) == 0:
            raise ValueError('El nombre no puede estar vacío')
        if len(v.strip()) < 3:
            raise ValueError('El nombre debe tener al menos 3 caracteres')
        if len(v) > 100:
            raise ValueError('El nombre no puede tener más de 100 caracteres')
        
        # Validar que solo contenga letras, espacios y algunos caracteres especiales
        if not re.match(r'^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s\-\'\.]+$', v):
            raise ValueError('El nombre solo puede contener letras, espacios y los caracteres: - \' .')
        
        return v.strip()

    @field_validator('rol_id')
    def validar_rol_id(cls, v):
        if v is None:
            raise ValueError('El rol_id es requerido')
        if v < 1:
            raise ValueError('El rol_id debe ser un número positivo')
        return v

class UsuarioCreate(UsuarioBase):
    password: Optional[str] = None

    @field_validator('password')
    def validar_password_opcional(cls, v):
        if v is not None:
            if len(v) < 6:
                raise ValueError('La contraseña debe tener al menos 6 caracteres')
            if len(v) > 100:
                raise ValueError('La contraseña no puede tener más de 100 caracteres')
            # Validar fortaleza de contraseña
            if not any(char.isdigit() for char in v):
                raise ValueError('La contraseña debe contener al menos un número')
            if not any(char.isalpha() for char in v):
                raise ValueError('La contraseña debe contener al menos una letra')
        return v

class UsuarioCreateWithPassword(UsuarioBase):
    password: str

    @field_validator('password')
    def validar_password_fuerte(cls, v):
        if len(v) < 6:
            raise ValueError('La contraseña debe tener al menos 6 caracteres')
        if len(v) > 100:
            raise ValueError('La contraseña no puede tener más de 100 caracteres')
        
        # Validar fortaleza de contraseña
        if not any(char.isdigit() for char in v):
            raise ValueError('La contraseña debe contener al menos un número')
        if not any(char.isalpha() for char in v):
            raise ValueError('La contraseña debe contener al menos una letra')
        if not any(char in "!@#$%^&*()-_=+[]{}|;:,.<>?/" for char in v):
            raise ValueError('La contraseña debe contener al menos un carácter especial')
        
        return v

    @model_validator(mode='after')
    def validar_email_dominio(cls, values):
        email = values.email
        # Validar que el email sea del dominio de la universidad
        dominios_permitidos = ['ucaldas.edu.co', 'estudiantes.ucaldas.edu.co']
        dominio = email.split('@')[-1]
        
        if dominio not in dominios_permitidos:
            raise ValueError(f'El email debe ser del dominio de la Universidad de Caldas. Dominios permitidos: {", ".join(dominios_permitidos)}')
        
        return values

class UsuarioUpdate(BaseModel):
    nombre: Optional[str] = None
    email: Optional[EmailStr] = None
    rol_id: Optional[int] = None
    activo: Optional[bool] = None

    @field_validator('nombre')
    def validar_nombre_update(cls, v):
        if v is not None:
            if len(v.strip()) < 3:
                raise ValueError('El nombre debe tener al menos 3 caracteres')
            if len(v) > 100:
                raise ValueError('El nombre no puede tener más de 100 caracteres')
            if not re.match(r'^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s\-\'\.]+$', v):
                raise ValueError('El nombre solo puede contener letras, espacios y los caracteres: - \' .')
        return v

    @field_validator('email')
    def validar_email_update(cls, v):
        if v is not None:
            dominios_permitidos = ['gmail.com','ucaldas.edu.co', 'estudiantes.ucaldas.edu.co']
            dominio = v.split('@')[-1]
            if dominio not in dominios_permitidos:
                raise ValueError(f'El email debe ser del dominio de la Universidad de Caldas')
        return v

    @field_validator('rol_id')
    def validar_rol_id_update(cls, v):
        if v is not None and v < 1:
            raise ValueError('El rol_id debe ser un número positivo')
        return v

class UsuarioResponse(UsuarioBase):
    id: int
    activo: bool
    fecha_creacion: datetime
    rol_nombre: str
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    nombre: str
    rol: str
    rol_id: int
    email: str

class GoogleAuthRequest(BaseModel):
    token: str

    @field_validator('token')
    def validar_token_google(cls, v):
        if not v or len(v.strip()) == 0:
            raise ValueError('El token de Google es requerido')
        if len(v) < 10:
            raise ValueError('El token de Google no es válido')
        return v

class GoogleRegisterRequest(BaseModel):
    token: str
    rol_id: int

    @field_validator('token')
    def validar_token_google_registro(cls, v):
        if not v or len(v.strip()) == 0:
            raise ValueError('El token de Google es requerido')
        return v

    @field_validator('rol_id')
    def validar_rol_id_google(cls, v):
        if v < 1:
            raise ValueError('El rol_id debe ser un número positivo')
        return v