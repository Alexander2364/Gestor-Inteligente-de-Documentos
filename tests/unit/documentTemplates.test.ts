import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { load } from 'cheerio';
import { getDocumentTemplate } from '../../src/domain/templates';
import { getTemplatePath } from '../../src/domain/templates/index';
import { fillTemplate } from '../../src/domain/templates/templateFiller';

const templateTypes = [
  'DECLARACION_JURADA_MENSUAL',
  'RESOLUCION_FRACCIONAMIENTO',
  'ORDEN_PAGO_OP',
] as const;

describe('plantillas de documentos tributarios', () => {
  it.each(templateTypes)('registra y carga la plantilla %s', (tipoDocumento) => {
    const templatePath = getTemplatePath(tipoDocumento);
    const template = getDocumentTemplate(tipoDocumento);

    expect(templatePath).toBeTruthy();
    expect(template).toMatchObject({ tipoDocumento });

    const html = readFileSync(templatePath as string, 'utf8');
    const $ = load(html);
    expect($('form.documento').length).toBe(1);
    expect($('input, select, textarea').filter((_index, element) => !$(element).attr('name'))).toHaveLength(0);
  });

  it('incluye las secciones requeridas de la declaracion mensual', () => {
    const html = readFileSync(getTemplatePath('DECLARACION_JURADA_MENSUAL') as string, 'utf8');

    expect(html).toContain('DATOS DEL DECLARANTE');
    expect(html).toContain('INGRESOS Y RENTAS');
    expect(html).toContain('DEDUCCIONES Y GASTOS');
    expect(html).toContain('CALCULO DEL TRIBUTO');
    expect(html).toContain('PAGOS REALIZADOS');
    expect(html).toContain('RESULTADO');
  });

  it('incluye el cronograma de cuotas y permite rellenar sus campos', () => {
    const html = readFileSync(getTemplatePath('RESOLUCION_FRACCIONAMIENTO') as string, 'utf8');
    const output = fillTemplate(html, {
      cronograma: [{ numeroCuota: '1', totalCuota: '1250.00' }],
    });
    const $ = load(output);

    expect(html).toContain('CRONOGRAMA DE PAGOS');
    expect($('[name="cronograma[0].numeroCuota"]').attr('value')).toBe('1');
    expect($('[name="cronograma[0].totalCuota"]').attr('value')).toBe('1250.00');
  });

  it('incluye deuda exigible y total a pagar en la orden', () => {
    const html = readFileSync(getTemplatePath('ORDEN_PAGO_OP') as string, 'utf8');
    const $ = load(html);

    expect(html).toContain('DEUDA EXIGIBLE');
    expect(html).toContain('TOTAL A PAGAR');
    expect($('[name="deudaExigible"]').length).toBeGreaterThan(0);
    expect($('[name="totalDeuda"]').length).toBeGreaterThan(0);
  });
});
