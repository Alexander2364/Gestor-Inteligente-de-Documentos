import { describe, expect, it } from 'vitest';
import {
  validateActa,
  validateDeclaracion,
  validateFraccionamiento,
} from '../../src/domain/templates/validators';

describe('validators', () => {
  it('valida un acta y sus formatos', () => {
    expect(validateActa({
      numeroActa: 'ACT-001',
      fecha: '14/10/2026',
      ruc: '20123456789',
      peso: '125.50',
    })).toEqual({ valido: true, errores: [] });

    const result = validateActa({ numeroActa: '', fecha: '2026-02-31', ruc: '123' });
    expect(result.valido).toBe(false);
    expect(result.errores).toEqual(expect.arrayContaining([
      'Número de acta es requerido',
      expect.stringContaining('Fecha debe tener formato'),
      'RUC debe contener exactamente 11 dígitos',
    ]));
  });

  it('valida campos críticos y números de una declaración mensual', () => {
    expect(validateDeclaracion({
      ruc: '20123456789',
      razonSocial: 'Empresa Demo',
      periodo: '10/2026',
      ingresos: 'S/ 1,234.50',
      rentaNeta: '1000.00',
      tributoDeterminado: '180.00',
      saldoAPagar: 180,
    })).toEqual({ valido: true, errores: [] });

    const result = validateDeclaracion({
      ruc: '201234567890',
      periodo: '13/2026',
      ingresos: 'mucho',
      rentaNeta: '',
    });
    expect(result.valido).toBe(false);
    expect(result.errores).toEqual(expect.arrayContaining([
      'RUC debe contener exactamente 11 dígitos',
      'Período debe tener formato MM/YYYY, YYYY-MM o YYYY',
      'Ingresos debe ser un número válido',
      'Renta neta es requerido',
      'Tributo determinado es requerido',
      'Saldo a pagar o saldo a favor es requerido',
    ]));
  });

  it('valida resolución de fraccionamiento', () => {
    expect(validateFraccionamiento({
      numeroResolucion: 'RES-001',
      ruc: '20123456789',
      totalDeuda: '1250.00',
      modalidad: 'FRACCIONAMIENTO',
      numeroCuotas: '6',
      fechaVencimiento: '2026-11-30',
    })).toEqual({ valido: true, errores: [] });

    const result = validateFraccionamiento({
      numeroResolucion: 'RES-001',
      ruc: '20123456789',
      totalDeuda: 'S/ pendiente',
      modalidad: 'FRACCIONAMIENTO',
      numeroCuotas: 'seis',
      fechaVencimiento: '31/02/2026',
    });
    expect(result.valido).toBe(false);
    expect(result.errores).toEqual(expect.arrayContaining([
      'Total de deuda debe ser un número válido',
      'Número de cuotas debe ser un número válido',
      expect.stringContaining('Fecha de vencimiento debe tener formato'),
    ]));
  });
});
