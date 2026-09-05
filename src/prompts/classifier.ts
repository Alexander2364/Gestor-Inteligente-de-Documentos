// src/prompts/classifier.ts

export const CLASSIFIER_PROMPT = `Eres un analista documental de SUNAT. Lee el texto completo y clasifica el documento.
No inventes datos: usa una cadena vacía o un arreglo vacío cuando un dato no aparezca.
Devuelve SOLO un objeto JSON válido, sin markdown ni comentarios.

TIPOS (15):
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
{"tipoDocumento":"DECLARACION_JURADA_MENSUAL","confianza":0.95,"campos":{"ruc":"","periodo":"","ingresos":"","rentaNeta":"","saldoAPagar":"","totalDeuda":"","fechaVencimiento":"","numeroCuotas":""},"resumenEjecutivo":"Resumen factual en español, con deudor, periodo, montos, vencimientos y acción requerida.","informeEjecutivo":{"tipoInforme":"DECLARACION_JURADA_MENSUAL","contexto":"Por qué el documento importa para el área destinataria.","identificacion":{},"datosClave":{},"analisisRiesgo":{},"analisisCumplimiento":{},"urgencia":"","alertas":[],"accionesRequeridas":[]}}

El resumen debe ser ejecutivo y verificable: identificar al contribuyente, indicar importes y fechas relevantes, señalar inconsistencias o riesgos, y mencionar la acción siguiente. No confundas tributo calculado con saldo a pagar. La confianza debe estar entre 0 y 1.

Texto (máx 2500 chars):
---
{text}
---`;

export function buildClassifierPrompt(text: string): string {
  const maxChars = 12000;
  const trimmedText = text.length > maxChars ? text.slice(0, maxChars) + '...' : text;
  return CLASSIFIER_PROMPT.replace('{text}', trimmedText);
}