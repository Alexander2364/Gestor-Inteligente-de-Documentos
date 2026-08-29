import express, { Request, Response } from 'express';
import cors from 'cors';
import multer from 'multer';

const app = express();
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10 MB
});

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/upload', upload.single('file'), (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No se envió ningún archivo' });
  }
  const response = {
    fileName: req.file.originalname,
    categoria: 'factura',
    confianza: 0.92,
    datosExtraidos: {
      proveedor: 'Ejemplo S.A.',
      fecha: '2026-08-28',
      total: 1250.00,
      moneda: 'MXN'
    },
    resumen: 'Factura de servicios profesionales por $1,250.00 MXN',
    derivacion: 'contabilidad'
  };
  return res.json(response);
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});