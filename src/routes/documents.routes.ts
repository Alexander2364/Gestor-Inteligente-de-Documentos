import { Request, Response, Router } from 'express';
import { mobileUpload, MOBILE_IMAGE_MIMES } from '../middleware/mobileUpload';
import { validateDocumentData } from '../domain/templates/validators';
import { DocumentFlowError, generateDocument, scanMobileDocument } from '../services/documentFlow.service';

const router = Router();

function isDataObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function sendFlowError(res: Response, error: unknown): Response {
  if (error instanceof DocumentFlowError) {
    console.error(`[Document Flow] ${error.stage}:`, error.message);
    const status = error.stage === 'template' ? 404 : 500;
    return res.status(status).json({ error: error.message, etapa: error.stage });
  }

  console.error('[Document Flow] Error inesperado:', error);
  return res.status(500).json({ error: 'No se pudo completar el flujo documental' });
}

router.post('/generate-document', async (req: Request, res: Response) => {
  const { tipoDocumento, datos } = req.body ?? {};

  if (typeof tipoDocumento !== 'string' || !tipoDocumento.trim()) {
    return res.status(400).json({ error: 'tipoDocumento es requerido' });
  }

  if (!isDataObject(datos)) {
    return res.status(400).json({ error: 'datos debe ser un objeto' });
  }

  const validation = validateDocumentData(tipoDocumento, datos);
  if (!validation.valido) {
    return res.status(400).json({ error: 'Datos inválidos', errores: validation.errores });
  }

  try {
    return res.status(201).json(await generateDocument(tipoDocumento, datos));
  } catch (error) {
    return sendFlowError(res, error);
  }
});

router.post('/scan-and-generate', mobileUpload.single('file'), async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No se envio ninguna imagen' });
  }

  if (!MOBILE_IMAGE_MIMES.has(req.file.mimetype)) {
    return res.status(415).json({ error: `Tipo de imagen no soportado: ${req.file.mimetype}` });
  }

  try {
    const scan = await scanMobileDocument(req.file.buffer, req.file.mimetype);
    const validation = validateDocumentData(scan.tipoDocumento, scan.datos);
    if (!validation.valido) {
      return res.status(400).json({ error: 'Datos inválidos', errores: validation.errores, etapa: 'validation' });
    }
    const generated = await generateDocument(scan.tipoDocumento, scan.datos);

    return res.status(201).json({
      tipoDocumento: scan.tipoDocumento,
      confianza: scan.confianza,
      datos: scan.datos,
      pdfUrl: generated.url,
      documentoId: generated.documentoId,
    });
  } catch (error) {
    return sendFlowError(res, error);
  }
});

export default router;