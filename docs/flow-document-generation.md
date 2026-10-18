# Flujo de documentos (OCR + IA + generación de PDF)

Este documento describe cómo el backend procesa documentos: transcribe y clasifica con OCR/IA,
persiste el resultado en Supabase y genera el PDF rellenado en el bucket `DocumentosIA`.

## Modelo de datos (Supabase)

La base de datos tiene **4 tablas**. La tabla `documents` representa siempre el **documento de
ENTRADA** (el archivo o la captura subida); el PDF generado es una **salida** que vive en Storage
y **no** se registra como fila.

| Tabla | Rol | Columnas |
| --- | --- | --- |
| `documents` | Documento de entrada | `id`, `user_id`, `file_name`, `storage_url`, `upload_date`, `processing_status` |
| `document_analysis` | Resultado de la IA | `id`, `document_id`, `document_category`, `confidence_percentage`, `ai_summary`, `processed_at` |
| `extracted_metadata` | Campos extraídos (1 fila por campo) | `id`, `document_id`, `field_name`, `field_value`, `confidence` |
| `document_derivations` | Derivación a un área | `id`, `document_id`, `target_area`, `derivation_reason`, `status`, `created_at` |

- `document_id` de las tres tablas hijas referencia `documents.id`.
- `documents.processing_status`: `pending` / `processing` / `completed` / `failed`.
- `document_derivations.status`: el backend inserta `PENDING`; n8n lo actualiza a `NOTIFICADO`.

## Flujos

### 1. Subida de archivo (`POST /upload`)

`multipart/form-data` en el campo `file` (docx, xlsx, pdf, imágenes). Con `QUEUE_ENABLED=true`
se encola (BullMQ) y responde `202` con `jobId`; en caso contrario procesa sincrónicamente.

`processDocument`:

1. Sube el archivo de entrada a Storage y crea la fila en `documents` (`processing`).
2. OCR/transcripción → clasificación IA → extracción de campos.
3. Marca `documents` como `completed`.
4. Inserta `document_analysis`, `extracted_metadata` y `document_derivations` (`PENDING`).
5. Notifica a n8n.

### 2. Captura de cámara (`POST /upload/mobile`)

`multipart/form-data` en el campo `file`; MIME permitidos: `image/jpeg`, `image/jpg`, `image/png`,
`image/heic`, `image/heif`. Con `QUEUE_ENABLED=true` responde `202 { jobId, status: "pending" }`
y el cliente consulta `GET /upload/status/:jobId`.

`processMobileDocument` (worker):

1. Crea la fila del documento de **entrada** en `documents` (`processing`) y sube la **captura
   original** a Storage, enlazándola en `storage_url`.
2. Mejora de imagen → OCR → clasificación IA (`scanMobileDocument`).
3. Validación **no bloqueante**: si faltan campos, se registra una advertencia y el PDF se genera
   igual para revisión humana (los avisos se devuelven en `warnings`).
4. Genera el **PDF rellenado** y lo sube a Storage (`buildDocumentPdf`). No se registra en `documents`.
5. Marca el documento de entrada como `completed`.
6. Inserta `document_analysis`, `extracted_metadata` y `document_derivations` (`PENDING`).
7. Notifica a n8n incluyendo `documentId`, `pdfUrl`, `area` y `campos`.

### 3. Documentos entrantes vía n8n / correo

n8n (o cualquier integración) inserta la fila en `documents` con `processing_status = "pending"`.
Luego:

- `POST /documents/process-pending` con `{ documentId }` procesa uno (`processDocumentById`).
- `POST /documents/process-pending` sin `documentId` procesa todos los `pending`
  (`processAllPendingDocuments`).

Ambos dejan el mismo rastro: `document_analysis` + `extracted_metadata` + `document_derivations` (`PENDING`).

## Endpoints

| Método | Ruta | Descripción |
| --- | --- | --- |
| `POST` | `/upload` | Sube un archivo (docx/xlsx/pdf/imagen) |
| `POST` | `/upload/mobile` | Sube una captura de cámara |
| `GET` | `/upload/status/:jobId` | Estado de un job de la cola |
| `GET` | `/documents` | Lista documentos con su análisis, metadatos y derivaciones |
| `GET` | `/documents/search?q=` | Busca documentos por `file_name` |
| `GET` | `/documents/:id` | Detalle de un documento |
| `POST` | `/documents/process-pending` | Procesa documentos `pending` |
| `GET` | `/template/:tipoDocumento` | Devuelve la definición de una plantilla |
| `POST` | `/generate-document` | Genera el PDF a partir de `{ tipoDocumento, datos }` (sin persistir) |
| `POST` | `/scan-and-generate` | Atajo síncrono: ejecuta el flujo de cámara sobre una imagen |
| `POST` | `/chat` | Consulta en lenguaje natural sobre los documentos |

