import { getDocumentTemplate } from '../domain/templates';
import { getTemplatePath } from '../domain/templates/index';
import { fillTemplate } from '../domain/templates/templateFiller';
import { extractTextFromPreprocessedImage, preprocessMobileImage } from './extractor';
import { classifyWithOllama } from './ia';
import { htmlToPdf } from './documentGenerator.service';
import { uploadFile } from './storage.service';
import { saveDocumentoGenerado } from './database.service';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';

export type DocumentFlowStage = 'preprocessing' | 'ocr' | 'classification' | 'template' | 'pdf' | 'storage' | 'database';

export class DocumentFlowError extends Error {
  constructor(public readonly stage: DocumentFlowStage, message: string) {
    super(message);
    this.name = 'DocumentFlowError';
  }
}

export interface ScannedDocument {
  tipoDocumento: string;
  confianza: number;
  datos: Record<string, unknown>;
  resumenEjecutivo: string;
}

export interface GeneratedDocument {
  url: string;
  documentoId: string;
  tipoDocumento: string;
}

/**
 * Tope de tokens para el flujo de cámara. En hardware sin GPU (~2 tok/s) acota el
 * peor caso a ~6 min, por debajo del timeout de Ollama, y evita que el modelo
 * divague hasta agotar los 10 minutos.
 */
const MOBILE_MAX_PREDICT = Number(process.env.OLLAMA_MOBILE_MAX_PREDICT ?? 768);

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Error desconocido';
}

export async function scanMobileDocument(buffer: Buffer, mimeType: string): Promise<ScannedDocument> {
  let processedBuffer: Buffer;
  try {
    processedBuffer = await preprocessMobileImage(buffer);
  } catch (error) {
    throw new DocumentFlowError('preprocessing', `No se pudo mejorar la imagen: ${getErrorMessage(error)}`);
  }

  let text: string;
  try {
    text = await extractTextFromPreprocessedImage(processedBuffer);
  } catch (error) {
    throw new DocumentFlowError('ocr', `No se pudo transcribir la imagen: ${getErrorMessage(error)}`);
  }

  try {
    // Esquema compacto + tope de tokens para que el modelo termine a tiempo en CPU.
    const result = await classifyWithOllama(text, { compact: true, maxPredict: MOBILE_MAX_PREDICT });
    return {
      tipoDocumento: result.tipoDocumento,
      confianza: result.confianza,
      datos: result.campos as Record<string, unknown>,
      resumenEjecutivo: result.resumenEjecutivo,
    };
  } catch (error) {
    throw new DocumentFlowError('classification', `No se pudo clasificar el documento: ${getErrorMessage(error)}`);
  }
}

export async function generateDocument(
  tipoDocumento: string,
  datos: Record<string, unknown>,
): Promise<GeneratedDocument> {
  const templatePath = getTemplatePath(tipoDocumento);
  const template = getDocumentTemplate(tipoDocumento);
  if (!templatePath || !template) {
    throw new DocumentFlowError('template', 'Plantilla no encontrada para el tipo de documento');
  }

  let filledHtml: string;
  try {
    const html = await readFile(templatePath, 'utf8');
    filledHtml = fillTemplate(html, datos);
  } catch (error) {
    throw new DocumentFlowError('template', `No se pudo preparar la plantilla: ${getErrorMessage(error)}`);
  }

  let pdf: Buffer;
  try {
    pdf = await htmlToPdf(filledHtml);
  } catch (error) {
    throw new DocumentFlowError('pdf', `No se pudo generar el PDF: ${getErrorMessage(error)}`);
  }

  const key = `generated/${tipoDocumento}/${randomUUID()}.pdf`;
  let url: string;
  try {
    url = await uploadFile(pdf, key, 'application/pdf');
  } catch (error) {
    throw new DocumentFlowError('storage', `No se pudo guardar el PDF en el bucket: ${getErrorMessage(error)}`);
  }

  try {
    const document = await saveDocumentoGenerado(tipoDocumento, template.area, datos, url);
    return { url, documentoId: document.id, tipoDocumento };
  } catch (error) {
    throw new DocumentFlowError('database', `No se pudo registrar el documento: ${getErrorMessage(error)}`);
  }
}