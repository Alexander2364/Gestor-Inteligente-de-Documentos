import { Worker } from 'bullmq';
import { createRedisConnection } from '../queues/connection';
import { processDocument } from '../services/document-processing';
import { DOCUMENT_QUEUE_NAME } from '../queues/document.queue'; // Usamos el nombre exportado

const connection = createRedisConnection();

console.log(`[Worker] 👂 Escuchando la cola: ${DOCUMENT_QUEUE_NAME}`);

export const documentWorker = new Worker(
  DOCUMENT_QUEUE_NAME, // <--- ¡CORREGIDO! Ahora coincide con la API
  async (job) => {
    try {
      console.log(`[Worker] 🚀 Iniciando job ${job.id}. Intento ${job.attemptsMade + 1}`);
      
      return await processDocument(job.data);
      
      console.log(`[Worker] ✅ Job ${job.id} completado exitosamente.`);
    } catch (error) {
      console.error(`[Worker] ❌ Error en job ${job.id}.`, error instanceof Error ? error.message : error);
      throw error; // Importante para que BullMQ aplique el backoff
    }
  },
  {
    connection,
    concurrency: 1, // Protege tu RAM de 16GB
  }
);

documentWorker.on('failed', (job, err) => {
  console.error(`[Worker] 🚨 ALERTA: Job ${job?.id} falló definitivamente tras ${job?.attemptsMade} intentos.`, err.message);
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