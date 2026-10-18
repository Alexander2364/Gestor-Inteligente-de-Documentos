import { describe, expect, it } from 'vitest';
import { Workbook } from 'exceljs';
import sharp from 'sharp';
import { extractText, preprocessMobileImage } from '../../src/services/extractor';

describe('extractText', () => {
  it('preprocesa fotos móviles: PNG en escala de grises, escalado y sin umbral duro', async () => {
    const input = await sharp({
      create: {
        width: 8,
        height: 4,
        channels: 3,
        background: { r: 120, g: 120, b: 120 },
      },
    })
      .jpeg()
      .toBuffer();

    const output = await preprocessMobileImage(input);
    const metadata = await sharp(output).metadata();

    expect(metadata.format).toBe('png');
    expect(metadata.channels).toBe(1);
    expect(metadata.width).toBe(2000);
  });

  it('extrae hojas y valores de un XLSX sin OCR', async () => {
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet('Deudas');
    worksheet.addRow(['RUC', 'Total deuda']);
    worksheet.addRow(['20123456789', '1500.50']);

    // En exceljs, el método correcto para obtener un Buffer es writeBuffer()
    // @ts-expect-error: Conflicto de tipos entre @types/node (Buffer<ArrayBufferLike>) y exceljs.
    const buffer = (await workbook.xlsx.writeBuffer()) as Buffer;

    const result = await extractText(
      buffer,
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'deudas.xlsx',
    );

    expect(result.text).toContain('20123456789');
    expect(result.tables?.[0].name).toBe('Deudas');
    // Actualizamos la expectativa al nuevo nombre del extractor
    expect(result.metadata?.extractor).toBe('exceljs');
  });

  it('rechaza tipos no soportados', async () => {
    await expect(extractText(Buffer.from('contenido'), 'text/plain', 'nota.txt')).rejects.toThrow(
      'Tipo de archivo no soportado',
    );
  });
});
