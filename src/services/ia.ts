import { buildClassifierPrompt } from '../prompts/classifier';

// 1. Tipos
export interface ClassificationResult {
  area: 'Finanzas' | 'RRHH';
  confianza: number; // 0.0 - 1.0
}

// 2. Config desde variables de entorno (con defaults)
const OLLAMA_HOST = process.env.OLLAMA_HOST ?? 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? 'phi3';
const OLLAMA_TIMEOUT_MS = Number(process.env.OLLAMA_TIMEOUT_MS ?? 60000); // 60 segundos

// 3. Función principal
export async function classifyWithOllama(text: string): Promise<ClassificationResult> {
  const prompt = buildClassifierPrompt(text);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), OLLAMA_TIMEOUT_MS);

  

  try {
    const response = await fetch(`${OLLAMA_HOST}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt,
        stream: false,
        format: 'json', // fuerza salida JSON válido
        options: { temperature: 0.1 } // determinista
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Ollama HTTP ${response.status}: ${errText}`);
    }

    const data = await response.json();
    // data.response viene como string JSON: '{"area":"Finanzas","confianza":0.92}'
    const parsed = JSON.parse(data.response);

    // 4. Validación de la respuesta
    if (!parsed.area || !['Finanzas', 'RRHH'].includes(parsed.area)) {
      throw new Error(`Área inválida devuelta por la IA: ${parsed.area}`);
    }

    // Confianza opcional: default 0.5 si no viene o es inválida
    let confianza = 0.5;
    if (typeof parsed.confianza === 'number' && parsed.confianza >= 0 && parsed.confianza <= 1) {
      confianza = parsed.confianza;
    } else if (typeof parsed.confianza === 'string') {
      const parsedConf = parseFloat(parsed.confianza);
      if (!isNaN(parsedConf) && parsedConf >= 0 && parsedConf <= 1) {
        confianza = parsedConf;
      }
    }

    return {
      area: parsed.area,
      confianza
    };
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error(`Timeout: Ollama no respondió en ${OLLAMA_TIMEOUT_MS} ms`);
    }
    throw err;
  }
}