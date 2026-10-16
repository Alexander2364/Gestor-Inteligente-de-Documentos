import path from 'node:path';

export const TEMPLATES: Record<string, string | null> = {
  ACTA_INMOVILIZACION: path.join(__dirname, 'actaInmovilizacion.html'),
  ACTA_INCAUTACION: path.join(__dirname, 'actaInmovilizacion.html'),
  DECLARACION_JURADA_MENSUAL: path.join(__dirname, 'declaracionJuradaMensual.html'),
  RESOLUCION_FRACCIONAMIENTO: path.join(__dirname, 'resolucionFraccionamiento.html'),
  ORDEN_PAGO_OP: path.join(__dirname, 'ordenPagoOp.html'),
};

export function getTemplatePath(tipoDocumento: string): string | null {
  return TEMPLATES[tipoDocumento] ?? null;
}
