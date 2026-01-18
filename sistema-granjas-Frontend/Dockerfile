FROM node:20-alpine AS builder

WORKDIR /app

# 1. Copiar package.json
COPY package.json ./

# 2. Instalar EXPLÍCITAMENTE las dependencias problemáticas PRIMERO
RUN npm install --legacy-peer-deps react@^18 react-dom@^18
RUN npm install --legacy-peer-deps @headlessui/react@^1 @heroicons/react@^2

# 3. Instalar el resto
RUN npm install --legacy-peer-deps

# 4. Copiar todo
COPY . .

# 5. Variables
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

# 6. Verificar que está instalado
RUN ls -la node_modules/@headlessui/react/

# 7. Build
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