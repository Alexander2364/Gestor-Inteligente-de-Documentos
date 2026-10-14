import { describe, expect, it } from 'vitest';
import { buildClassifierPrompt } from '../../src/prompts/classifier';
import { detectActaType, extractActaFields } from '../../src/services/ia';

describe('buildClassifierPrompt', () => {
	it('incluye el texto recibido y limita documentos demasiado largos', () => {
		const prompt = buildClassifierPrompt('RUC 20123456789');
		const oversizedPrompt = buildClassifierPrompt('x'.repeat(15000));

		expect(prompt).toContain('RUC 20123456789');
		expect(oversizedPrompt).not.toContain('x'.repeat(12001));
		expect(oversizedPrompt).toContain('...');
	});
});

describe('detectActaType', () => {
	it.each([
		'[X] 01',
		'[x] 01',
		'01 [X]',
		'01 INMOVILIZACION [X]',
	])('detecta inmovilización con el checkbox OCR: %s', (text) => {
		expect(detectActaType(text)).toBe('ACTA_INMOVILIZACION');
	});

	it.each(['[X] 02', '[x] 02', '02 [X]', '02 INCAUTACION [X]'])
		('detecta incautación con el checkbox OCR: %s', (text) => {
			expect(detectActaType(text)).toBe('ACTA_INCAUTACION');
		});

	it('usa palabras clave cuando no hay checkbox detectable', () => {
		expect(detectActaType('La mercancía queda bajo custodia'))
			.toBe('ACTA_INMOVILIZACION');
		expect(detectActaType('Se dispone el comiso de la mercancía'))
			.toBe('ACTA_INCAUTACION');
	});

	it('devuelve null cuando no puede determinar el tipo', () => {
		expect(detectActaType('Acta sin opción marcada ni contexto suficiente')).toBeNull();
		expect(detectActaType('custodia y comiso')).toBeNull();
	});
});

describe('extractActaFields', () => {
	it('extrae datos del acta y múltiples bienes', () => {
		const fields = extractActaFields(`
			N° Acta: ACT-001
			[X] 01
			Fecha: 14/10/2026
			Hora: 09:30
			RUC: 20123456789
			Lugar de acción de control: Aduana del Callao
			Bien 1: cantidad: 10 unidad: cajas descripción: Repuestos observaciones: Sellados
			Bien 2: cantidad: 5 unidad: unidades descripción: Motores observaciones: Ninguna
			Peso: 125 kg
			Lugar de custodia: Almacén SUNAT
		`);

		expect(fields.numeroActa).toBe('ACT-001');
		expect(fields.tipoAccion).toBe('INMOVILIZACION');
		expect(fields.ruc).toBe('20123456789');
		expect(fields.bienes).toHaveLength(2);
		expect(fields.bienes[0]).toMatchObject({ cantidad: '10', unidadMedida: 'cajas' });
		expect(fields.bienes[1]).toMatchObject({ numero: '2', descripcion: 'Motores' });
		expect(fields.lugarCustodia).toBe('Almacén SUNAT');
	});

	it('devuelve estructura vacía cuando no encuentra campos', () => {
		const fields = extractActaFields('Texto sin datos de acta');

		expect(fields.numeroActa).toBe('');
		expect(fields.tipoAccion).toBe('');
		expect(fields.bienes).toEqual([]);
	});
});
