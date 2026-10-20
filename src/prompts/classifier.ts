// src/prompts/classifier.ts

export const CLASSIFIER_PROMPT = `Eres un analista documental de SUNAT. Lee el texto completo y clasifica el documento.
No inventes datos: usa una cadena vacía o un arreglo vacío cuando un dato no aparezca.
Devuelve SOLO un objeto JSON válido, sin markdown ni comentarios.

TIPOS (17):
1. SOLICITUD_INSCRIPCION_RUC
2. ACTUALIZACION_RUC
3. DECLARACION_JURADA_MENSUAL
4. DECLARACION_JURADA_ANUAL
5. RESOLUCION_FRACCIONAMIENTO
6. RESOLUCION_APLAZAMIENTO
7. ORDEN_PAGO_OP
8. RESOLUCION_DETERMINACION_RD
9. RESOLUCION_MULTA_RM
10. REQUERIMIENTO_FISCALIZACION
11. AUDITORIA_LIBROS
12. CARTA_PRESENTACION
13. NOTIFICACION_ELECTRONICA
14. SOLICITUD_APLAZAMIENTO
15. RESOLUCION_APLAZAMIENTO_FRACCIONAMIENTO
16. ACTA_INMOVILIZACION
17. ACTA_INCAUTACION

REGLAS PARA ACTAS ADUANERAS:
1. Si el documento contiene "ACTA DE INMOVILIZACIÓN - INCAUTACIÓN" y está marcada la opción "01 INMOVILIZACIÓN", clasifica como ACTA_INMOVILIZACION.
2. Si el documento contiene "ACTA DE INMOVILIZACIÓN - INCAUTACIÓN" y está marcada la opción "02 INCAUTACIÓN", clasifica como ACTA_INCAUTACION.
3. Prioriza la opción marcada del formulario sobre el título del documento.
4. Usa la custodia, inmovilización o retención de la mercancía como información complementaria, sin sustituir la opción marcada.

Para las actas, extrae también número de acta, tipo de acción, fecha, hora, acción de control, identificación del intervenido, datos de identidad, domicilio, razón social, RUC, transporte, manifiesto, procedencia, destino, documento de transporte, régimen aduanero, declaración, fundamentos, bienes, peso, lugar de custodia, servidores, representantes y entrega al almacén.
En "peso" y en "cantidad" de cada bien devuelve únicamente el número (con punto decimal y sin unidades, monedas ni etiquetas); por ejemplo "3.10", no "3.10 Y:".

Cada bien debe conservarse como un elemento del arreglo bienes con esta estructura:
{"numero":"","cantidad":"","unidadMedida":"","descripcion":"","observaciones":""}

REGLAS DE PRIORIDAD (ORDEN ESTRICTO):
1. "Formulario 2119" + ("Inscripción al RUC" | "Inscripción al RUC" | "Solicitud de Inscripción") → SOLICITUD_INSCRIPCION_RUC
2. "Formulario 2119" + ("Actualización" | "Actualización RUC" | "Cambio de domicilio" | "Cambio de actividad") → ACTUALIZACION_RUC
3. ("Resolución de Aplazamiento y/o Fraccionamiento" | "Aplazamiento y Fraccionamiento" | "RES-FRAC") → RESOLUCION_APLAZAMIENTO_FRACCIONAMIENTO
4. "Orden de Pago" | "OP-" → ORDEN_PAGO_OP
5. "Declaración Jurada Mensual" → DECLARACION_JURADA_MENSUAL
6. "Declaración Jurada Anual" → DECLARACION_JURADA_ANUAL
7. "Resolución de Fraccionamiento" → RESOLUCION_FRACCIONAMIENTO
8. "Aplazamiento" (SIN "fraccionamiento") → RESOLUCION_APLAZAMIENTO
9. "Orden de Pago" | "OP-" → ORDEN_PAGO_OP

DIFERENCIADORES CLAVE:
- SOLICITUD_INSCRIPCION_RUC: "Formulario 2119" + "Inscripción al RUC" + "CIIU" + "Actividad Económica" + "Domicilio Fiscal"
- ACTUALIZACION_RUC: "Formulario 2119" + "Actualización" + "Cambio Domicilio/Actividad"
- DECLARACION_JURADA_MENSUAL: "Declaración Jurada Mensual" + "Período" + "Ingresos" + "Renta Neta" + "Tributo" + "Saldo a Pagar"
- DECLARACION_JURADA_ANUAL: "Declaración Jurada Anual" + "Ejercicio" + "Renta Neta" + "Pagos a Cuenta"
- RESOLUCION_FRACCIONAMIENTO: "Resolución de Fraccionamiento" + "Fraccionamiento" + "Cuotas" + "RES-FRAC" + "Plan de Pagos"
- RESOLUCION_APLAZAMIENTO: "Aplazamiento" + "Cronograma" + "Aplazamiento" + "RES-FRAC" (SIN fraccionamiento)
- ORDEN_PAGO_OP: "Orden de Pago" + "OP-" + "Deuda Exigible" + "Vencimiento" + "Total Deuda"
- RESOLUCION_APLAZAMIENTO_FRACCIONAMIENTO: "Aplazamiento y Fraccionamiento" + "RES-FRAC" + "Aplazamiento y Fraccionamiento"
- ORDEN_PAGO_OP: "Orden de Pago" + "OP-" + "Deuda Exigible" + "Vencimiento" + "Total Deuda"

El JSON debe tener exactamente esta estructura base:
{"tipoDocumento":"DECLARACION_JURADA_MENSUAL","confianza":0.95,"campos":{"ruc":"","periodo":"","ingresos":"","rentaNeta":"","saldoAPagar":"","totalDeuda":"","fechaVencimiento":"","numeroCuotas":"","numeroActa":"","tipoAccion":"","fecha":"","hora":"","numeroAccionControl":"","lugarAccionControl":"","nombreAccionControl":"","formaIdentificacion":"","tipoPersona":"","apellidosNombres":"","tipoDocumentoIdentidad":"","numeroDocumentoIdentidad":"","domicilio":"","razonSocial":"","empresaTransportista":"","tipoVehiculo":"","matricula":"","manifiesto":"","procedencia":"","destino":"","documentoTransporte":"","regimenOperacionAduanera":"","numeroDeclaracion":"","fechaDeclaracion":"","fundamentoHecho":"","fundamentoDerecho":"","bienes":[],"peso":"","lugarCustodia":"","observaciones":""},"resumenEjecutivo":"Análisis breve en español: qué pasó y quién, qué está en juego (monto o mercancía), qué falta por confirmar, acción recomendada y riesgo. En actas, incluir tipo, número, fecha, lugar, intervenido, mercancía, cantidad y peso.","informeEjecutivo":{"tipoInforme":"DECLARACION_JURADA_MENSUAL","contexto":"Por qué el documento importa para el área destinataria.","identificacion":{},"datosClave":{},"analisisRiesgo":{},"analisisCumplimiento":{},"urgencia":"","alertas":[],"accionesRequeridas":[]}}

El resumen debe ser un análisis breve para el gestor, no una lista de datos: qué pasó y quién es el sujeto, qué está en juego (monto o mercancía), qué falta por confirmar, la acción recomendada y el riesgo si no se actúa. No copies texto ilegible del OCR: si un dato no se lee, escríbelo como "no identificado". No confundas tributo calculado con saldo a pagar. La confianza debe estar entre 0 y 1.

Texto (máx 2500 chars):
---
{text}
---`;

