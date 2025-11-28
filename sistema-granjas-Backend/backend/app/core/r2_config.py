from botocore.client import Config
from app.core.config import settings

s3 = settings.r2_client  # reutiliza el cliente inicializado

def get_r2_bucket():
    return settings.R2_BUCKET_NAME

def get_r2_client():
    return s3
