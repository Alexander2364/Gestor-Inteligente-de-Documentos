import { beforeEach, describe, expect, it, vi } from 'vitest';

const { S3ClientMock, PutObjectCommandMock, sendMock } = vi.hoisted(() => ({
  S3ClientMock: vi.fn(),
  PutObjectCommandMock: vi.fn(),
  sendMock: vi.fn(),
}));

vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: S3ClientMock,
  PutObjectCommand: PutObjectCommandMock,
}));

import { uploadFile } from '../../src/services/storage.service';

describe('uploadFile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.S3_ENDPOINT = 'http://localhost:9000';
    process.env.S3_ACCESS_KEY = 'minioadmin';
    process.env.S3_SECRET_KEY = 'minioadmin';
    process.env.S3_BUCKET = 'documentos';
    S3ClientMock.mockImplementation(() => ({ send: sendMock }));
    PutObjectCommandMock.mockImplementation((input) => input);
    sendMock.mockResolvedValue({});
  });

  it('sube el buffer al bucket configurado y devuelve la key', async () => {
    const buffer = Buffer.from('contenido PDF');

    const result = await uploadFile(buffer, 'documentos/acta.pdf', 'application/pdf');

    expect(result).toBe('documentos/acta.pdf');
    expect(S3ClientMock).toHaveBeenCalledWith({
      endpoint: 'http://localhost:9000',
      region: 'us-east-1',
      forcePathStyle: true,
      credentials: {
        accessKeyId: 'minioadmin',
        secretAccessKey: 'minioadmin',
      },
    });
    expect(PutObjectCommandMock).toHaveBeenCalledWith({
      Bucket: 'documentos',
      Key: 'documentos/acta.pdf',
      Body: buffer,
      ContentType: 'application/pdf',
    });
    expect(sendMock).toHaveBeenCalledWith({
      Bucket: 'documentos',
      Key: 'documentos/acta.pdf',
      Body: buffer,
      ContentType: 'application/pdf',
    });
  });

  it('falla con un error claro si falta configuración S3', async () => {
    delete process.env.S3_SECRET_KEY;

    await expect(uploadFile(Buffer.from('pdf'), 'acta.pdf', 'application/pdf'))
      .rejects.toThrow('Faltan variables de entorno S3: S3_SECRET_KEY');
    expect(S3ClientMock).not.toHaveBeenCalled();
  });
});