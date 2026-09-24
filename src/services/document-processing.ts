import { extractText } from './extractor';
import { classifyWithOllama } from './ia';
import { DocumentJobData, DocumentJobResult } from '../domain/jobs';
import { getSupabaseClient } from '../config/supabase';
import type { Document, DocumentAnalysis, ExtractedMetadata, DocumentDerivation } from '../types/supabase';

const DERIVATION_EMAIL: Record<string, string> = {
  DECLARACION_JURADA_MENSUAL: 'declaraciones@sunat.gob.pe',
  DECLARACION_JURADA_ANUAL: 'declaraciones@sunat.gob.pe',
  RESOLUCION_FRACCIONAMIENTO: 'fraccionamiento@sunat.gob.pe',
  RESOLUCION_APLAZAMIENTO: 'fraccionamiento@sunat.gob.pe',
  ORDEN_PAGO_OP: 'ordenes_pago@sunat.gob.pe',
  SOLICITUD_INSCRIPCION_RUC: 'ruc_inscripciones@sunat.gob.pe',
  ACTUALIZACION_RUC: 'ruc_inscripciones@sunat.gob.pe',
  RESOLUCION_DETERMINACION_RD: 'determinaciones@sunat.gob.pe',
  RESOLUCION_MULTA_RM: 'fiscalizacion@sunat.gob.pe',
  REQUERIMIENTO_FISCALIZACION: 'fiscalizacion@sunat.gob.pe',
  AUDITORIA_LIBROS: 'fiscalizacion@sunat.gob.pe',
  CARTA_PRESENTACION: 'recaudacion@sunat.gob.pe',
  NOTIFICACION_ELECTRONICA: 'notificaciones@sunat.gob.pe',
  SOLICITUD_APLAZAMIENTO: 'fraccionamiento@sunat.gob.pe',
  RESOLUCION_APLAZAMIENTO_FRACCIONAMIENTO: 'fraccionamiento@sunat.gob.pe',
};

export async function processDocument(jobData: {
  fileName: string;
  mimeType: string;
  fileBase64: string;
}): Promise<DocumentJobResult> {
  const supabase = getSupabaseClient();
  let documentId: string | undefined;

  try {
    // 1. Insertar en documents
    const { data: documentData, error: docError } = await supabase
      .from('documents')
      .insert([
        {
          file_name: jobData.fileName,
          user_id: 'current_user_id', // Reemplaza con el ID del usuario autenticado
          processing_status: 'processing',
          upload_date: new Date().toISOString(),
        },
      ])
      .select();

    if (docError) {
      throw new Error(`Failed to insert document: ${docError.message}`);
    }

    documentId = documentData[0].id;

    // 2. Procesar documento
    const buffer = Buffer.from(jobData.fileBase64, 'base64');
    const { text } = await extractText(buffer, jobData.mimeType, jobData.fileName);

    if (!text || text.trim().length < 20) {
      throw new Error('No se pudo extraer texto suficiente del documento');
    }

    // 3. Actualizar estado a completed
    try {
      const { error: updateError } = await supabase
        .from('documents')
        .update({ processing_status: 'completed' })
        .eq('id', documentId);

      if (updateError) {
        console.error('Error actualizando estado del documento:', updateError);
      }
    } catch (error) {
      console.error('Error actualizando estado del documento:', error);
    }

    // 4. Clasificar documento
    const result = await classifyWithOllama(text);

    // 5. Insertar en document_analysis
    try {
      const { data: analysisData, error: analysisError } = await supabase
        .from('document_analysis')
        .insert([
          {
            document_id: documentId,
            document_category: result.tipoDocumento,
            confidence_percentage: result.confianza,
            ai_summary: result.resumenEjecutivo,
            processed_at: new Date().toISOString(),
          },
        ])
        .select();

      if (analysisError) {
        console.error('Error inserting document analysis:', analysisError);
      }
    } catch (error) {
      console.error('Error insertando análisis del documento:', error);
    }

    // 6. Insertar metadatos extraídos
    if (result.campos) {
      try {
        const metadataPromises = Object.entries(result.campos).map(async ([field, value]) => {
          return supabase
            .from('extracted_metadata')
            .insert([
              {
                document_id: documentId,
                field_name: field,
                field_value: value,
                confidence: 100,
              },
            ])
            .select();
        });

        await Promise.all(metadataPromises);
      } catch (error) {
        console.error('Error insertando metadatos extraídos:', error);
      }
    }

    // 7. Insertar en document_derivations
    try {
      const { data: derivationData, error: derivationError } = await supabase
        .from('document_derivations')
        .insert([
          {
            document_id: documentId,
            target_area: result.area,
            derivation_reason: `Derivación automática basada en clasificación: ${result.tipoDocumento}`,
            status: 'pending',
            created_at: new Date().toISOString(),
          },
        ])
        .select();

      if (derivationError) {
        console.error('Error inserting document derivation:', derivationError);
      }
    } catch (error) {
      console.error('Error insertando derivación del documento:', error);
    }

    return {
      fileName: jobData.fileName,
      ...result,
      derivacion: `Derivado a ${result.area}`,
    };

  } catch (error) {
    console.error('Error general en processDocument:', error);
    if (error instanceof Error) {
      console.error('Mensaje de error:', error.message);
    }

    try {
      const supabase = getSupabaseClient();
      const { error: updateError } = await supabase
        .from('documents')
        .update({ processing_status: 'failed' })
        .eq('id', documentId);

      if (updateError) {
        console.error('Error updating document status to failed:', updateError);
      }
    } catch (updateError) {
      console.error('Error actualizando estado a failed:', updateError);
    }

    throw error;
  }
}
