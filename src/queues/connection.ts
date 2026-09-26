import IORedis from 'ioredis';

const redisUrl = process.env.REDIS_URL ?? 'redis://redis:6379';

export function createRedisConnection(): IORedis {
  console.log(`[Redis] 🔗 Intentando conectar a: ${redisUrl}`);

  const redis = new IORedis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });

  redis.on('connect', () => console.log('[Redis] 🔌 Conexión de red establecida'));
  redis.on('ready', () => console.log('[Redis] ✅ Listo para enviar comandos (READY)'));
  redis.on('error', (err) => console.error('[Redis] ❌ Error:', err.message));

  return redis;
}