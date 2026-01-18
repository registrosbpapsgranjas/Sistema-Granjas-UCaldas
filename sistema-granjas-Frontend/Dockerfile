# Etapa 1: Build
FROM node:20-alpine AS build

WORKDIR /app

# Copiar dependencias primero (para mejor cache)
# ¡QUITAR --only=production! Necesitamos TypeScript para build
COPY package.json package-lock.json* ./
RUN npm ci --silent  # ← SIN --only=production

# Copiar el resto
COPY . .

# Pasar variables de entorno al build (IMPORTANTE)
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

# Build
RUN npm run build

# Etapa 2: Servir
FROM node:20-alpine

WORKDIR /app

# Instalar solo serve (más ligero)
RUN npm install -g serve@14

# Copiar solo los archivos built
COPY --from=build /app/dist ./dist

# Saludar a Render con el puerto correcto
ENV PORT=3000
EXPOSE $PORT

# Comando con variable PORT
CMD ["sh", "-c", "serve -s dist -l $PORT"]