FROM python:3.12-slim-bookworm

WORKDIR /app

# Actualizar OpenSSL y certificados
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    ca-certificates \
    openssl \
    wget \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && update-ca-certificates --fresh

# Descargar certificados root modernos
RUN wget -O /usr/local/share/ca-certificates/ISRG_Root_X1.crt https://letsencrypt.org/certs/isrgrootx1.pem \
    && wget -O /usr/local/share/ca-certificates/Cloudflare_CA.crt https://developers.cloudflare.com/ssl/static/authenticated_origin_pull_ca.pem \
    && update-ca-certificates

# Instalar Python dependencies
COPY requirements.txt .
RUN pip install --upgrade pip setuptools wheel \
    && pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]