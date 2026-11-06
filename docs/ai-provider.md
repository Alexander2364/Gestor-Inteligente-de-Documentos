# Proveedor de IA (Gemini)

La clasificación y extracción de documentos usa **Gemini (Google AI Studio)** como único
proveedor remoto. Si Gemini no está configurado o falla, se aplica el clasificador local por
palabras clave (`classifyByKeywords`), de modo que el flujo nunca se queda sin resultado.

```
Gemini (Google AI Studio)  →  palabras clave (siempre disponible)
```

Punto de entrada: `classifyDocument()` en `src/services/ia.ts`. Lo usan
`src/services/document-processing.ts` (subidas) y `src/services/documentFlow.service.ts`
(escaneo con cámara). El chat RAG (`src/routes/chat.ts`) usa Gemini con streaming.

## Configuración

| Variable | Default | Descripción |
|---|---|---|
| `GEMINI_API_KEY` | — | Clave de Google AI Studio (o `GOOGLE_API_KEY`). |
| `GEMINI_MODEL` | `gemini-3.5-flash-lite` | Modelo a usar. |
| `GEMINI_TIMEOUT_MS` | `45000` | Timeout por petición. |
| `GEMINI_THINKING_LEVEL` | `minimal` | `minimal`\|`low`\|`medium`\|`high`. Menos nivel = menos tokens de salida. |
| `GEMINI_API_BASE` | `https://generativelanguage.googleapis.com/v1beta` | Base de la API REST. |
| `IA_MOBILE_MAX_TOKENS` | `768` | Tope de tokens de salida del flujo de cámara. |

Las llaves de la API viven en `src/config/ai.ts`.

## Modelo recomendado (plan gratuito)

En el plan gratuito de AI Studio los modelos de texto disponibles son `gemini-3.8-flash`,
`gemini-3.6-flash`, `gemini-3.5-flash-lite` y `gemini-3.1-flash-lite`. Para este proyecto se
elige **`gemini-3.5-flash-lite`**:

- Es la línea *Lite*: la más económica y rápida, pensada para clasificar y procesar datos.
- Su razonamiento por defecto es **`minimal`**. Los tokens de *thinking* se facturan como
  salida y en los modelos 3.x no se pueden apagar del todo: los `*-flash` arrancan en `medium`
  y añadirían cientos de tokens ocultos por documento.
- Admite *structured output* (`responseSchema`), con lo que la respuesta JSON queda garantizada
  por esquema en vez de depender de "devuelve solo JSON".

### Consumo estimado por documento

Medido sobre el prompt real (`buildCompactClassifierPrompt`):

| Texto OCR | Prompt compacto | Prompt completo |
|---|---|---|
| 0 chars | ~1.368 tok | ~1.492 tok |
| 3.000 chars (típico) | ~2.201 tok | ~2.325 tok |
| 12.000 chars (máx) | ~4.701 tok | ~4.825 tok |

Con salida compacta de un acta realista (~145 tokens) el caso típico es
**~2.2k tokens de entrada / ~0.15k de salida**. Aun en el plan de pago de `gemini-3.5-flash-lite`
($0.30 / $2.50 por millón) ronda **~$0.0012 por documento**.

> **Privacidad**: el plan gratuito de AI Studio usa el contenido para mejorar los productos de
> Google. Para documentos SUNAT sensibles hay que valorarlo; el plan de pago no entrena con el
> contenido. Detalles de cuota (RPM/TPM/RPD) en *AI Studio → Rate limits*.

## Sin IA remota

Si no hay `GEMINI_API_KEY`, `classifyDocument()` cae directamente al clasificador local por
palabras clave (menor precisión). La aplicación funciona en todo momento; la única diferencia
es la calidad de la clasificación.