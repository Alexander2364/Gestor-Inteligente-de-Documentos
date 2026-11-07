/**
 * Detección de intención para el chat documental.
 *
 * El chat usa los documentos como contexto para responder casi cualquier
 * pregunta, pero las tarjetas de descarga solo deben mostrarse cuando el
 * usuario pide explícitamente ver o listar documentos. Mezclar ambas cosas
 * hacía que cada respuesta incluyera el historial completo de archivos.
 */

/** Normaliza el texto para comparar sin acentos, mayúsculas ni signos de apertura. */
export function normalizeIntentText(text: string): string {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/^[^a-z0-9]+/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Verbos que expresan una petición de listado. Se combinan con el plural
// "documentos/archivos" para no confundirlos con preguntas sobre el contenido
// de un documento concreto ("¿qué dice el documento?").
const LIST_VERBS =
  'lista|listar|listado|muestra|muestrame|mostrar|ensena|ensenar|ver|visualizar|dame|pasame|comparte|compartir';

const LIST_NOUNS = 'documentos|archivos';

/**
 * Indica si el usuario pidió ver/listar documentos.
 *
 * `explicit` permite que un botón de la interfaz fuerce la intención sin
 * depender de que el texto libre coincida con los patrones.
 */
export function wantsDocumentList(message: string, explicit?: unknown): boolean {
  if (explicit === true) return true;

  const text = normalizeIntentText(message);
  if (!text) return false;

  // "documentos", "los documentos", "todos los archivos".
  if (/^(?:los\s+|todos\s+los\s+)?(?:documentos|archivos)$/.test(text)) return true;

  // "historial", "ver historial completo".
  if (/\bhistorial\b/.test(text)) return true;

  // "¿qué documentos hay?", "¿cuántos archivos tengo?", "¿cuáles son los documentos?".
  if (/\b(?:que|cuantos|cuales)\s+(?:son\s+)?(?:los\s+)?(?:documentos|archivos)\b/.test(text)) {
    return true;
  }

  // "muéstrame los documentos", "listar archivos", "quiero ver documentos".
  if (new RegExp(`\\b(?:${LIST_VERBS})\\b[\\s\\S]{0,40}\\b(?:${LIST_NOUNS})\\b`).test(text)) {
    return true;
  }

  // "documentos subidos", "archivos registrados", "documentos disponibles".
  if (
    /\b(?:documentos|archivos)\s+(?:subidos|registrados|cargados|disponibles|guardados)\b/.test(
      text,
    )
  ) {
    return true;
  }

  // "busca el documento del RUC", "encuentra el archivo".
  if (
    /\b(?:busca|buscar|encuentra|encontrar|localiza|localizar)\b[\s\S]{0,40}\b(?:documento|documentos|archivo|archivos)\b/.test(
      text,
    )
  ) {
    return true;
  }

  // "documentos en el historial", "archivos del sistema".
  if (
    /\b(?:documentos|archivos)\s+(?:en|del)\s+(?:el\s+)?(?:historial|sistema|supabase)\b/.test(text)
  ) {
    return true;
  }

  return false;
}
