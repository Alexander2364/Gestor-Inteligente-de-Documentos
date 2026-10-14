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
        id: 42,
        tipo_documento: 'ACTA_INMOVILIZACION',
        area: 'Prevención del Contrabando',
        datos_json: { numeroActa: 'ACT-001' },
        pdf_url: 'generated/acta.pdf',
        fecha_generacion: '2026-10-14T23:00:00.000Z',
        usuario: null,
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

    expect(result.id).toBe(42);
    expect(fromMock).toHaveBeenCalledWith('documentos_generados');
    expect(insertMock).toHaveBeenCalledWith({
      tipo_documento: 'ACTA_INMOVILIZACION',
      area: 'Prevención del Contrabando',
      datos_json: datos,
      pdf_url: 'generated/acta.pdf',
      usuario: 'usuario-1',
    });
  });

  it('propaga un error de Supabase', async () => {
    singleMock.mockResolvedValue({ data: null, error: { message: 'insert failed' } });

    await expect(saveDocumentoGenerado('ACTA_INMOVILIZACION', 'Área', {}, 'acta.pdf'))
      .rejects.toThrow('insert failed');
  });
});