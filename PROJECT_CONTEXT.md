# Contexto del Proyecto: Gestor Inteligente de Documentos (SUNAT)

## 1. Objetivo y Alcance
- **Propósito**: Clasificar, extraer datos, resumir y derivar documentos automáticamente a las áreas correctas (Recaudación, Fiscalización, PRICOS, Jurídica, Cobranza Coactiva) usando IA, RPA y automatización.
- **Stack Tecnológico**: 
  - Frontend: React + Vite + TypeScript + Tailwind CSS.
  - Backend: Node.js + Express + TypeScript.
  - IA Local: Ollama (qwen2.5-coder:14b, deepseek-r1:14b).
  - OCR: Tesseract (con preprocesamiento pendiente).
  - Base de Datos: PostgreSQL.
  - Infraestructura: Docker (pendiente), Azure VM, GitHub Actions.

## 2. Estado Actual (Avance 1 - COMPLETADO)
- Backend funcional con endpoints `/health` y `/upload`.
- Extracción básica de texto de PDF y DOCX.
- Conexión real con Ollama para clasificación de 15 tipos de documentos SUNAT.
- Frontend en React con pantallas de subida, procesamiento, resultados, historial y error.
- Repositorio GitHub con ramas `main` y `develop` protegidas.

## 3. Pendientes Inmediatos (Avance 2 - Semanas 5-6)
1. **Preprocesamiento de imágenes**: Implementar `sharp` para contraste y binarización antes de pasar a Tesseract OCR.
2. **Parsers nativos**: Integrar `mammoth` (para DOCX) y `xlsx` (para Excel) en lugar de depender únicamente de OCR.
3. **Sistema de colas**: Implementar BullMQ + Redis para manejar picos de peticiones a Ollama y reintentos de correos (Nodemailer).
4. **Contenerización**: Dockerizar el backend y frontend.
5. **Pruebas**: Configurar Vitest (unitarias), Supertest (integración) y Playwright (E2E).

## 4. Reglas de Interacción con Aider
- Trabajar siempre en ramas `feature/` nuevas, nunca directamente en `develop` o `main`.
- Usar modo Architect (`/ask`) para planificación antes de ejecutar cambios.
- Revisar rigurosamente el código generado, especialmente en TypeScript estricto (verificar instancias de `Error`, variables no asignadas, etc.).
- Mantener el grafo de conocimiento actualizado (se usará Graphify hook en Git).