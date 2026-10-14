import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  getTemplatePathMock,
  readFileMock,
  fillTemplateMock,
  htmlToPdfMock,
  uploadFileMock,
  saveDocumentoGeneradoMock,
  getDocumentTemplateMock,
} = vi.hoisted(() => ({
  getTemplatePathMock: vi.fn(),
  readFileMock: vi.fn(),
  fillTemplateMock: vi.fn(),
  htmlToPdfMock: vi.fn(),
  uploadFileMock: vi.fn(),
  saveDocumentoGeneradoMock: vi.fn(),
  getDocumentTemplateMock: vi.fn(),
}));

vi.mock('node:fs/promises', () => ({ readFile: readFileMock }));
vi.mock('../../src/domain/templates/index', () => ({ getTemplatePath: getTemplatePathMock }));
vi.mock('../../src/domain/templates', () => ({ getDocumentTemplate: getDocumentTemplateMock }));
vi.mock('../../src/domain/templates/templateFiller', () => ({ fillTemplate: fillTemplateMock }));
vi.mock('../../src/services/documentGenerator.service', () => ({ htmlToPdf: htmlToPdfMock }));
vi.mock('../../src/services/storage.service', () => ({ uploadFile: uploadFileMock }));
vi.mock('../../src/services/database.service', () => ({ saveDocumentoGenerado: saveDocumentoGeneradoMock }));

import { app } from '../../src/app';

describe('POST /generate-document', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getTemplatePathMock.mockReturnValue('/tmp/acta.html');
    getDocumentTemplateMock.mockReturnValue({ area: 'Prevención del Contrabando' });
    readFileMock.mockResolvedValue('<html>plantilla</html>');
    fillTemplateMock.mockReturnValue('<html>rellenada</html>');
    htmlToPdfMock.mockResolvedValue(Buffer.from('pdf'));
    uploadFileMock.mockResolvedValue('generated/ACTA_INMOVILIZACION/documento.pdf');
    saveDocumentoGeneradoMock.mockResolvedValue({ id: 123 });
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
    getTemplatePathMock.mockReturnValue(null);

    const response = await request(app)
      .post('/generate-document')
      .send({ tipoDocumento: 'DOCUMENTO_DESCONOCIDO', datos: {} });

    expect(response.status).toBe(404);
    expect(response.body.error).toContain('Plantilla');
  });

  it('rellena, genera, sube y guarda el documento', async () => {
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
      documentoId: 123,
      tipoDocumento: 'ACTA_INMOVILIZACION',
    });
    expect(readFileMock).toHaveBeenCalledWith('/tmp/acta.html', 'utf8');
    expect(fillTemplateMock).toHaveBeenCalledWith('<html>plantilla</html>', datos);
    expect(htmlToPdfMock).toHaveBeenCalledWith('<html>rellenada</html>');
    expect(uploadFileMock).toHaveBeenCalledWith(
      Buffer.from('pdf'),
      expect.stringMatching(/^generated\/ACTA_INMOVILIZACION\/.*\.pdf$/),
      'application/pdf',
    );
    expect(saveDocumentoGeneradoMock).toHaveBeenCalledWith(
      'ACTA_INMOVILIZACION',
      'Prevención del Contrabando',
      datos,
      'generated/ACTA_INMOVILIZACION/documento.pdf',
    );
  });

  it('devuelve 500 si falla la conversión a PDF', async () => {
    htmlToPdfMock.mockRejectedValue(new Error('Puppeteer no disponible'));

    const response = await request(app)
      .post('/generate-document')
      .send({ tipoDocumento: 'ACTA_INMOVILIZACION', datos: {} });

    expect(response.status).toBe(500);
    expect(response.body.error).toContain('generar');
  });
});