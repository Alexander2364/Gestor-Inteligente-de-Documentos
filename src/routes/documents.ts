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

export default router;