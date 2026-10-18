import { getDocumentTemplate } from '../domain/templates';
import { getTemplatePath } from '../domain/templates/index';
import { fillTemplate } from '../domain/templates/templateFiller';
import { extractTextFromPreprocessedImage, preprocessMobileImage } from './extractor';
import { classifyDocument } from './ia';
import { htmlToPdf } from './documentGenerator.service';
import { uploadFile } from './storage.service';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';

export type DocumentFlowStage =
  'preprocessing' | 'ocr' | 'classification' | 'template' | 'pdf' | 'storage' | 'database';

export class DocumentFlowError extends Error {
  constructor(
    public readonly stage: DocumentFlowStage,
    message: string,
  ) {
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

/**
 * Tope de tokens para el flujo de cámara: acota la salida del modelo (Ollama
 * `num_predict` / Gemini `maxOutputTokens`) para que no divague hasta agotar el
 * timeout en hardware sin GPU.
 */
const MOBILE_MAX_PREDICT = Number(
  process.env.IA_MOBILE_MAX_TOKENS ?? process.env.OLLAMA_MOBILE_MAX_PREDICT ?? 768,
);

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Error desconocido';
}

export async function scanMobileDocument(
  buffer: Buffer,
  mimeType: string,
): Promise<ScannedDocument> {
  let processedBuffer: Buffer;
  try {
    processedBuffer = await preprocessMobileImage(buffer);
  } catch (error) {
    throw new DocumentFlowError(
      'preprocessing',
      `No se pudo mejorar la imagen: ${getErrorMessage(error)}`,
    );
  }

  let text: string;
  try {
    text = await extractTextFromPreprocessedImage(processedBuffer);
  } catch (error) {
    throw new DocumentFlowError(
      'ocr',
      `No se pudo transcribir la imagen: ${getErrorMessage(error)}`,
    );
  }

  try {
    // Esquema compacto + tope de tokens para acotar la generación del proveedor.
    const result = await classifyDocument(text, { compact: true, maxPredict: MOBILE_MAX_PREDICT });
    return {
      tipoDocumento: result.tipoDocumento,
      confianza: result.confianza,
      datos: result.campos as Record<string, unknown>,
      resumenEjecutivo: result.resumenEjecutivo,
    };
  } catch (error) {
    throw new DocumentFlowError(
      'classification',
      `No se pudo clasificar el documento: ${getErrorMessage(error)}`,
    );
  }
}

export interface BuiltDocument {
  url: string;
  tipoDocumento: string;
  area: string;
}

/**
 * Rellena la plantilla, genera el PDF y lo sube a Storage, SIN tocar la base de
 * datos. La tabla `documents` representa el documento de ENTRADA, por lo que el
 * PDF generado (salida) nunca se registra como fila: queda en Storage y se
 * devuelve al cliente / se envía a n8n.
 */
export async function buildDocumentPdf(
  tipoDocumento: string,
  datos: Record<string, unknown>,
): Promise<BuiltDocument> {
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
    throw new DocumentFlowError(
      'template',
      `No se pudo preparar la plantilla: ${getErrorMessage(error)}`,
    );
  }

  let pdf: Buffer;
  try {
    pdf = await htmlToPdf(filledHtml);
  } catch (error) {
    throw new DocumentFlowError('pdf', `No se pudo generar el PDF: ${getErrorMessage(error)}`);
  }

  const key = `generated/${tipoDocumento}/${randomUUID()}.pdf`;
  try {
    const url = await uploadFile(pdf, key, 'application/pdf');
    return { url, tipoDocumento, area: template.area };
  } catch (error) {
    throw new DocumentFlowError(
      'storage',
      `No se pudo guardar el PDF en el bucket: ${getErrorMessage(error)}`,
    );
  }
}
