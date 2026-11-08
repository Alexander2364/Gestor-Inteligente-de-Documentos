// src/index.ts
import 'dotenv/config'; // Carga .env al primer require/import
import { validateEnv } from './utils/env';
import { createApp } from './app';
import { initSentry } from './config/sentry';

// Inicializa Sentry solo si hay SENTRY_DSN definido.
initSentry();

validateEnv(); // Falla rápido si faltan variables

const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';

const parsedPort = Number.parseInt(process.env.PORT ?? '3000', 10);
const PORT = Number.isFinite(parsedPort) ? parsedPort : 3000;

const app = createApp();

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`   Frontend permitido: ${frontendUrl}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
});
