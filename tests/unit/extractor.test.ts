import { describe, expect, it } from 'vitest';
import * as XLSX from 'xlsx';
import { extractText } from '../../src/services/extractor';

describe('extractText', () => {
	it('extrae hojas y valores de un XLSX sin OCR', async () => {
		const workbook = XLSX.utils.book_new();
		const sheet = XLSX.utils.aoa_to_sheet([
			['RUC', 'Total deuda'],
			['20123456789', '1500.50'],
		]);
		XLSX.utils.book_append_sheet(workbook, sheet, 'Deudas');
		const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

		const result = await extractText(buffer, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'deudas.xlsx');

		expect(result.text).toContain('20123456789');
		expect(result.tables?.[0].name).toBe('Deudas');
		expect(result.metadata?.extractor).toBe('xlsx');
	});

	it('rechaza tipos no soportados', async () => {
		await expect(extractText(Buffer.from('contenido'), 'text/plain', 'nota.txt'))
			.rejects.toThrow('Tipo de archivo no soportado');
	});
});
