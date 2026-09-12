import { extractText } from './extractor';
import { classifyWithOllama } from './ia';
import { DocumentJobData, DocumentJobResult } from '../domain/jobs';

const DERIVATION_EMAIL: Record<string, string> = {
  DECLARACION_JURADA_MENSUAL: 'declaraciones@sunat.gob.pe',
  DECLARACION_JURADA_ANUAL: 'declaraciones@sunat.gob.pe',
  RESOLUCION_FRACCIONAMIENTO: 'fraccionamiento@sunat.gob.pe',
  RESOLUCION_APLAZAMIENTO: 'fraccionamiento@sunat.gob.pe',
  ORDEN_PAGO_OP: 'ordenes_pago@sunat.gob.pe',
  SOLICITUD_INSCRIPCION_RUC: 'ruc_inscripciones@sunat.gob.pe',
  ACTUALIZACION_RUC: 'ruc_inscripciones@sunat.gob.pe',
  RESOLUCION_DETERMINACION_RD: 'determinaciones@sunat.gob.pe',
  SOLICITUD_APLAZAMIENTO: 'fraccionamiento@sunat.gob.pe',
  RESOLUCION_APLAZAMIENTO_FRACCIONAMIENTO: 'fraccionamiento@sunat.gob.pe',
  CARTA_PRESENTACION: 'recaudacion@sunat.gob.pe',
  NOTIFICACION_ELECTRONICA: 'notificaciones@sunat.gob.pe',
  RESOLUCION_MULTA_RM: 'fiscalizacion@sunat.gob.pe',
  REQUERIMIENTO_FISCALIZACION: 'fiscalizacion@sunat.gob.pe',
  AUDITORIA_LIBROS: 'fiscalizacion@sunat.gob.pe',
};

export async function processDocument(data: DocumentJobData): Promise<DocumentJobResult> {
  const buffer = Buffer.from(data.fileBase64, 'base64');
  const { text } = await extractText(buffer, data.mimeType, data.fileName);
  if (!text || text.trim().length < 20) {
    throw new Error('No se pudo extraer texto suficiente del documento');
  }
  const result = await classifyWithOllama(text);
  return {
    fileName: data.fileName,
    ...result,
    derivacion: DERIVATION_EMAIL[result.tipoDocumento] ?? 'sin-derivacion',
  };
}