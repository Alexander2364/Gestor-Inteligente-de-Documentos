// Variables requeridas solo si Ollama es el proveedor principal de IA.
const OLLAMA_REQUIRED_VARS = ['OLLAMA_HOST', 'OLLAMA_MODEL'] as const;

// Variables opcionales (tienen defaults en el código)
const OPTIONAL_VARS = [
  'PORT',
  'FRONTEND_URL',
  'IA_PROVIDER',
  'GEMINI_API_KEY',
  'GOOGLE_API_KEY',
  'GEMINI_MODEL',
  'GEMINI_TIMEOUT_MS',
  'GEMINI_API_BASE',
  'GEMINI_THINKING_LEVEL',
  'OLLAMA_FALLBACK',
  'OLLAMA_TIMEOUT_MS',
  'IA_MOBILE_MAX_TOKENS',
  'OLLAMA_MOBILE_MAX_PREDICT',
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASS',
  'SMTP_FROM',
  'REDIS_URL',
  'QUEUE_ENABLED',
  'QUEUE_ATTEMPTS',
  'QUEUE_BACKOFF_MS',
  'OLLAMA_CONCURRENCY',
] as const;

type RequiredVar = (typeof OLLAMA_REQUIRED_VARS)[number];
type OptionalVar = (typeof OPTIONAL_VARS)[number];

export function validateEnv(): void {
  const provider = (process.env.IA_PROVIDER ?? 'auto').trim().toLowerCase();
  const geminiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;

  const missing: string[] = [];

  // Ollama solo es obligatorio cuando va a ser el proveedor principal.
  const ollamaIsPrimary = provider === 'ollama' || (provider === 'auto' && !geminiKey);
  if (ollamaIsPrimary) {
    for (const varName of OLLAMA_REQUIRED_VARS) {
      if (!process.env[varName]) {
        missing.push(varName);
      }
    }
  }
  // Si se fuerza Gemini, la clave es imprescindible.
  if (provider === 'gemini' && !geminiKey) {
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
  console.log(
    ` IA_PROVIDER: ${provider}${geminiKey ? ' (Gemini configurado)' : ' (sin Gemini, usa Ollama)'}`,
  );
  console.log(` GEMINI_MODEL: ${process.env.GEMINI_MODEL ?? 'gemini-3.5-flash-lite (default)'}`);
  console.log(` OLLAMA_HOST: ${process.env.OLLAMA_HOST ?? 'no configurado'}`);
  console.log(` OLLAMA_MODEL: ${process.env.OLLAMA_MODEL ?? 'no configurado'}`);
  console.log(` OLLAMA_TIMEOUT_MS: ${process.env.OLLAMA_TIMEOUT_MS ?? '180000 (default)'}`);
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
