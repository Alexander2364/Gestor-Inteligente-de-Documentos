import { buildClassifierPrompt } from '../prompts/classifier';
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
  | 'RESOLUCION_APLAZAMIENTO_FRACCIONAMIENTO';

export interface InformeEjecutivo {
  tipoInforme: string;
  contexto: string;
  identificacion: Record<string, string>;
  datosClave: Record<string, unknown>;
  analisisRiesgo?: Record<string, unknown>;
  estado?: string;
  analisisCumplimiento?: Record<string, unknown>;
  urgencia?: string;
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

const OLLAMA_HOST = process.env.OLLAMA_HOST ?? 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? 'llama3.1:8b';
const OLLAMA_TIMEOUT_MS = Number(process.env.OLLAMA_TIMEOUT_MS ?? 180000);

const VALID_TYPES: SunatDocumentType[] = [
  'DECLARACION_JURADA_MENSUAL', 'DECLARACION_JURADA_ANUAL',
  'RESOLUCION_FRACCIONAMIENTO', 'RESOLUCION_APLAZAMIENTO', 'ORDEN_PAGO_OP',
  'SOLICITUD_INSCRIPCION_RUC', 'ACTUALIZACION_RUC', 'RESOLUCION_DETERMINACION_RD',
  'RESOLUCION_MULTA_RM', 'REQUERIMIENTO_FISCALIZACION', 'AUDITORIA_LIBROS',
  'CARTA_PRESENTACION', 'NOTIFICACION_ELECTRONICA', 'SOLICITUD_APLAZAMIENTO',
  'RESOLUCION_APLAZAMIENTO_FRACCIONAMIENTO',
];

function isDocumentType(value: unknown): value is SunatDocumentType {
  return typeof value === 'string' && VALID_TYPES.includes(value as SunatDocumentType);
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function asStringRecord(value: unknown): Record<string, string> {
  return Object.fromEntries(
    Object.entries(asRecord(value)).filter(([, item]) => typeof item === 'string'),
  ) as Record<string, string>;
}

function extractFields(text: string): Record<string, string> {
  const fields: Record<string, string> = {};
  const patterns: Record<string, RegExp> = {
    contribuyente: /(?:raz[oó]n social\s*\/\s*nombre|identificaci[oó]n(?: del deudor| del contribuyente)?|deudor|contribuyente)\s*:\s*([^\n(]+)/i,
    ruc: /\bruc\s*[:#-]?\s*(\d{11})/i,
    periodo: /\b(?:per[ií]odo fiscal|per[ií]odo(?: a declarar)?|ejercicio)\s*[:#-]?\s*(\d{2}\/\d{4}|\d{4})/i,
    ingresos: /\b(?:total ingresos|ingresos(?: por ventas\/servicios| brutos)?)\s*(?:\([^)]*\))?\s*[:#-]?\s*((?:S\/\s*)?[\d,.]+)/i,
    deducciones: /\b(?:total deducciones|deducci[oó]n principal|costo de ventas \+ gastos|gastos)\s*(?:\([^)]*\))?\s*[:#-]?\s*((?:S\/\s*)?[\d,.]+)/i,
    rentaNeta: /\brenta neta\s*(?:\([^)]*\))?\s*[:#-]?\s*((?:S\/\s*)?[\d,.]+)/i,
    tributoCalculado: /\b(?:tributo calculado|tributo sobre la renta|tributo determinado)\s*(?:\([^)]*\))?\s*[:#-]?\s*((?:S\/\s*)?[\d,.]+)/i,
    tributo: /\btributo\s*(?:\([^)]*\))?\s*[:#-]?\s*((?:S\/\s*)?[\d,.]+)/i,
    impuestoRenta: /\b(?:impuesto a la renta|impuesto sobre la renta)\s*(?:\([^)]*\))?\s*[:#-]?\s*((?:S\/\s*)?[\d,.]+)/i,
    igv: /\b(?:igv|tributo general de ventas)\s*(?:\([^)]*\))?\s*[:#-]?\s*((?:S\/\s*)?[\d,.]+)/i,
    intereses: /\bintereses?(?: moratorios| hasta acogimiento)?\s*(?:\([^)]*\))?\s*[:#-]?\s*((?:S\/\s*)?[\d,.]+)/i,
    pagosCuenta: /\b(?:pagos? a cuenta realizados|pagos? a cuenta)\s*(?:\([^)]*\))?\s*[:#-]?\s*((?:S\/\s*)?[\d,.]+)/i,
    saldoAPagar: /\bsaldo a pagar(?:\s*\/\s*a favor)?\s*(?:\([^)]*\))?\s*[:#-]?\s*((?:S\/\s*)?[\d,.]+)/i,
    totalDeuda: /\b(?:total deuda(?: a aplazar\/fraccionar)?|deuda total exigible|deuda total|monto total aprobado)\s*(?:\([^)]*\))?\s*[:#-]?\s*((?:S\/\s*)?[\d,.]+)/i,
    fechaVencimiento: /\b(?:primer vencimiento|fecha de vencimiento|plazo de pago|vencimiento)\s*[:#-]?\s*(\d{1,2}\/\d{1,2}\/\d{4})/i,
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
  const totalIncomeMatch = text.match(/\btotal ingresos\s*(?:\([^)]*\))?\s*[:#-]?\s*((?:S\/\s*)?[\d,.]+)/i);
  if (totalIncomeMatch?.[1]) fields.ingresos = totalIncomeMatch[1].trim();
  if (!fields.totalDeuda) {
    const totalMatch = text.match(/total deuda(?:\s+a\s+aplazar\/fraccionar|\s+exigible)?[\s\S]{0,80}?((?:S\/\s*)?[\d,.]+)/i);
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
    const startMatch = text.match(/fecha de inicio de actividades[\s\S]{0,80}?(\d{2}\/\d{2}\/\d{4})/i);
    if (startMatch?.[1]) fields.fechaInicio = startMatch[1];
  }
  if (!fields.sistemas || /ficticios|simulaci[oó]n/i.test(fields.sistemas)) {
    const accounting = text.match(/sistema de contabilidad[\s\S]{0,80}?\b(manual|computarizado)\b/i)?.[1];
    const receipts = text.match(/sistema de emisi[oó]n de comprobantes[\s\S]{0,80}?\b(manual|electr[oó]nico|computarizado)\b/i)?.[1];
    if (accounting || receipts) fields.sistemas = `Contabilidad: ${accounting ?? 'no identificada'}; comprobantes: ${receipts ?? 'no identificados'}`;
  }
  if (fields.nombreVia && fields.numeroVia) {
    fields.domicilioFiscal = `${fields.via ?? ''} ${fields.nombreVia} ${fields.numeroVia}${fields.distrito ? `, ${fields.distrito}` : ''}`.trim();
  }
  fields.contribuyente = fields.contribuyente?.replace(/\s*\(.*/, '').trim() || fields.contribuyente;
  if (fields.actividadEconomica && !fields.actividadPrincipal) fields.actividadPrincipal = fields.actividadEconomica;
  if (/firmas?|firmado|firma del declarante/i.test(text)) fields.firmas = 'Presentes según el documento';
  if (/pendiente/i.test(text)) fields.condicion = fields.condicion ?? 'Pendiente';
  return fields;
}

function createExecutiveReport(
  tipoDocumento: SunatDocumentType,
  campos: Record<string, string>,
  summary: string,
): InformeEjecutivo {
  const area = getAreaByDocumentType(tipoDocumento);
  const subject = campos.contribuyente
    ? `${campos.contribuyente}${campos.ruc ? ` (RUC: ${campos.ruc})` : ''}`
    : campos.ruc ? `RUC ${campos.ruc}` : 'contribuyente no identificado';
  const base = {
    tipoInforme: tipoDocumento,
    identificacion: {
      contribuyente: subject,
      ...(campos.ruc ? { ruc: campos.ruc } : {}),
    },
    datosClave: { ...campos, areaDestino: area },
    accionesRequeridas: ['Verificar la clasificación y la integridad de los campos extraídos'],
    resumenEjecutivo: summary,
  };

  switch (tipoDocumento) {
    case 'RESOLUCION_APLAZAMIENTO_FRACCIONAMIENTO':
    case 'RESOLUCION_FRACCIONAMIENTO':
    case 'RESOLUCION_APLAZAMIENTO':
    case 'SOLICITUD_APLAZAMIENTO':
      return {
        ...base,
        contexto: 'Documento que concede o solicita un beneficio de aplazamiento o fraccionamiento. El control debe centrarse en la vigencia, aceptación y cumplimiento del cronograma de pagos.',
        estado: campos.condicion ?? 'Pendiente de verificación',
        analisisCumplimiento: { beneficio: 'En curso o solicitado', control: 'Validar cuotas pagadas y próximo vencimiento' },
        analisisRiesgo: { caducidad: 'MEDIO', observacion: 'La falta de firma, aceptación o pago puede dejar sin efecto el beneficio' },
        accionesRequeridas: ['Validar firma del funcionario competente', 'Confirmar aceptación del deudor', 'Verificar el cronograma y el primer vencimiento'],
      };
    case 'ORDEN_PAGO_OP':
      return {
        ...base,
        contexto: 'Documento de requerimiento de pago utilizado para determinar una deuda tributaria exigible y evaluar el inicio de cobranza coactiva.',
        estado: 'Pendiente de pago',
        urgencia: campos.fechaVencimiento ? 'ALTA: revisar antes del vencimiento indicado' : 'ALTA',
        analisisRiesgo: { exigibilidad: 'ALTA', observacion: 'El incumplimiento posterior al vencimiento puede activar cobranza coactiva' },
        accionesRequeridas: ['Exigir la cancelación total', 'Validar deuda, intereses y fecha de vencimiento', 'Verificar el pago en el sistema antes de derivar a cobranza coactiva'],
      };
    case 'DECLARACION_JURADA_MENSUAL':
    case 'DECLARACION_JURADA_ANUAL':
      return {
        ...base,
        contexto: 'Documento de autoliquidación del contribuyente. Sirve para verificar la consistencia entre ingresos, deducciones, tributo determinado y pagos realizados.',
        analisisCumplimiento: { declaracion: 'Presentada según el documento', saldo: campos.saldoAPagar ? `Saldo pendiente: ${campos.saldoAPagar}` : 'Verificar saldo a pagar' },
        analisisRiesgo: { consistencia: 'MEDIO', observacion: 'Cruzar ingresos y deducciones con facturación electrónica, bancos y declaraciones previas' },
        accionesRequeridas: ['Validar firma del declarante y contador', 'Cruzar ingresos y deducciones con fuentes externas', 'Controlar el pago del saldo determinado'],
      };
    case 'SOLICITUD_INSCRIPCION_RUC':
    case 'ACTUALIZACION_RUC':
      return {
        ...base,
        contexto: 'Documento registral que crea o actualiza la información del contribuyente en el RUC. La exactitud del domicilio y la actividad determina futuras obligaciones y notificaciones.',
        analisisRiesgo: { fiscalizacion: campos.sistemas?.toLowerCase().includes('manual') ? 'ALTO' : 'MEDIO', observacion: 'Validar domicilio, actividad económica y régimen antes de emitir o actualizar el RUC' },
        accionesRequeridas: ['Validar identidad y RUC', 'Confirmar domicilio fiscal y actividad económica', 'Verificar régimen tributario y sistemas declarados'],
      };
    default:
      return {
        ...base,
        contexto: `Documento dirigido al área ${area}. El análisis debe confirmar su validez, alcance y obligación derivada antes de continuar el trámite.`,
      };
  }
}

function buildExecutiveSummary(tipoDocumento: SunatDocumentType, campos: Record<string, string>): string {
  const subject = campos.contribuyente
    ? `${campos.contribuyente}${campos.ruc ? ` (RUC: ${campos.ruc})` : ''}`
    : campos.ruc ? `RUC ${campos.ruc}` : 'contribuyente no identificado';
  switch (tipoDocumento) {
    case 'RESOLUCION_APLAZAMIENTO_FRACCIONAMIENTO':
    case 'RESOLUCION_FRACCIONAMIENTO':
    case 'RESOLUCION_APLAZAMIENTO':
    case 'SOLICITUD_APLAZAMIENTO':
      return `${tipoDocumento.replace(/_/g, ' ')} de ${subject}: beneficio ${campos.modalidad ?? 'tributario'} por ${campos.totalDeuda ?? 'monto no identificado'}${campos.numeroCuotas ? ` en ${campos.numeroCuotas} cuotas` : ''}. Próximo vencimiento: ${campos.fechaVencimiento ?? 'no identificado'}. Estado: ${campos.condicion ?? 'pendiente de verificación'}. Validar firma, aceptación y cumplimiento del cronograma.`;
    case 'ORDEN_PAGO_OP':
      return `Orden de Pago de ${subject}: deuda exigible ${campos.totalDeuda ?? 'no identificada'}${campos.periodo ? ` del período ${campos.periodo}` : ''}. Vencimiento: ${campos.fechaVencimiento ?? 'no identificado'}. Exigir la cancelación total y verificar si corresponde iniciar cobranza coactiva.`;
    case 'DECLARACION_JURADA_MENSUAL':
    case 'DECLARACION_JURADA_ANUAL':
      return `${tipoDocumento.replace(/_/g, ' ')} de ${subject}${campos.periodo ? ` del período ${campos.periodo}` : ''}: ingresos ${campos.ingresos ?? 'no identificados'}, renta neta ${campos.rentaNeta ?? 'no identificada'} y saldo a pagar ${campos.saldoAPagar ?? 'no identificado'}. Validar firmas, consistencia y pago del saldo.`;
    case 'SOLICITUD_INSCRIPCION_RUC':
    case 'ACTUALIZACION_RUC':
      return `${tipoDocumento.replace(/_/g, ' ')} de ${subject}: actividad ${campos.actividadPrincipal ?? campos.actividadEconomica ?? 'no identificada'}, régimen ${campos.regimenTributario ?? 'no identificado'} y domicilio ${campos.domicilioFiscal ?? 'no identificado'}. Validar los datos antes de registrar o actualizar el RUC.`;
    default:
      return `Documento ${tipoDocumento.replace(/_/g, ' ')} de ${subject}. Revisar los datos extraídos, validar su formalidad y ejecutar la acción correspondiente al área destinataria.`;
  }
}

function parseJsonResponse(raw: string): Record<string, unknown> {
  const withoutMarkdown = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  const firstBrace = withoutMarkdown.indexOf('{');
  const lastBrace = withoutMarkdown.lastIndexOf('}');
  if (firstBrace < 0 || lastBrace <= firstBrace) {
    throw new Error('Ollama no devolvió un objeto JSON');
  }
  return JSON.parse(withoutMarkdown.slice(firstBrace, lastBrace + 1)) as Record<string, unknown>;
}

function normalizeOllamaResult(value: Record<string, unknown>, text: string): ClassificationResult {
  const tipoDocumento = isDocumentType(value.tipoDocumento)
    ? value.tipoDocumento
    : 'DECLARACION_JURADA_MENSUAL';
  const campos = { ...extractFields(text), ...asStringRecord(value.campos) };
  const resumenEjecutivo = buildExecutiveSummary(tipoDocumento, campos);
  const informe = asRecord(value.informeEjecutivo);
  const baseReport = createExecutiveReport(tipoDocumento, campos, resumenEjecutivo);
  const informeEjecutivo: InformeEjecutivo = {
    ...informe,
    ...baseReport,
    identificacion: { ...asStringRecord(informe.identificacion), ...baseReport.identificacion },
    datosClave: { ...asRecord(informe.datosClave), ...baseReport.datosClave },
    resumenEjecutivo,
  };

  const report = createExecutiveReport(tipoDocumento, campos, resumenEjecutivo);
  return {
    tipoDocumento,
    area: getAreaByDocumentType(tipoDocumento),
    confianza: typeof value.confianza === 'number'
      ? Math.max(0, Math.min(1, value.confianza))
      : 0.5,
    campos,
    informeEjecutivo,
    resumenEjecutivo,
  };
}

function classifyByKeywords(text: string): ClassificationResult {
  const lowerText = text.toLocaleLowerCase('es');
  const rules: Array<{ tipo: SunatDocumentType; keywords: string[] }> = [
    { tipo: 'SOLICITUD_INSCRIPCION_RUC', keywords: ['formulario 2119', 'inscripción al ruc', 'actividad económica'] },
    { tipo: 'ACTUALIZACION_RUC', keywords: ['formulario 2119', 'actualización', 'cambio de domicilio'] },
    { tipo: 'RESOLUCION_APLAZAMIENTO_FRACCIONAMIENTO', keywords: ['aplazamiento', 'fraccionamiento', 'res-frac'] },
    { tipo: 'ORDEN_PAGO_OP', keywords: ['orden de pago', 'deuda exigible', 'fecha de vencimiento'] },
    { tipo: 'DECLARACION_JURADA_MENSUAL', keywords: ['declaración jurada mensual', 'ingresos', 'saldo a pagar'] },
    { tipo: 'DECLARACION_JURADA_ANUAL', keywords: ['declaración jurada anual', 'ejercicio', 'renta neta'] },
    { tipo: 'RESOLUCION_FRACCIONAMIENTO', keywords: ['resolución de fraccionamiento', 'cuotas', 'plan de pagos'] },
    { tipo: 'RESOLUCION_APLAZAMIENTO', keywords: ['aplazamiento', 'cronograma'] },
    { tipo: 'RESOLUCION_DETERMINACION_RD', keywords: ['resolución de determinación', 'deuda tributaria'] },
    { tipo: 'RESOLUCION_MULTA_RM', keywords: ['resolución de multa', 'infracción', 'sanción'] },
    { tipo: 'REQUERIMIENTO_FISCALIZACION', keywords: ['requerimiento', 'fiscalización'] },
    { tipo: 'AUDITORIA_LIBROS', keywords: ['libros contables', 'libro de ventas', 'libro de compras'] },
    { tipo: 'CARTA_PRESENTACION', keywords: ['carta de presentación'] },
    { tipo: 'NOTIFICACION_ELECTRONICA', keywords: ['notificación electrónica', 'buzón sunat'] },
  ];
  const best = rules
    .map((rule) => ({ ...rule, score: rule.keywords.filter((keyword) => lowerText.includes(keyword)).length }))
    .sort((left, right) => right.score - left.score)[0];
  const tipoDocumento = best?.score ? best.tipo : 'DECLARACION_JURADA_MENSUAL';
  const campos = extractFields(text);
  const resumenEjecutivo = buildExecutiveSummary(tipoDocumento, campos);
  const report = createExecutiveReport(tipoDocumento, campos, resumenEjecutivo);
  return {
    tipoDocumento,
    area: getAreaByDocumentType(tipoDocumento),
    confianza: best?.score ? Math.min(0.9, 0.5 + best.score * 0.1) : 0.3,
    campos,
    informeEjecutivo: report,
    resumenEjecutivo,
  };
}

export async function classifyWithOllama(text: string): Promise<ClassificationResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OLLAMA_TIMEOUT_MS);
  try {
    const response = await fetch(`${OLLAMA_HOST}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: buildClassifierPrompt(text),
        stream: false,
        format: 'json',
        options: { temperature: 0.1 },
      }),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`Ollama respondió HTTP ${response.status}`);
    const payload = await response.json() as { response?: string };
    if (!payload.response) throw new Error('Ollama devolvió una respuesta vacía');
    return normalizeOllamaResult(parseJsonResponse(payload.response), text);
  } catch (error) {
    console.warn('[IA] Ollama no disponible; se usa fallback local:', error instanceof Error ? error.message : error);
    return classifyByKeywords(text);
  } finally {
    clearTimeout(timeout);
  }
}
