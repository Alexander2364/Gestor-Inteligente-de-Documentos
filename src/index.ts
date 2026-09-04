// src/index.ts
import 'dotenv/config'; // Carga .env al primer require/import
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { validateEnv } from './utils/env';
import uploadRouter from './routes/upload';

validateEnv(); // Falla rápido si faltan variables

const app = express();

// Request logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`📡 [${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// CORS: permite tu frontend (Vite dev server por defecto)
const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';
app.use(cors({ origin: frontendUrl }));

app.use(express.json());

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Rutas
app.use('/upload', uploadRouter);

// 404
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Error handler global
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('💥 Unhandled error:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

const PORT = Number(process.env.PORT) ?? 3000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`   Frontend permitido: ${frontendUrl}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
});