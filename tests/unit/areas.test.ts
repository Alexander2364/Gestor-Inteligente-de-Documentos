import { describe, expect, it } from 'vitest';
import {
  getAreaByDocumentType,
  getDestinationEmailByDocumentType,
} from '../../src/domain/sunat/areas';

describe('mapeo de áreas SUNAT', () => {
  it('deriva las actas al área de prevención del contrabando', () => {
    expect(getAreaByDocumentType('ACTA_INMOVILIZACION')).toBe(
      'PREVENCION_CONTRABANDO_FISCALIZACION_ADUANERA',
    );
    expect(getAreaByDocumentType('ACTA_INCAUTACION')).toBe(
      'PREVENCION_CONTRABANDO_FISCALIZACION_ADUANERA',
    );
  });

  it('mantiene el área por defecto para tipos desconocidos', () => {
    expect(getAreaByDocumentType('TIPO_DESCONOCIDO')).toBe(
      'INTENDENCIA_RECAUDACION_CONTROL_MASIVO',
    );
  });

  it('usa el correo de fiscalización aduanera para las actas', () => {
    expect(getDestinationEmailByDocumentType('ACTA_INMOVILIZACION')).toBe(
      'aduanas.fiscalizacion@sunat.gob.pe',
    );
    expect(getDestinationEmailByDocumentType('ACTA_INCAUTACION')).toBe(
      'aduanas.fiscalizacion@sunat.gob.pe',
    );
  });
});
