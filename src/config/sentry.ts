import * as Sentry from '@sentry/node';
import { expressIntegration, expressErrorHandler } from '@sentry/node';

/**
 * Inicializa Sentry solo cuando se define SENTRY_DSN. En desarrollo local o en
 * entornos sin DSN, no envía nada y la app sigue funcionando normalmente.
 *
 * Variables de entorno:
 *   SENTRY_DSN           DSN del proyecto de Sentry (obligatorio para enviar eventos).
 *   SENTRY_ENVIRONMENT   Entorno (development, staging, production). Default: development.
 *   SENTRY_RELEASE       Versión del despliegue. Default: package.json version.
 *   SENTRY_TRACES_SAMPLE_RATE Tasa de muestreo de traces (0 a 1). Default: 0.1.
 */
export function initSentry() {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    console.log('[Sentry] DSN no definido; se omite la inicialización.');
    return;
  }

  Sentry.init({
    dsn,
    environment:
      process.env.SENTRY_ENVIRONMENT ??
      (process.env.NODE_ENV === 'production' ? 'production' : 'development'),
    release: process.env.SENTRY_RELEASE ?? process.env.npm_package_version,
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? '0.1'),
    // No enviar peticiones de salud ni de métricas a Sentry como transacciones.
    ignoreTransactions: ['/health', '/healthz'],
    // Ignorar ruidos esperados que no son errores de la aplicación.
    ignoreErrors: ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'socket hang up', 'AbortError'],
    integrations: [expressIntegration()],
  });

  console.log('[Sentry] Inicializado.');
}

/**
 * Middleware de captura de peticiones entrantes. Se registra antes de las rutas.
 */
export const sentryRequestHandler = expressIntegration();

/**
 * Middleware de captura de errores no capturados. Se registra al final de la
 * pila de middlewares, después de todas las rutas.
 */
export const sentryErrorHandler = expressErrorHandler;
