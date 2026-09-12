import { Job, Queue } from 'bullmq';
import { DocumentJobData, DocumentJobResult } from '../domain/jobs';
import { createRedisConnection } from './connection';

export const DOCUMENT_QUEUE_NAME = 'document-processing';
let documentQueue: Queue<DocumentJobData, DocumentJobResult> | undefined;

export function getDocumentQueue(): Queue<DocumentJobData, DocumentJobResult> {
  documentQueue ??= new Queue<DocumentJobData, DocumentJobResult>(DOCUMENT_QUEUE_NAME, {
    connection: createRedisConnection(),
  });
  return documentQueue;
}

export async function enqueueDocument(data: DocumentJobData): Promise<Job<DocumentJobData, DocumentJobResult>> {
  return getDocumentQueue().add('process-document', data, {
    attempts: Number(process.env.QUEUE_ATTEMPTS ?? 3),
    backoff: { type: 'exponential', delay: Number(process.env.QUEUE_BACKOFF_MS ?? 2000) },
    removeOnComplete: { age: 86400, count: 1000 },
    removeOnFail: { age: 604800, count: 1000 },
  });
}