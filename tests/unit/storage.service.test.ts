import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getSupabaseClientMock, uploadMock, getPublicUrlMock } = vi.hoisted(() => ({
  getSupabaseClientMock: vi.fn(),
  uploadMock: vi.fn(),
  getPublicUrlMock: vi.fn(),
}));

vi.mock('../../src/config/supabase', () => ({
  getSupabaseClient: getSupabaseClientMock,
}));

import { uploadFile } from '../../src/services/storage.service';

describe('uploadFile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSupabaseClientMock.mockReturnValue({
      storage: {
        from: vi.fn(() => ({
          upload: uploadMock,
          getPublicUrl: getPublicUrlMock,
        })),
      },
    });
    uploadMock.mockResolvedValue({ error: null });
    getPublicUrlMock.mockReturnValue({
      data: { publicUrl: 'https://demo.supabase.co/storage/v1/object/public/DocumentosIA/acta.pdf' },
    });
  });

  it('sube el buffer al bucket publico DocumentosIA y devuelve la URL publica', async () => {
    const buffer = Buffer.from('contenido PDF');

    const result = await uploadFile(buffer, 'generated/acta.pdf', 'application/pdf');

    expect(result).toBe('https://demo.supabase.co/storage/v1/object/public/DocumentosIA/acta.pdf');
    expect(uploadMock).toHaveBeenCalledWith('generated/acta.pdf', buffer, {
      contentType: 'application/pdf',
      upsert: true,
    });
    expect(getPublicUrlMock).toHaveBeenCalledWith('generated/acta.pdf');
  });

  it('propaga un error legible cuando Supabase rechaza la subida', async () => {
    uploadMock.mockResolvedValue({ error: { message: 'Bucket no encontrado' } });

    await expect(uploadFile(Buffer.from('pdf'), 'acta.pdf', 'application/pdf'))
      .rejects.toThrow('No se pudo subir el archivo a Supabase Storage: Bucket no encontrado');
    expect(getPublicUrlMock).not.toHaveBeenCalled();
  });
});