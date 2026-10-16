import { getSupabaseClient } from '../config/supabase';

export interface DocumentoGenerado {
  id: string;
  file_name: string;
  storage_url: string;
  upload_date: string;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
}

function getFileName(pdfUrl: string, tipoDocumento: string): string {
  const path = pdfUrl.split('?')[0];
  const fileName = path.split('/').pop();
  return fileName || `${tipoDocumento}.pdf`;
}

export async function saveDocumentoGenerado(
  tipoDocumento: string,
  area: string,
  datos: Record<string, unknown>,
  pdfUrl: string,
  usuario?: string,
): Promise<DocumentoGenerado> {
  const { data, error } = await getSupabaseClient()
    .from('documents')
    .insert({
      file_name: getFileName(pdfUrl, tipoDocumento),
      storage_url: pdfUrl,
      processing_status: 'completed',
    })
    .select()
    .single();

  if (error) {
    throw new Error(`No se pudo guardar el documento generado: ${error.message}`);
  }

  if (!data) {
    throw new Error('No se pudo guardar el documento generado: respuesta vacía');
  }

  return data as DocumentoGenerado;
}