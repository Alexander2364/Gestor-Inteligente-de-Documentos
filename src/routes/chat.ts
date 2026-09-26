import { Router, Request, Response } from 'express';
import { getSupabaseClient } from '../config/supabase';
import { extractText, SupportedMimeType } from '../services/extractor';

const router = Router();
const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.1:8b';
const STORAGE_BUCKET = 'DocumentosIA';

function normalize(str: string): string {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function resolveStorageUrl(supabase: ReturnType<typeof getSupabaseClient>, docId: string, fileName: string, existingUrl?: string | null): string {
  if (existingUrl && existingUrl.startsWith('http')) {
    return existingUrl;
  }
  const ext = fileName.split('.').pop() || 'pdf';
  const storagePath = `${docId}.${ext}`;
  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}

// Interfaz para documentos enriquecidos
interface EnrichedDoc {
  id: string;
  file_name: string;
  storage_url?: string | null;
  upload_date: string;
  processing_status: string;
  document_analysis?: {
    document_category?: string;
    confidence_percentage?: number;
    ai_summary?: string;
  };
  extracted_metadata?: Array<{
    field_name: string;
    field_value: string;
  }>;
  document_derivations?: {
    target_area?: string;
    derivation_reason?: string;
  };
  raw_text_snippet?: string;
}

/**
 * Busca y clasifica los documentos más relevantes de Supabase según la consulta del usuario
 */
async function searchRelevantDocuments(query: string): Promise<EnrichedDoc[]> {
  try {
    const supabase = getSupabaseClient();
    const { data: rawDocs, error } = await supabase
      .from('documents')
      .select(`
        id,
        file_name,
        storage_url,
        upload_date,
        processing_status,
        document_analysis (
          document_category,
          confidence_percentage,
          ai_summary
        ),
        extracted_metadata (
          field_name,
          field_value
        ),
        document_derivations (
          target_area,
          derivation_reason
        )
      `)
      .order('upload_date', { ascending: false })
      .limit(40);

    if (error || !rawDocs || rawDocs.length === 0) {
      console.warn('[RAG] No se encontraron documentos en Supabase o hubo error:', error?.message);
      return [];
    }

    const docs: EnrichedDoc[] = rawDocs.map((d: any) => ({
      ...d,
      document_analysis: Array.isArray(d.document_analysis) ? d.document_analysis[0] : d.document_analysis,
      document_derivations: Array.isArray(d.document_derivations) ? d.document_derivations[0] : d.document_derivations,
      extracted_metadata: Array.isArray(d.extracted_metadata) ? d.extracted_metadata : [],
    }));

    const normalizedQuery = normalize(query);
    const tokens = normalizedQuery.split(/\s+/).filter(t => t.length > 2);

    // Detectar si es una pregunta general o de listado
    const isGeneralQuery = tokens.length === 0 || 
      /^(hola|buen|que tal|documentos|que hay|cuales|resumen|todos|listar|mostrar|ayuda)/i.test(query.trim());

    if (isGeneralQuery) {
      // Devolver los 6 documentos más recientes
      return docs.slice(0, 6);
    }

    // Puntuar documentos según relevancia con la consulta
    const scoredDocs = docs.map(doc => {
      let score = 0;
      const fileNameNorm = normalize(doc.file_name);
      const categoryNorm = normalize(doc.document_analysis?.document_category || '');
      const summaryNorm = normalize(doc.document_analysis?.ai_summary || '');
      const areaNorm = normalize(doc.document_derivations?.target_area || '');

      for (const token of tokens) {
        if (fileNameNorm.includes(token)) score += 15;
        if (categoryNorm.includes(token)) score += 12;
        if (summaryNorm.includes(token)) score += 8;
        if (areaNorm.includes(token)) score += 6;

        for (const meta of doc.extracted_metadata || []) {
          const valNorm = normalize(meta.field_value || '');
          if (valNorm.includes(token)) {
            // Coincidencia exacta con RUC u otro metadato clave tiene gran peso
            score += (/^\d{8,11}$/.test(token) ? 30 : 15);
          }
        }
      }

      return { doc, score };
    });

    scoredDocs.sort((a, b) => b.score - a.score);

    // Filtrar documentos que tienen coincidencia; si ninguno tiene puntuación > 0, tomar los 4 más recientes
    const matches = scoredDocs.filter(s => s.score > 0).map(s => s.doc);
    const selectedDocs = matches.length > 0 ? matches.slice(0, 6) : docs.slice(0, 4);

    // Si el usuario pregunta por el contenido exacto de un archivo específico, intentar leerlo del bucket
    if (selectedDocs.length > 0 && /leer|texto|dice|detalle|contenido|extraer/i.test(query)) {
      const topDoc = selectedDocs[0];
      try {
        const ext = (topDoc.file_name.split('.').pop() || '').toLowerCase();
        const storagePath = `${topDoc.id}.${ext}`;
        const { data: fileBlob } = await supabase.storage.from(STORAGE_BUCKET).download(storagePath);
        
        if (fileBlob) {
          const buffer = Buffer.from(await fileBlob.arrayBuffer());
          let mime: SupportedMimeType = 'application/pdf';
          if (ext === 'docx' || ext === 'docm') mime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
          else if (ext === 'xlsx') mime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

          const { text } = await extractText(buffer, mime, topDoc.file_name);
          if (text) {
            topDoc.raw_text_snippet = text.slice(0, 2000);
          }
        }
      } catch (e) {
        console.warn('[RAG] No se pudo extraer texto bruto del bucket:', e);
      }
    }

    return selectedDocs;
  } catch (err) {
    console.error('[RAG] Error en búsqueda de documentos:', err);
    return [];
  }
}

/**
 * Endpoint de streaming SSE para el chatbot con RAG de Supabase
 */
router.post('/stream', async (req: Request, res: Response) => {
  try {
    const { message, history } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'El mensaje es obligatorio' });
    }

    // Configurar headers para Server-Sent Events (SSE) sin buffering
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Desactiva buffering en Nginx
    res.flushHeaders?.();

    const supabase = getSupabaseClient();

    // 1. RAG: Buscar documentos relevantes en Supabase y el bucket
    const relevantDocs = await searchRelevantDocuments(message);

    // 2. Construir tarjetas de documentos para el frontend
    const toolResults = relevantDocs.map(doc => ({
      nombre: doc.file_name,
      tipoDocumento: doc.document_analysis?.document_category || 'DOCUMENTO_SUNAT',
      area: doc.document_derivations?.target_area || 'Área Administrativa',
      descargaUrl: resolveStorageUrl(supabase, doc.id, doc.file_name, doc.storage_url),
    }));

    // Enviar evento 'tool_results' al frontend (compatible con la vista de Chatbot.jsx)
    if (toolResults.length > 0) {
      res.write(`data: ${JSON.stringify({
        type: 'tool_results',
        results: [{ results: toolResults }]
      })}\n\n`);
    }

    // 3. Formatear el contexto para el LLM de Ollama
    let contextText = '';
    if (relevantDocs.length > 0) {
      contextText += 'DOCUMENTOS REGISTRADOS EN SUPABASE (BUCKET "DocumentosIA" Y BASE DE DATOS):\n';
      relevantDocs.forEach((doc, idx) => {
        contextText += `\n--- [DOCUMENTO #${idx + 1}] ---\n`;
        contextText += `Nombre de archivo: ${doc.file_name}\n`;
        contextText += `Tipo / Categoría: ${doc.document_analysis?.document_category || 'No clasificado'}\n`;
        contextText += `Área asignada: ${doc.document_derivations?.target_area || 'No asignada'}\n`;
        contextText += `Fecha de subida: ${doc.upload_date}\n`;
        if (doc.document_analysis?.ai_summary) {
          contextText += `Resumen ejecutivo: ${doc.document_analysis.ai_summary}\n`;
        }
        if (doc.extracted_metadata && doc.extracted_metadata.length > 0) {
          const fields = doc.extracted_metadata
            .filter(m => m.field_value && m.field_value.trim().length > 0)
            .map(m => `${m.field_name}: ${m.field_value}`)
            .join(' | ');
          if (fields) contextText += `Campos y datos clave: ${fields}\n`;
        }
        if (doc.raw_text_snippet) {
          contextText += `Fragmento de texto original del archivo: ${doc.raw_text_snippet}\n`;
        }
      });
    } else {
      contextText = 'Actualmente no hay documentos registrados en el sistema.';
    }

    // 4. Prompt del sistema para Llama 3.1
    const systemPrompt = `Eres el Asistente Inteligente del Gestor Documental Tributario SUNAT.
Tu función es ayudar a los usuarios respondiendo preguntas sobre los documentos almacenados en la plataforma y resolver dudas tributarias y de gestión de documentos.

${contextText}

INSTRUCCIONES CLAVE:
1. Responde SIEMPRE en ESPAÑOL, de manera clara, amable, precisa y profesional.
2. Si el usuario pregunta por documentos disponibles, haz un breve resumen de los documentos registrados en el contexto (menciona nombres de archivo y tipos).
3. Si el usuario consulta sobre datos específicos (RUC, montos, domicilios, actividades, áreas de derivación o fechas), búscalo en el contexto anterior y entrégale el dato exacto.
4. Si el usuario pregunta sobre trámites SUNAT (cómo inscribirse en RUC, plazos de apelación, requerimientos), respóndele con información tributaria acertada.
5. Sé conciso pero completo en tus explicaciones. Evita respuestas vacías o evasivas.`;

    // Historial limpio para Ollama
    const sanitizedHistory = (history || [])
      .filter((h: any) => h && h.role && h.content)
      .slice(-6); // Mantener los últimos 6 turnos para no sobrecargar el contexto

    const messages = [
      { role: 'system', content: systemPrompt },
      ...sanitizedHistory,
      { role: 'user', content: message }
    ];

    console.log(`[Chat Stream] Enviando prompt a Ollama (${OLLAMA_MODEL}) en ${OLLAMA_HOST}...`);

    const response = await fetch(`${OLLAMA_HOST}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages: messages,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new Error(`Error de Ollama (${response.status}): ${errText || response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No se pudo abrir el stream de lectura de Ollama');
    }

    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        res.write('data: {"type": "done"}\n\n');
        break;
      }

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const parsed = JSON.parse(line);
          if (parsed.message?.content) {
            res.write(`data: ${JSON.stringify({ type: 'content', content: parsed.message.content })}\n\n`);
          }
        } catch {
          // Ignorar líneas no parseables
        }
      }
    }

    res.end();
  } catch (error) {
    console.error('[Chat Stream] Error:', error);
    const errorMsg = error instanceof Error ? error.message : 'Error desconocido al procesar el mensaje';
    res.write(`data: ${JSON.stringify({ type: 'error', error: errorMsg })}\n\n`);
    res.end();
  }
});

export default router;