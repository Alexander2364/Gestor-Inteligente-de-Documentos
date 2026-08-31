// Variables requeridas para que la app funcione
const REQUIRED_VARS = [
    'OLLAMA_HOST',
    'OLLAMA_MODEL'
] as const;

// Variables opcionales (tienen defaults en el código)
const OPTIONAL_VARS = [
    'PORT',
    'FRONTEND_URL',
    'OLLAMA_TIMEOUT_MS',
    'SMTP_HOST',
    'SMTP_PORT',
    'SMTP_USER',
    'SMTP_PASS',
    'SMTP_FROM'
] as const;

type RequiredVar = typeof REQUIRED_VARS[number];
type OptionalVar = typeof OPTIONAL_VARS[number];

export function validateEnv(): void {
    const missing: string[] = [];

    for (const varName of REQUIRED_VARS) {
        if (!process.env[varName]) {
            missing.push(varName);
        }
    }

    if (missing.length > 0) {
        console.error('Variables de entorno requeridas faltantes');
        missing.forEach(v => console.error(` - ${v}`));
        console.error('\nCrea un archivo .env basado en .env.example');
        process.exit(1);
    }

    // Log de config (sin secrets)
    console.log('Configuración cargada:');
    console.log(` PORT: ${process.env.PORT ?? '3000 (default)'}`);
    console.log(` OLLAMA_HOST: ${process.env.OLLAMA_HOST}`);
    console.log(` OLLAMA_MODEL: ${process.env.OLLAMA_MODEL}`);
    console.log(` OLLAMA_TIMEOUT_MS: ${process.env.OLLAMA_TIMEOUT_MS ?? '60000 (default)'}`);
    console.log(` FRONTEND_URL: ${process.env.FRONTEND_URL ?? 'no configurado'}`);
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

