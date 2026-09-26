import { extractText, SupportedMimeType } from './extractor';
import { classifyWithOllama } from './ia';
import { DocumentJobData, DocumentJobResult } from '../domain/jobs';
import { getSupabaseClient } from '../config/supabase';
import type { Document, DocumentAnalysis, ExtractedMetadata, DocumentDerivation } from '../types/supabase';

const STORAGE_BUCKET = 'DocumentosIA';

function getMimeTypeFromFileName(fileName: string): SupportedMimeType {
  const ext = fileName.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf': return 'application/pdf';
    case 'docx':
    case 'docm':
    case 'dotx':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case 'xlsx':
    case 'xlsm':
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    case 'png': return 'image/png';
    case 'jpg':
    case 'jpeg': return 'image/jpeg';
    case 'tiff': return 'image/tiff';
    case 'bmp': return 'image/bmp';
    default: return 'application/pdf';
  }
}

async function uploadToStorage(supabase: ReturnType<typeof getSupabaseClient>, documentId: string, fileName: string, fileBase64: string, mimeType: string): Promise<string | null> {
  try {
    const buffer = Buffer.from(fileBase64, 'base64');
    const fileExt = fileName.split('.').pop() || 'bin';
    const storagePath = `${documentId}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, buffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (uploadError) {
      console.error('Error subiendo a Storage:', uploadError.message);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(storagePath);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Error en uploadToStorage:', error);
    return null;
  }
}

/**
 * Notifica a n8n cuando un documento ha sido analizado y guardado en Supabase
 */
export async function notifyN8n(payload: Record<string, any>): Promise<void> {
  const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL || 'http://n8n:5678/webhook/documento-analizado';
  try {
    const res = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    console.log(`[n8n Webhook] Notificación enviada exitosamente a ${n8nWebhookUrl} (Status: ${res.status})`);
  } catch (err) {
    // Si n8n no está escuchando o no tiene el webhook activo, registramos warning sin detener el flujo
    console.log(`[n8n Webhook] Aviso: n8n no recibió webhook en ${n8nWebhookUrl} (${err instanceof Error ? err.message : 'inactivo'}). Continuará por Supabase polling.`);
  }
}

interface ProcessDocumentData extends DocumentJobData {
  userId?: string;
}

/**
 * Procesa un documento subido directamente en base64 (flujo Web Frontend)
 */
export async function processDocument(jobData: ProcessDocumentData): Promise<DocumentJobResult> {
  const fileName: string = jobData.fileName;
  const fileBase64: string = jobData.fileBase64;
  const mimeType: string = jobData.mimeType;
  const userId = jobData.userId;
  const supabase = getSupabaseClient();
  let documentId: string | undefined;

  try {
    // 1. Insertar en documents
    const { data: documentData, error: docError } = await supabase
      .from('documents')
      .insert([
        {
          file_name: fileName,
          processing_status: 'processing',
          upload_date: new Date().toISOString(),
          ...(userId ? { user_id: userId } : {})
        },
      ])
      .select();

    if (docError) {
      throw new Error(`Failed to insert document: ${docError.message}`);
    }

    documentId = documentData[0].id;

    // 1b. Subir archivo a Supabase Storage
    let storageUrl: string | null = null;
    storageUrl = await uploadToStorage(supabase, documentId!, fileName, fileBase64, mimeType);
    if (storageUrl) {
      await supabase
        .from('documents')
        .update({ storage_url: storageUrl })
        .eq('id', documentId);
    }

    // 2. Extraer texto
    const buffer = Buffer.from(fileBase64, 'base64');
    const { text } = await extractText(buffer, mimeType, fileName);

    if (!text || text.trim().length < 20) {
      throw new Error('No se pudo extraer texto suficiente del documento');
    }

    // 3. Clasificar y analizar con Ollama (Llama 3.1)
    const result = await classifyWithOllama(text);

    // 4. Actualizar estado a completed en documents
    await supabase
      .from('documents')
      .update({ processing_status: 'completed' })
      .eq('id', documentId);

    // 5. Insertar en document_analysis
    await supabase
      .from('document_analysis')
      .insert([
        {
          document_id: documentId,
          document_category: result.tipoDocumento,
          confidence_percentage: result.confianza,
          ai_summary: result.resumenEjecutivo,
          processed_at: new Date().toISOString(),
        },
      ]);

    // 6. Insertar metadatos extraídos
    if (result.campos) {
      const metadataPromises = Object.entries(result.campos).map(([field, value]) => {
        return supabase
          .from('extracted_metadata')
          .insert([
            {
              document_id: documentId,
              field_name: field,
              field_value: String(value || ''),
              confidence: 100,
            },
          ]);
      });
      await Promise.all(metadataPromises);
    }

    // 7. Insertar en document_derivations con status 'PENDING' para n8n
    let derivationId: string | undefined;
    const { data: derivationData } = await supabase
      .from('document_derivations')
      .insert([
        {
          document_id: documentId,
          target_area: result.area,
          derivation_reason: `Derivación automática basada en clasificación: ${result.tipoDocumento}`,
          status: 'PENDING', // Mayúsculas para sincronización con n8n
          created_at: new Date().toISOString(),
        },
      ])
      .select();

    if (derivationData && derivationData.length > 0) {
      derivationId = derivationData[0].id;
    }

    // 8. Notificar a n8n para que dispare el flujo de correo o automatización
    await notifyN8n({
      event: 'DOCUMENTO_ANALIZADO',
      documentId,
      derivationId,
      fileName,
      storageUrl,
      tipoDocumento: result.tipoDocumento,
      area: result.area,
      confianza: result.confianza,
      resumenEjecutivo: result.resumenEjecutivo,
      informeEjecutivo: result.informeEjecutivo,
      campos: result.campos,
      remitente: 'ea.luisperez@gmail.com',
      fecha: new Date().toISOString(),
    });

    return {
      fileName,
      ...result,
      derivacion: `Derivado a ${result.area}`,
      storageUrl,
    };

  } catch (error) {
    console.error('Error general en processDocument:', error);
    if (documentId) {
      try {
        await supabase
          .from('documents')
          .update({ processing_status: 'failed' })
          .eq('id', documentId);
      } catch (e) {
        console.error('Error actualizando a failed:', e);
      }
    }
    throw error;
  }
}

/**
 * Procesa un documento que ya existe en la base de datos de Supabase y en el bucket
 * (por ejemplo, documentos subidos vía Email por el workflow de n8n)
 */
export async function processDocumentById(documentId: string): Promise<Record<string, any>> {
  const supabase = getSupabaseClient();

  // 1. Obtener registro de la BD
  const { data: doc, error: fetchErr } = await supabase
    .from('documents')
    .select('*')
    .eq('id', documentId)
    .single();

  if (fetchErr || !doc) {
    throw new Error(`Documento con ID ${documentId} no encontrado en Supabase: ${fetchErr?.message}`);
  }

  console.log(`[ProcessDocById] Procesando documento existente: ${doc.file_name} (${doc.id})`);

  // Marcar como 'processing'
  await supabase
    .from('documents')
    .update({ processing_status: 'processing' })
    .eq('id', doc.id);

  try {
    const ext = doc.file_name.split('.').pop() || 'bin';
    let fileBlob: Blob | null = null;

    // Intentar descargar usando <id>.<ext>
    const storagePathWithId = `${doc.id}.${ext}`;
    const { data: blob1 } = await supabase.storage.from(STORAGE_BUCKET).download(storagePathWithId);
    fileBlob = blob1;

    // Si no existe con <id>.<ext>, intentar con el nombre original del archivo (como lo sube n8n)
    if (!fileBlob) {
      const { data: blob2 } = await supabase.storage.from(STORAGE_BUCKET).download(doc.file_name);
      fileBlob = blob2;
    }

    if (!fileBlob) {
      throw new Error(`El archivo no fue encontrado en el bucket "${STORAGE_BUCKET}" con path ${storagePathWithId} ni con ${doc.file_name}`);
    }

    const buffer = Buffer.from(await fileBlob.arrayBuffer());
    const mimeType = getMimeTypeFromFileName(doc.file_name);

    // Extraer texto
    const { text } = await extractText(buffer, mimeType, doc.file_name);
    if (!text || text.trim().length < 15) {
      throw new Error(`Texto insuficiente extraído de ${doc.file_name}`);
    }

    // Clasificar con Ollama
    const result = await classifyWithOllama(text);

    // Actualizar storage_url si faltaba
    let storageUrl = doc.storage_url;
    if (!storageUrl || !storageUrl.startsWith('http')) {
      const { data: urlData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(doc.file_name);
      storageUrl = urlData.publicUrl;
      await supabase.from('documents').update({ storage_url: storageUrl }).eq('id', doc.id);
    }

    // Actualizar estado a completed
    await supabase.from('documents').update({ processing_status: 'completed' }).eq('id', doc.id);

    // Insertar document_analysis
    await supabase.from('document_analysis').insert([
      {
        document_id: doc.id,
        document_category: result.tipoDocumento,
        confidence_percentage: result.confianza,
        ai_summary: result.resumenEjecutivo,
        processed_at: new Date().toISOString(),
      },
    ]);

    // Insertar extracted_metadata
    if (result.campos) {
      const metaPromises = Object.entries(result.campos).map(([field, value]) => {
        return supabase.from('extracted_metadata').insert([
          {
            document_id: doc.id,
            field_name: field,
            field_value: String(value || ''),
            confidence: 100,
          },
        ]);
      });
      await Promise.all(metaPromises);
    }

    // Insertar document_derivations con status 'PENDING'
    let derivationId: string | undefined;
    const { data: derivationData } = await supabase.from('document_derivations').insert([
      {
        document_id: doc.id,
        target_area: result.area,
        derivation_reason: `Derivación automática basada en clasificación: ${result.tipoDocumento}`,
        status: 'PENDING',
        created_at: new Date().toISOString(),
      },
    ]).select();

    if (derivationData && derivationData.length > 0) {
      derivationId = derivationData[0].id;
    }

    // Notificar a n8n
    await notifyN8n({
      event: 'DOCUMENTO_ANALIZADO',
      documentId: doc.id,
      derivationId,
      fileName: doc.file_name,
      storageUrl,
      tipoDocumento: result.tipoDocumento,
      area: result.area,
      confianza: result.confianza,
      resumenEjecutivo: result.resumenEjecutivo,
      informeEjecutivo: result.informeEjecutivo,
      campos: result.campos,
      remitente: 'ea.luisperez@gmail.com',
      fecha: new Date().toISOString(),
    });

    console.log(`[ProcessDocById] ✅ Documento ${doc.file_name} procesado y clasificado exitosamente como ${result.tipoDocumento}`);

    return {
      id: doc.id,
      fileName: doc.file_name,
      ...result,
      storageUrl,
    };
  } catch (error) {
    console.error(`[ProcessDocById] ❌ Error procesando ${doc.file_name}:`, error);
    await supabase.from('documents').update({ processing_status: 'failed' }).eq('id', doc.id);
    throw error;
  }
}

/**
 * Busca y procesa automáticamente todos los documentos pendientes en Supabase
 * (ideal para procesar lo que n8n o usuarios cargaron por correo u otros medios)
 */
export async function processAllPendingDocuments(): Promise<any[]> {
  const supabase = getSupabaseClient();
  const { data: pendingDocs, error } = await supabase
    .from('documents')
    .select('id, file_name, processing_status')
    .ilike('processing_status', 'pending')
    .limit(10);

  if (error || !pendingDocs || pendingDocs.length === 0) {
    return [];
  }

  console.log(`[ProcessPending] Encontrados ${pendingDocs.length} documentos pendientes para procesar.`);
  const results = [];

  for (const doc of pendingDocs) {
    try {
      const res = await processDocumentById(doc.id);
      results.push(res);
    } catch (e) {
      console.error(`[ProcessPending] Error en documento ${doc.id}:`, e);
    }
  }

  return results;
}
