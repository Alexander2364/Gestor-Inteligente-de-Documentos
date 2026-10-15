import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getSupabaseClientMock, fromMock, insertMock, selectMock, singleMock } = vi.hoisted(() => ({
  getSupabaseClientMock: vi.fn(),
  fromMock: vi.fn(),
  insertMock: vi.fn(),
  selectMock: vi.fn(),
  singleMock: vi.fn(),
}));

vi.mock('../../src/config/supabase', () => ({
  getSupabaseClient: getSupabaseClientMock,
}));

import { saveDocumentoGenerado } from '../../src/services/database.service';

describe('saveDocumentoGenerado', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    singleMock.mockResolvedValue({
      data: {
        id: '8d8c3d71-0b34-4a1b-91ad-2f6c4d6f3e14',
        file_name: 'acta.pdf',
        storage_url: 'https://demo.supabase.co/storage/v1/object/public/DocumentosIA/acta.pdf',
        upload_date: '2026-10-14T23:00:00.000Z',
        processing_status: 'completed',
      },
      error: null,
    });
    selectMock.mockReturnValue({ single: singleMock });
    insertMock.mockReturnValue({ select: selectMock });
    fromMock.mockReturnValue({ insert: insertMock });
    getSupabaseClientMock.mockReturnValue({ from: fromMock });
  });

  it('inserta todos los datos del documento generado', async () => {
    const datos = { numeroActa: 'ACT-001', bienes: [{ descripcion: 'Repuestos' }] };

    const result = await saveDocumentoGenerado(
      'ACTA_INMOVILIZACION',
      'Prevención del Contrabando',
      datos,
      'generated/acta.pdf',
      'usuario-1',
    );

    expect(result.id).toBe('8d8c3d71-0b34-4a1b-91ad-2f6c4d6f3e14');
    expect(fromMock).toHaveBeenCalledWith('documents');
    expect(insertMock).toHaveBeenCalledWith({
      file_name: 'acta.pdf',
      storage_url: 'generated/acta.pdf',
      processing_status: 'completed',
    });
  });

  it('propaga un error de Supabase', async () => {
    singleMock.mockResolvedValue({ data: null, error: { message: 'insert failed' } });

    await expect(saveDocumentoGenerado('ACTA_INMOVILIZACION', 'Área', {}, 'acta.pdf'))
      .rejects.toThrow('insert failed');
  });
});