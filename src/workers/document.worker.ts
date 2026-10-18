import { Worker } from 'bullmq';
import { createRedisConnection } from '../queues/connection';
import { processDocument, processMobileDocument } from '../services/document-processing';
import { DOCUMENT_QUEUE_NAME } from '../queues/document.queue';
import { MOBILE_JOB_NAME } from '../domain/jobs';

const connection = createRedisConnection();

console.log(`[Worker] 👂 Escuchando la cola: ${DOCUMENT_QUEUE_NAME}`);

export const documentWorker = new Worker(
  DOCUMENT_QUEUE_NAME,
  async (job) => {
    try {
      console.log(
        `[Worker] 🚀 Iniciando job ${job.id} (${job.name}). Intento ${job.attemptsMade + 1}`,
      );

      if (job.name === MOBILE_JOB_NAME) {
        const result = await processMobileDocument(job.data);
        console.log(`[Worker] ✅ Job ${job.id} (cámara) completado exitosamente.`);
        return result;
      }

      const result = await processDocument(job.data);
      console.log(`[Worker] ✅ Job ${job.id} completado exitosamente.`);
      return result;
    } catch (error) {
      console.error(
        `[Worker] ❌ Error en job ${job.id}.`,
        error instanceof Error ? error.message : error,
      );
      throw error; // Importante para que BullMQ aplique el backoff
    }
  },
  {
    connection,
    concurrency: 1, // Protege tu RAM de 16GB
  },
);

documentWorker.on('failed', (job, err) => {
  console.error(
    `[Worker] 🚨 ALERTA: Job ${job?.id} falló definitivamente tras ${job?.attemptsMade} intentos.`,
    err.message,
  );
});

console.log('✅ Document worker is running and listening for jobs...');

// Polling periódico cada 45 segundos para procesar documentos cargados directamente en Supabase (ej. vía email en n8n)
setInterval(async () => {
  try {
    const { processAllPendingDocuments } = await import('../services/document-processing');
    await processAllPendingDocuments();
  } catch (err) {
    // Ignorar errores silenciosamente para no saturar los logs
  }
}, 45000);