/**
 * Variante compacta del prompt para el flujo de escaneo con cámara (hardware sin GPU).
 * Pide solo tipoDocumento, confianza, campos y resumenEjecutivo: se omite la clave
 * `informeEjecutivo`, que el backend reconstruye localmente en `normalizeClassificationResult`
 * a partir de `createExecutiveReport`. Así el modelo genera muchos menos tokens y
 * termina dentro del timeout en vez de divagar hasta los 10 minutos.
 */
const COMPACT_SCHEMA =
  '{"tipoDocumento":"DECLARACION_JURADA_MENSUAL","confianza":0.95,"campos":{"ruc":"","periodo":"","ingresos":"","rentaNeta":"","saldoAPagar":"","totalDeuda":"","fechaVencimiento":"","numeroCuotas":"","numeroActa":"","tipoAccion":"","fecha":"","hora":"","numeroAccionControl":"","lugarAccionControl":"","nombreAccionControl":"","formaIdentificacion":"","tipoPersona":"","apellidosNombres":"","tipoDocumentoIdentidad":"","numeroDocumentoIdentidad":"","domicilio":"","razonSocial":"","empresaTransportista":"","tipoVehiculo":"","matricula":"","manifiesto":"","procedencia":"","destino":"","documentoTransporte":"","regimenOperacionAduanera":"","numeroDeclaracion":"","fechaDeclaracion":"","fundamentoHecho":"","fundamentoDerecho":"","bienes":[],"peso":"","lugarCustodia":"","observaciones":""},"resumenEjecutivo":"Análisis breve en español: qué pasó, qué está en juego, qué falta, acción y riesgo."}';

const COMPACT_CLASSIFIER_PROMPT = CLASSIFIER_PROMPT.replace(
  /\{"tipoDocumento"[\s\S]*?"accionesRequeridas":\[\]\}\}/,
  COMPACT_SCHEMA,
);

function renderPrompt(template: string, text: string): string {
  const maxChars = 12000;
  const trimmedText = text.length > maxChars ? text.slice(0, maxChars) + '...' : text;
  return template.replace('{text}', trimmedText);
}

export function buildClassifierPrompt(text: string): string {
  return renderPrompt(CLASSIFIER_PROMPT, text);
}

export function buildCompactClassifierPrompt(text: string): string {
  return renderPrompt(COMPACT_CLASSIFIER_PROMPT, text);
}
