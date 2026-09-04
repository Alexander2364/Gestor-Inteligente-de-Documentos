// src/services/ia.ts
import { buildClassifierPrompt } from '../prompts/classifier';
import {getAreaByDocumentType}   from '../domain/sunat/areas'

// 1. Tipos - 15 tipos documento
export type SunatDocumentType = 
  | 'DECLARACION_JURADA_MENSUAL'
  | 'DECLARACION_JURADA_ANUAL'
  | 'RESOLUCION_FRACCIONAMIENTO'
  | 'RESOLUCION_APLAZAMIENTO'
  | 'ORDEN_PAGO_OP'
  | 'SOLICITUD_INSCRIPCION_RUC'
  | 'ACTUALIZACION_RUC'
  | 'RESOLUCION_DETERMINACION_RD'
  | 'RESOLUCION_MULTA_RM'
  | 'REQUERIMIENTO_FISCALIZACION'
  | 'AUDITORIA_LIBROS'
  | 'CARTA_PRESENTACION'
  | 'NOTIFICACION_ELECTRONICA'
  | 'ACTUALIZACION_RUC';

// 2. Resultado clasificación
export interface ClassificationResult {
  tipoDocumento: SunatDocumentType;
  area: string;
  confianza: number; // 0.0 - 1.0
}

// 3. Tipos válidos para validación
const VALID_TYPES: SunatDocumentType[] = [
  'DECLARACION_JURADA_MENSUAL',
  'DECLARACION_JURADA_ANUAL',
  'RESOLUCION_FRACCIONAMIENTO',
  'RESOLUCION_APLAZAMIENTO',
  'ORDEN_PAGO_OP',
  'SOLICITUD_INSCRIPCION_RUC',
  'ACTUALIZACION_RUC',
  'RESOLUCION_DETERMINACION_RD',
  'RESOLUCION_MULTA_RM',
  'REQUERIMIENTO_FISCALIZACION',
  'AUDITORIA_LIBROS',
  'CARTA_PRESENTACION',
  'NOTIFICACION_ELECTRONICA',
  'ACTUALIZACION_RUC',
];

// 4. Config desde variables de entorno
const OLLAMA_HOST = process.env.OLLAMA_HOST ?? 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? 'phi3';
const OLLAMA_TIMEOUT_MS = Number(process.env.OLLAMA_TIMEOUT_MS ?? 60000);

// 5. Función principal
export async function classifyWithOllama(text: string) {
  const prompt = buildClassifierPrompt(text);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), OLLAMA_TIMEOUT_MS);

  try {
    const response = await fetch(`${OLLAMA_HOST}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt,
        stream: false,
        format: 'json',
        options: { temperature: 0.1 }
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Ollama HTTP ${response.status}: ${errText}`);
    }

    const data = await response.json();
    const parsed = JSON.parse(data.response);

    // Validación estricta
    if (!parsed.tipoDocumento || !VALID_TYPES.includes(parsed.tipoDocumento as SunatDocumentType)) {
      throw new Error(`Tipo documento inválido devuelto por la IA: ${parsed.tipoDocumento}`);
    }

    // Confianza opcional con default 0.5
    let confianza = 0.5;
    if (typeof parsed.confianza === 'number' && parsed.confianza >= 0 && parsed.confianza <= 1) {
      confianza = parsed.confianza;
    } else if (typeof parsed.confianza === 'string') {
      const parsedConf = parseFloat(parsed.confianza);
      if (!isNaN(parsedConf) && parsedConf >= 0 && parsedConf <= 1) {
        confianza = parsedConf;
      }
    }

    // Determinar área usando la función de areas.ts
    const area = getAreaByDocumentType(parsed.tipoDocumento);

    return {
      tipoDocumento: parsed.tipoDocumento as SunatDocumentType,
      area,
      confianza
    };
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error(`Timeout: Ollama no respondió en ${OLLAMA_TIMEOUT_MS} ms`);
    }
    throw err;
  }
}