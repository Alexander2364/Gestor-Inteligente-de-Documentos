import path from 'node:path';

export const TEMPLATES: Record<string, string | null> = {
  ACTA_INMOVILIZACION: path.join(__dirname, 'actaInmovilizacion.html'),
  ACTA_INCAUTACION: path.join(__dirname, 'actaInmovilizacion.html'),
  DECLARACION_JURADA_MENSUAL: null,
  RESOLUCION_FRACCIONAMIENTO: null,
  ORDEN_PAGO_OP: null,
};

export function getTemplatePath(tipoDocumento: string): string | null {
  return TEMPLATES[tipoDocumento] ?? null;
}
