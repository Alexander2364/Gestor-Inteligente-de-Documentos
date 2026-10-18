import { Router, Request, Response } from 'express';
import multer from 'multer';
import { isSupportedMimeType } from '../services/extractor';
import { enqueueDocument, enqueueMobileDocument, getDocumentQueue } from '../queues/document.queue';
import { processDocument, processMobileDocument } from '../services/document-processing';
import { MOBILE_IMAGE_MIMES, mobileUpload } from '../middleware/mobileUpload';
import { DocumentFlowError } from '../services/documentFlow.service';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

router.post('/', upload.single('file'), async (req: Request, res: Response) => {
  console.log('[Upload] 1. Request received:', req.file?.originalname, req.file?.mimetype);
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se envio ningun archivo' });
    }

    console.log('[Upload] 2. Validando mimetype...');
    const extensionSupported = /\.(docx|docm|dotx|xlsx|xlsm|png|jpg|jpeg|tiff|bmp|pdf)$/i.test(
      req.file.originalname,
    );
    if (
      !isSupportedMimeType(req.file.mimetype) &&
      !(req.file.mimetype === 'application/octet-stream' && extensionSupported)
    ) {
      return res.status(400).json({ error: `Tipo no soportado: ${req.file.mimetype}` });
    }

    let fileName = req.file.originalname;
    try {
      const utf8Name = Buffer.from(req.file.originalname, 'latin1').toString('utf8');
      if (!utf8Name.includes('Ã')) fileName = utf8Name;
    } catch {
      // La decodificación es best-effort: si falla, se usa el nombre original.
    }

    fileName = fileName
      .replace(/Ã[\u0080-\u009f]?N/g, 'ÓN')
      .replace(/Ã“/g, 'Ó')
      .replace(/Ã\u0093/g, 'Ó')
      .replace(/Ã¡/g, 'á')
      .replace(/Ã©/g, 'é')
      .replace(/Ã­/g, 'í')
      .replace(/Ã³/g, 'ó')
      .replace(/Ãº/g, 'ú')
      .replace(/Ã±/g, 'ñ')
      .replace(/ÃN/g, 'ÓN');

    const jobData = {
      fileName,
      mimeType: req.file.mimetype,
      fileBase64: req.file.buffer.toString('base64'),
    };

    if (process.env.QUEUE_ENABLED === 'true') {
      console.log('[Upload] 3. QUEUE_ENABLED=true. Llamando a enqueueDocument...');

      const job = await enqueueDocument(jobData);

      console.log('[Upload] 4. ✅ enqueueDocument completado. Job ID:', job.id);

      return res.status(202).json({
        jobId: job.id,
        fileName,
        status: 'pending',
      });
    }

    console.log('[Upload] 5. Procesando sincrónicamente (fallback)...');
    const response = await processDocument(jobData);
    return res.json(response);
  } catch (err) {
    console.error('[Upload] ❌ ERROR FATAL:', err);
    const message = err instanceof Error ? err.message : 'Error interno';
    res.status(500).json({ error: message });
  }
});

router.post('/mobile', mobileUpload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se envio ninguna imagen' });
    }

    if (!MOBILE_IMAGE_MIMES.has(req.file.mimetype)) {
      return res.status(415).json({ error: `Tipo de imagen no soportado: ${req.file.mimetype}` });
    }

    const jobData = {
      fileName: req.file.originalname || `captura-${Date.now()}.jpg`,
      mimeType: req.file.mimetype,
      fileBase64: req.file.buffer.toString('base64'),
      source: 'mobile' as const,
    };

    // El OCR + clasificación con IA puede tardar varios minutos en hardware sin GPU.
    // Lo procesamos en segundo plano y el cliente consulta /upload/status/:jobId.
    if (process.env.QUEUE_ENABLED === 'true') {
      const job = await enqueueMobileDocument(jobData);
      console.log('[Upload Mobile] Captura encolada. Job ID:', job.id);
      return res.status(202).json({ jobId: job.id, fileName: jobData.fileName, status: 'pending' });
    }

    console.log('[Upload Mobile] Procesando sincrónicamente (fallback)...');
    const result = await processMobileDocument(jobData);
    return res.json(result);
  } catch (err) {
    console.error('[Upload Mobile] Error procesando imagen:', err);
    if (err instanceof DocumentFlowError) {
      return res.status(err.stage === 'template' ? 404 : 500).json({
        error: err.message,
        etapa: err.stage,
      });
    }
    const message = err instanceof Error ? err.message : 'Error interno procesando imagen';
    return res.status(500).json({ error: message });
  }
});

router.get('/status/:jobId', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const queue = getDocumentQueue();
    const job = await queue.getJob(jobId);

    if (!job) {
      return res.status(404).json({ error: 'Job no encontrado' });
    }

    const state = await job.getState();

    if (state === 'completed') {
      return res.json({
        status: 'completed',
        result: job.returnvalue,
      });
    }

    if (state === 'failed') {
      return res.json({
        status: 'failed',
        error: job.failedReason,
      });
    }

    return res.json({ status: state });
  } catch (err) {
    console.error('[Status] Error:', err);
    res.status(500).json({ error: 'Error consultando estado' });
  }
});

export default router;
