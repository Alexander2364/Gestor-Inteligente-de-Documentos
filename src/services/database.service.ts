import { getSupabaseClient } from '../config/supabase';

export interface DocumentoGenerado {
  id: number;
  tipo_documento: string;
  area: string;
  datos_json: Record<string, unknown>;
  pdf_url: string;
  fecha_generacion: string;
  usuario?: string | null;
}

export async function saveDocumentoGenerado(
  tipoDocumento: string,
  area: string,
  datos: Record<string, unknown>,
  pdfUrl: string,
  usuario?: string,
): Promise<DocumentoGenerado> {
  const { data, error } = await getSupabaseClient()
    .from('documentos_generados')
    .insert({
      tipo_documento: tipoDocumento,
      area,
      datos_json: datos,
      pdf_url: pdfUrl,
      ...(usuario ? { usuario } : {}),
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