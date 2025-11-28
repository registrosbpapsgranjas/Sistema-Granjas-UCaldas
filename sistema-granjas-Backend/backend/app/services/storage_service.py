from app.core.r2_config import get_r2_client, get_r2_bucket
import os
from io import BytesIO
from dotenv import load_dotenv
load_dotenv()


s3 = get_r2_client()
bucket_name = get_r2_bucket()

PUBLIC_R2_URL = os.getenv("R2_PUBLIC_URL")


def upload_file_r2(file_bytes: bytes, file_name: str, content_type: str):
    try:
        # Convertir bytes → objeto con .read()
        file_obj = BytesIO(file_bytes)

        s3.upload_fileobj(
            Fileobj=file_obj,
            Bucket=bucket_name,
            Key=file_name,
            ExtraArgs={"ContentType": content_type}
        )
        print(f"Archivo {PUBLIC_R2_URL} subido correctamente a R2.")
        url = f"{PUBLIC_R2_URL}/{file_name}"

        return url

    except Exception as e:
        raise Exception(f"Error subiendo archivo a R2: {str(e)}")
