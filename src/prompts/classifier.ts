// src/prompts/classifier.ts

export const CLASSIFIER_PROMPT = `Eres un clasificador de documentos SUNAT (Perú).

Clasifica en EXACTAMENTE UNA de estas 15 categorías:

**ÁREA: RECAUDACIÓN Y CONTROL MASIVO**
1. DECLARACION_JURADA_MENSUAL - DJ mensual, ingresos, renta neta, tributo, saldo a pagar, pagos a cuenta
2. DECLARACION_JURADA_ANUAL - DJ anual, ejercicio, renta neta, pagos a cuenta
3. RESOLUCION_FRACCIONAMIENTO - Aplazamiento, fraccionamiento, cuotas, cronograma, RES-FRAC
4. RESOLUCION_APLAZAMIENTO - Aplazamiento deuda, cronograma, RES-FRAC
6. ORDEN_PAGO_OP - Orden Pago, OP-, deuda exigible, vencimiento, total deuda
7. SOLICITUD_INSCRIPCION_RUC - Formulario 2119, inscripción RUC, actividad económica, domicilio fiscal
8. ACTUALIZACION_RUC - Formulario 2119, actualización RUC, cambio domicilio/actividad
9. RESOLUCION_DETERMINACION_RD - Resolución Determinación, RD, deuda tributaria

**ÁREA: FISCALIZACIÓN**
10. RESOLUCION_MULTA_RM - Resolución Multa, RM, infracción, sanción
11. REQUERIMIENTO_FISCALIZACION - Requerimiento fiscalización, carta indagatoria, libros
12. AUDITORIA_LIBROS - Libro Ventas, Libro Compras, Libro Diario, auditoría

**ÁREA: SERVICIOS AL CONTRIBUYENTE**
13. CARTA_PRESENTACION - Carta presentación, requerimiento fiscalización
14. NOTIFICACION_ELECTRONICA - Notificación electrónica, buzón SUNAT
15. ACTUALIZACION_RUC - Formulario 2119, actualización RUC, cambio domicilio/actividad

REGLAS PRIORIDAD (evalúa en orden):
1. "Formulario 2119" + "Inscripción RUC" + "actividad económica" → SOLICITUD_INSCRIPCION_RUC
2. "Aplazamiento" O "Fraccionamiento" O "RES-FRAC" → RESOLUCION_FRACCIONAMIENTO
3. "Orden de Pago" O "OP-" O "Deuda Exigible" → ORDEN_PAGO_OP
4. "Declaración Jurada" O "Ingresos" O "Renta Neta" → DECLARACION_JURADA_MENSUAL
5. "Resolución Multa" O "RM" O "Sanción" → RESOLUCION_MULTA_RM
5. "Requerimiento" O "Fiscalización" O "Indagatoria" → REQUERIMIENTO_FISCALIZACION
6. "Libro Ventas" O "Libro Compras" O "Libro Diario" O "Auditoría" → AUDITORIA_LIBROS

RESPONDE SOLO JSON VÁLIDO:
{"tipoDocumento": "DECLARACION_JURADA_MENSUAL", "confianza": 0.95}

Texto:
---
{text}
---`;

export function buildClassifierPrompt(text: string): string {
  const maxChars = 4000;
  const trimmedText = text.length > maxChars ? text.slice(0, maxChars) + '...' : text;
  return CLASSIFIER_PROMPT.replace('{text}', trimmedText);
}