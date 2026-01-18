# Imagen base con bookworm para certificados más recientes
FROM python:3.12-slim-bookworm

# Definir directorio de trabajo
WORKDIR /app

# Instalar dependencias del sistema con OpenSSL actualizado
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    ca-certificates \
    wget \
    curl \
    openssl \
    && rm -rf /var/lib/apt/lists/*

# Actualizar certificados CA
RUN update-ca-certificates --fresh

# Descargar certificados root de Let's Encrypt (ISRG Root X1)
RUN wget -O /usr/local/share/ca-certificates/ISRG_Root_X1.crt https://letsencrypt.org/certs/isrgrootx1.pem \
    && update-ca-certificates

# Copiar archivos de dependencias
COPY requirements.txt .

# Instalar dependencias de Python
RUN pip install --upgrade pip setuptools wheel \
    && pip install --no-cache-dir -r requirements.txt

# Copiar el código fuente
COPY . .

# Exponer el puerto de FastAPI
EXPOSE 8000

# Comando para ejecutar la app
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]