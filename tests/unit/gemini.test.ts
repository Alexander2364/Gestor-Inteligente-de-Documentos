import { describe, expect, it } from 'vitest';
import {
  CLASSIFIER_TYPE_NAMES,
  COMPACT_RESPONSE_SCHEMA,
  FULL_RESPONSE_SCHEMA,
} from '../../src/prompts/classifierSchema';
import { buildGeminiRequestBody, extractGeminiText } from '../../src/services/ia';

describe('classifierSchema (structured output de Gemini)', () => {
  it('declara los 17 tipos SUNAT en el enum del esquema', () => {
    expect(CLASSIFIER_TYPE_NAMES).toHaveLength(17);
    const tipo = COMPACT_RESPONSE_SCHEMA.properties.tipoDocumento as { enum: string[] };
    expect(tipo.enum).toContain('ACTA_INMOVILIZACION');
    expect(tipo.enum).toContain('ACTUALIZACION_RUC');
  });

  it('el esquema compacto incluye campos y su arreglo de bienes', () => {
    expect(COMPACT_RESPONSE_SCHEMA.type).toBe('object');
    expect(COMPACT_RESPONSE_SCHEMA.required).toEqual(
      expect.arrayContaining(['tipoDocumento', 'confianza', 'campos', 'resumenEjecutivo']),
    );
    const campos = COMPACT_RESPONSE_SCHEMA.properties.campos as {
      properties: Record<string, { type: string }>;
    };
    expect(campos.properties.numeroActa.type).toBe('string');
    expect(campos.properties.bienes.type).toBe('array');
  });

  it('el esquema completo añade informeEjecutivo sin tocar el compacto', () => {
    expect(FULL_RESPONSE_SCHEMA.properties).toHaveProperty('informeEjecutivo');
    expect(COMPACT_RESPONSE_SCHEMA.properties).not.toHaveProperty('informeEjecutivo');
  });
});

describe('buildGeminiRequestBody', () => {
  it('pide JSON garantizado con razonamiento y tope de tokens', () => {
    const { contents, generationConfig } = buildGeminiRequestBody('RUC 20123456789', {
      compact: true,
      maxPredict: 768,
    });

    expect(generationConfig.responseMimeType).toBe('application/json');
    expect(generationConfig.maxOutputTokens).toBe(768);
    expect(generationConfig.responseSchema).toBe(COMPACT_RESPONSE_SCHEMA);
    expect(generationConfig.thinkingConfig).toEqual({ thinkingLevel: expect.any(String) });

    const parts = (contents[0] as { parts: Array<{ text: string }> }).parts;
    expect(parts[0].text).toContain('RUC 20123456789');
  });

  it('usa el esquema completo cuando no es compacto', () => {
    const { generationConfig } = buildGeminiRequestBody('texto');
    expect(generationConfig.responseSchema).toBe(FULL_RESPONSE_SCHEMA);
  });
});

describe('extractGeminiText', () => {
  it('concatena las partes de texto del primer candidato', () => {
    const text = extractGeminiText({
      candidates: [{ content: { parts: [{ text: '{"tipo' }, { text: 'Documento":"X"}' }] } }],
    });
    expect(text).toBe('{"tipoDocumento":"X"}');
  });

  it('devuelve cadena vacía cuando no hay candidatos', () => {
    expect(extractGeminiText({ promptFeedback: { blockReason: 'SAFETY' } })).toBe('');
  });
});
