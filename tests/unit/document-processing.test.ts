import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getSupabaseClientMock, buildDocumentPdfMock, scanMobileDocumentMock } = vi.hoisted(() => ({
	getSupabaseClientMock: vi.fn(),
	buildDocumentPdfMock: vi.fn(),
	scanMobileDocumentMock: vi.fn(),
}));

vi.mock('../../src/config/supabase', () => ({ getSupabaseClient: getSupabaseClientMock }));
vi.mock('../../src/services/documentFlow.service', () => ({
	buildDocumentPdf: buildDocumentPdfMock,
	scanMobileDocument: scanMobileDocumentMock,
}));

import { processMobileDocument } from '../../src/services/document-processing';

const inserted: Record<string, any[]> = {};

function makeSupabaseClient() {
	return {
		from(table: string) {
			return {
				insert(rows: any[]) {
					(inserted[table] ??= []).push(...rows);
					return {
						select: () => Promise.resolve({
							data: rows.map((_row, index) => ({ id: `${table}-${index + 1}` })),
							error: null,
						}),
					};
				},
				update() {
					return { eq: () => Promise.resolve({ data: null, error: null }) };
				},
			};
		},
		storage: {
			from() {
				return {
					upload: () => Promise.resolve({ error: null }),
					getPublicUrl: () => ({
						data: { publicUrl: 'https://demo.supabase.co/storage/v1/object/public/DocumentosIA/captura.jpg' },
					}),
				};
			},
		},
	};
}

describe('processMobileDocument', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		for (const key of Object.keys(inserted)) delete inserted[key];
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status: 200 }));
		getSupabaseClientMock.mockReturnValue(makeSupabaseClient());
		scanMobileDocumentMock.mockResolvedValue({
			tipoDocumento: 'ACTA_INMOVILIZACION',
			confianza: 0.9,
			datos: { numeroActa: '235-0105-2020', fecha: '04/03/2020', bienes: [{ numero: '1' }] },
			resumenEjecutivo: 'Acta detectada',
		});
		buildDocumentPdfMock.mockResolvedValue({
			url: 'generated/ACTA_INMOVILIZACION/documento.pdf',
			tipoDocumento: 'ACTA_INMOVILIZACION',
			area: 'Prevención del Contrabando',
		});
	});

	it('registra el documento de ENTRADA y crea análisis, metadatos y derivación PENDING', async () => {
		const result = await processMobileDocument({
			fileName: 'captura.jpg',
			mimeType: 'image/jpeg',
			fileBase64: Buffer.from('imagen').toString('base64'),
		});

		// documents = documento de ENTRADA (la captura), no el PDF generado.
		expect(inserted.documents).toHaveLength(1);
		expect(inserted.documents[0]).toMatchObject({
			file_name: 'captura.jpg',
			processing_status: 'processing',
		});

		expect(inserted.document_analysis).toHaveLength(1);
		expect(inserted.document_analysis[0]).toMatchObject({
			document_id: 'documents-1',
			document_category: 'ACTA_INMOVILIZACION',
			confidence_percentage: 0.9,
			ai_summary: 'Acta detectada',
		});

		expect(inserted.extracted_metadata.map((row) => row.field_name))
			.toEqual(expect.arrayContaining(['numeroActa', 'fecha', 'bienes']));
		expect(inserted.extracted_metadata.every((row) => row.document_id === 'documents-1')).toBe(true);

		expect(inserted.document_derivations).toHaveLength(1);
		expect(inserted.document_derivations[0]).toMatchObject({
			document_id: 'documents-1',
			target_area: 'PREVENCION_CONTRABANDO_FISCALIZACION_ADUANERA',
			status: 'PENDING',
		});

		expect(result.documentId).toBe('documents-1');
		expect(result.pdfUrl).toBe('generated/ACTA_INMOVILIZACION/documento.pdf');
		expect(result.warnings).toEqual([]);
		// El PDF generado no crea una fila extra en `documents`.
		expect(buildDocumentPdfMock).toHaveBeenCalledWith('ACTA_INMOVILIZACION', {
			numeroActa: '235-0105-2020',
			fecha: '04/03/2020',
			bienes: [{ numero: '1' }],
		});
	});

	it('continúa y reporta warnings cuando la validación falla, pero igual deriva', async () => {
		scanMobileDocumentMock.mockResolvedValue({
			tipoDocumento: 'ACTA_INMOVILIZACION',
			confianza: 0.5,
			datos: { numeroActa: '', fecha: '' },
			resumenEjecutivo: 'Sin datos',
		});

		const result = await processMobileDocument({
			fileName: 'captura.jpg',
			mimeType: 'image/jpeg',
			fileBase64: Buffer.from('imagen').toString('base64'),
		});

		expect(result.warnings.length).toBeGreaterThan(0);
		expect(inserted.document_derivations).toHaveLength(1);
		expect(inserted.document_derivations[0].status).toBe('PENDING');
	});
});
