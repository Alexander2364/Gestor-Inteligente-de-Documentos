# Etapa 1: Builder
FROM node:20-alpine AS builder

# Configurar directorio de trabajo
WORKDIR /app

# Instalar dependencias
COPY package.json ./
RUN npm ci

# Copiar código fuente
COPY . .

# Construir el proyecto
RUN npm run build

# Etapa 2: Runner
FROM node:20-alpine AS runner

# Configurar directorio de trabajo
WORKDIR /app

# Instalar dependencias de producción
COPY package.json ./
RUN npm ci --omit=dev

# Copiar código compilado de la etapa builder
COPY --from=builder ./dist/ .

# Expón puerto 3000
EXPOSE 3000

# No definimos CMD/ENTRYPOINT aquí, se definirán en docker-compose.yml
