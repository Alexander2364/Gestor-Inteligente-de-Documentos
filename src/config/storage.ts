/**
 * Configuración del bucket de Supabase Storage.
 *
 * El bucket por defecto es 'DocumentosIA'. Se puede sobreescribir con la
 * variable de entorno STORAGE_BUCKET para entornos con distinto bucket.
 * Todas las referencias al bucket deben ir por aquí para evitar que el
 * valor se repita y se desincronicen.
 */

export const DEFAULT_STORAGE_BUCKET = 'DocumentosIA';

export function getStorageBucket(): string {
  return process.env.STORAGE_BUCKET ?? DEFAULT_STORAGE_BUCKET;
}
