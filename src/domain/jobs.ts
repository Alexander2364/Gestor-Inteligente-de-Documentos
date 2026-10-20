export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'retrying';

/** Nombre del job para documentos subidos como archivo (flujo web). */
export const FILE_JOB_NAME = 'process-document';

/** Nombre del job para capturas de cámara (flujo móvil). */
export const MOBILE_JOB_NAME = 'process-mobile-document';

export interface DocumentJobData {
  fileName: string;
  mimeType: string;
  fileBase64: string;
  /** Origen del documento: archivo subido o captura de cámara móvil. */
  source?: 'file' | 'mobile';
}

export interface DocumentJobResult {
  fileName: string;
  tipoDocumento: string;
  area: string;
  confianza: number;
  campos: Record<string, string>;
  informeEjecutivo: Record<string, unknown>;
  resumenEjecutivo: string;
  derivacion: string;
  storageUrl?: string | null;
}

export interface MobileDocumentJobResult {
  tipoDocumento: string;
  confianza: number;
  campos: Record<string, unknown>;
  resumenEjecutivo: string;
  /**
   * Informe ejecutivo compuesto al clasificar (se reconstruye en cada lectura,
   * no se guarda). La pantalla que sigue al escaneo lo muestra tal cual.
   */
  informeEjecutivo: Record<string, unknown>;
  templateSugerido: string;
  pdfUrl: string;
  documentId: string;
  /** Advertencias de validación (el PDF se genera igual, para revisión humana). */
  warnings?: string[];
}

export type AnyDocumentJobResult = DocumentJobResult | MobileDocumentJobResult;
