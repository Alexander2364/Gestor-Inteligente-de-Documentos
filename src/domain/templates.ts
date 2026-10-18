export interface TemplateField {
  nombre: string;
  label: string;
  tipo: 'text' | 'select' | 'array';
  requerido?: boolean;
  opciones?: string[];
  subcampos?: TemplateField[];
}

export interface DocumentTemplate {
  tipoDocumento: string;
  area: string;
  campos: TemplateField[];
}

const actaFields: TemplateField[] = [
  { nombre: 'numeroActa', label: 'N° Acta', tipo: 'text', requerido: true },
  {
    nombre: 'tipoAccion',
    label: 'Tipo de Acción',
    tipo: 'select',
    opciones: ['INMOVILIZACIÓN', 'INCAUTACIÓN'],
  },
  { nombre: 'fecha', label: 'Fecha', tipo: 'text', requerido: true },
  { nombre: 'hora', label: 'Hora', tipo: 'text' },
  { nombre: 'numeroAccionControl', label: 'N° Acción de Control', tipo: 'text' },
  { nombre: 'lugarAccionControl', label: 'Lugar de Acción de Control', tipo: 'text' },
  { nombre: 'apellidosNombres', label: 'Apellidos y Nombres', tipo: 'text' },
  { nombre: 'razonSocial', label: 'Razón Social', tipo: 'text' },
  { nombre: 'ruc', label: 'RUC', tipo: 'text' },
  { nombre: 'domicilio', label: 'Domicilio', tipo: 'text' },
  { nombre: 'empresaTransportista', label: 'Empresa Transportista', tipo: 'text' },
  { nombre: 'tipoVehiculo', label: 'Tipo de Vehículo', tipo: 'text' },
  { nombre: 'matricula', label: 'Matrícula', tipo: 'text' },
  { nombre: 'manifiesto', label: 'Manifiesto', tipo: 'text' },
  { nombre: 'procedencia', label: 'Procedencia', tipo: 'text' },
  { nombre: 'destino', label: 'Destino', tipo: 'text' },
  { nombre: 'documentoTransporte', label: 'Documento de Transporte', tipo: 'text' },
  { nombre: 'regimenOperacionAduanera', label: 'Régimen u Operación Aduanera', tipo: 'text' },
  { nombre: 'numeroDeclaracion', label: 'N° Declaración', tipo: 'text' },
  { nombre: 'fundamentoHecho', label: 'Fundamento de Hecho', tipo: 'text' },
  { nombre: 'fundamentoDerecho', label: 'Fundamento de Derecho', tipo: 'text' },
  {
    nombre: 'bienes',
    label: 'Bienes',
    tipo: 'array',
    subcampos: [
      { nombre: 'numero', label: 'N°', tipo: 'text' },
      { nombre: 'cantidad', label: 'Cantidad', tipo: 'text' },
      { nombre: 'unidadMedida', label: 'Unidad de Medida', tipo: 'text' },
      { nombre: 'descripcion', label: 'Descripción', tipo: 'text' },
      { nombre: 'observaciones', label: 'Observaciones', tipo: 'text' },
    ],
  },
  { nombre: 'peso', label: 'Peso', tipo: 'text' },
  { nombre: 'lugarCustodia', label: 'Lugar de Custodia', tipo: 'text' },
  { nombre: 'observaciones', label: 'Observaciones', tipo: 'text' },
];

const declaracionJuradaMensualFields: TemplateField[] = [
  { nombre: 'ruc', label: 'RUC', tipo: 'text', requerido: true },
  { nombre: 'razonSocial', label: 'Razon social', tipo: 'text', requerido: true },
  { nombre: 'periodo', label: 'Periodo', tipo: 'text', requerido: true },
  { nombre: 'ingresos', label: 'Total ingresos', tipo: 'text' },
  { nombre: 'rentaNeta', label: 'Renta neta', tipo: 'text' },
  { nombre: 'deducciones', label: 'Total deducciones', tipo: 'text' },
  { nombre: 'tributoDeterminado', label: 'Tributo determinado', tipo: 'text' },
  { nombre: 'pagosRealizados', label: 'Total pagos', tipo: 'text' },
  { nombre: 'saldoAPagar', label: 'Saldo a pagar', tipo: 'text' },
  { nombre: 'saldoAFavor', label: 'Saldo a favor', tipo: 'text' },
];

const resolucionFraccionamientoFields: TemplateField[] = [
  { nombre: 'numeroResolucion', label: 'Numero de resolucion', tipo: 'text', requerido: true },
  { nombre: 'fechaResolucion', label: 'Fecha de resolucion', tipo: 'text', requerido: true },
  { nombre: 'ruc', label: 'RUC', tipo: 'text' },
  { nombre: 'razonSocial', label: 'Razon social', tipo: 'text' },
  { nombre: 'totalDeuda', label: 'Total deuda', tipo: 'text' },
  {
    nombre: 'modalidad',
    label: 'Modalidad',
    tipo: 'select',
    opciones: ['FRACCIONAMIENTO', 'APLAZAMIENTO'],
  },
  { nombre: 'numeroCuotas', label: 'Numero de cuotas', tipo: 'text' },
  { nombre: 'fechaVencimiento', label: 'Fecha primer vencimiento', tipo: 'text' },
  { nombre: 'cronograma', label: 'Cronograma de pagos', tipo: 'array' },
];

const ordenPagoFields: TemplateField[] = [
  { nombre: 'numeroOrden', label: 'Numero de orden', tipo: 'text', requerido: true },
  { nombre: 'fechaEmision', label: 'Fecha de emision', tipo: 'text', requerido: true },
  { nombre: 'fechaVencimiento', label: 'Fecha de vencimiento', tipo: 'text', requerido: true },
  { nombre: 'ruc', label: 'RUC', tipo: 'text' },
  { nombre: 'razonSocial', label: 'Razon social', tipo: 'text' },
  { nombre: 'deudaExigible', label: 'Deuda exigible', tipo: 'text' },
  { nombre: 'totalDeuda', label: 'Total a pagar', tipo: 'text' },
];

export const documentTemplates: Record<string, DocumentTemplate> = {
  ACTA_INMOVILIZACION: {
    tipoDocumento: 'ACTA_INMOVILIZACION',
    area: 'Prevención del Contrabando',
    campos: actaFields,
  },
  ACTA_INCAUTACION: {
    tipoDocumento: 'ACTA_INCAUTACION',
    area: 'Prevención del Contrabando',
    campos: actaFields,
  },
  DECLARACION_JURADA_MENSUAL: {
    tipoDocumento: 'DECLARACION_JURADA_MENSUAL',
    area: 'Intendencia de Recaudacion y Control Masivo',
    campos: declaracionJuradaMensualFields,
  },
  RESOLUCION_FRACCIONAMIENTO: {
    tipoDocumento: 'RESOLUCION_FRACCIONAMIENTO',
    area: 'Intendencia de Recaudacion y Control Masivo',
    campos: resolucionFraccionamientoFields,
  },
  ORDEN_PAGO_OP: {
    tipoDocumento: 'ORDEN_PAGO_OP',
    area: 'Intendencia de Recaudacion y Control Masivo',
    campos: ordenPagoFields,
  },
};

export function getDocumentTemplate(tipoDocumento: string): DocumentTemplate | undefined {
  return documentTemplates[tipoDocumento];
}
