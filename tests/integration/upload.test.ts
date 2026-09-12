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
});
