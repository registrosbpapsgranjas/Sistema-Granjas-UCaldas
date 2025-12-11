from pydantic import BaseModel, EmailStr, field_validator, model_validator
from typing import Optional, List
import re

class TokenResponse(BaseModel):
    id: int
    access_token: str
    token_type: str = "bearer"
    nombre: str
    rol: str
    rol_id: int
    email: EmailStr
    message: str | None = None 

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

    @field_validator('password')
    def validar_password_login(cls, v):
        if len(v) < 1:
            raise ValueError('La contraseña es requerida')
        return v

    @model_validator(mode='after')
    def validar_credenciales_completas(cls, values):
        email = values.email
        password = values.password
        
        if not email or not password:
            raise ValueError('Email y contraseña son requeridos')
        
        return values

class RegisterRequest(BaseModel):
    nombre: str
    email: EmailStr
    password: str
    rol_id: int

    @field_validator('nombre')
    def validar_nombre_registro(cls, v):
        if len(v.strip()) < 3:
            raise ValueError('El nombre debe tener al menos 3 caracteres')
        if len(v) > 100:
            raise ValueError('El nombre no puede tener más de 100 caracteres')
        if not re.match(r'^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s\-\'\.]+$', v):
            raise ValueError('El nombre solo puede contener letras, espacios y los caracteres: - \' .')
        return v.strip()

    @field_validator('password')
    def validate_password_length(cls, v):
        if len(v) < 6:
            raise ValueError('La contraseña debe tener al menos 6 caracteres')
        if len(v) > 100:
            raise ValueError('La contraseña no puede tener más de 100 caracteres')
        
        # Validar fortaleza
        if not any(char.isdigit() for char in v):
            raise ValueError('La contraseña debe contener al menos un número')
        if not any(char.isalpha() for char in v):
            raise ValueError('La contraseña debe contener al menos una letra')
        
        return v

    @model_validator(mode='after')
    def validar_email_dominio_registro(cls, values):
        email = values.email
        dominios_permitidos = ['gmail.com','ucaldas.edu.co', 'estudiantes.ucaldas.edu.co']
        dominio = email.split('@')[-1]
        
        if dominio not in dominios_permitidos:
            raise ValueError(f'El email debe ser del dominio de la Universidad de Caldas')
        
        return values

    @field_validator('rol_id')
    def validar_rol_id_registro(cls, v):
        if v < 1:
            raise ValueError('El rol_id debe ser un número positivo')
        return v

class LogoutRequest(BaseModel):
    token: Optional[str] = None

class UserVerification(BaseModel):
    valid: bool
    user: dict
    
class SuccessMessage(BaseModel):
    message: str
    detail: Optional[str] = None

class GoogleLoginRequest(BaseModel):
    token: str

    @field_validator('token')
    def validar_token_google(cls, v):
        if not v or len(v.strip()) == 0:
            raise ValueError('El token de Google es requerido')
        return v

class RoleInfo(BaseModel):
    id: int
    nombre: str
    descripcion: str

class RolesAvailableResponse(BaseModel):
    roles: List[RoleInfo]