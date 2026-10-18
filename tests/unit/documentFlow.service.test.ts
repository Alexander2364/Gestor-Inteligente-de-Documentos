import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
	preprocessMobileImageMock,
	extractTextMock,
	classifyWithOllamaMock,
	getTemplatePathMock,
	getDocumentTemplateMock,
	readFileMock,
	fillTemplateMock,
	htmlToPdfMock,
	uploadFileMock,
} = vi.hoisted(() => ({
	preprocessMobileImageMock: vi.fn(),
	extractTextMock: vi.fn(),
	classifyWithOllamaMock: vi.fn(),
	getTemplatePathMock: vi.fn(),
	getDocumentTemplateMock: vi.fn(),
	readFileMock: vi.fn(),
	fillTemplateMock: vi.fn(),
	htmlToPdfMock: vi.fn(),
	uploadFileMock: vi.fn(),
}));

vi.mock('../../src/services/extractor', () => ({
	preprocessMobileImage: preprocessMobileImageMock,
	extractTextFromPreprocessedImage: extractTextMock,
}));
vi.mock('../../src/services/ia', () => ({ classifyWithOllama: classifyWithOllamaMock }));
vi.mock('../../src/domain/templates/index', () => ({ getTemplatePath: getTemplatePathMock }));
vi.mock('../../src/domain/templates', () => ({ getDocumentTemplate: getDocumentTemplateMock }));
vi.mock('node:fs/promises', () => ({ readFile: readFileMock }));
vi.mock('../../src/domain/templates/templateFiller', () => ({ fillTemplate: fillTemplateMock }));
vi.mock('../../src/services/documentGenerator.service', () => ({ htmlToPdf: htmlToPdfMock }));
vi.mock('../../src/services/storage.service', () => ({ uploadFile: uploadFileMock }));

import {
	DocumentFlowError,
	buildDocumentPdf,
	scanMobileDocument,
} from '../../src/services/documentFlow.service';

describe('documentFlow.service', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		preprocessMobileImageMock.mockResolvedValue(Buffer.from('processed'));
		extractTextMock.mockResolvedValue('texto del acta');
		classifyWithOllamaMock.mockResolvedValue({
			tipoDocumento: 'ACTA_INMOVILIZACION',
			confianza: 0.9,
			campos: { numeroActa: 'ACT-001' },
			resumenEjecutivo: 'Acta detectada',
		});
		getTemplatePathMock.mockReturnValue('/tmp/acta.html');
		getDocumentTemplateMock.mockReturnValue({ area: 'Prevención del Contrabando' });
		readFileMock.mockResolvedValue('<html>plantilla</html>');
		fillTemplateMock.mockReturnValue('<html>rellenada</html>');
		htmlToPdfMock.mockResolvedValue(Buffer.from('pdf'));
		uploadFileMock.mockResolvedValue('generated/ACTA_INMOVILIZACION/documento.pdf');
	});

	it('escanea una imagen y devuelve los datos extraídos', async () => {
		const result = await scanMobileDocument(Buffer.from('image'), 'image/jpeg');

		expect(result).toEqual({
			tipoDocumento: 'ACTA_INMOVILIZACION',
			confianza: 0.9,
			datos: { numeroActa: 'ACT-001' },
			resumenEjecutivo: 'Acta detectada',
		});
		expect(preprocessMobileImageMock).toHaveBeenCalledWith(Buffer.from('image'));
		expect(extractTextMock).toHaveBeenCalledWith(Buffer.from('processed'));
		expect(classifyWithOllamaMock).toHaveBeenCalledWith(
			'texto del acta',
			expect.objectContaining({ compact: true }),
		);
	});

	it('genera y sube el PDF sin registrar nada en la base de datos', async () => {
		const result = await buildDocumentPdf('ACTA_INMOVILIZACION', { numeroActa: 'ACT-001' });

		expect(result).toEqual({
			url: 'generated/ACTA_INMOVILIZACION/documento.pdf',
			tipoDocumento: 'ACTA_INMOVILIZACION',
			area: 'Prevención del Contrabando',
		});
		expect(htmlToPdfMock).toHaveBeenCalledWith('<html>rellenada</html>');
		expect(uploadFileMock).toHaveBeenCalledWith(
			Buffer.from('pdf'),
			expect.stringMatching(/^generated\/ACTA_INMOVILIZACION\/.*\.pdf$/),
			'application/pdf',
		);
	});

	it('marca la etapa cuando falla la generación PDF', async () => {
		htmlToPdfMock.mockRejectedValue(new Error('Chromium no disponible'));

		await expect(buildDocumentPdf('ACTA_INMOVILIZACION', {})).rejects.toMatchObject({
			name: 'DocumentFlowError',
			stage: 'pdf',
		} satisfies Partial<DocumentFlowError>);
	});
});
