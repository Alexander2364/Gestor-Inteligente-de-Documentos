import { describe, expect, it } from 'vitest';
import { buildClassifierPrompt } from '../../src/prompts/classifier';

describe('buildClassifierPrompt', () => {
	it('incluye el texto recibido y limita documentos demasiado largos', () => {
		const prompt = buildClassifierPrompt('RUC 20123456789');
		const oversizedPrompt = buildClassifierPrompt('x'.repeat(15000));

		expect(prompt).toContain('RUC 20123456789');
		expect(oversizedPrompt).not.toContain('x'.repeat(12001));
		expect(oversizedPrompt).toContain('...');
	});
});
