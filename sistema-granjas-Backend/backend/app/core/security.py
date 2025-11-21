from datetime import datetime, timedelta
from typing import Optional
from jose import jwt, JWTError
from passlib.context import CryptContext
from app.core.config import settings
import hashlib

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

MAX_PASSWORD_LENGTH = 72

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def verify_token(token: str):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None

def safe_truncate_password(password: str) -> str:
    """Trunca la contraseña de forma segura a 72 bytes"""
    if not password:
        return password

    password_bytes = password.encode('utf-8')
    if len(password_bytes) > MAX_PASSWORD_LENGTH:
        truncated_bytes = password_bytes[:MAX_PASSWORD_LENGTH]
        return truncated_bytes.decode('utf-8', errors='ignore')
    
    return password

def verify_sha256_hash(plain_password: str, hashed_password: str) -> bool:
    """Verifica contraseñas hasheadas con SHA256 (legacy fallback)"""
    try:
        parts = hashed_password.split('$')
        if len(parts) != 3 or parts[0] != 'sha256':
            return False
        
        salt = parts[1]
        stored_hash = parts[2]
        
        computed_hash = hashlib.sha256((plain_password + salt).encode()).hexdigest()
        return computed_hash == stored_hash
    except Exception:
        return False

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verificación unificada soportando bcrypt y SHA256 legacy"""
    if not hashed_password or not plain_password:
        return False
    
    try:
        safe_password = safe_truncate_password(plain_password)
        
        if hashed_password.startswith('sha256$'):
            return verify_sha256_hash(safe_password, hashed_password)
        
        return pwd_context.verify(safe_password, hashed_password)
        
    except Exception as e:
        print(f"❌ ERROR verificando contraseña: {str(e)}")
        return False

def get_password_hash(password: str) -> str:
    """Hash seguro solo usando bcrypt (sin fallback)"""
    try:
        safe_password = safe_truncate_password(password)
        return pwd_context.hash(safe_password)
        
    except Exception as e:
        raise ValueError(f"❌ Error al hashear contraseña: {str(e)}")
