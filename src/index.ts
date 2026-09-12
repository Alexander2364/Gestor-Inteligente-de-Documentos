// src/index.ts
import 'dotenv/config'; // Carga .env al primer require/import
import { validateEnv } from './utils/env';
import { app } from './app';

validateEnv(); // Falla rápido si faltan variables

const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';

const PORT = Number(process.env.PORT) ?? 3000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`   Frontend permitido: ${frontendUrl}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
});