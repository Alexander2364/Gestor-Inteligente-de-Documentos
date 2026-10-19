import { Router, Request, Response } from 'express';
import { getSupabaseClient } from '../config/supabase';
import { buildStoredReport } from '../services/documentReadModel';

const router = Router();

const DOCUMENT_SELECT = `
  *,
  document_analysis (*),
  document_derivations (*),
  extracted_metadata (*)
`;

type SupabaseClient = ReturnType<typeof getSupabaseClient>;

/**
 * Añade a cada fila la URL pública del archivo y su informe ejecutivo. El informe
 * no se guarda en la base de datos (se compone al clasificar), así que aquí se
 * reconstruye a partir de los campos persistidos: de esta forma el historial
 * muestra el mismo informe que el flujo de escaneo, también en documentos antiguos.
 */
function decorateDocument(supabase: SupabaseClient, doc: any) {
  let storageUrl = doc.storage_url;
  if (!storageUrl && doc.id) {
    const ext = doc.file_name?.split('.').pop() || 'pdf';
    const { data: urlData } = supabase.storage
      .from('DocumentosIA')
      .getPublicUrl(`${doc.id}.${ext}`);
    storageUrl = urlData?.publicUrl || null;
  }

  const analysis = Array.isArray(doc.document_analysis)
    ? doc.document_analysis[0]
    : doc.document_analysis;
  const report = buildStoredReport(doc);

  return {
    ...doc,
    storage_url: storageUrl,
    informeEjecutivo: report?.informeEjecutivo ?? null,
    resumenEjecutivo: report?.resumenEjecutivo ?? analysis?.ai_summary ?? null,
  };
}

router.get('/', async (_req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('documents')
      .select(DOCUMENT_SELECT)
      .order('upload_date', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });

    res.json((data || []).map((doc: any) => decorateDocument(supabase, doc)));
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Error inesperado' });
  }
});

router.get('/search', async (req: Request, res: Response) => {
  const q = req.query.q as string;
  if (!q || !q.trim()) {
    return res.status(400).json({ error: 'Query parameter q is required' });
  }
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('documents')
      .select(DOCUMENT_SELECT)
      .ilike('file_name', `%${q}%`)
      .order('upload_date', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });

    res.json((data || []).map((doc: any) => decorateDocument(supabase, doc)));
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Error en búsqueda' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('documents')
    .select(DOCUMENT_SELECT)
    .eq('id', id)
    .single();

  if (error) return res.status(404).json({ error: 'Documento no encontrado' });
  res.json(decorateDocument(supabase, data));
});

// Endpoint para procesar documentos que ingresaron directamente a Supabase (ej. vía email con n8n)
router.post('/process-pending', async (req: Request, res: Response) => {
  try {
    const { documentId } = req.body || {};
    const { processDocumentById, processAllPendingDocuments } =
      await import('../services/document-processing');

    if (documentId) {
      const result = await processDocumentById(documentId);
      return res.json({ success: true, result });
    }

    const results = await processAllPendingDocuments();
    return res.json({ success: true, processedCount: results.length, results });
  } catch (error) {
    console.error('[Route Process Pending] Error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Error procesando documentos pendientes',
    });
  }
});

export default router;
