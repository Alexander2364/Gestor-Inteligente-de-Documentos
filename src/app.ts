import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import uploadRouter from './routes/upload';
import documentsRouter from './routes/documents';
import chatRouter from './routes/chat'; 

export function createApp() {
  const app = express();

  // 1. Definir un array de orígenes permitidos (robusto para Docker y desarrollo local)
  const allowedOrigins = [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost',
    'http://localhost:80',
    'http://127.0.0.1',
    'http://127.0.0.1:80'
  ];

  app.use((req: Request, _res: Response, next: NextFunction) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });

  // 2. Configurar CORS para permitir acceso local y desde cualquier dispositivo de la red (LAN)
  app.use(cors({ 
    origin: (origin, callback) => {
      // Permitir solicitudes sin origen (curl, Postman, server-to-server) o cualquier origen web
      callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  }));

  app.use(express.json());

  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Rutas principales de la API
  app.use('/upload', uploadRouter);
  app.use('/documents', documentsRouter);
  app.use('/chat', chatRouter);

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