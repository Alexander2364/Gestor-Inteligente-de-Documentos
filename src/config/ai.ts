// src/config/ai.ts
// Configuración central del proveedor de IA.
//
// Gemini (Google AI Studio) es el único proveedor remoto de la aplicación.
// El clasificador local por palabras clave (`classifyByKeywords`) es siempre
// el último recurso, así que la app nunca se queda sin clasificar.
//
// Variables de entorno:
//   GEMINI_API_KEY=...               (o GOOGLE_API_KEY)
//   GEMINI_MODEL=gemini-3.5-flash-lite
//   GEMINI_TIMEOUT_MS=45000
//   GEMINI_THINKING_LEVEL=minimal    (minimal|low|medium|high)

export const GEMINI_API_KEY = (
  process.env.GEMINI_API_KEY ??
  process.env.GOOGLE_API_KEY ??
  ''
).trim();
export const GEMINI_MODEL = process.env.GEMINI_MODEL ?? 'gemini-3.5-flash-lite';
export const GEMINI_TIMEOUT_MS = Number(process.env.GEMINI_TIMEOUT_MS ?? 45000);
export const GEMINI_API_BASE = (
  process.env.GEMINI_API_BASE ?? 'https://generativelanguage.googleapis.com/v1beta'
).replace(/\/+$/, '');

/**
 * Nivel de razonamiento de Gemini 3.x. Los tokens de "pensamiento" se cobran como
 * salida, así que `minimal` (el default de la línea Flash-Lite) es lo más económico
 * para clasificar. En los modelos 3.x no se puede apagar del todo.
 */
export const GEMINI_THINKING_LEVEL = (process.env.GEMINI_THINKING_LEVEL ?? 'minimal').toUpperCase();

export function geminiConfigured(): boolean {
  return GEMINI_API_KEY.length > 0;
}

/**
 * Indica si el proveedor remoto (Gemini) está disponible para usar.
 * El clasificador local por palabras clave se aplica siempre como fallback.
 */
export function providerAvailable(): boolean {
  return geminiConfigured();
}
