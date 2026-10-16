import { describe, expect, it } from 'vitest';
import { buildClassifierPrompt } from '../../src/prompts/classifier';
import { classifyByKeywords, detectActaType, extractActaFields } from '../../src/services/ia';
import { validateDocumentData } from '../../src/domain/templates/validators';

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

	it('extrae el número de acta impreso en el título del formulario', () => {
		const fields = extractActaFields(`
			SUNAT
			ACTA DE INMOVILIZACIÓN - INCAUTACIÓN N° 235 - 0105 - 2020 - N° 000067
			1.1 FECHA 04.03.2020
		`);
		const compact = extractActaFields('ACTA DE INCAUTACIÓN N°235-0105-2020');

		expect(fields.numeroActa).toBe('235-0105-2020');
		expect(compact.numeroActa).toBe('235-0105-2020');
	});
});

describe('classifyByKeywords (fallback local cuando Ollama no responde)', () => {
	it('extrae los campos del acta con las reglas locales', () => {
		const result = classifyByKeywords(`
			ACTA DE INMOVILIZACIÓN - INCAUTACIÓN
			[X] 02 INCAUTACION
			N° Acta: ACT-2026-001
			Fecha: 14/10/2026
			RUC: 20123456789
			Lugar de custodia: Almacén SUNAT
			Bien 1: cantidad: 10 unidad: cajas descripción: Repuestos observaciones: Sellados
		`);

		expect(result.tipoDocumento).toBe('ACTA_INCAUTACION');
		expect(result.campos.numeroActa).toBe('ACT-2026-001');
		expect(result.campos.fecha).toBe('14/10/2026');
		expect(result.campos.lugarCustodia).toBe('Almacén SUNAT');
	});

	it('no inyecta campos de acta en documentos que no son actas', () => {
		const result = classifyByKeywords('Declaración Jurada Mensual del período 09/2026 con ingresos S/ 1,000');

		expect(result.tipoDocumento).toBe('DECLARACION_JURADA_MENSUAL');
		expect(result.campos).not.toHaveProperty('numeroActa');
	});

	it('normaliza el peso con ruido OCR y deja el acta válida', () => {
		const result = classifyByKeywords(`
			ACTA DE INMOVILIZACIÓN - INCAUTACIÓN
			[X] 02 INCAUTACION
			N° Acta: 235-0105
			Fecha: 01/01/2020
			Peso: 3.10 Y:
		`);

		expect(result.tipoDocumento).toBe('ACTA_INCAUTACION');
		expect(result.campos.peso).toBe('3.10');
		expect(validateDocumentData(result.tipoDocumento, result.campos).valido).toBe(true);
	});

	it('valida un acta con fecha con puntos y número en el título (fallback local)', () => {
		const result = classifyByKeywords(`
			ACTA DE INMOVILIZACIÓN - INCAUTACIÓN N° 235 - 0105 - 2020 - N° 000067
			[X] 01 INMOVILIZACION
			1.1 FECHA 04.03.2020
			1.2 HORA 13:38
			Peso: 3.420 KG
		`);

		expect(result.campos.numeroActa).toBe('235-0105-2020');
		expect(result.campos.fecha).toBe('04/03/2020');
		expect(result.campos.peso).toBe('3.420');
		expect(validateDocumentData(result.tipoDocumento, result.campos).valido).toBe(true);
	});

	it('reconoce el acta por el título aunque la casilla no sea legible (OCR real)', () => {
		// Texto tal como lo devuelve el OCR mejorado de una foto: la casilla marcada
		// no se distingue, pero aparecen "FISCALIZACIÓN" y "CUSTODIA" (que antes no
		// se leían). Sin la detección por título, se clasificaba como
		// REQUERIMIENTO_FISCALIZACION y se perdían todos los campos del acta.
		const result = classifyByKeywords(`
			ACTA DE INMOVILIZACIÓN - INCAUTACIÓN N* 235 - 0105 - 2020 N? 000067
			01 INMOVILIZACIÓN
			02 INCAUTACIÓN
			DATOS GENERALES DE LA ACCIÓN DE CONTROL O FISCALIZACIÓN
			MERCANCIA QUEDA EN CUSTODIA DEL ALMACEN
			Peso: 3.420
		`);

		expect(result.tipoDocumento).toBe('ACTA_INMOVILIZACION');
		expect(result.campos.numeroActa).toBe('235-0105-2020');
		expect(result.campos.tipoAccion).toBe('INMOVILIZACION');
	});
});
