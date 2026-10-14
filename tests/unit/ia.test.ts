import { describe, expect, it } from 'vitest';
import { buildClassifierPrompt } from '../../src/prompts/classifier';
import { detectActaType } from '../../src/services/ia';

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
