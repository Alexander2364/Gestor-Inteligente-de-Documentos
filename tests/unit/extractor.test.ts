import { describe, expect, it } from 'vitest';
import { Workbook } from 'exceljs';
import { extractText } from '../../src/services/extractor';

describe('extractText', () => {
    it('extrae hojas y valores de un XLSX sin OCR', async () => {
        const workbook = new Workbook();
        const worksheet = workbook.addWorksheet('Deudas');
        worksheet.addRow(['RUC', 'Total deuda']);
        worksheet.addRow(['20123456789', '1500.50']);

        // En exceljs, el método correcto para obtener un Buffer es writeBuffer()
		// @ts-ignore: Conflicto de tipos entre @types/node (Buffer<ArrayBufferLike>) y exceljs.
        const buffer = await workbook.xlsx.writeBuffer() as Buffer;
        
        const result = await extractText(
            buffer, 
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 
            'deudas.xlsx'
        );

        expect(result.text).toContain('20123456789');
        expect(result.tables?.[0].name).toBe('Deudas');
        // Actualizamos la expectativa al nuevo nombre del extractor
        expect(result.metadata?.extractor).toBe('exceljs');
    });

    it('rechaza tipos no soportados', async () => {
        await expect(extractText(Buffer.from('contenido'), 'text/plain', 'nota.txt'))
            .rejects.toThrow('Tipo de archivo no soportado');
    });
});