// Variables de entorno para la aplicación.
//
// El único proveedor de IA remoto es Gemini (Google AI Studio). El clasificador
// local por palabras clave (`classifyByKeywords`) es siempre el último recurso,
// así que la app nunca se queda sin clasificar y NUNCA requiere Ollama.

const GEMINI_REQUIRED_VARS = ['GEMINI_API_KEY'] as const;

// Variables optionales (tienen defaults en el código).
const OPTIONAL_VARS = [
  'PORT',
  'FRONTEND_URL',
  'GOOGLE_API_KEY',
  'GEMINI_MODEL',
  'GEMINI_TIMEOUT_MS',
  'GEMINI_API_BASE',
  'GEMINI_THINKING_LEVEL',
  'IA_MOBILE_MAX_TOKENS',
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASS',
  'SMTP_FROM',
  'REDIS_URL',
  'QUEUE_ENABLED',
  'QUEUE_ATTEMPTS',
  'QUEUE_BACKOFF_MS',
  'REQUEST_TIMEOUT_MS',
] as const;

type RequiredVar = (typeof GEMINI_REQUIRED_VARS)[number];
type OptionalVar = (typeof OPTIONAL_VARS)[number];

export function validateEnv(): void {
  const geminiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;
  const missing: string[] = [];

  // Gemini es obligatorio como proveedor principal de IA.
  if (!geminiKey) {
    missing.push('GEMINI_API_KEY');
  }

  if (missing.length > 0) {
    console.error('Variables de entorno requeridas faltantes');
    missing.forEach((v) => console.error(` - ${v}`));
    console.error('\nCrea un archivo .env basado en .env.example');
    process.exit(1);
  }

  // Log de config (sin secrets)
  console.log('Configuración cargada:');
  console.log(` PORT: ${process.env.PORT ?? '3000 (default)'}`);
  console.log(` GEMINI_MODEL: ${process.env.GEMINI_MODEL ?? 'gemini-3.5-flash-lite (default)'}`);
  console.log(` GEMINI_TIMEOUT_MS: ${process.env.GEMINI_TIMEOUT_MS ?? '45000 (default)'}`);
  console.log(` FRONTEND_URL: ${process.env.FRONTEND_URL ?? 'no configurado'}`);
  console.log(` QUEUE_ENABLED: ${process.env.QUEUE_ENABLED ?? 'false'}`);
}

// Helper tipado para leer variables
export function getEnv<K extends RequiredVar | OptionalVar>(key: K): string | undefined {
  return process.env[key];
}

export function getEnvOrThrow<K extends RequiredVar>(key: K): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Variable de entorno requerida no definida: ${key}`);
  }
  return value;
}
