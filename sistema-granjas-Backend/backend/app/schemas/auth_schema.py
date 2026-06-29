from pydantic import BaseModel, EmailStr, field_validator, model_validator
from typing import Optional, List, Dict, Any
import re

class TokenResponse(BaseModel):
    id: int
    access_token: str
    token_type: str = "bearer"
    nombre: str
    rol: str
    rol_id: int
    email: EmailStr
    programas: Optional[List[Dict[str, Any]]] = []
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
        dominios_permitidos = ['gmail.com', 'ucaldas.edu.co', 'estudiantes.ucaldas.edu.co']
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
    user: Optional[Dict[str, Any]] = None

class SuccessMessage(BaseModel):
    message: str
    detail: Optional[str] = None

class RoleInfo(BaseModel):
    id: int
    nombre: str
    descripcion: str

class RolesAvailableResponse(BaseModel):
    roles: List[RoleInfo]


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class VerifyResetCodeRequest(BaseModel):
    email: EmailStr
    code: str

    @field_validator('code')
    def validar_code(cls, v):
        v = v.strip()
        if len(v) != 5 or not v.isdigit():
            raise ValueError('El código debe ser de 5 dígitos numéricos')
        return v


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    code: str
    new_password: str
    confirm_password: str

    @field_validator('code')
    def validar_code(cls, v):
        v = v.strip()
        if len(v) != 5 or not v.isdigit():
            raise ValueError('El código debe ser de 5 dígitos numéricos')
        return v

    @field_validator('new_password')
    def validate_new_password(cls, v):
        if len(v) < 6:
            raise ValueError('La contraseña debe tener al menos 6 caracteres')
        if len(v) > 100:
            raise ValueError('La contraseña no puede tener más de 100 caracteres')
        if not any(c.isalpha() for c in v):
            raise ValueError('La contraseña debe contener al menos una letra')
        if not any(c.isdigit() for c in v):
            raise ValueError('La contraseña debe contener al menos un número')
        return v

    @model_validator(mode='after')
    def validate_passwords_match(cls, values):
        if values.new_password != values.confirm_password:
            raise ValueError('Las contraseñas no coinciden')
        return values


class SendVerificationEmailRequest(BaseModel):
    nombre: str
    email: EmailStr
    password: str
    rol_id: int

    @field_validator('nombre')
    def validar_nombre(cls, v):
        if len(v.strip()) < 3:
            raise ValueError('El nombre debe tener al menos 3 caracteres')
        if len(v) > 100:
            raise ValueError('El nombre no puede tener más de 100 caracteres')
        if not re.match(r'^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s\-\'\.]+$', v):
            raise ValueError('El nombre solo puede contener letras, espacios y los caracteres: - \' .')
        return v.strip()

    @field_validator('password')
    def validate_password(cls, v):
        if len(v) < 6:
            raise ValueError('La contraseña debe tener al menos 6 caracteres')
        if len(v) > 100:
            raise ValueError('La contraseña no puede tener más de 100 caracteres')
        if not any(char.isdigit() for char in v):
            raise ValueError('La contraseña debe contener al menos un número')
        if not any(char.isalpha() for char in v):
            raise ValueError('La contraseña debe contener al menos una letra')
        return v

    @field_validator('rol_id')
    def validar_rol_id(cls, v):
        if v < 1:
            raise ValueError('El rol_id debe ser un número positivo')
        return v


class VerifyRegistrationCodeRequest(BaseModel):
    email: EmailStr
    code: str

    @field_validator('code')
    def validar_code(cls, v):
        v = v.strip()
        if len(v) != 5 or not v.isdigit():
            raise ValueError('El código debe ser de 5 dígitos numéricos')
        return v


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str
    confirm_password: str

    @field_validator('new_password')
    def validate_new_password(cls, v):
        if len(v) < 6:
            raise ValueError('La nueva contraseña debe tener al menos 6 caracteres')
        if len(v) > 100:
            raise ValueError('La nueva contraseña no puede tener más de 100 caracteres')
        if not any(c.isalpha() for c in v):
            raise ValueError('La nueva contraseña debe contener al menos una letra')
        return v

    @model_validator(mode='after')
    def validate_passwords_match(cls, values):
        new_password = values.new_password
        confirm_password = values.confirm_password
        
        if new_password != confirm_password:
            raise ValueError('Las contraseñas no coinciden')
        
        if new_password == values.current_password:
            raise ValueError('La nueva contraseña debe ser diferente a la actual')
        
        return values