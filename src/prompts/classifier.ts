// src/prompts/classifier.ts

export const CLASSIFIER_PROMPT = `Eres un clasificador de documentos empresariales.
Clasifica el siguiente documento en UNA sola categoría: "Finanzas" o "RRHH".
Responde SOLO con JSON válido, sin markdown, sin explicaciones, sin texto extra.
El campo "area" DEBE ser exactamente "Finanzas" o "RRHH" (nada más).

Ejemplo de respuesta correcta:
{"area": "Finanzas", "confianza": 0.92}

Texto del documento:
---
{text}
---`;

export function buildClassifierPrompt(text: string): string {
  const maxChars = 3000;
  const trimmedText = text.length > maxChars ? text.slice(0, maxChars) + '...' : text;
  return CLASSIFIER_PROMPT.replace('{text}', trimmedText);
}