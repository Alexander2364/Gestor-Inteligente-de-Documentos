import { describe, expect, it } from 'vitest';
import { buildStoredReport, fieldsFromMetadata } from '../../src/services/documentReadModel';

const HOY = new Date('2026-10-19T00:00:00Z');

describe('fieldsFromMetadata', () => {
  it('convierte las filas en el mapa de campos y deserializa los compuestos', () => {
    const campos = fieldsFromMetadata([
      { field_name: 'numeroActa', field_value: 'ACT-001' },
      { field_name: 'peso', field_value: '115.23' },
      { field_name: 'bienes', field_value: '[{"cantidad":"115","descripcion":"collares"}]' },
      { field_name: '  ', field_value: 'sin nombre' },
      { field_name: 'vacio', field_value: null },
      { field_name: 'otro', field_value: '' },
      null,
      'no es una fila',
    ]);

    expect(campos).toEqual({
      numeroActa: 'ACT-001',
      peso: '115.23',
      bienes: [{ cantidad: '115', descripcion: 'collares' }],
    });
  });

  it('deja el texto tal cual cuando el JSON está roto', () => {
    const campos = fieldsFromMetadata([{ field_name: 'bienes', field_value: '[no es json]' }]);
    expect(campos.bienes).toBe('[no es json]');
  });

  it('devuelve un mapa vacío si no hay metadatos', () => {
    expect(fieldsFromMetadata(undefined)).toEqual({});
    expect(fieldsFromMetadata({})).toEqual({});
  });
});

describe('buildStoredReport', () => {
  it('reconstruye el informe de un acta ya procesada', () => {
    const report = buildStoredReport(
      {
        document_analysis: [{ document_category: 'ACTA_INMOVILIZACION' }],
        extracted_metadata: [
          { field_name: 'numeroActa', field_value: 'ACT-001' },
          { field_name: 'fecha', field_value: '04/03/2020' },
          { field_name: 'consignatario', field_value: 'SANTA CRUZ CABRERA, JUDITH KATHERINE' },
          { field_name: 'bienes', field_value: '[{"cantidad":"115","descripcion":"collares"}]' },
        ],
      },
      HOY,
    );

    expect(report?.informeEjecutivo.identificacion).toMatchObject({
      Consignatario: 'SANTA CRUZ CABRERA, JUDITH KATHERINE',
    });
    expect(report?.informeEjecutivo.datosClave['Mercancía']).toBe('115 de collares');
    expect(report?.informeEjecutivo.alertas?.join(' ')).toContain('18/03/2020');
    expect(report?.resumenEjecutivo).toContain('ACT-001');
    expect(report?.resumenEjecutivo).not.toContain('contribuyente no identificado');
  });

  it('acepta document_analysis como objeto, no solo como arreglo', () => {
    const report = buildStoredReport(
      {
        document_analysis: { document_category: 'ORDEN_PAGO_OP' },
        extracted_metadata: [{ field_name: 'contribuyente', field_value: 'ANDINA S.A.C.' }],
      },
      HOY,
    );

    expect(report?.informeEjecutivo.tipoInforme).toBe('ORDEN_PAGO_OP');
    expect(report?.informeEjecutivo.identificacion.Contribuyente).toBe('ANDINA S.A.C.');
  });

  it('devuelve null cuando el documento todavía no tiene una categoría válida', () => {
    expect(buildStoredReport({}, HOY)).toBeNull();
    expect(buildStoredReport({ document_analysis: [] }, HOY)).toBeNull();
    expect(
      buildStoredReport({ document_analysis: [{ document_category: 'DOCUMENTO_GENERAL' }] }, HOY),
    ).toBeNull();
    expect(
      buildStoredReport({ document_analysis: [{ document_category: 'TIPO_INVENTADO' }] }, HOY),
    ).toBeNull();
  });
});
