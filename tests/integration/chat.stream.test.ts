import http from 'node:http';
import type { AddressInfo } from 'node:net';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const { docs, limit, supabaseMock, geminiCalls } = vi.hoisted(() => {
  const docs = [
    {
      id: 'doc-ruc',
      file_name: 'RUC_2025.pdf',
      storage_url: null,
      upload_date: '2026-01-15T10:00:00.000Z',
      processing_status: 'completed',
      document_analysis: {
        document_category: 'DOCUMENTO_SUNAT',
        confidence_percentage: 95,
        ai_summary: 'Constancia de inscripción en el RUC.',
      },
      extracted_metadata: [{ field_name: 'RUC', field_value: '20551234567' }],
      document_derivations: {
        target_area: 'Intendencia de Recaudación',
        derivation_reason: 'Documento tributario',
      },
    },
    {
      id: 'doc-acta',
      file_name: 'Acta_Visita.docx',
      storage_url: 'https://cdn.example/Acta_Visita.docx',
      upload_date: '2026-02-20T09:30:00.000Z',
      processing_status: 'completed',
      document_analysis: {
        document_category: 'ACTA_VISITA',
        confidence_percentage: 88,
        ai_summary: 'Acta de visita al contribuyente.',
      },
      extracted_metadata: [],
      document_derivations: {
        target_area: 'Prevención del Contrabando',
        derivation_reason: 'Acta de fiscalización',
      },
    },
  ];

  const limit = vi.fn();
  const order = vi.fn(() => ({ limit }));
  const select = vi.fn(() => ({ order }));
  const from = vi.fn(() => ({ select }));
  const getPublicUrl = vi.fn((path: string) => ({
    data: { publicUrl: `https://cdn.example/${path}` },
  }));
  const download = vi.fn();
  const storage = { from: vi.fn(() => ({ getPublicUrl, download })) };

  return {
    docs,
    limit,
    geminiCalls: [] as Array<{ messages: Array<{ role: string; content: string }> }>,
    supabaseMock: { from, storage },
  };
});

vi.mock('../../src/config/supabase', () => ({
  getSupabaseClient: () => supabaseMock,
  validateSupabaseEnv: () => undefined,
}));

let app: import('express').Express;
let server: http.Server;
let baseUrl: string;

beforeAll(async () => {
  server = http.createServer((req, res) => {
    if (req.method !== 'POST' || req.url !== '/openai/chat/completions') {
      res.writeHead(404);
      res.end();
      return;
    }

    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
    });
    req.on('end', () => {
      geminiCalls.push(JSON.parse(raw));
      res.writeHead(200, { 'Content-Type': 'text/event-stream' });
      res.write(
        `data: ${JSON.stringify({
          choices: [{ delta: { content: 'Respuesta de prueba del asistente.' } }],
        })}\n\n`,
      );
      res.write('data: [DONE]\n\n');
      res.end();
    });
  });

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${port}`;

  process.env.GEMINI_API_KEY = 'test-key';
  process.env.GEMINI_API_BASE = baseUrl;
  process.env.GEMINI_TIMEOUT_MS = '5000';

  ({ app } = await import('../../src/app'));
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
});

beforeEach(() => {
  geminiCalls.length = 0;
  supabaseMock.from.mockClear();
  limit.mockResolvedValue({ data: docs, error: null });
});

describe('POST /chat/stream', () => {
  it('responde sin tarjetas cuando el usuario solo saluda', async () => {
    const response = await request(app).post('/chat/stream').send({ message: 'hola' });

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/event-stream');
    expect(response.text).toContain('"type":"content"');
    expect(response.text).toContain('"type": "done"');
    expect(response.text).not.toContain('"type":"tool_results"');
  });

  it('incluye los documentos como contexto para Gemini aunque no muestre tarjetas', async () => {
    await request(app).post('/chat/stream').send({ message: 'hola' });

    expect(geminiCalls).toHaveLength(1);
    const systemPrompt = geminiCalls[0].messages[0].content;
    expect(systemPrompt).toContain('RUC_2025.pdf');
    expect(systemPrompt).toContain('Constancia de inscripción en el RUC.');
    expect(systemPrompt).toContain('20551234567');
  });

  it('devuelve tarjetas cuando el usuario pide listar documentos', async () => {
    const response = await request(app)
      .post('/chat/stream')
      .send({ message: '¿Qué documentos hay?' });

    expect(response.status).toBe(200);
    expect(response.text).toContain('"type":"tool_results"');
    expect(response.text).toContain('RUC_2025.pdf');
    expect(response.text).toContain('Acta_Visita.docx');
    expect(response.text).toContain('https://cdn.example/doc-ruc.pdf');
    expect(response.text).toContain('"type": "done"');
  });

  it('respeta el flag includeDocuments de la interfaz', async () => {
    const response = await request(app)
      .post('/chat/stream')
      .send({ message: 'hola', includeDocuments: true });

    expect(response.text).toContain('"type":"tool_results"');
  });

  it('rechaza mensajes vacíos', async () => {
    const response = await request(app).post('/chat/stream').send({});

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('mensaje');
  });
});
