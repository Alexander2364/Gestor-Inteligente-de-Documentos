// src/services/documentReadModel.ts
//
// El informe ejecutivo no se guarda en la base de datos: se compone en el momento
// de clasificar. Para que el historial muestre el mismo informe que el flujo de
// escaneo (y también en los documentos ya procesados), aquí se reconstruye a partir
// de lo que sí está persistido: `document_analysis.document_category` y las filas
// de `extracted_metadata`.

import {
  buildExecutiveSummary,
  createExecutiveReport,
  isDocumentType,
  type InformeEjecutivo,
} from './ia';

export interface StoredReport {
  informeEjecutivo: InformeEjecutivo;
  resumenEjecutivo: string;
}

/** Valor de un campo tal como se serializó al guardarlo (JSON para los compuestos). */
function parseFieldValue(value: string): unknown {
  const trimmed = value.trim();
  const looksLikeJson =
    (trimmed.startsWith('[') && trimmed.endsWith(']')) ||
    (trimmed.startsWith('{') && trimmed.endsWith('}'));
  if (!looksLikeJson) return value;
  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
}

/** Convierte las filas de `extracted_metadata` en el mapa de campos del documento. */
export function fieldsFromMetadata(metadata: unknown): Record<string, unknown> {
  if (!Array.isArray(metadata)) return {};
  const campos: Record<string, unknown> = {};
  for (const row of metadata) {
    if (!row || typeof row !== 'object') continue;
    const { field_name: fieldName, field_value: fieldValue } = row as Record<string, unknown>;
    const name = typeof fieldName === 'string' ? fieldName.trim() : '';
    if (!name) continue;
    if (fieldValue === null || fieldValue === undefined) continue;
    const value = String(fieldValue);
    if (!value) continue;
    campos[name] = parseFieldValue(value);
  }
  return campos;
}

function firstRow(value: unknown): Record<string, unknown> | undefined {
  const row = Array.isArray(value) ? value[0] : value;
  return row && typeof row === 'object' ? (row as Record<string, unknown>) : undefined;
}

/**
 * Reconstruye el informe ejecutivo de un documento ya procesado.
 * Devuelve null si el documento no tiene una categoría válida (aún sin analizar).
 */
export function buildStoredReport(
  doc: { document_analysis?: unknown; extracted_metadata?: unknown },
  now: Date = new Date(),
): StoredReport | null {
  const tipoDocumento = firstRow(doc.document_analysis)?.document_category;
  if (!isDocumentType(tipoDocumento)) return null;

  const campos = fieldsFromMetadata(doc.extracted_metadata) as Record<string, string>;
  const resumenEjecutivo = buildExecutiveSummary(tipoDocumento, campos, now);
  return {
    informeEjecutivo: createExecutiveReport(tipoDocumento, campos, resumenEjecutivo, now),
    resumenEjecutivo,
  };
}