### `POST /generate-document`

Genera y sube el PDF a partir de datos ya extraídos. **No** escribe en la base de datos
(el PDF es una salida). Respuesta `201`:

```json
{
  "url": "generated/ACTA_INMOVILIZACION/6b2c5e32-8ec7-4ef8-a2e4-17a7202bde71.pdf",
  "tipoDocumento": "ACTA_INMOVILIZACION",
  "area": "Prevención del Contrabando"
}
```

### `POST /scan-and-generate`

Atajo síncrono equivalente a `/upload/mobile` (mismo `processMobileDocument`): registra el
documento de entrada, crea análisis/metadatos/derivación y genera el PDF. Devuelve el resultado
del flujo de cámara (`tipoDocumento`, `confianza`, `campos`, `resumenEjecutivo`, `pdfUrl`,
`documentId`, `warnings`).

## Storage

Bucket público `DocumentosIA`:

- Documentos de entrada: `<documentId>.<ext>`.
- PDFs generados: `generated/<tipoDocumento>/<uuid>.pdf` (salida, no registrada en `documents`).

El backend usa `SUPABASE_SECRET_KEY` solo en el servidor para subir archivos y genera URLs
públicas con `getPublicUrl`.

## Variables de entorno

```dotenv
PORT=3000
FRONTEND_URL=http://localhost:5173
# IA: Gemini (Google AI Studio) con respaldo en Ollama
IA_PROVIDER=auto
GEMINI_API_KEY=tu_api_key_de_ai_studio
GEMINI_MODEL=gemini-3.5-flash-lite
GEMINI_TIMEOUT_MS=45000
GEMINI_THINKING_LEVEL=minimal
OLLAMA_FALLBACK=true
# Ollama (respaldo local)
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=llama3.2:3b
OLLAMA_TIMEOUT_MS=180000
IA_MOBILE_MAX_TOKENS=768
QUEUE_ENABLED=false
REDIS_URL=redis://127.0.0.1:6379
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_PUBLISHABLE_KEY=tu_publishable_key
SUPABASE_SECRET_KEY=tu_service_role_key
```

La clasificación usa una **cadena de proveedores**: Gemini → Ollama → clasificador local por
palabras clave. `IA_PROVIDER` controla el orden (`gemini`, `ollama` o `auto`; en `auto` se usa
Gemini si hay `GEMINI_API_KEY`, si no Ollama). `OLLAMA_FALLBACK=false` desactiva el respaldo a
Ollama. Detalles en [`ai-provider.md`](./ai-provider.md).

`OLLAMA_HOST` y `OLLAMA_MODEL` solo son obligatorias si Ollama es el proveedor principal
(`IA_PROVIDER=ollama`, o `auto` sin clave de Gemini). `GEMINI_TIMEOUT_MS` acota la llamada a
Gemini y `IA_MOBILE_MAX_TOKENS` la salida del flujo de cámara.

## Errores comunes

- **`Bucket not found`**: el bucket debe llamarse exactamente `DocumentosIA` y ser público.
- **`Plantilla no encontrada`** (`etapa: "template"`): el `tipoDocumento` no tiene plantilla;
  usa el valor exacto devuelto por el escaneo (p. ej. `ACTA_INMOVILIZACION`).
- **Puppeteer no inicia Chromium**: instala el navegador (`npx puppeteer browsers install chrome`)
  y las dependencias del sistema en el contenedor del backend.
- **Ollama no responde**: verifica `OLLAMA_HOST`, que el modelo esté descargado y que el backend
  pueda alcanzarlo desde Docker (`docker compose logs -f backend-api ollama`).
- **Gemini falla (401/403)**: revisa `GEMINI_API_KEY`; si `IA_PROVIDER=gemini` la clave es
  obligatoria. Un `429` indica cuota del plan gratuito agotada; sin clave/Gemini se usa Ollama.
- **Clasificación con el fallback local**: aparece un `[IA] Proveedor ... falló` en los logs;
  revisa la cuota de Gemini o la disponibilidad de Ollama. Ver [`ai-provider.md`](./ai-provider.md).
