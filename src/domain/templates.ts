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
};

export function getDocumentTemplate(tipoDocumento: string): DocumentTemplate | undefined {
  return documentTemplates[tipoDocumento];
}
