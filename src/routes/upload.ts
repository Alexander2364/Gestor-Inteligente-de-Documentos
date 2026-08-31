// src/routes/upload.ts
import { Router, Request, Response } from 'express';
import multer from 'multer';
import { extractText, isSupportedMimeType } from '../services/extractor';
import { classifyWithOllama } from '../services/ia';
import { closeOcrWorker } from '../services/extractor';

const router = Router();

// multer en memoria (archivos < 10 MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

// Mapeo área -> email derivación
const DERIVATION_EMAIL: Record<string, string> = {
  Finanzas: 'finanzas@empresa.com',
  RRHH: 'rrhh@empresa.com'
};

/**
 * POST /upload
 * Recibe multipart/form-data con campo "file"
 * Devuelve: { fileName, categoria, confianza, derivacion }
 */
router.post('/', upload.single('file'), async (req: Request, res: Response) => {
  try {
    // 1. Validar archivo
    if (!req.file) {
      return res.status(400).json({ error: 'No se envió ningún archivo' });
    }

    if (!isSupportedMimeType(req.file.mimetype)) {
      return res.status(400).json({ error: `Tipo no soportado: ${req.file.mimetype}` });
    }

    // 2. Extraer texto
    const { text } = await extractText(req.file.buffer, req.file.mimetype);

    if (!text || text.trim().length < 20) {
      return res.status(400).json({ error: 'No se pudo extraer texto suficiente del documento' });
    }

    // 3. Clasificar con IA (Ollama)
    const { area, confianza } = await classifyWithOllama(text);

    // 4. Responder al cliente INMEDIATAMENTE
    const response = {
      fileName: req.file.originalname,
      categoria: area,
      confianza,
      derivacion: DERIVATION_EMAIL[area] ?? 'sin-derivación'
    };

    res.json(response);

    // 5. Fire-and-forget: enviar correo (no bloquea la respuesta)
    // TODO: Integrar cuando Edu tenga sendDerivationEmail listo
    // sendDerivationEmail(area, req.file.originalname, area, confianza).catch(console.error);

  } catch (err) {
    console.error('❌ Error en /upload:', err);
    const message = err instanceof Error ? err.message : 'Error interno';
    res.status(500).json({ error: message });
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