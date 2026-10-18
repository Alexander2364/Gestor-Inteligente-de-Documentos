// src/prompts/classifierSchema.ts
//
// Esquemas JSON para el "structured output" de Gemini (campo
// `generationConfig.responseSchema`). Con esto la respuesta está garantizada por
// esquema y no dependemos de que el modelo "devuelva solo JSON".
//
// Los nombres y el orden de los campos replican el esquema que ya pide el prompt
// de `src/prompts/classifier.ts`, para que el resultado siga encajando con
// `normalizeClassificationResult` sin cambios.

/** Los 17 tipos SUNAT admitidos. Fuente única para el enum del esquema. */
export const CLASSIFIER_TYPE_NAMES = [
  'SOLICITUD_INSCRIPCION_RUC',
  'ACTUALIZACION_RUC',
  'DECLARACION_JURADA_MENSUAL',
  'DECLARACION_JURADA_ANUAL',
  'RESOLUCION_FRACCIONAMIENTO',
  'RESOLUCION_APLAZAMIENTO',
  'ORDEN_PAGO_OP',
  'RESOLUCION_DETERMINACION_RD',
  'RESOLUCION_MULTA_RM',
  'REQUERIMIENTO_FISCALIZACION',
  'AUDITORIA_LIBROS',
  'CARTA_PRESENTACION',
  'NOTIFICACION_ELECTRONICA',
  'SOLICITUD_APLAZAMIENTO',
  'RESOLUCION_APLAZAMIENTO_FRACCIONAMIENTO',
  'ACTA_INMOVILIZACION',
  'ACTA_INCAUTACION',
] as const;

const stringField = { type: 'string' };

const BIEN_ITEM_SCHEMA = {
  type: 'object',
  properties: {
    numero: stringField,
    cantidad: stringField,
    unidadMedida: stringField,
    descripcion: stringField,
    observaciones: stringField,
  },
  propertyOrdering: ['numero', 'cantidad', 'unidadMedida', 'descripcion', 'observaciones'],
};

const CAMPOS_PROPERTIES = {
  ruc: stringField,
  periodo: stringField,
  ingresos: stringField,
  rentaNeta: stringField,
  saldoAPagar: stringField,
  totalDeuda: stringField,
  fechaVencimiento: stringField,
  numeroCuotas: stringField,
  numeroActa: stringField,
  tipoAccion: stringField,
  fecha: stringField,
  hora: stringField,
  numeroAccionControl: stringField,
  lugarAccionControl: stringField,
  nombreAccionControl: stringField,
  formaIdentificacion: stringField,
  tipoPersona: stringField,
  apellidosNombres: stringField,
  tipoDocumentoIdentidad: stringField,
  numeroDocumentoIdentidad: stringField,
  domicilio: stringField,
  razonSocial: stringField,
  empresaTransportista: stringField,
  tipoVehiculo: stringField,
  matricula: stringField,
  manifiesto: stringField,
  procedencia: stringField,
  destino: stringField,
  documentoTransporte: stringField,
  regimenOperacionAduanera: stringField,
  numeroDeclaracion: stringField,
  fechaDeclaracion: stringField,
  fundamentoHecho: stringField,
  fundamentoDerecho: stringField,
  bienes: { type: 'array', items: BIEN_ITEM_SCHEMA },
  peso: stringField,
  lugarCustodia: stringField,
  observaciones: stringField,
};

const CAMPOS_SCHEMA = {
  type: 'object',
  properties: CAMPOS_PROPERTIES,
  propertyOrdering: Object.keys(CAMPOS_PROPERTIES),
};

/** Esquema del flujo de cámara: sin `informeEjecutivo` (se reconstruye local). */
export const COMPACT_RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    tipoDocumento: { type: 'string', enum: [...CLASSIFIER_TYPE_NAMES] },
    confianza: { type: 'number' },
    campos: CAMPOS_SCHEMA,
    resumenEjecutivo: { type: 'string' },
  },
  required: ['tipoDocumento', 'confianza', 'campos', 'resumenEjecutivo'],
  propertyOrdering: ['tipoDocumento', 'confianza', 'campos', 'resumenEjecutivo'],
};

/**
 * Esquema del flujo completo: añade las partes textuales de `informeEjecutivo`.
 * Los mapas libres (identificacion, datosClave, analisisRiesgo, ...) no se piden
 * al modelo porque `normalizeClassificationResult` los reconstruye localmente.
 */
export const FULL_RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    ...COMPACT_RESPONSE_SCHEMA.properties,
    informeEjecutivo: {
      type: 'object',
      properties: {
        tipoInforme: stringField,
        contexto: stringField,
        urgencia: stringField,
        alertas: { type: 'array', items: stringField },
        accionesRequeridas: { type: 'array', items: stringField },
      },
      propertyOrdering: ['tipoInforme', 'contexto', 'urgencia', 'alertas', 'accionesRequeridas'],
    },
  },
  required: ['tipoDocumento', 'confianza', 'campos', 'resumenEjecutivo'],
  propertyOrdering: ['tipoDocumento', 'confianza', 'campos', 'resumenEjecutivo', 'informeEjecutivo'],
};
