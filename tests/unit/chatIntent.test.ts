import { describe, expect, it } from 'vitest';
import { normalizeIntentText, wantsDocumentList } from '../../src/services/chatIntent';

describe('normalizeIntentText', () => {
  it('quita acentos, mayúsculas y signos de apertura', () => {
    expect(normalizeIntentText('  ¿QUÉ Documentos hay?  ')).toBe('que documentos hay?');
    expect(normalizeIntentText('¡Muéstrame los archivos!')).toBe('muestrame los archivos!');
  });
});

describe('wantsDocumentList', () => {
  it.each([
    '¿Qué documentos hay subidos?',
    '¿Cuántos documentos tengo?',
    '¿Cuáles son los documentos registrados?',
    'Muéstrame los documentos',
    'Listar archivos',
    'Quiero ver documentos',
    'Busca el documento del RUC 20551234567',
    'documentos',
    'historial',
  ])('muestra tarjetas con un pedido explícito: "%s"', (message) => {
    expect(wantsDocumentList(message)).toBe(true);
  });

  it.each([
    'hola',
    '¿Qué es el RUC?',
    '¿Qué dice el documento?',
    'Resume el contrato de alquiler',
    '¿A qué áreas se derivaron los documentos?',
    'Explícame el acta de inmovilización',
    '¿Cuál es el monto de la orden de pago?',
  ])('no muestra tarjetas con preguntas normales: "%s"', (message) => {
    expect(wantsDocumentList(message)).toBe(false);
  });

  it('acepta el flag explícito de la interfaz', () => {
    expect(wantsDocumentList('hola', true)).toBe(true);
    expect(wantsDocumentList('hola', false)).toBe(false);
    expect(wantsDocumentList('hola', 'true')).toBe(false);
  });
});
