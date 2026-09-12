import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import uploadRouter from './routes/upload';

export function createApp() {
  const app = express();
  const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';

  app.use((req: Request, _res: Response, next: NextFunction) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });
  app.use(cors({ origin: frontendUrl }));
  app.use(express.json());
  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });
  app.use('/upload', uploadRouter);
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'Ruta no encontrada' });
  });
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  });
  return app;
}

export const app = createApp();