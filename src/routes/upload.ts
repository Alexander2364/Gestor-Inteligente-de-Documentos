import { Router, Request, Response } from 'express';
import multer from 'multer';
import { isSupportedMimeType, closeOcrWorker } from '../services/extractor';
import { enqueueDocument, getDocumentQueue } from '../queues/document.queue';
import { processDocument } from '../services/document-processing';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

router.post('/', upload.single('file'), async (req: Request, res: Response) => {
  console.log('[Upload] 1. Request received:', req.file?.originalname, req.file?.mimetype);
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se envio ningun archivo' });
    }

    console.log('[Upload] 2. Validando mimetype...');
    const extensionSupported = /\.(docx|docm|dotx|xlsx|xlsm|png|jpg|jpeg|tiff|bmp|pdf)$/i.test(req.file.originalname);
    if (!isSupportedMimeType(req.file.mimetype) && !(req.file.mimetype === 'application/octet-stream' && extensionSupported)) {
      return res.status(400).json({ error: `Tipo no soportado: ${req.file.mimetype}` });
    }

    const jobData = {
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
      fileBase64: req.file.buffer.toString('base64'),
    };

    if (process.env.QUEUE_ENABLED === 'true') {
      console.log('[Upload] 3. QUEUE_ENABLED=true. Llamando a enqueueDocument...');
      
      const job = await enqueueDocument(jobData);
      
      console.log('[Upload] 4. ✅ enqueueDocument completado. Job ID:', job.id);
      
      return res.status(202).json({
        jobId: job.id,
        fileName: req.file.originalname,
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
        result: job.returnvalue 
      });
    }
    
    if (state === 'failed') {
      return res.json({ 
        status: 'failed', 
        error: job.failedReason 
      });
    }
    
    return res.json({ status: state });
  } catch (err) {
    console.error('[Status] Error:', err);
    res.status(500).json({ error: 'Error consultando estado' });
  }
});

export default router;