import 'dotenv/config';
import { Worker } from 'bullmq';
import { DocumentJobData, DocumentJobResult } from '../domain/jobs';
import { processDocument } from '../services/document-processing';
import { createRedisConnection } from '../queues/connection';
import { DOCUMENT_QUEUE_NAME } from '../queues/document.queue';

const worker = new Worker<DocumentJobData, DocumentJobResult>(
  DOCUMENT_QUEUE_NAME,
  (job) => processDocument(job.data),
  {
    connection: createRedisConnection(),
    concurrency: Number(process.env.OLLAMA_CONCURRENCY ?? 1),
  },
);

worker.on('completed', (job) => console.log(`[Worker] Trabajo completado: ${job.id}`));
worker.on('failed', (job, error) => console.error(`[Worker] Trabajo fallido: ${job?.id}`, error.message));

console.log(`[Worker] Escuchando ${DOCUMENT_QUEUE_NAME}`);