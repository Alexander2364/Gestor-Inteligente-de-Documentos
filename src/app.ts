import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import uploadRouter from './routes/upload';
import documentsRouter from './routes/documents';
import chatRouter from './routes/chat';
import templatesRouter from './routes/templates.routes';
import documentGenerationRouter from './routes/documents.routes';

/**
 * Express aplica un timeout de socket de 2 minutos por defecto
 * (`server.setTimeout`). Para endpoints streaming (SSE) o síncronos que pueden
 * tardar más (OCR + clasificación + generación de PDF), elevamos el timeout
 * del request para que no corte operaciones legítimas.
 */
const LONG_REQUEST_TIMEOUT_MS = Number(process.env.REQUEST_TIMEOUT_MS ?? 600_000);

export function createApp() {
  const app = express();

  // 1. Definir un array de orígenes permitidos (robusto para Docker y desarrollo local)
  const allowedOrigins = [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost',
    'http://localhost:80',
    'http://127.0.0.1',
    'http://127.0.0.1:80',
  ];

  app.use((req: Request, _res: Response, next: NextFunction) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });

  // 2. Configurar CORS para permitir acceso local y desde cualquier dispositivo de la red (LAN)
  app.use(
    cors({
      origin: (origin, callback) => {
        // Permitir solicitudes sin origen (curl, Postman, server-to-server) o cualquier origen web
        callback(null, true);
      },
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
    }),
  );

  app.use(express.json());

  // Eleva el timeout del socket para endpoints streaming o de generación larga.
  // Sin esto, el timeout por defecto de Node (120s) corta conexiones SSE que
  // pueden durar minutos (Ollama en CPU, OCR de imágenes).
  app.use((req: Request, _res: Response, next: NextFunction) => {
    req.setTimeout(LONG_REQUEST_TIMEOUT_MS);
    next();
  });

  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Rutas principales de la API
  app.use('/upload', uploadRouter);
  app.use('/documents', documentsRouter);
  app.use('/chat', chatRouter);
  app.use('/template', templatesRouter);
  app.use('/', documentGenerationRouter);

  // Manejador 404 para rutas no existentes
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'Ruta no encontrada' });
  });

  // Manejador global de errores
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  });

  return app;
}

export const app = createApp();
