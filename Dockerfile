# syntax=docker/dockerfile:1
FROM node:22-alpine AS builder

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar TODAS las dependencias (incluyendo devDependencies para compilar)
RUN npm ci

# Copiar el código fuente
COPY . .

# Compilar el proyecto a JavaScript
RUN npm run build

# ==========================================
# Etapa de producción (ligera y segura)
# ==========================================
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Chromium del sistema evita depender de una descarga de Puppeteer durante npm ci.
RUN apk add --no-cache \
	chromium \
	nss \
	freetype \
	harfbuzz \
	ca-certificates \
	ttf-freefont
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Copiar solo los archivos de dependencias
COPY package*.json ./

# Instalar SOLO dependencias de producción (más rápido y seguro)
RUN npm ci --omit=dev

# Copiar el código compilado desde la etapa de builder
COPY --from=builder /app/dist ./dist
# TypeScript no copia las plantillas HTML; se necesitan en tiempo de ejecución.
COPY --from=builder /app/src/domain/templates/*.html ./dist/domain/templates/

# Puerto por defecto de Express
EXPOSE 3000

# Comando por defecto (será sobrescrito en docker-compose)
CMD ["node", "dist/index.js"]