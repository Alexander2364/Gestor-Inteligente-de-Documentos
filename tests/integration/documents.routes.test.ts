import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
	buildDocumentPdfMock,
	processMobileDocumentMock,
} = vi.hoisted(() => ({
	buildDocumentPdfMock: vi.fn(),
	processMobileDocumentMock: vi.fn(),
}));

vi.mock('../../src/services/documentFlow.service', () => ({
	buildDocumentPdf: buildDocumentPdfMock,
	DocumentFlowError: class DocumentFlowError extends Error {
		stage: string;

		constructor(stage: string, message: string) {
			super(message);
			this.stage = stage;
		}
	},
}));

vi.mock('../../src/services/document-processing', () => ({
	processMobileDocument: processMobileDocumentMock,
}));

import { app } from '../../src/app';
import { DocumentFlowError } from '../../src/services/documentFlow.service';

describe('POST /generate-document', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		buildDocumentPdfMock.mockResolvedValue({
			url: 'generated/ACTA_INMOVILIZACION/documento.pdf',
			tipoDocumento: 'ACTA_INMOVILIZACION',
			area: 'Prevención del Contrabando',
		});
	});

	it('valida tipoDocumento y datos', async () => {
		const missingType = await request(app)
			.post('/generate-document')
			.send({ datos: {} });
		const invalidData = await request(app)
			.post('/generate-document')
			.send({ tipoDocumento: 'ACTA_INMOVILIZACION', datos: [] });

		expect(missingType.status).toBe(400);
		expect(invalidData.status).toBe(400);
	});

	it('devuelve 404 cuando no existe la plantilla', async () => {
		buildDocumentPdfMock.mockRejectedValue(new DocumentFlowError('template', 'Plantilla no encontrada'));

		const response = await request(app)
			.post('/generate-document')
			.send({ tipoDocumento: 'DOCUMENTO_DESCONOCIDO', datos: {} });

		expect(response.status).toBe(404);
		expect(response.body.error).toContain('Plantilla');
	});

	it('rellena, genera y sube el PDF sin registrar fila en documents', async () => {
		const datos = {
			numeroActa: 'ACT-001',
			fecha: '2026-10-14',
			bienes: [{ numero: '1', descripcion: 'Repuestos' }],
		};

		const response = await request(app)
			.post('/generate-document')
			.send({ tipoDocumento: 'ACTA_INMOVILIZACION', datos });

		expect(response.status).toBe(201);
		expect(response.body).toEqual({
			url: 'generated/ACTA_INMOVILIZACION/documento.pdf',
			tipoDocumento: 'ACTA_INMOVILIZACION',
			area: 'Prevención del Contrabando',
		});
		expect(buildDocumentPdfMock).toHaveBeenCalledWith('ACTA_INMOVILIZACION', datos);
	});

	it('devuelve 500 si falla la conversión a PDF', async () => {
		buildDocumentPdfMock.mockRejectedValue(new DocumentFlowError('pdf', 'No se pudo generar el PDF'));

		const response = await request(app)
			.post('/generate-document')
			.send({
				tipoDocumento: 'ACTA_INMOVILIZACION',
				datos: { numeroActa: 'ACT-001', fecha: '2026-10-14' },
			});

		expect(response.status).toBe(500);
		expect(response.body.error).toContain('generar');
	});

	it('devuelve 400 y no genera PDF cuando los datos del acta son inválidos', async () => {
		const response = await request(app)
			.post('/generate-document')
			.send({
				tipoDocumento: 'ACTA_INMOVILIZACION',
				datos: { numeroActa: '', fecha: '2026-02-31', ruc: '123' },
			});

		expect(response.status).toBe(400);
		expect(response.body.error).toBe('Datos inválidos');
		expect(response.body.errores).toEqual(expect.arrayContaining([
			'Número de acta es requerido',
			expect.stringContaining('Fecha debe tener formato'),
			'RUC debe contener exactamente 11 dígitos',
		]));
		expect(buildDocumentPdfMock).not.toHaveBeenCalled();
	});
});

describe('POST /scan-and-generate', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		processMobileDocumentMock.mockResolvedValue({
			tipoDocumento: 'ACTA_INMOVILIZACION',
			confianza: 0.9,
			campos: { numeroActa: 'ACT-001', fecha: '2026-10-14' },
			resumenEjecutivo: 'Acta detectada',
			templateSugerido: 'ACTA_INMOVILIZACION',
			pdfUrl: 'generated/ACTA_INMOVILIZACION/documento.pdf',
			documentId: 'doc-1',
			warnings: [],
		});
	});

	it('reutiliza el flujo de cámara (entrada + análisis + derivación + PDF)', async () => {
		const response = await request(app)
			.post('/scan-and-generate')
			.attach('file', Buffer.from('imagen'), {
				filename: 'acta.jpg',
				contentType: 'image/jpeg',
			});

		expect(response.status).toBe(201);
		expect(response.body).toEqual({
			tipoDocumento: 'ACTA_INMOVILIZACION',
			confianza: 0.9,
			campos: { numeroActa: 'ACT-001', fecha: '2026-10-14' },
			resumenEjecutivo: 'Acta detectada',
			templateSugerido: 'ACTA_INMOVILIZACION',
			pdfUrl: 'generated/ACTA_INMOVILIZACION/documento.pdf',
			documentId: 'doc-1',
			warnings: [],
		});
		expect(processMobileDocumentMock).toHaveBeenCalledWith(expect.objectContaining({
			fileName: 'acta.jpg',
			mimeType: 'image/jpeg',
			source: 'mobile',
			fileBase64: expect.any(String),
		}));
	});

	it('rechaza una petición scan-and-generate sin imagen', async () => {
		const response = await request(app).post('/scan-and-generate');

		expect(response.status).toBe(400);
		expect(response.body.error).toContain('imagen');
		expect(processMobileDocumentMock).not.toHaveBeenCalled();
	});
});
