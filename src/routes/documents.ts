import { Router, Request, Response } from 'express';
import { getSupabaseClient } from '../config/supabase';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('documents')
    .select(`
      *,
      document_analysis (document_category, confidence_percentage, ai_summary)
    `)
    .order('upload_date', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.get('/search', async (req: Request, res: Response) => {
  const q = req.query.q as string;
  if (!q || !q.trim()) {
    return res.status(400).json({ error: 'Query parameter q is required' });
  }
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('documents')
    .select(`
      *,
      document_analysis (document_category, confidence_percentage, ai_summary)
    `)
    .ilike('file_name', `%${q}%`)
    .order('upload_date', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('documents')
    .select(`
      *,
      document_analysis (*),
      extracted_metadata (*),
      document_derivations (*)
    `)
    .eq('id', id)
    .single();

  if (error) return res.status(404).json({ error: 'Documento no encontrado' });
  res.json(data);
});

// Endpoint para procesar documentos que ingresaron directamente a Supabase (ej. vía email con n8n)
router.post('/process-pending', async (req: Request, res: Response) => {
  try {
    const { documentId } = req.body || {};
    const { processDocumentById, processAllPendingDocuments } = await import('../services/document-processing');

    if (documentId) {
      const result = await processDocumentById(documentId);
      return res.json({ success: true, result });
    }

    const results = await processAllPendingDocuments();
    return res.json({ success: true, processedCount: results.length, results });
  } catch (error) {
    console.error('[Route Process Pending] Error:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Error procesando documentos pendientes' });
  }
});

export default router;