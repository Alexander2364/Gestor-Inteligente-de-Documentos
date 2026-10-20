import http from 'node:http';
import https from 'node:https';
import { buildCompactClassifierPrompt, buildClassifierPrompt } from '../prompts/classifier';
import {
  CLASSIFIER_TYPE_NAMES,
  COMPACT_RESPONSE_SCHEMA,
  FULL_RESPONSE_SCHEMA,
  URGENCIA_LEVELS,
} from '../prompts/classifierSchema';
import {
  GEMINI_API_BASE,
  GEMINI_API_KEY,
  GEMINI_MODEL,
  GEMINI_THINKING_LEVEL,
  GEMINI_TIMEOUT_MS,
  OLLAMA_HOST,
  OLLAMA_MODEL,
  OLLAMA_TIMEOUT_MS,
  providerChain,
} from '../config/ai';
import { getAreaByDocumentType } from '../domain/sunat/areas';

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
  | 'SOLICITUD_APLAZAMIENTO'
  | 'RESOLUCION_APLAZAMIENTO_FRACCIONAMIENTO'
  | 'ACTA_INMOVILIZACION'
  | 'ACTA_INCAUTACION';

/** Nivel de urgencia del informe ejecutivo (ver `URGENCIA_LEVELS`). */
export type UrgenciaInforme = (typeof URGENCIA_LEVELS)[number];

export interface InformeEjecutivo {
  tipoInforme: string;
  contexto: string;
  identificacion: Record<string, string>;
  datosClave: Record<string, unknown>;
  analisisRiesgo?: Record<string, unknown>;
  estado?: string;
  analisisCumplimiento?: Record<string, unknown>;
  urgencia?: UrgenciaInforme;
  alertas?: string[];
  accionesRequeridas: string[];
  resumenEjecutivo: string;
  [key: string]: unknown;
}

export interface ClassificationResult {
  tipoDocumento: SunatDocumentType;
  area: string;
  confianza: number;
  campos: Record<string, string>;
  informeEjecutivo: InformeEjecutivo;
  resumenEjecutivo: string;
}

// La configuración de proveedores (Gemini/Ollama) vive en `src/config/ai.ts`.

const VALID_TYPES: SunatDocumentType[] = [...CLASSIFIER_TYPE_NAMES] as SunatDocumentType[];

export function isDocumentType(value: unknown): value is SunatDocumentType {
  return typeof value === 'string' && VALID_TYPES.includes(value as SunatDocumentType);
}

export function detectActaType(text: string): 'ACTA_INMOVILIZACION' | 'ACTA_INCAUTACION' | null {
  const normalized = text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleUpperCase('es');

  const checked01 =
    /\[\s*x\s*\]\s*01\b/i.test(normalized) || /\b01\b[^\n]{0,60}\[\s*x\s*\]/i.test(normalized);
  const checked02 =
    /\[\s*x\s*\]\s*02\b/i.test(normalized) || /\b02\b[^\n]{0,60}\[\s*x\s*\]/i.test(normalized);

  if (checked01 !== checked02) {
    return checked01 ? 'ACTA_INMOVILIZACION' : 'ACTA_INCAUTACION';
  }

  const hasInmovilizacionContext = /\bcustodia\b|\bretenida\b/i.test(normalized);
  const hasIncautacionContext = /\bcomiso\b|\bincautacion\b/i.test(normalized);

  if (hasInmovilizacionContext !== hasIncautacionContext) {
    return hasInmovilizacionContext ? 'ACTA_INMOVILIZACION' : 'ACTA_INCAUTACION';
  }

  return null;
}

/**
 * Detecta el formulario de acta por su título dual ("ACTA DE INMOVILIZACIÓN -
 * INCAUTACIÓN") cuando la casilla marcada no es legible por OCR. Devuelve el tipo
 * primario del formulario (INMOVILIZACIÓN). Sin esto, el fallback local clasificaba
 * el acta como otro documento (p. ej. REQUERIMIENTO_FISCALIZACION por la palabra
 * "FISCALIZACIÓN" del encabezado) y no extraía ninguno de sus campos.
 */
function detectActaForm(text: string): 'ACTA_INMOVILIZACION' | 'ACTA_INCAUTACION' | null {
  const normalized = text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleUpperCase('es');
  if (!/\bACTA\b/.test(normalized)) return null;

  const hasInmovilizacion = /INMOVILIZACION/.test(normalized);
  const hasIncautacion = /INCAUTACION/.test(normalized);
  if (!hasInmovilizacion && !hasIncautacion) return null;
  if (hasInmovilizacion && !hasIncautacion) return 'ACTA_INMOVILIZACION';
  if (hasIncautacion && !hasInmovilizacion) return 'ACTA_INCAUTACION';
  // Título dual del formulario: usa el tipo primario.
  return 'ACTA_INMOVILIZACION';
}

/**
 * Normaliza el número de acta: une guiones separados por espacios
 * ("235 - 0105 - 2020" → "235-0105-2020") y recorta separadores sobrantes.
 */
