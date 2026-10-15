import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from '../../src/app';

describe('API de documentos', () => {
	it('responde correctamente en /health', async () => {
		const response = await request(app).get('/health');

		expect(response.status).toBe(200);
		expect(response.body.status).toBe('ok');
	});

	it('rechaza una subida sin archivo', async () => {
		const response = await request(app).post('/upload');

		expect(response.status).toBe(400);
		expect(response.body.error).toContain('archivo');
	});

	it('rechaza una captura móvil sin imagen', async () => {
		const response = await request(app).post('/upload/mobile');

		expect(response.status).toBe(400);
		expect(response.body.error).toContain('imagen');
	});

	it('rechaza MIME no permitido en capturas móviles', async () => {
		const response = await request(app)
			.post('/upload/mobile')
			.attach('file', Buffer.from('texto'), {
				filename: 'nota.txt',
				contentType: 'text/plain',
			});

		expect(response.status).toBe(415);
		expect(response.body.error).toContain('no soportado');
	});

	it('devuelve la plantilla de un acta de inmovilización', async () => {
		const response = await request(app).get('/template/ACTA_INMOVILIZACION');

		expect(response.status).toBe(200);
		expect(response.body.tipoDocumento).toBe('ACTA_INMOVILIZACION');
		expect(response.body.area).toBe('Prevención del Contrabando');
		expect(response.body.campos).toEqual(expect.arrayContaining([
			expect.objectContaining({ nombre: 'numeroActa', tipo: 'text', requerido: true }),
			expect.objectContaining({ nombre: 'tipoAccion', tipo: 'select' }),
			expect.objectContaining({ nombre: 'bienes', tipo: 'array', subcampos: expect.any(Array) }),
		]));
	});

	it('valida el parámetro y devuelve 404 para una plantilla inexistente', async () => {
		const invalid = await request(app).get('/template/ACTA%20INVALIDA');
		const missing = await request(app).get('/template/DOCUMENTO_DESCONOCIDO');

		expect(invalid.status).toBe(400);
		expect(missing.status).toBe(404);
	});
});
