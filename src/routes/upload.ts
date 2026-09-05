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

// Mapeo tipo documento SUNAT -> email derivacion
const DERIVATION_EMAIL: Record<string, string> = {
  // Area: RECAUDACION Y CONTROL MASIVO
  DECLARACION_JURADA_MENSUAL: 'declaraciones@sunat.gob.pe',
  DECLARACION_JURADA_ANUAL: 'declaraciones@sunat.gob.pe',
  RESOLUCION_FRACCIONAMIENTO: 'fraccionamiento@sunat.gob.pe',
  RESOLUCION_APLAZAMIENTO: 'fraccionamiento@sunat.gob.pe',
  ORDEN_PAGO_OP: 'ordenes_pago@sunat.gob.pe',
  SOLICITUD_INSCRIPCION_RUC: 'ruc_inscripciones@sunat.gob.pe',
  ACTUALIZACION_RUC: 'ruc_inscripciones@sunat.gob.pe',
  RESOLUCION_DETERMINACION_RD: 'determinaciones@sunat.gob.pe',
  SOLICITUD_APLAZAMIENTO: 'fraccionamiento@sunat.gob.pe',
  RESOLUCION_APLAZAMIENTO_FRACCIONAMIENTO: 'fraccionamiento@sunat.gob.pe',
  CARTA_PRESENTACION: 'recaudacion@sunat.gob.pe',
  NOTIFICACION_ELECTRONICA: 'notificaciones@sunat.gob.pe',
  
  // Area: FISCALIZACION
  RESOLUCION_MULTA_RM: 'fiscalizacion@sunat.gob.pe',
  REQUERIMIENTO_FISCALIZACION: 'fiscalizacion@sunat.gob.pe',
  AUDITORIA_LIBROS: 'fiscalizacion@sunat.gob.pe',
};

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

    if (!isSupportedMimeType(req.file.mimetype)) {
      console.log('[Upload] Mime type not supported:', req.file.mimetype);
      return res.status(400).json({ error: `Tipo no soportado: ${req.file.mimetype}` });
    }

    // 2. Extraer texto
    console.log('[Upload] Extracting text...');
    const { text } = await extractText(req.file.buffer, req.file.mimetype, req.file.originalname);
    console.log('[Upload] Text extracted, length:', text.length);

    if (!text || text.trim().length < 20) {
      return res.status(400).json({ error: 'No se pudo extraer texto suficiente del documento' });
    }

    // 3. Clasificar con IA (Ollama)
    console.log('[Upload] Classifying with IA...');
    const { tipoDocumento, area, confianza, campos, informeEjecutivo, resumenEjecutivo } = await classifyWithOllama(text);
    console.log('[Upload] Classified:', tipoDocumento, area, confianza);

    // 4. Responder al cliente INMEDIATAMENTE
    const response = {
      fileName: req.file.originalname,
      tipoDocumento,
      area,
      confianza,
      campos,
      informeEjecutivo,
      resumenEjecutivo,
      derivacion: DERIVATION_EMAIL[tipoDocumento] ?? 'sin-derivacion'
    };

    res.json(response);
    console.log('[Upload] Response sent');

  } catch (err) {
    console.error('[Upload] Error:', err);
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