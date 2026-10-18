// src/config/ai.ts
// Configuración central del proveedor de IA.
//
// Gemini (Google AI Studio) es el proveedor principal y Ollama queda como
// respaldo. El clasificador local por palabras clave (`classifyByKeywords`) es
// siempre el último recurso, así que la app nunca se queda sin clasificar.
//
// Variables de entorno:
//   IA_PROVIDER=gemini|ollama|auto   (auto: Gemini si hay clave, si no Ollama)
//   GEMINI_API_KEY=...               (o GOOGLE_API_KEY)
//   GEMINI_MODEL=gemini-3.5-flash-lite
//   GEMINI_TIMEOUT_MS=45000
//   GEMINI_THINKING_LEVEL=minimal    (minimal|low|medium|high)
//   OLLAMA_FALLBACK=true             (usar Ollama si Gemini falla)

export type AiProvider = 'gemini' | 'ollama' | 'auto';

function normalizeProvider(raw: string | undefined): AiProvider {
  const value = (raw ?? 'auto').trim().toLowerCase();
  if (value === 'gemini' || value === 'google' || value === 'aistudio') return 'gemini';
  if (value === 'ollama') return 'ollama';
  return 'auto';
}

function boolFromEnv(raw: string | undefined, fallback: boolean): boolean {
  if (raw === undefined || raw.trim() === '') return fallback;
  return !['false', '0', 'no', 'off'].includes(raw.trim().toLowerCase());
}

/** gemini (forzar) | ollama (forzar) | auto (Gemini si hay clave, si no Ollama). */
export const AI_PROVIDER: AiProvider = normalizeProvider(process.env.IA_PROVIDER);

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

export const OLLAMA_HOST = process.env.OLLAMA_HOST ?? 'http://localhost:11434';
export const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? 'llama3.2:3b';
export const OLLAMA_TIMEOUT_MS = Number(process.env.OLLAMA_TIMEOUT_MS ?? 180000);
/** Si Gemini falla, permitir que se intente Ollama antes del clasificador local. */
export const OLLAMA_FALLBACK = boolFromEnv(process.env.OLLAMA_FALLBACK, true);

export function geminiConfigured(): boolean {
  return GEMINI_API_KEY.length > 0;
}

/**
 * Orden de proveedores remotos a intentar. El clasificador local por palabras
 * clave se aplica después (fuera de esta cadena), por eso la lista puede quedar vacía.
 */
export function providerChain(): Array<'gemini' | 'ollama'> {
  if (AI_PROVIDER === 'ollama') return ['ollama'];
  if (AI_PROVIDER === 'gemini') {
    if (!geminiConfigured()) return OLLAMA_FALLBACK ? ['ollama'] : [];
    return OLLAMA_FALLBACK ? ['gemini', 'ollama'] : ['gemini'];
  }
  // auto
  return geminiConfigured() ? ['gemini', 'ollama'] : ['ollama'];
}
