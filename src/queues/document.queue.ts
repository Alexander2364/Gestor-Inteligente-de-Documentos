import { Job, Queue } from 'bullmq';
import {
  AnyDocumentJobResult,
  DocumentJobData,
  FILE_JOB_NAME,
  MOBILE_JOB_NAME,
} from '../domain/jobs';
import { createRedisConnection } from './connection';

export const DOCUMENT_QUEUE_NAME = 'document-processing';
let documentQueue: Queue<DocumentJobData, AnyDocumentJobResult> | undefined;

export function getDocumentQueue(): Queue<DocumentJobData, AnyDocumentJobResult> {
  documentQueue ??= new Queue<DocumentJobData, AnyDocumentJobResult>(DOCUMENT_QUEUE_NAME, {
    connection: createRedisConnection(),
  });
  return documentQueue;
}

function baseJobOptions() {
  return {
    attempts: Number(process.env.QUEUE_ATTEMPTS ?? 3),
    backoff: { type: 'exponential' as const, delay: Number(process.env.QUEUE_BACKOFF_MS ?? 2000) },
    removeOnComplete: { age: 86400, count: 1000 },
    removeOnFail: { age: 604800, count: 1000 },
  };
}

export async function enqueueDocument(data: DocumentJobData): Promise<Job<DocumentJobData, AnyDocumentJobResult>> {
  return getDocumentQueue().add(FILE_JOB_NAME, data, baseJobOptions());
}

/**
 * Encola el análisis de una captura de cámara. Se procesa en segundo plano porque el
 * OCR + clasificación con IA puede tardar varios minutos en hardware sin GPU.
 * Usamos attempts:1 para no repetir automáticamente un análisis tan costoso.
 */
export async function enqueueMobileDocument(data: DocumentJobData): Promise<Job<DocumentJobData, AnyDocumentJobResult>> {
  return getDocumentQueue().add(MOBILE_JOB_NAME, data, {
    ...baseJobOptions(),
    attempts: 1,
  });
}