function normalizeActaNumber(value: string): string {
  return value
    .replace(/\s*[-–—]\s*/g, '-')
    .replace(/^[\s:.#-]+/, '')
    .replace(/[\s:.#-]+$/, '')
    .trim();
}

/**
 * Normaliza una fecha a un formato que `validateActa` acepte: convierte los
 * separadores con punto (`04.03.2020`) o guion (`04-03-2020`) a barra
 * (`04/03/2020`) y deja intacto el formato ISO (`2020-03-04`).
 */
function normalizeDate(value: string): string {
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  return trimmed.replace(/[.-]/g, '/');
}

/**
 * Comprueba que una fecha (ya normalizada) sea `YYYY-MM-DD` o `DD/MM/YYYY` y
 * corresponda a una fecha real. Sirve para descartar el ruido que el modelo local
 * inventa en los campos de fecha (p. ej. "07/VEN/2020").
 */
function isPlausibleDate(value: string): boolean {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$|^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return false;
  const year = Number(match[1] ?? match[6]);
  const month = Number(match[2] ?? match[5]);
  const day = Number(match[3] ?? match[4]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

/**
 * Etiquetas de sección del formulario de acta. Cuando el OCR devuelve una de
 * ellas como si fuera el valor de un campo (p. ej. `DOMICILIO: RUC`), no es un
 * dato: es el título de la sección siguiente.
 */
const ACTA_LABELS = new Set([
  'APELLIDOS Y NOMBRES',
  'NOMBRES Y APELLIDOS',
  'CONSIGNATARIO',
  'INTERVENIDO',
  'DOMICILIO',
  'DOMICILIO FISCAL',
  'RUC',
  'RAZON SOCIAL',
  'EMPRESA TRANSPORTISTA',
  'TIPO DE VEHICULO',
  'MATRICULA',
  'MANIFIESTO',
  'PROCEDENCIA',
  'DESTINO',
  'DOCUMENTO DE TRANSPORTE',
  'REGIMEN U OPERACION ADUANERA',
  'DECLARACION',
  'NUMERO DE DECLARACION',
  'TIPO DE DOCUMENTO',
  'NUMERO DE DOCUMENTO',
  'FUNDAMENTO DE HECHO',
  'FUNDAMENTO DE DERECHO',
  'BIENES',
  'MERCANCIAS',
  'PESO',
  'LUGAR DE CUSTODIA',
  'OBSERVACIONES',
  'FECHA',
  'HORA',
  'LUGAR DE ACCION DE CONTROL',
  'TIPO DE ACCION',
]);

function deaccentUpper(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleUpperCase('es')
    .replace(/[.,:;#*?°º()[\]]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Descarta el ruido que el OCR devuelve como valor de un campo de acta: títulos de
 * sección ("DOMICILIO", "MATRICULA") y cadenas sin texto real, como "2 Z" o "1.".
 * Sin esto, esos restos acababan en campos como "Apellidos y Nombres".
 */
function isActaNoise(value: string): boolean {
  const normalized = deaccentUpper(value);
  if (!normalized) return true;
  if (ACTA_LABELS.has(normalized)) return true;
  for (const label of ACTA_LABELS) {
    if (normalized.startsWith(`${label} `)) return true;
  }
  // Sin ninguna palabra de dos letras o más ("2 Z", "--", "1.").
  if (!/\p{L}{2,}/u.test(normalized)) return true;
  // Una sola letra suelta ("Z", "A B", "X Z").
  if (/^[A-Z](\s+[A-Z])*$/.test(normalized)) return true;
  return false;
}

/** ¿El valor parece el nombre de una persona o una razón social? */
function isPersonNameValue(value: string): boolean {
  return !isActaNoise(value) && value.replace(/[^\p{L}]/gu, '').length >= 3;
}

/** ¿El valor parece un domicilio o una dirección? */
function isAddressValue(value: string): boolean {
  return !isActaNoise(value) && value.replace(/[^\p{L}]/gu, '').length >= 4;
}

/** ¿El valor parece una matrícula o placa de vehículo? */
function isPlateValue(value: string): boolean {
  if (isActaNoise(value)) return false;
  const compact = value.replace(/[^a-z0-9]/gi, '');
  return compact.length >= 4 && compact.length <= 12;
}

/** ¿El texto tiene contenido real (al menos una palabra de tres letras)? */
function hasTextualContent(value: string): boolean {
  return /\p{L}{3,}/u.test(value) && !isActaNoise(value);
}

/**
 * Deja un bloque de texto libre en una sola línea y acotado. El OCR a veces pega
 * media página al campo "Fundamento de hecho" y el informe no debe arrastrarla.
 */
function compactLongText(value: string, maxLength = 240): string {
  const singleLine = value.replace(/\s+/g, ' ').trim();
  if (singleLine.length <= maxLength) return singleLine;
  const cut = singleLine.slice(0, maxLength);
  const lastBreak = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('; '));
  return `${(lastBreak > 80 ? cut.slice(0, lastBreak) : cut).trim()}…`;
}

/**
 * Campos de texto de un acta que no deben mostrarse si traen ruido del OCR. Se usan
 * tanto al extraer como al componer el informe, para que un valor como "2 Z" (que ya
 * quedó guardado en documentos antiguos) no acabe presentado como "Apellidos y Nombres".
 */
const ACTA_TEXT_VALIDATORS: Record<string, (value: string) => boolean> = {
  consignatario: isPersonNameValue,
  apellidosNombres: isPersonNameValue,
  razonSocial: isPersonNameValue,
  domicilio: isAddressValue,
  matricula: isPlateValue,
};

/** ¿El valor sirve para mostrarlo en el informe? En las actas, descarta ruido de OCR. */
function isUsableValue(tipoDocumento: SunatDocumentType, key: string, value: unknown): boolean {
  if (!isActaType(tipoDocumento)) return true;
  const validator = ACTA_TEXT_VALIDATORS[key];
  if (!validator || typeof value !== 'string') return true;
  return validator(value);
}

/** Primer valor de acta que es un texto utilizable (descarta el ruido del OCR). */
function firstUsableActaValue(campos: Record<string, any>, keys: string[]): string {
  for (const key of keys) {
    const value = campos[key];
    if (value === undefined || value === null || value === '') continue;
    const validator = ACTA_TEXT_VALIDATORS[key];
    if (typeof value === 'string' && validator && !validator(value)) continue;
    return String(value);
  }
  return '';
}

export function extractActaFields(text: string): Record<string, any> {
  const read = (patterns: RegExp[]): string => {
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match?.[1]?.trim()) return match[1].trim();
    }
    return '';
  };

  /**
   * Lee un campo descartando el ruido del OCR. Si el texto que sigue a la etiqueta
   * en la misma línea no es un valor plausible (el OCR partió la etiqueta y el
   * valor, o devolvió "2 Z"), busca en las líneas siguientes a la etiqueta.
   */
  const readField = (
    labels: string[],
    accept: (value: string) => boolean,
    normalize: (value: string) => string = (value) => value,
  ): string => {
    const prepare = (value: string) => normalize(value.replace(/\s+/g, ' ').trim());
    const firstAccepted = (values: string[]) => values.map(prepare).find(accept);

    for (const label of labels) {
      const match = text.match(new RegExp(`${label}[^\\S\\n]*[:#-]?[^\\S\\n]*([^\\n]+)`, 'i'));
      const accepted = match?.[1] ? firstAccepted([match[1]]) : undefined;
      if (accepted) return accepted;
    }
    for (const label of labels) {
      const block = text.match(new RegExp(`${label}[^\\n]*\\n([\\s\\S]{0,240})`, 'i'))?.[1];
      if (!block) continue;
      const lines = block
        .split(/\r?\n/)
        .filter((line) => line.trim())
        .slice(0, 3);
      const accepted = firstAccepted(lines);
      if (accepted) return accepted;
    }
    return '';
  };

  /**
   * Lee un bloque de texto libre (fundamento de hecho/derecho, observaciones) y lo
   * deja en una sola línea, acotado y sin ruido: el OCR suele pegar media página
   * detrás de la etiqueta y el informe no debe arrastrarla.
   */
  const readLongText = (patterns: RegExp[]): string => {
    const raw = read(patterns);
    if (!raw) return '';
    const value = compactLongText(raw);
    return hasTextualContent(value) ? value : '';
  };

  const type = detectActaType(text) ?? detectActaForm(text);
  const fields: Record<string, any> = {
    numeroActa: normalizeActaNumber(
      read([
        /\b(?:n[uú]mero|nro\.?|n[°º])\s*(?:de\s*)?acta\s*[:#-]?\s*([^\n,;]+)/i,
        /\bacta\s*(?:n[uú]mero|nro\.?|n[°º])\s*[:#-]?\s*([^\n,;]+)/i,
        // Título del acta: "ACTA DE INMOVILIZACIÓN - INCAUTACIÓN N° 235-0105-2020 - N° 000067".
        /\bacta\b[\s\S]{0,120}?\bn\s*[°ºo0*]?\s*\.?\s*[:#-]?\s*(\d[\d\s]*(?:\s*[-–—]\s*\d{1,8}){0,4})/i,
      ]),
    ),
    tipoAccion:
      type === 'ACTA_INMOVILIZACION'
        ? 'INMOVILIZACION'
        : type === 'ACTA_INCAUTACION'
          ? 'INCAUTACION'
          : '',
    fecha: normalizeDate(
      read([
        /\bfecha\s*(?:de\s*acta)?\s*[:#-]?\s*(\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4})/i,
        /\b(\d{1,2}[/\-.]\d{1,2}[/\-.]\d{4})\b/,
      ]),
    ),
    hora: read([/\bhora\s*[:#-]?\s*(\d{1,2}:\d{2}(?::\d{2})?\s*(?:a\.?\s*m\.?|p\.?\s*m\.?)?)/i]),
    numeroAccionControl: read([
      /\b(?:n[uú]mero|nro\.?|n[°º])\s*(?:de\s*)?(?:acci[oó]n|control)\s*[:#-]?\s*([^\n,;]+)/i,
    ]),
    lugarAccionControl: read([
      /\blugar\s+(?:de\s+la\s+)?acci[oó]n\s+(?:de\s+control)?\s*[:#-]?\s*([^\n]+)/i,
    ]),
    apellidosNombres: readField(
      ['\\b(?:apellidos\\s+y\\s+nombres|nombres\\s+y\\s+apellidos)\\b'],
      isPersonNameValue,
    ),
    consignatario: readField(['\\bconsignatario\\b'], isPersonNameValue),
    razonSocial: read([/\b(?:raz[oó]n\s+social|empresa)\s*[:#-]?\s*([^\n]+)/i]),
    ruc: read([/\bruc\s*[:#-]?\s*(\d{11})/i]),
    domicilio: readField(['\\bdomicilio\\b(?!\\s+fiscal)'], isAddressValue),
    empresaTransportista: read([/\bempresa\s+transportista\s*[:#-]?\s*([^\n]+)/i]),
    tipoVehiculo: read([/\btipo\s+de\s+veh[ií]culo\s*[:#-]?\s*([^\n]+)/i]),
    matricula: readField(['\\bmatr[ií]cula\\b'], isPlateValue, (value) =>
      value.split(/[,;]/)[0].trim(),
    ),
    manifiesto: read([/\bmanifiesto\s*[:#-]?\s*([^\n,;]+)/i]),
    procedencia: read([/\bprocedencia\s*[:#-]?\s*([^\n]+)/i]),
    destino: read([/\bdestino\s*[:#-]?\s*([^\n]+)/i]),
    documentoTransporte: read([/\bdocumento\s+de\s+transporte\s*[:#-]?\s*([^\n]+)/i]),
    regimenOperacionAduanera: read([
      /\b(?:r[eé]gimen|operaci[oó]n)\s+(?:u\s+operaci[oó]n\s+)?aduanera\s*[:#-]?\s*([^\n]+)/i,
    ]),
    numeroDeclaracion: read([/\b(?:n[uú]mero\s+de\s+)?declaraci[oó]n\s*[:#-]?\s*([^\n,;]+)/i]),
    fundamentoHecho: readLongText([
      /\bfundamento\s*de\s*hecho\s*[:#-]?\s*([\s\S]*?)(?=\bfundamento\s*de\s*derecho|\bdescripci[oó]n\s+de\s+los\s+bienes|\n\s*[A-ZÁÉÍÓÚ ]{3,}:|$)/i,
    ]),
    fundamentoDerecho: readLongText([
      /\bfundamento\s+de\s+derecho\s*[:#-]?\s*([\s\S]*?)(?=\n\s*[A-ZÁÉÍÓÚ ]{3,}:|$)/i,
    ]),
    bienes: [],
    peso: read([/\bpeso\s*[:#-]?\s*([^\n]+)/i]),
    lugarCustodia: read([/\blugar\s+de\s+custodia(?:\s+o\s+almacenamiento)?\s*[:#-]?\s*([^\n]+)/i]),
    observaciones: readLongText([/\bobservaciones?\s*[:#-]?\s*([^\n]+)/i]),
  };

  const itemPattern =
    /\bbien\s*(\d+)\s*[:#-]\s*([\s\S]*?)(?=\n\s*bien\s*\d+\s*[:#-]|\n\s*(?:peso|lugar de custodia|observaciones)\s*:|$)/gi;
  for (const match of text.matchAll(itemPattern)) {
    const content = match[2];
    const field = (label: string): string => {
      const result = content.match(
        new RegExp(
          `${label}\\s*[:=]\\s*(.*?)(?=\\s+(?:cantidad|unidad(?:\\s+de\\s+medida)?|descripci[oó]n|observaciones)\\s*[:=]|$)`,
          'i',
        ),
      );
      return result?.[1]?.trim() ?? '';
    };
    fields.bienes.push({
      numero: match[1],
      cantidad: field('cantidad'),
      unidadMedida: field('unidad(?:\\s+de\\s+medida)?'),
      descripcion: field('descripci[oó]n'),
      observaciones: field('observaciones'),
    });
  }

  if (fields.bienes.length === 0) {
    const goodsBlock =
      text.match(
        /\b(?:bienes|mercanc[ií]as)\s*:\s*([\s\S]*?)(?=\n\s*(?:peso|lugar de custodia|observaciones)\s*:|$)/i,
      )?.[1] ?? '';
    fields.bienes = goodsBlock
      .split(/\r?\n/)
      .map((line, index) => {
        const parts = line.split('|').map((part) => part.trim());
        if (parts.length < 3) return null;
        return {
          numero: parts[0] || String(index + 1),
          cantidad: parts[1] ?? '',
          unidadMedida: parts[2] ?? '',
          descripcion: parts[3] ?? '',
          observaciones: parts[4] ?? '',
        };
      })
      .filter(Boolean);
  }

  return fields;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function isActaType(tipoDocumento: string): boolean {
  return tipoDocumento === 'ACTA_INMOVILIZACION' || tipoDocumento === 'ACTA_INCAUTACION';
}

/**
 * Conserva solo los campos de acta con contenido real (descarta cadenas vacías y
 * arreglos de bienes vacíos) para no ensuciar los datos extraídos.
 */
function compactFields(fields: Record<string, any>): Record<string, any> {
  return Object.fromEntries(
    Object.entries(fields).filter(([key, value]) =>
      key === 'bienes'
        ? Array.isArray(value) && value.length > 0
        : value !== '' && value !== undefined && value !== null,
    ),
  );
}

/**
 * Extrae el primer número de un valor y lo normaliza a punto decimal. Los modelos
 * locales (y el OCR) suelen devolver unidades o etiquetas pegadas al número, por
 * ejemplo "3.10 Y:" o "S/ 1,200.00 kg", que `validateActa` rechazaría como "Peso
 * debe ser un número válido" y haría fallar toda el acta.
 */
function coerceNumber(value: unknown): string {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  const raw = String(value ?? '').replace(/^S\/\s*/i, '');
  const match = raw.match(/-?\d[\d.,]*\d|-?\d/);
  if (!match) return '';
  const token = match[0].replace(/[.,]+$/, '');
  return token.includes('.') && token.includes(',')
    ? token.replace(/,/g, '')
    : token.replace(',', '.');
}

/**
 * Sanea los campos numéricos de un acta (`peso` y la `cantidad` de cada bien) para
 * que pasen la validación. Si no hay ningún número reconocible, se deja el campo
 * vacío en vez de romper el flujo completo.
 */
function coerceActaNumbers(campos: Record<string, any>): Record<string, any> {
  if (campos.peso !== undefined && campos.peso !== '') {
    campos.peso = coerceNumber(campos.peso);
  }
  // El RUC de un acta debe tener 11 dígitos. Si el modelo devuelve algo con
  // otro largo, lo dejamos vacío en vez de romper la validación del acta.
  if (campos.ruc !== undefined && campos.ruc !== '') {
    const digits = String(campos.ruc).replace(/\D/g, '');
    campos.ruc = digits.length === 11 ? digits : '';
  }
  if (campos.fecha) {
    const fecha = normalizeDate(String(campos.fecha));
    campos.fecha = isPlausibleDate(fecha) ? fecha : '';
  }
  if (campos.fechaDeclaracion) {
    const declaracion = normalizeDate(String(campos.fechaDeclaracion));
    campos.fechaDeclaracion = isPlausibleDate(declaracion) ? declaracion : '';
  }
  // Partes del número de acta para el encabezado de la plantilla:
  // "235-0105-2020" → actaCodigo1=235, actaCodigo2=0105, actaAnio=2020.
  const actaParts = String(campos.numeroActa ?? '')
    .split('-')
    .map((part) => part.trim())
    .filter(Boolean);
  if (actaParts[0]) campos.actaCodigo1 = actaParts[0];
  if (actaParts[1]) campos.actaCodigo2 = actaParts[1];
  if (actaParts[2]) campos.actaAnio = actaParts[2];

  // La plantilla no tiene casillas propias para peso ni custodia; se anexan a las
  // observaciones, igual que en el acta física.
  const extras: string[] = [];
  if (campos.peso) extras.push(`PESO: ${campos.peso} KG`);
  if (campos.lugarCustodia) extras.push(`LUGAR DE CUSTODIA: ${campos.lugarCustodia}`);
  if (extras.length) {
    const base = String(campos.observaciones ?? '').trim();
    campos.observaciones = [base, ...extras].filter(Boolean).join('\n');
  }
  if (Array.isArray(campos.bienes)) {
    campos.bienes = campos.bienes.map((bien) => {
      if (!bien || typeof bien !== 'object' || Array.isArray(bien)) return bien;
      const item = bien as Record<string, unknown>;
      if (item.cantidad === undefined || item.cantidad === '') return item;
      return { ...item, cantidad: coerceNumber(item.cantidad) };
    });
  }
  return campos;
}

function asStringRecord(value: unknown): Record<string, string> {
  return Object.fromEntries(
    Object.entries(asRecord(value)).filter(([, item]) => typeof item === 'string'),
  ) as Record<string, string>;
}

function extractFields(text: string): Record<string, string> {
  const fields: Record<string, string> = {};
  const patterns: Record<string, RegExp> = {
    contribuyente:
      /(?:raz[oó]n social\s*\/\s*nombre|identificaci[oó]n(?: del deudor| del contribuyente)?|deudor|contribuyente)\s*:\s*([^\n(]+)/i,
    ruc: /\bruc\s*[:#-]?\s*(\d{11})/i,
    periodo:
      /\b(?:per[ií]odo fiscal|per[ií]odo(?: a declarar)?|ejercicio)\s*[:#-]?\s*(\d{2}\/\d{4}|\d{4})/i,
    ingresos:
      /\b(?:total ingresos|ingresos(?: por ventas\/servicios| brutos)?)\s*(?:\([^)]*\))?\s*[:#-]?\s*((?:S\/\s*)?[\d,.]+)/i,
    deducciones:
      /\b(?:total deducciones|deducci[oó]n principal|costo de ventas \+ gastos|gastos)\s*(?:\([^)]*\))?\s*[:#-]?\s*((?:S\/\s*)?[\d,.]+)/i,
    rentaNeta: /\brenta neta\s*(?:\([^)]*\))?\s*[:#-]?\s*((?:S\/\s*)?[\d,.]+)/i,
    tributoCalculado:
      /\b(?:tributo calculado|tributo sobre la renta|tributo determinado)\s*(?:\([^)]*\))?\s*[:#-]?\s*((?:S\/\s*)?[\d,.]+)/i,
    tributo: /\btributo\s*(?:\([^)]*\))?\s*[:#-]?\s*((?:S\/\s*)?[\d,.]+)/i,
    impuestoRenta:
      /\b(?:impuesto a la renta|impuesto sobre la renta)\s*(?:\([^)]*\))?\s*[:#-]?\s*((?:S\/\s*)?[\d,.]+)/i,
    igv: /\b(?:igv|tributo general de ventas)\s*(?:\([^)]*\))?\s*[:#-]?\s*((?:S\/\s*)?[\d,.]+)/i,
    intereses:
      /\bintereses?(?: moratorios| hasta acogimiento)?\s*(?:\([^)]*\))?\s*[:#-]?\s*((?:S\/\s*)?[\d,.]+)/i,
    pagosCuenta:
      /\b(?:pagos? a cuenta realizados|pagos? a cuenta)\s*(?:\([^)]*\))?\s*[:#-]?\s*((?:S\/\s*)?[\d,.]+)/i,
    saldoAPagar:
      /\bsaldo a pagar(?:\s*\/\s*a favor)?\s*(?:\([^)]*\))?\s*[:#-]?\s*((?:S\/\s*)?[\d,.]+)/i,
    totalDeuda:
      /\b(?:total deuda(?: a aplazar\/fraccionar)?|deuda total exigible|deuda total|monto total aprobado)\s*(?:\([^)]*\))?\s*[:#-]?\s*((?:S\/\s*)?[\d,.]+)/i,
    fechaVencimiento:
      /\b(?:primer vencimiento|fecha de vencimiento|plazo de pago|vencimiento)\s*[:#-]?\s*(\d{1,2}\/\d{1,2}\/\d{4})/i,
    numeroCuotas: /\b(?:fraccionamiento en|n[uú]mero de )?([0-9]+)\s+cuotas?/i,
    modalidad: /\bmodalidad\s*[:#-]?\s*([^\n,;]+)/i,
    condicion: /\bcondici[oó]n(?: actual)?\b\s*[:#-]?\s*([^\n,;]+)/i,
    actividadPrincipal: /\bactividad econ[oó]mica principal\s*(?:\([^)]*\))?\s*[:#-]?\s*([^\n]+)/i,
    actividadEconomica: /\bactividad econ[oó]mica\s*(?:\([^)]*\))?\s*[:#-]?\s*([^\n]+)/i,
    ciiu: /\bciiu\s*[:#-]?\s*([^\n,;]+)/i,
    regimenTributario: /\b(?:r[eé]gimen tributario|r[eé]gimen)\s*[:#-]?\s*([^\n,;]+)/i,
    fechaInicio: /\bfecha de inicio de actividades|\bfecha de inicio\s*[:#-]?\s*([^\n,;]+)/i,
    domicilioFiscal: /\bdomicilio fiscal\s*[:#-]?\s*([^\n]+)/i,
    sistemas: /\bsistema de (?:contabilidad|emisi[oó]n de comprobantes)[^:]*:\s*([^\n]+)/i,
    departamento: /\bdepartamento\s*[:#-]?\s*([^\n]+)/i,
    distrito: /\bdistrito(?: \/ ubigeo)?\s*[:#-]?\s*([^\n]+)/i,
    via: /\bv[ií]a \([^)]*\)\s*[:#-]?\s*([^\n]+)/i,
    nombreVia: /\bnombre de la v[ií]a\s*[:#-]?\s*([^\n]+)/i,
    numeroVia: /\bn[uú]mero \/ kil[oó]metro \/ manzana \/ lote\s*[:#-]?\s*([^\n]+)/i,
  };
  for (const [key, pattern] of Object.entries(patterns)) {
    const match = text.match(pattern);
    if (match?.[1]) fields[key] = match[1].trim().replace(/[.)]+$/, '');
  }
  if (!fields.ruc) {
    const codeMatch = text.match(/c[oó]digo de contribuyente\s*[:#-]?\s*(\d{11})/i);
    if (codeMatch?.[1]) fields.ruc = codeMatch[1];
  }
  if (!fields.periodo) {
    const periodMatch = text.match(/(?<!\d\/)(0[1-9]|1[0-2])\/20\d{2}/);
    if (periodMatch) fields.periodo = periodMatch[0];
  }
  const totalIncomeMatch = text.match(
    /\btotal ingresos\s*(?:\([^)]*\))?\s*[:#-]?\s*((?:S\/\s*)?[\d,.]+)/i,
  );
  if (totalIncomeMatch?.[1]) fields.ingresos = totalIncomeMatch[1].trim();
  if (!fields.totalDeuda) {
    const totalMatch = text.match(
      /total deuda(?:\s+a\s+aplazar\/fraccionar|\s+exigible)?[\s\S]{0,80}?((?:S\/\s*)?[\d,.]+)/i,
    );
    if (totalMatch?.[1]) fields.totalDeuda = totalMatch[1].trim();
  }
  if (!fields.fechaVencimiento && /vencimiento|cronograma|orden de pago/i.test(text)) {
    const dates = text.match(/\b\d{1,2}\/\d{1,2}\/\d{4}\b/g) ?? [];
    if (dates.length > 1) fields.fechaVencimiento = dates[1];
    const compactDate = text.match(/\d(\d{2}\/\d{2}\/\d{4})/);
    if (!fields.fechaVencimiento && compactDate?.[1]) fields.fechaVencimiento = compactDate[1];
  }
  if (!fields.ciiu) {
    const ciiuMatch = text.match(/\b(?:ciiu|código ciiu)[\s\S]{0,100}?\b(\d{4})\s*[–-]/i);
    if (ciiuMatch?.[1]) fields.ciiu = ciiuMatch[1];
  }
  if (!fields.fechaInicio) {
    const startMatch = text.match(
      /fecha de inicio de actividades[\s\S]{0,80}?(\d{2}\/\d{2}\/\d{4})/i,
    );
    if (startMatch?.[1]) fields.fechaInicio = startMatch[1];
  }
  if (!fields.sistemas || /ficticios|simulaci[oó]n/i.test(fields.sistemas)) {
    const accounting = text.match(
      /sistema de contabilidad[\s\S]{0,80}?\b(manual|computarizado)\b/i,
    )?.[1];
    const receipts = text.match(
      /sistema de emisi[oó]n de comprobantes[\s\S]{0,80}?\b(manual|electr[oó]nico|computarizado)\b/i,
    )?.[1];
    if (accounting || receipts)
      fields.sistemas = `Contabilidad: ${accounting ?? 'no identificada'}; comprobantes: ${receipts ?? 'no identificados'}`;
  }
  if (fields.nombreVia && fields.numeroVia) {
    fields.domicilioFiscal =
      `${fields.via ?? ''} ${fields.nombreVia} ${fields.numeroVia}${fields.distrito ? `, ${fields.distrito}` : ''}`.trim();
  }
  fields.contribuyente =
    fields.contribuyente?.replace(/\s*\(.*/, '').trim() || fields.contribuyente;
  if (fields.actividadEconomica && !fields.actividadPrincipal)
    fields.actividadPrincipal = fields.actividadEconomica;
  if (/firmas?|firmado|firma del declarante/i.test(text))
    fields.firmas = 'Presentes según el documento';
  if (/pendiente/i.test(text)) fields.condicion = fields.condicion ?? 'Pendiente';
  return fields;
}

// ---------------------------------------------------------------------------
// Informe ejecutivo
// ---------------------------------------------------------------------------

/** Etiquetas legibles de los campos que se muestran en el informe. */
const FIELD_LABELS: Record<string, string> = {
  contribuyente: 'Contribuyente',
  razonSocial: 'Razón social',
  consignatario: 'Consignatario',
  apellidosNombres: 'Apellidos y nombres',
  ruc: 'RUC',
  domicilio: 'Domicilio',
  domicilioFiscal: 'Domicilio fiscal',
  periodo: 'Período',
  fecha: 'Fecha',
  hora: 'Hora',
  fechaEmision: 'Fecha de emisión',
  fechaVencimiento: 'Vencimiento',
  fechaInicio: 'Inicio de actividades',
  fechaDeclaracion: 'Fecha de declaración',
  ingresos: 'Ingresos totales',
  deducciones: 'Deducciones totales',
  rentaNeta: 'Renta neta',
  tributoCalculado: 'Tributo calculado',
  tributo: 'Tributo',
  pagosCuenta: 'Pagos a cuenta',
  saldoAPagar: 'Saldo a pagar',
  totalDeuda: 'Deuda total',
  deudaExigible: 'Deuda exigible',
  intereses: 'Intereses al acogimiento',
  impuestoRenta: 'Impuesto a la renta',
  igv: 'IGV',
  numeroCuotas: 'N° de cuotas',
  modalidad: 'Modalidad',
  condicion: 'Condición',
  numeroActa: 'N° de acta',
  tipoAccion: 'Tipo de acción',
  numeroAccionControl: 'N° de acción de control',
  lugarAccionControl: 'Lugar de control',
  empresaTransportista: 'Empresa transportista',
  tipoVehiculo: 'Tipo de vehículo',
  matricula: 'Matrícula',
  manifiesto: 'Manifiesto',
  procedencia: 'Procedencia',
  destino: 'Destino',
  documentoTransporte: 'Documento de transporte',
  regimenOperacionAduanera: 'Régimen u operación aduanera',
  numeroDeclaracion: 'N° de declaración',
  numeroDocumento: 'N° de documento',
  fundamentoHecho: 'Fundamento de hecho',
  fundamentoDerecho: 'Fundamento de derecho',
  bienes: 'Mercancía',
  peso: 'Peso (kg)',
  lugarCustodia: 'Lugar de custodia',
  observaciones: 'Observaciones',
  actividadPrincipal: 'Actividad principal',
  ciiu: 'CIIU',
  regimenTributario: 'Régimen tributario',
  sistemas: 'Sistemas',
  areaDestino: 'Área de destino',
};

const ACTA_KEY_FIELDS = [
  'numeroActa',
  'tipoAccion',
  'fecha',
  'hora',
  'lugarAccionControl',
  'numeroAccionControl',
  'consignatario',
  'apellidosNombres',
  'razonSocial',
  'ruc',
  'empresaTransportista',
  'manifiesto',
  'procedencia',
  'destino',
  'numeroDeclaracion',
  'fechaDeclaracion',
  'regimenOperacionAduanera',
  'fundamentoHecho',
  'fundamentoDerecho',
  'bienes',
  'peso',
  'lugarCustodia',
];

/** Campos que se muestran en "Datos clave", en orden, según el tipo de documento. */
const KEY_FIELDS: Record<string, string[]> = {
  ACTA_INMOVILIZACION: ACTA_KEY_FIELDS,
  ACTA_INCAUTACION: ACTA_KEY_FIELDS,
  SOLICITUD_INSCRIPCION_RUC: [
    'razonSocial',
    'ruc',
    'actividadPrincipal',
    'ciiu',
    'fechaInicio',
    'domicilioFiscal',
    'regimenTributario',
    'sistemas',
  ],
  ACTUALIZACION_RUC: [
    'razonSocial',
    'ruc',
    'actividadPrincipal',
    'ciiu',
    'domicilioFiscal',
    'regimenTributario',
    'sistemas',
  ],
  DECLARACION_JURADA_MENSUAL: [
    'contribuyente',
    'ruc',
    'periodo',
    'ingresos',
    'deducciones',
    'rentaNeta',
    'tributoCalculado',
    'pagosCuenta',
    'saldoAPagar',
    'fechaVencimiento',
  ],
  DECLARACION_JURADA_ANUAL: [
    'contribuyente',
    'ruc',
    'periodo',
    'ingresos',
    'deducciones',
    'rentaNeta',
    'tributoCalculado',
    'pagosCuenta',
    'saldoAPagar',
  ],
  RESOLUCION_FRACCIONAMIENTO: [
    'contribuyente',
    'ruc',
    'modalidad',
    'totalDeuda',
    'intereses',
    'numeroCuotas',
    'fechaVencimiento',
    'condicion',
  ],
  RESOLUCION_APLAZAMIENTO: [
    'contribuyente',
    'ruc',
    'modalidad',
    'totalDeuda',
    'numeroCuotas',
    'fechaVencimiento',
    'condicion',
  ],
  ORDEN_PAGO_OP: [
    'contribuyente',
    'ruc',
    'periodo',
    'impuestoRenta',
    'igv',
    'intereses',
    'totalDeuda',
    'fechaEmision',
    'fechaVencimiento',
  ],
  RESOLUCION_DETERMINACION_RD: [
    'contribuyente',
    'ruc',
    'periodo',
    'tributo',
    'totalDeuda',
    'fechaVencimiento',
  ],
  RESOLUCION_MULTA_RM: ['contribuyente', 'ruc', 'periodo', 'totalDeuda', 'fechaVencimiento'],
  REQUERIMIENTO_FISCALIZACION: [
    'contribuyente',
    'ruc',
    'periodo',
    'totalDeuda',
    'numeroDocumento',
    'fecha',
    'fechaVencimiento',
  ],
  AUDITORIA_LIBROS: [
    'contribuyente',
    'ruc',
    'periodo',
    'fecha',
    'fechaVencimiento',
    'observaciones',
  ],
  CARTA_PRESENTACION: ['contribuyente', 'ruc', 'numeroDocumento', 'fecha', 'fechaVencimiento'],
  NOTIFICACION_ELECTRONICA: [
    'contribuyente',
    'ruc',
    'numeroDocumento',
    'numeroDeclaracion',
    'fecha',
    'fechaVencimiento',
  ],
  SOLICITUD_APLAZAMIENTO: [
    'contribuyente',
    'ruc',
    'totalDeuda',
    'numeroCuotas',
    'numeroDocumento',
    'fecha',
  ],
  RESOLUCION_APLAZAMIENTO_FRACCIONAMIENTO: [
    'contribuyente',
    'ruc',
    'modalidad',
    'totalDeuda',
    'intereses',
    'numeroCuotas',
    'fechaVencimiento',
    'condicion',
  ],
};

const DEFAULT_KEY_FIELDS = [
  'contribuyente',
  'razonSocial',
  'ruc',
  'periodo',
  'totalDeuda',
  'saldoAPagar',
  'fechaVencimiento',
];

/** Resume la mercancía de un acta: "10 cajas de repuestos; 5 unidades de motores". */
function summarizeBienes(bienes: unknown): string {
  if (!Array.isArray(bienes)) return '';
  return bienes
    .map((bien) => {
      const item = asRecord(bien);
      const cantidad = item.cantidad ? String(item.cantidad) : '';
      const unidad = item.unidadMedida ? ` ${String(item.unidadMedida)}` : '';
      const descripcion = item.descripcion ? ` de ${String(item.descripcion)}` : '';
      return `${cantidad}${unidad}${descripcion}`.trim();
    })
    .filter(Boolean)
    .join('; ');
}

/** Datos clave del documento con etiqueta legible, en el orden del tipo. */
function buildKeyData(
  tipoDocumento: SunatDocumentType,
  campos: Record<string, any>,
): Record<string, string> {
  const keys = KEY_FIELDS[tipoDocumento] ?? DEFAULT_KEY_FIELDS;
  const datos: Record<string, string> = {};
  for (const key of keys) {
    const value = campos[key];
    if (value === undefined || value === null || value === '') continue;
    if (!isUsableValue(tipoDocumento, key, value)) continue;
    if (Array.isArray(value)) {
      const resumen = summarizeBienes(value);
      if (resumen) datos[FIELD_LABELS[key] ?? key] = resumen;
      continue;
    }
    datos[FIELD_LABELS[key] ?? key] = compactLongText(String(value));
  }
  return datos;
}

/** Identificación del contribuyente (o del intervenido, en las actas). */
function buildIdentificacion(
  tipoDocumento: SunatDocumentType,
  campos: Record<string, any>,
): Record<string, string> {
  const identificacion: Record<string, string> = {};
  const push = (label: string, key: string, value: unknown) => {
    if (value === undefined || value === null || String(value).trim() === '') return;
    if (!isUsableValue(tipoDocumento, key, value)) return;
    identificacion[label] = String(value);
  };

  if (isActaType(tipoDocumento)) {
    push('Consignatario', 'consignatario', campos.consignatario);
    push('Intervenido', 'apellidosNombres', campos.apellidosNombres);
    push('Razón social', 'razonSocial', campos.razonSocial);
    push('RUC', 'ruc', campos.ruc);
    push('Domicilio', 'domicilio', campos.domicilio);
    push('Empresa transportista', 'empresaTransportista', campos.empresaTransportista);
  } else {
    push('Contribuyente', 'contribuyente', campos.contribuyente || campos.razonSocial);
    push('RUC', 'ruc', campos.ruc);
    push('Domicilio fiscal', 'domicilioFiscal', campos.domicilioFiscal || campos.domicilio);
  }
  return identificacion;
}

/** Suma días hábiles (lunes a viernes) a una fecha. No considera feriados. */
function addBusinessDays(from: Date, days: number): Date {
  const date = new Date(from.getTime());
  let remaining = days;
  while (remaining > 0) {
    date.setUTCDate(date.getUTCDate() + 1);
    const weekday = date.getUTCDay();
    if (weekday !== 0 && weekday !== 6) remaining -= 1;
  }
  return date;
}

/** Convierte "04/03/2020" o "2020-03-04" a fecha UTC; null si no es válida. */
function parseDocumentDate(value?: unknown): Date | null {
  if (value === undefined || value === null) return null;
  const text = String(value).trim();
  if (!text) return null;

  const iso = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (iso) {
    const date = new Date(Date.UTC(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3])));
    return date.getUTCMonth() === Number(iso[2]) - 1 ? date : null;
  }

  const slashed = text.match(/^(\d{1,2})[/.](\d{1,2})[/.](\d{2,4})$/);
  if (!slashed) return null;
  const year = Number(slashed[3]) < 100 ? 2000 + Number(slashed[3]) : Number(slashed[3]);
  const date = new Date(Date.UTC(year, Number(slashed[2]) - 1, Number(slashed[1])));
  return date.getUTCMonth() === Number(slashed[2]) - 1 ? date : null;
}

function startOfDayUtc(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function daysBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / 86400000);
}

function formatDatePe(date: Date): string {
  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${date.getUTCFullYear()}`;
}

/** "venció hace 3 día(s) (04/08/2026)" | "vence hoy (04/08/2026)" | "vence el ... (en 5 día(s))". */
/** Tiempo transcurrido en lenguaje humano: "6 año(s)" en vez de "2404 día(s)". */
function humanizeElapsed(days: number): string {
  if (days >= 365) return `${Math.floor(days / 365)} año(s)`;
  if (days >= 60) return `${Math.floor(days / 30)} mes(es)`;
  return `${days} día(s)`;
}

function describeDeadline(due: Date, today: Date): string {
  const difference = daysBetween(today, due);
  if (difference < 0) {
    return `venció hace ${humanizeElapsed(Math.abs(difference))} (${formatDatePe(due)})`;
  }
  if (difference === 0) return `vence hoy (${formatDatePe(due)})`;
  return `vence el ${formatDatePe(due)} (en ${difference} día(s))`;
}

function buildActaAlerts(
  tipoDocumento: SunatDocumentType,
  campos: Record<string, any>,
  now: Date,
): string[] {
  const alerts: string[] = [];
  const hoy = startOfDayUtc(now);
  const fechaActa = parseDocumentDate(campos.fecha);

  if (fechaActa) {
    if (tipoDocumento === 'ACTA_INMOVILIZACION') {
      alerts.push(
        `Plazo de 10 días hábiles para solicitar el levantamiento de la inmovilización: ${describeDeadline(addBusinessDays(fechaActa, 10), hoy)}.`,
      );
      alerts.push(
        `Plazo de 20 días hábiles para solicitar la devolución de la mercancía: ${describeDeadline(addBusinessDays(fechaActa, 20), hoy)}.`,
      );
    } else {
      alerts.push(
        'La mercancía incautada queda a disposición de la autoridad aduanera: confirmar el expediente y el destino final.',
      );
    }
    const anios = Math.floor(daysBetween(fechaActa, hoy) / 365);
    if (anios >= 1) {
      alerts.push(
        `Han pasado ${anios} año(s) desde el acta (${formatDatePe(fechaActa)}): confirmar el estado final del caso (levantamiento, devolución o comiso) y su valorización.`,
      );
    }
  } else {
    alerts.push(
      'No se identificó la fecha del acta: sin ella no se pueden calcular los plazos legales.',
    );
  }

  if (!campos.numeroActa) alerts.push('No se identificó el número de acta.');
  if (!Array.isArray(campos.bienes) || campos.bienes.length === 0) {
    alerts.push('No se identificaron los bienes de la mercancía.');
  }
  if (!firstUsableActaValue(campos, ['consignatario', 'apellidosNombres', 'razonSocial'])) {
    alerts.push('No se identificó al consignatario ni al intervenido: revisar el acta original.');
  }
  return alerts;
}

function buildCollectableAlerts(campos: Record<string, any>, now: Date): string[] {
  const alerts: string[] = [];
  const hoy = startOfDayUtc(now);
  const vencimiento = parseDocumentDate(campos.fechaVencimiento);

  if (vencimiento) {
    alerts.push(`Fecha de vencimiento: ${describeDeadline(vencimiento, hoy)}.`);
    if (daysBetween(hoy, vencimiento) < 0) {
      alerts.push('Plazo de pago vencido: los intereses moratorios siguen acumulándose.');
    }
  } else {
    alerts.push('No se identificó la fecha de vencimiento.');
  }
  if (!campos.totalDeuda && !campos.saldoAPagar) {
    alerts.push('No se identificó el monto exigible.');
  }
  return alerts;
}

function buildInstalmentAlerts(campos: Record<string, any>, now: Date): string[] {
  const alerts: string[] = [];
  const hoy = startOfDayUtc(now);
  const primerVencimiento = parseDocumentDate(campos.fechaVencimiento);

  if (primerVencimiento) {
    alerts.push(`Primer vencimiento del cronograma: ${describeDeadline(primerVencimiento, hoy)}.`);
    if (daysBetween(hoy, primerVencimiento) < 0) {
      alerts.push(
        'El primer vencimiento ya pasó: verificar el pago de la cuota antes de evaluar la pérdida del beneficio.',
      );
    }
  } else {
    alerts.push('No se identificó el primer vencimiento del cronograma.');
  }
  if (!campos.numeroCuotas) alerts.push('No se identificó el número de cuotas.');
  return alerts;
}

function buildDeclarationAlerts(campos: Record<string, any>, now: Date): string[] {
  const alerts: string[] = [];
  if (campos.saldoAPagar) {
    alerts.push(`Saldo por pagar de ${campos.saldoAPagar} sin constancia de pago en el documento.`);
  } else {
    alerts.push('No se identificó el saldo a pagar: verificar el tributo resultante.');
  }
  if (campos.ingresos && campos.rentaNeta) {
    alerts.push(
      'Cruzar ingresos y deducciones con facturación electrónica, bancos y declaraciones previas.',
    );
  }
  const vencimiento = parseDocumentDate(campos.fechaVencimiento);
  if (vencimiento) {
    alerts.push(
      `Vencimiento de la declaración: ${describeDeadline(vencimiento, startOfDayUtc(now))}.`,
    );
  }
  return alerts;
}

function buildRegistryAlerts(campos: Record<string, any>, now: Date): string[] {
  const alerts: string[] = [];
  const inicio = parseDocumentDate(campos.fechaInicio);
  if (inicio) {
    alerts.push(`Inicio de actividades: ${formatDatePe(inicio)}.`);
    if (daysBetween(inicio, startOfDayUtc(now)) <= 365) {
      alerts.push('Contribuyente nuevo: incluirlo en el seguimiento de contribuyentes nuevos.');
    }
  }
  alerts.push(
    'Afecto a declaraciones desde el inicio de actividades: verificar presentación y pago de sus obligaciones mensuales.',
  );
  if (!campos.domicilioFiscal) {
    alerts.push(
      'No se identificó el domicilio fiscal: validarlo antes de registrar o actualizar el RUC.',
    );
  }
  return alerts;
}

/** Alertas y observaciones del informe, calculadas a partir de los datos del documento. */
function buildAlerts(
  tipoDocumento: SunatDocumentType,
  campos: Record<string, any>,
  now: Date,
): string[] {
  switch (tipoDocumento) {
    case 'ACTA_INMOVILIZACION':
    case 'ACTA_INCAUTACION':
      return buildActaAlerts(tipoDocumento, campos, now);
    case 'ORDEN_PAGO_OP':
    case 'RESOLUCION_DETERMINACION_RD':
    case 'RESOLUCION_MULTA_RM':
      return buildCollectableAlerts(campos, now);
    case 'RESOLUCION_APLAZAMIENTO_FRACCIONAMIENTO':
    case 'RESOLUCION_FRACCIONAMIENTO':
    case 'RESOLUCION_APLAZAMIENTO':
    case 'SOLICITUD_APLAZAMIENTO':
      return buildInstalmentAlerts(campos, now);
    case 'DECLARACION_JURADA_MENSUAL':
    case 'DECLARACION_JURADA_ANUAL':
      return buildDeclarationAlerts(campos, now);
    case 'SOLICITUD_INSCRIPCION_RUC':
    case 'ACTUALIZACION_RUC':
      return buildRegistryAlerts(campos, now);
    default:
      return campos.fechaVencimiento
        ? [`Vencimiento indicado en el documento: ${String(campos.fechaVencimiento)}.`]
        : [];
  }
}

/**
 * Sanea el nivel de urgencia del informe. El modelo puede devolver el nivel con
 * texto añadido ("ALTA: revisar antes del vencimiento indicado"), así que se
 * conserva solo el nivel reconocido. Devuelve `undefined` si no hay ningún nivel
 * válido, para no inventar una urgencia que el documento no permite determinar.
 */
export function normalizeUrgencia(value: unknown): UrgenciaInforme | undefined {
  if (typeof value !== 'string') return undefined;
  const nivel = value.toUpperCase().match(/\b(ALTA|MEDIA|BAJA)\b/)?.[1];
  return URGENCIA_LEVELS.find((nivelValido) => nivelValido === nivel);
}

export function createExecutiveReport(
  tipoDocumento: SunatDocumentType,
  campos: Record<string, any>,
  summary: string,
  now: Date = new Date(),
): InformeEjecutivo {
  const area = getAreaByDocumentType(tipoDocumento);
  const alertas = buildAlerts(tipoDocumento, campos, now);
  const base = {
    tipoInforme: tipoDocumento,
    identificacion: buildIdentificacion(tipoDocumento, campos),
    datosClave: { ...buildKeyData(tipoDocumento, campos), areaDestino: area },
    alertas,
    accionesRequeridas: ['Verificar la clasificación y la integridad de los campos extraídos'],
    resumenEjecutivo: summary,
  };

  switch (tipoDocumento) {
    case 'ACTA_INMOVILIZACION':
    case 'ACTA_INCAUTACION': {
      const plazosVencidos = alertas.some((alerta) => alerta.includes('venció'));
      return {
        ...base,
        contexto:
          'Acta de control aduanero dirigida al área de Prevención del Contrabando y Fiscalización Aduanera. El análisis debe confirmar la situación de la mercancía, el cumplimiento de los plazos legales y el destino final del caso.',
        estado:
          tipoDocumento === 'ACTA_INMOVILIZACION'
            ? 'Mercancía en custodia (inmovilización)'
            : 'Mercancía incautada',
        urgencia: plazosVencidos ? 'ALTA' : 'MEDIA',
        analisisRiesgo: {
          urgencia: plazosVencidos ? 'ALTO' : 'MEDIO',
          observacion:
            'Si los plazos de levantamiento o devolución vencieron, el caso pasa a incautación o comiso y la mercancía puede perderse para el contribuyente.',
        },
        accionesRequeridas: [
          'Verificar si hubo solicitud de levantamiento o devolución dentro del plazo',
          'Confirmar si el caso pasó a incautación o comiso',
          'Registrar la valorización de la mercancía y su recepción en almacén',
          'Consolidar el expediente con el manifiesto, la declaración y la procedencia',
        ],
      };
    }
    case 'RESOLUCION_APLAZAMIENTO_FRACCIONAMIENTO':
    case 'RESOLUCION_FRACCIONAMIENTO':
    case 'RESOLUCION_APLAZAMIENTO':
    case 'SOLICITUD_APLAZAMIENTO':
      return {
        ...base,
        contexto:
          'Documento que concede o solicita un beneficio de aplazamiento o fraccionamiento. El control debe centrarse en la vigencia, aceptación y cumplimiento del cronograma de pagos.',
        estado: campos.condicion ?? 'Pendiente de verificación',
        urgencia: alertas.some((alerta) => alerta.includes('venció')) ? 'ALTA' : 'MEDIA',
        analisisCumplimiento: {
          beneficio: 'En curso o solicitado',
          control: 'Validar cuotas pagadas y próximo vencimiento',
        },
        analisisRiesgo: {
          caducidad: 'MEDIO',
          observacion: 'La falta de firma, aceptación o pago puede dejar sin efecto el beneficio',
        },
        accionesRequeridas: [
          'Validar firma del funcionario competente',
          'Confirmar aceptación del deudor',
          'Verificar el cronograma y el primer vencimiento',
          'Controlar el pago de cada cuota y el saldo pendiente',
        ],
      };
    case 'ORDEN_PAGO_OP':
      return {
        ...base,
        contexto:
          'Documento de requerimiento de pago utilizado para determinar una deuda tributaria exigible y evaluar el inicio de cobranza coactiva.',
        estado: 'Pendiente de pago',
        urgencia: 'ALTA',
        analisisRiesgo: {
          exigibilidad: 'ALTO',
          observacion: 'El incumplimiento posterior al vencimiento puede activar cobranza coactiva',
        },
        accionesRequeridas: [
          'Exigir la cancelación total',
          'Validar deuda, intereses y fecha de vencimiento',
          'Verificar el pago en el sistema antes de derivar a cobranza coactiva',
          'Consolidar el expediente del contribuyente con sus demás deudas',
        ],
      };
    case 'RESOLUCION_DETERMINACION_RD':
    case 'RESOLUCION_MULTA_RM':
      return {
        ...base,
        contexto:
          'Resolución emitida por el área de fiscalización que determina una deuda o una sanción. El análisis debe confirmar la notificación, la exigibilidad y si existe reclamo o impugnación.',
        estado: 'Notificada, pendiente de verificación',
        urgencia: 'ALTA',
        analisisRiesgo: {
          exigibilidad: 'ALTO',
          observacion:
            'Sin pago ni reclamo dentro del plazo, corresponde el inicio de la cobranza coactiva',
        },
        accionesRequeridas: [
          'Verificar la fecha y la forma de notificación',
          'Comprobar si existe pago, reclamo o impugnación',
          'Actualizar los intereses a la fecha',
          'Derivar a cobranza coactiva si no hay respuesta',
        ],
      };
    case 'REQUERIMIENTO_FISCALIZACION':
    case 'AUDITORIA_LIBROS':
      return {
        ...base,
        contexto:
          'Documento de fiscalización parcial o definitiva dirigido al contribuyente. El análisis debe confirmar el plazo otorgado y la documentación exigida.',
        estado: 'Requerimiento pendiente de respuesta',
        urgencia: 'ALTA',
        analisisRiesgo: {
          incumplimiento: 'ALTO',
          observacion:
            'La falta de respuesta en el plazo otorgado puede generar presunciones y sanciones',
        },
        accionesRequeridas: [
          'Identificar el plazo otorgado y la documentación exigida',
          'Confirmar si el contribuyente presentó la información',
          'Evaluar el resultado del requerimiento o la auditoría',
        ],
      };
    case 'DECLARACION_JURADA_MENSUAL':
    case 'DECLARACION_JURADA_ANUAL':
      return {
        ...base,
        contexto:
          'Documento de autoliquidación del contribuyente. Sirve para verificar la consistencia entre ingresos, deducciones, tributo determinado y pagos realizados.',
        estado: campos.saldoAPagar ? 'Saldo pendiente de pago' : 'Presentada',
        urgencia: campos.saldoAPagar ? 'ALTA' : 'MEDIA',
        analisisCumplimiento: {
          declaracion: 'Presentada según el documento',
          saldo: campos.saldoAPagar
            ? `Saldo pendiente: ${campos.saldoAPagar}`
            : 'Verificar saldo a pagar',
        },
        analisisRiesgo: {
          consistencia: 'MEDIO',
          observacion:
            'Cruzar ingresos y deducciones con facturación electrónica, bancos y declaraciones previas',
        },
        accionesRequeridas: [
          'Validar firma del declarante y contador',
          'Cruzar ingresos y deducciones con fuentes externas',
          'Controlar el pago del saldo determinado',
        ],
      };
    case 'SOLICITUD_INSCRIPCION_RUC':
    case 'ACTUALIZACION_RUC':
      return {
        ...base,
        contexto:
          'Documento registral que crea o actualiza la información del contribuyente en el RUC. La exactitud del domicilio y la actividad determina futuras obligaciones y notificaciones.',
        estado: 'Pendiente de validación registral',
        urgencia: 'MEDIA',
        analisisCumplimiento: {
          inscripcion: 'Solicitada',
          obligaciones: 'Afecto a declaraciones desde el inicio de actividades',
        },
        analisisRiesgo: {
          fiscalizacion: campos.sistemas?.toLowerCase().includes('manual') ? 'ALTO' : 'MEDIO',
          observacion:
            'Validar domicilio, actividad económica y régimen antes de emitir o actualizar el RUC',
        },
        accionesRequeridas: [
          'Validar identidad y RUC',
          'Confirmar domicilio fiscal y actividad económica',
          'Verificar régimen tributario y sistemas declarados',
          'Incluir al contribuyente en el seguimiento de declaraciones mensuales',
        ],
      };
    default:
      return {
        ...base,
        contexto: `Documento dirigido al área ${area}. El análisis debe confirmar su validez, alcance y obligación derivada antes de continuar el trámite.`,
      };
  }
}

/** Identifica al sujeto del documento: contribuyente, consignatario o intervenido. */
function resolveSubject(tipoDocumento: SunatDocumentType, campos: Record<string, any>): string {
  const nombre = isActaType(tipoDocumento)
    ? firstUsableActaValue(campos, ['consignatario', 'apellidosNombres', 'razonSocial'])
    : campos.contribuyente || campos.consignatario || campos.apellidosNombres || campos.razonSocial;
  if (nombre && campos.ruc) return `${nombre} (RUC: ${campos.ruc})`;
  if (nombre) return String(nombre);
  if (campos.ruc) return `RUC ${campos.ruc}`;
  return 'contribuyente no identificado';
}

/**
 * Compone el resumen del gestor: primero el hecho verificable y después la
 * lectura (qué falta confirmar, qué acción toca y qué riesgo hay si no se actúa).
 * Es lo que convierte un volcado de datos en un análisis para decidir.
 */
function composeSummary(
  hechos: string[],
  analisis: { falta?: string; accion: string; riesgo: string },
): string {
  const partes = [...hechos];
  if (analisis.falta) partes.push(`Falta por confirmar: ${analisis.falta}`);
  partes.push(`Acción: ${analisis.accion}`);
  partes.push(`Riesgo: ${analisis.riesgo}`);
  return partes.join(' ');
}

export function buildExecutiveSummary(
  tipoDocumento: SunatDocumentType,
  campos: Record<string, any>,
  now: Date = new Date(),
): string {
  const subject = resolveSubject(tipoDocumento, campos);
  switch (tipoDocumento) {
    case 'ACTA_INMOVILIZACION':
    case 'ACTA_INCAUTACION': {
      const accion = tipoDocumento === 'ACTA_INMOVILIZACION' ? 'inmovilización' : 'incautación';
      const hechos = [
        `Acta de ${accion}${campos.numeroActa ? ` N° ${campos.numeroActa}` : ''}${campos.fecha ? ` del ${campos.fecha}` : ''}${campos.lugarAccionControl ? `, en ${campos.lugarAccionControl}` : ''}.`,
      ];
      const nombreIdentificado = firstUsableActaValue(campos, [
        'consignatario',
        'apellidosNombres',
        'razonSocial',
      ]);
      if (nombreIdentificado) hechos.push(`Consignatario/intervenido: ${subject}.`);
      const mercancia = summarizeBienes(campos.bienes);
      if (mercancia) {
        hechos.push(`Mercancía: ${mercancia}${campos.peso ? ` (${campos.peso} kg)` : ''}.`);
      }
      if (campos.procedencia || campos.manifiesto) {
        hechos.push(
          `Procedencia: ${campos.procedencia ?? 'no identificada'}${campos.manifiesto ? ` (manifiesto ${campos.manifiesto})` : ''}.`,
        );
      }
      if (campos.lugarCustodia && campos.lugarCustodia !== campos.lugarAccionControl) {
        hechos.push(`Custodia: ${campos.lugarCustodia}.`);
      }
      // El fundamento de hecho no entra al resumen: suele traer el texto crudo del
      // formulario u OCR ilegible, y el gestor ya lo tiene en "Datos clave".

      const alertas = buildActaAlerts(tipoDocumento, campos, now);
      if (alertas.some((alerta) => alerta.includes('venció'))) {
        hechos.push(
          'Los plazos legales para solicitar el levantamiento y la devolución ya vencieron.',
        );
      }
      const faltanDatos = !campos.fecha || !nombreIdentificado || !mercancia;
      return composeSummary(hechos, {
        falta: faltanDatos
          ? 'los datos que el acta no permite leer (fecha, interviniente o mercancía).'
          : 'si hubo solicitud dentro del plazo, el estado final (levantamiento, devolución o comiso) y la valorización de la mercancía.',
        accion:
          'verificar el expediente y confirmar el estado final antes de disponer de la mercancía.',
        riesgo: 'la mercancía queda sin destino definido y el expediente sin valorizar.',
      });
    }
    case 'RESOLUCION_APLAZAMIENTO_FRACCIONAMIENTO':
    case 'RESOLUCION_FRACCIONAMIENTO':
    case 'RESOLUCION_APLAZAMIENTO':
    case 'SOLICITUD_APLAZAMIENTO':
      return composeSummary(
        [
          `${tipoDocumento.replace(/_/g, ' ')} de ${subject}: beneficio ${campos.modalidad ?? 'tributario'} por ${campos.totalDeuda ?? 'monto no identificado'}${campos.numeroCuotas ? ` en ${campos.numeroCuotas} cuotas` : ''}.`,
          `Próximo vencimiento: ${campos.fechaVencimiento ?? 'no identificado'}. Estado: ${campos.condicion ?? 'pendiente de verificación'}.`,
        ],
        {
          falta:
            'que la resolución esté notificada y aceptada y que el cronograma se esté cumpliendo.',
          accion: 'validar firma y aceptación y controlar el pago de cada cuota.',
          riesgo:
            'si se incumple el cronograma, el beneficio se pierde y la deuda vuelve a ser exigible.',
        },
      );
    case 'ORDEN_PAGO_OP': {
      const vencida = buildCollectableAlerts(campos, now).some((alerta) =>
        alerta.includes('venció'),
      );
      return composeSummary(
        [
          `Orden de Pago de ${subject}: deuda exigible ${campos.totalDeuda ?? 'no identificada'}${campos.periodo ? ` del período ${campos.periodo}` : ''}.`,
          `Vencimiento: ${campos.fechaVencimiento ?? 'no identificado'}${vencida ? ' (ya vencido)' : ''}.`,
        ],
        {
          falta: 'la constancia de notificación y si hay reclamo o impugnación pendiente.',
          accion: 'exigir la cancelación total y evaluar el inicio de cobranza coactiva.',
          riesgo: 'la deuda sigue generando intereses y la acción de cobro puede prescribir.',
        },
      );
    }
    case 'RESOLUCION_DETERMINACION_RD':
    case 'RESOLUCION_MULTA_RM':
      return composeSummary(
        [
          `${tipoDocumento.replace(/_/g, ' ')} de ${subject}${campos.periodo ? ` del período ${campos.periodo}` : ''} por ${campos.totalDeuda ?? 'monto no identificado'}.`,
          `Vencimiento: ${campos.fechaVencimiento ?? 'no identificado'}.`,
        ],
        {
          falta: 'la constancia de notificación y si existe reclamo o impugnación.',
          accion: 'verificar el pago y, si no corresponde, evaluar la cobranza.',
          riesgo: 'el acto queda sin ejecutar y el monto sin cobrar.',
        },
      );
    case 'DECLARACION_JURADA_MENSUAL':
    case 'DECLARACION_JURADA_ANUAL':
      return composeSummary(
        [
          `${tipoDocumento.replace(/_/g, ' ')} de ${subject}${campos.periodo ? ` del período ${campos.periodo}` : ''}: ingresos ${campos.ingresos ?? 'no identificados'}, renta neta ${campos.rentaNeta ?? 'no identificada'} y saldo a pagar ${campos.saldoAPagar ?? 'no identificado'}.`,
        ],
        {
          falta: 'validar firmas y consistencia de los importes declarados.',
          accion: 'verificar el pago del saldo y observar las diferencias frente a lo registrado.',
          riesgo:
            'un saldo impago genera intereses y una declaración inconsistente puede observarse.',
        },
      );
    case 'SOLICITUD_INSCRIPCION_RUC':
    case 'ACTUALIZACION_RUC':
      return composeSummary(
        [
          `${tipoDocumento.replace(/_/g, ' ')} de ${subject}: actividad ${campos.actividadPrincipal ?? campos.actividadEconomica ?? 'no identificada'}, régimen ${campos.regimenTributario ?? 'no identificado'} y domicilio ${campos.domicilioFiscal ?? 'no identificado'}.`,
        ],
        {
          falta: 'el domicilio fiscal cuando no aparece y la documentación de sustento.',
          accion: 'validar los datos y registrar o actualizar el RUC.',
          riesgo: 'un registro inconsistente afecta la fiscalización y las notificaciones.',
        },
      );
    case 'REQUERIMIENTO_FISCALIZACION':
    case 'AUDITORIA_LIBROS':
    case 'CARTA_PRESENTACION':
    case 'NOTIFICACION_ELECTRONICA':
      return composeSummary(
        [
          `${tipoDocumento.replace(/_/g, ' ')} de ${subject}${campos.numeroDocumento ? ` N° ${campos.numeroDocumento}` : ''}${campos.periodo ? ` del período ${campos.periodo}` : ''}${campos.fecha ? `, notificado el ${campos.fecha}` : ''}.`,
          campos.fechaVencimiento
            ? `Plazo para responder: ${campos.fechaVencimiento}.`
            : 'El documento no fija un plazo legible para responder.',
        ],
        {
          falta: 'el detalle de lo pedido y la documentación que sustenta la respuesta.',
          accion: 'atender lo pedido dentro del plazo y dejar constancia de la respuesta.',
          riesgo:
            'dejar vencer el plazo sin responder deja el expediente incompleto y puede generar una sanción.',
        },
      );
    default:
      // Defensivo: si la base trajera una categoría fuera del enum, igual sale un
      // resumen con la estructura de siempre en lugar de dejarlo vacío.
      return composeSummary(
        [`Documento ${String(tipoDocumento).replace(/_/g, ' ')} de ${subject}.`],
        {
          falta: 'los datos que el documento no permite leer.',
          accion:
            'revisar los datos extraídos, validar su formalidad y ejecutar la acción del área destinataria.',
          riesgo: 'atender el documento con datos incompletos o fuera de plazo.',
        },
      );
  }
}

function parseJsonResponse(raw: string): Record<string, unknown> {
  const withoutMarkdown = raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  const firstBrace = withoutMarkdown.indexOf('{');
  const lastBrace = withoutMarkdown.lastIndexOf('}');
  if (firstBrace < 0 || lastBrace <= firstBrace) {
    throw new Error('El modelo no devolvió un objeto JSON');
  }
  return JSON.parse(withoutMarkdown.slice(firstBrace, lastBrace + 1)) as Record<string, unknown>;
}

function normalizeClassificationResult(
  value: Record<string, unknown>,
  text: string,
): ClassificationResult {
  const classifiedType = isDocumentType(value.tipoDocumento)
    ? value.tipoDocumento
    : 'DECLARACION_JURADA_MENSUAL';
  // Detecta el acta también desde el texto: si el OCR del formulario es legible,
  // no dependemos de que el modelo local acierte el tipoDocumento.
  const actaFromText = detectActaType(text) ?? detectActaForm(text);
  const isActa = isActaType(classifiedType) || actaFromText !== null;
  const tipoDocumento = isActa ? (actaFromText ?? classifiedType) : classifiedType;
  const populatedActaFields = isActa ? compactFields(extractActaFields(text)) : {};
  const camposBase = {
    ...extractFields(text),
    ...asStringRecord(value.campos),
    ...populatedActaFields,
  };
  const campos = isActa ? coerceActaNumbers(camposBase) : camposBase;
  const resumenEjecutivo = buildExecutiveSummary(tipoDocumento, campos);
  const informe = asRecord(value.informeEjecutivo);
  const baseReport = createExecutiveReport(tipoDocumento, campos, resumenEjecutivo);
  const informeEjecutivo: InformeEjecutivo = {
    ...informe,
    ...baseReport,
    identificacion: { ...asStringRecord(informe.identificacion), ...baseReport.identificacion },
    datosClave: { ...asRecord(informe.datosClave), ...baseReport.datosClave },
    resumenEjecutivo,
    // La plantilla determinista manda. Si el tipo de documento no tiene plantilla
    // propia, se sanea la urgencia que devolvió el modelo para que nunca llegue
    // texto libre al informe (el campo es un nivel, no una frase).
    urgencia: baseReport.urgencia ?? normalizeUrgencia(informe.urgencia),
  };

  return {
    tipoDocumento,
    area: getAreaByDocumentType(tipoDocumento),
    confianza:
      typeof value.confianza === 'number' ? Math.max(0, Math.min(1, value.confianza)) : 0.5,
    campos,
    informeEjecutivo,
    resumenEjecutivo,
  };
}

export function classifyByKeywords(text: string, now: Date = new Date()): ClassificationResult {
  const lowerText = text.toLocaleLowerCase('es');
  const rules: Array<{ tipo: SunatDocumentType; keywords: string[] }> = [
    {
      tipo: 'SOLICITUD_INSCRIPCION_RUC',
      keywords: ['formulario 2119', 'inscripción al ruc', 'actividad económica'],
    },
    {
      tipo: 'ACTUALIZACION_RUC',
      keywords: ['formulario 2119', 'actualización', 'cambio de domicilio'],
    },
    {
      tipo: 'RESOLUCION_APLAZAMIENTO_FRACCIONAMIENTO',
      keywords: ['aplazamiento', 'fraccionamiento', 'res-frac'],
    },
    {
      tipo: 'ORDEN_PAGO_OP',
      keywords: ['orden de pago', 'deuda exigible', 'fecha de vencimiento'],
    },
    {
      tipo: 'DECLARACION_JURADA_MENSUAL',
      keywords: ['declaración jurada mensual', 'ingresos', 'saldo a pagar'],
    },
    {
      tipo: 'DECLARACION_JURADA_ANUAL',
      keywords: ['declaración jurada anual', 'ejercicio', 'renta neta'],
    },
    {
      tipo: 'RESOLUCION_FRACCIONAMIENTO',
      keywords: ['resolución de fraccionamiento', 'cuotas', 'plan de pagos'],
    },
    { tipo: 'RESOLUCION_APLAZAMIENTO', keywords: ['aplazamiento', 'cronograma'] },
    {
      tipo: 'RESOLUCION_DETERMINACION_RD',
      keywords: ['resolución de determinación', 'deuda tributaria'],
    },
    { tipo: 'RESOLUCION_MULTA_RM', keywords: ['resolución de multa', 'infracción', 'sanción'] },
    { tipo: 'REQUERIMIENTO_FISCALIZACION', keywords: ['requerimiento', 'fiscalización'] },
    {
      tipo: 'AUDITORIA_LIBROS',
      keywords: ['libros contables', 'libro de ventas', 'libro de compras'],
    },
    { tipo: 'CARTA_PRESENTACION', keywords: ['carta de presentación'] },
    { tipo: 'NOTIFICACION_ELECTRONICA', keywords: ['notificación electrónica', 'buzón sunat'] },
  ];
  const best = rules
    .map((rule) => ({
      ...rule,
      score: rule.keywords.filter((keyword) => lowerText.includes(keyword)).length,
    }))
    .sort((left, right) => right.score - left.score)[0];
  const keywordType = best?.score ? best.tipo : 'DECLARACION_JURADA_MENSUAL';
  // Para actas: primero la casilla marcada; si el OCR no la lee, el título del
  // formulario (evita clasificar el acta como REQUERIMIENTO_FISCALIZACION).
  const tipoDocumento = detectActaType(text) ?? detectActaForm(text) ?? keywordType;
  // Para las actas, además de la clasificación, extraemos los campos con las
  // reglas locales. Sin esto, cuando Ollama falla/expira el resultado quedaba en
  // `{}` y la validación rechazaba el documento por falta de número de acta/fecha.
  const camposBase = {
    ...extractFields(text),
    ...(isActaType(tipoDocumento) ? compactFields(extractActaFields(text)) : {}),
  };
  const campos = isActaType(tipoDocumento) ? coerceActaNumbers(camposBase) : camposBase;
  const resumenEjecutivo = buildExecutiveSummary(tipoDocumento, campos, now);
  const report = createExecutiveReport(tipoDocumento, campos, resumenEjecutivo, now);
  return {
    tipoDocumento,
    area: getAreaByDocumentType(tipoDocumento),
    confianza: best?.score ? Math.min(0.9, 0.5 + best.score * 0.1) : 0.3,
    campos,
    informeEjecutivo: report,
    resumenEjecutivo,
  };
}

/**
 * POST JSON usando node:http/https en lugar del fetch global (undici).
 * El fetch de undici aplica headersTimeout/bodyTimeout de 300s por defecto, lo que
 * aborta las generaciones largas ("fetch failed") mucho antes que nuestro timeout.
 * Con node:http deshabilitamos ese tope y el único límite es nuestro AbortController.
 */
function postJson(
  urlStr: string,
  headers: Record<string, string>,
  body: unknown,
  timeoutMs: number,
  signal: AbortSignal,
): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    let target: URL;
    try {
      target = new URL(urlStr);
    } catch {
      reject(new Error(`URL inválida: ${urlStr}`));
      return;
    }
    const isHttps = target.protocol === 'https:';
    const lib = (isHttps ? https : http) as typeof http;
    const data = JSON.stringify(body);
    const req = lib.request(
      {
        protocol: target.protocol,
        hostname: target.hostname,
        port: target.port || (isHttps ? 443 : 80),
        path: `${target.pathname}${target.search}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
          ...headers,
        },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
        res.on('end', () =>
          resolve({
            status: res.statusCode ?? 0,
            body: Buffer.concat(chunks).toString('utf8'),
          }),
        );
      },
    );
    const abort = (): void => {
      req.destroy(new Error('This operation was aborted'));
    };
    if (signal.aborted) {
      abort();
      return;
    }
    signal.addEventListener('abort', abort, { once: true });
    req.setTimeout(timeoutMs, abort);
    req.on('error', (error) => reject(error));
    req.write(data);
    req.end();
  });
}

export interface ClassifyOptions {
  /** Pide un esquema compacto (sin `informeEjecutivo`) para reducir la generación. */
  compact?: boolean;
  /** Tope de tokens a generar (Ollama `num_predict` / Gemini `maxOutputTokens`). */
  maxPredict?: number;
}

/** Alias retrocompatible del nombre anterior. */
export type ClassifyOllamaOptions = ClassifyOptions;

const DEFAULT_MAX_OUTPUT_TOKENS = 2048;

/**
 * Cuerpo de la petición a `generateContent` de Gemini. Función pura para poder
 * probarla sin red. Usa "structured output" (`responseSchema`) y razonamiento
 * mínimo para gastar la menor cantidad de tokens posible.
 */
export function buildGeminiRequestBody(
  text: string,
  options: ClassifyOptions = {},
): { contents: unknown[]; generationConfig: Record<string, unknown> } {
  const { compact = false, maxPredict } = options;
  const maxOutputTokens =
    maxPredict && maxPredict > 0 ? maxPredict : compact ? 1024 : DEFAULT_MAX_OUTPUT_TOKENS;
  return {
    contents: [
      {
        role: 'user',
        parts: [
          { text: compact ? buildCompactClassifierPrompt(text) : buildClassifierPrompt(text) },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens,
      responseMimeType: 'application/json',
      responseSchema: compact ? COMPACT_RESPONSE_SCHEMA : FULL_RESPONSE_SCHEMA,
      thinkingConfig: { thinkingLevel: GEMINI_THINKING_LEVEL },
    },
  };
}

interface GeminiPayload {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
    finishReason?: string;
  }>;
  promptFeedback?: { blockReason?: string };
  error?: { message?: string };
}

/** Concatena las partes de texto del primer candidato de Gemini. */
export function extractGeminiText(payload: GeminiPayload): string {
  const parts = payload.candidates?.[0]?.content?.parts ?? [];
  return parts.map((part) => part.text ?? '').join('');
}

async function classifyWithGemini(
  text: string,
  options: ClassifyOptions,
): Promise<ClassificationResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);
  try {
    const { contents, generationConfig } = buildGeminiRequestBody(text, options);
    const { status, body } = await postJson(
      `${GEMINI_API_BASE}/models/${GEMINI_MODEL}:generateContent`,
      { 'x-goog-api-key': GEMINI_API_KEY },
      { contents, generationConfig },
      GEMINI_TIMEOUT_MS,
      controller.signal,
    );
    if (status !== 200) {
      throw new Error(`Gemini respondió HTTP ${status}: ${body.slice(0, 300)}`);
    }
    const payload = JSON.parse(body) as GeminiPayload;
    if (payload.error?.message) throw new Error(`Gemini: ${payload.error.message}`);
    const content = extractGeminiText(payload);
    if (!content.trim()) {
      const reason =
        payload.candidates?.[0]?.finishReason ??
        payload.promptFeedback?.blockReason ??
        'sin candidatos';
      throw new Error(`Gemini devolvió una respuesta vacía (${reason})`);
    }
    return normalizeClassificationResult(parseJsonResponse(content), text);
  } finally {
    clearTimeout(timeout);
  }
}

/** Variante estricta: propaga el error para que la cadena pruebe el siguiente proveedor. */
async function classifyWithOllamaStrict(
  text: string,
  options: ClassifyOptions,
): Promise<ClassificationResult> {
  const { compact = false, maxPredict } = options;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OLLAMA_TIMEOUT_MS);
  try {
    const { status, body } = await postJson(
      `${OLLAMA_HOST}/api/generate`,
      {},
      {
        model: OLLAMA_MODEL,
        prompt: compact ? buildCompactClassifierPrompt(text) : buildClassifierPrompt(text),
        stream: false,
        format: 'json',
        options: {
          temperature: 0.1,
          ...(maxPredict && maxPredict > 0 ? { num_predict: maxPredict } : {}),
        },
      },
      OLLAMA_TIMEOUT_MS,
      controller.signal,
    );
    if (status !== 200) throw new Error(`Ollama respondió HTTP ${status}`);
    const payload = JSON.parse(body) as { response?: string };
    if (!payload.response) throw new Error('Ollama devolvió una respuesta vacía');
    return normalizeClassificationResult(parseJsonResponse(payload.response), text);
  } finally {
    clearTimeout(timeout);
  }
}

/** Clasifica solo con Ollama y cae al clasificador local si falla. */
export async function classifyWithOllama(
  text: string,
  options: ClassifyOptions = {},
): Promise<ClassificationResult> {
  try {
    return await classifyWithOllamaStrict(text, options);
  } catch (error) {
    console.warn(
      '[IA] Ollama no disponible; se usa fallback local:',
      error instanceof Error ? error.message : error,
    );
    return classifyByKeywords(text);
  }
}

/**
 * Clasificación con la cadena de proveedores configurada (Gemini → Ollama →
 * palabras clave). Es el punto de entrada que deben usar los flujos de documentos.
 */
export async function classifyDocument(
  text: string,
  options: ClassifyOptions = {},
): Promise<ClassificationResult> {
  for (const provider of providerChain()) {
    try {
      return provider === 'gemini'
        ? await classifyWithGemini(text, options)
        : await classifyWithOllamaStrict(text, options);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`[IA] Proveedor ${provider} falló; se intenta el siguiente: ${message}`);
    }
  }
  return classifyByKeywords(text);
}
