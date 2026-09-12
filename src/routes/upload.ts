// src/routes/upload.ts
import { Router, Request, Response } from 'express';
import multer from 'multer';
import { isSupportedMimeType } from '../services/extractor';
import { closeOcrWorker } from '../services/extractor';
import { enqueueDocument, getDocumentQueue } from '../queues/document.queue';
import { processDocument } from '../services/document-processing';

const router = Router();

// multer en memoria (archivos < 10 MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

/**
 * POST /upload
 * Recibe multipart/form-data con campo "file"
 * Devuelve: { fileName, tipoDocumento, area, confianza, derivacion }
 */
router.post('/', upload.single('file'), async (req: Request, res: Response) => {
  console.log('[Upload] Request received:', req.file?.originalname, req.file?.mimetype);
  try {
    // 1. Validar archivo
    if (!req.file) {
      console.log('[Upload] No file');
      return res.status(400).json({ error: 'No se envio ningun archivo' });
    }

    console.log('[Upload] File:', req.file.originalname, 'mimetype:', req.file.mimetype);

    const extensionSupported = /\.(docx|docm|dotx|xlsx|xlsm|png|jpg|jpeg|tiff|bmp|pdf)$/i.test(req.file.originalname);
    if (!isSupportedMimeType(req.file.mimetype) && !(req.file.mimetype === 'application/octet-stream' && extensionSupported)) {
      console.log('[Upload] Mime type not supported:', req.file.mimetype);
      return res.status(400).json({ error: `Tipo no soportado: ${req.file.mimetype}` });
    }

    const jobData = {
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
      fileBase64: req.file.buffer.toString('base64'),
    };

    if (process.env.QUEUE_ENABLED === 'true') {
      const job = await enqueueDocument(jobData);
      return res.status(202).json({
        jobId: job.id,
        fileName: req.file.originalname,
        status: 'pending',
      });
    }

    const response = await processDocument(jobData);
    return res.json(response);

  } catch (err) {
    console.error('[Upload] Error:', err);
    const message = err instanceof Error ? err.message : 'Error interno';
    res.status(500).json({ error: message });
  }
});

router.get('/status/:jobId', async (req: Request, res: Response) => {
  if (process.env.QUEUE_ENABLED !== 'true') {
    return res.status(404).json({ error: 'La cola no esta habilitada' });
  }
  try {
    const job = await getDocumentQueue().getJob(String(req.params.jobId));
    if (!job) return res.status(404).json({ error: 'Trabajo no encontrado' });
    const rawState = await job.getState();
    const status = rawState === 'active'
      ? 'processing'
      : rawState === 'completed'
        ? 'completed'
        : rawState === 'failed'
          ? 'failed'
          : job.attemptsMade > 0
            ? 'retrying'
            : 'pending';
    return res.json({
      jobId: job.id,
      status,
      result: status === 'completed' ? job.returnvalue : undefined,
      error: status === 'failed' ? job.failedReason : undefined,
      attempts: job.attemptsMade,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'No se pudo consultar el trabajo';
    return res.status(503).json({ error: message });
  }
});

// Cleanup al cerrar servidor
process.on('SIGTERM', async () => {
  await closeOcrWorker();
  process.exit(0);
});
process.on('SIGINT', async () => {
  await closeOcrWorker();
  process.exit(0);
});

export default router;