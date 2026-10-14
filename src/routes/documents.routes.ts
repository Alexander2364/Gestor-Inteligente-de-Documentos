import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { Request, Response, Router } from 'express';
import { getTemplatePath } from '../domain/templates/index';
import { getSupabaseClient } from '../config/supabase';
import { htmlToPdf } from '../services/documentGenerator.service';
import { uploadFile } from '../services/storage.service';
import { fillTemplate } from '../domain/templates/templateFiller';

const router = Router();

function isDataObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

router.post('/', async (req: Request, res: Response) => {
  const { tipoDocumento, datos } = req.body ?? {};

  if (typeof tipoDocumento !== 'string' || !tipoDocumento.trim()) {
    return res.status(400).json({ error: 'tipoDocumento es requerido' });
  }

  if (!isDataObject(datos)) {
    return res.status(400).json({ error: 'datos debe ser un objeto' });
  }

  const templatePath = getTemplatePath(tipoDocumento);
  if (!templatePath) {
    return res.status(404).json({ error: 'Plantilla no encontrada' });
  }

  try {
    const html = await readFile(templatePath, 'utf8');
    const filledHtml = fillTemplate(html, datos);
    const pdf = await htmlToPdf(filledHtml);
    const key = `generated/${tipoDocumento}/${randomUUID()}.pdf`;
    const url = await uploadFile(pdf, key, 'application/pdf');

    const supabase = getSupabaseClient();
    const { data: document, error } = await supabase
      .from('documents')
      .insert({
        file_name: `${tipoDocumento}.pdf`,
        storage_url: url,
        upload_date: new Date().toISOString(),
        processing_status: 'completed',
      })
      .select('id')
      .single();

    if (error || !document?.id) {
      console.error('[Generate Document] Error guardando documento:', error);
      return res.status(500).json({ error: 'No se pudo guardar el documento' });
    }

    return res.status(201).json({
      url,
      documentoId: document.id,
      tipoDocumento,
    });
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return res.status(404).json({ error: 'Archivo de plantilla no encontrado' });
    }

    console.error('[Generate Document] Error generando documento:', error);
    return res.status(500).json({ error: 'No se pudo generar el documento' });
  }
});

export default router;