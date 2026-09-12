export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'retrying';

export interface DocumentJobData {
  fileName: string;
  mimeType: string;
  fileBase64: string;
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
}