# Dockerfile Optimizado para React + TypeScript
FROM node:20-alpine AS builder

WORKDIR /app

# Instalar dependencias con cache eficiente
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps --silent

# Copiar código fuente
COPY . .

# Variables de entorno para build
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

# Build de producción
RUN npm run build

# Etapa final liviana
FROM node:20-alpine

WORKDIR /app
RUN npm install -g serve@14

# Copiar archivos built desde la etapa builder
COPY --from=builder /app/dist ./dist

# Puerto dinámico para Render
ENV PORT=3000
EXPOSE $PORT

# Health check para Render
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -qO- http://localhost:$PORT/ || exit 1

# Comando para iniciar
CMD ["serve", "-s", "dist", "-l", "3000"]