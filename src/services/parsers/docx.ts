import mammoth from 'mammoth';
import { NativeExtractedDocument } from './types';

function stripTags(value: string): string {
  return value
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function parseDocx(buffer: Buffer): Promise<NativeExtractedDocument> {
  const [raw, html] = await Promise.all([
    mammoth.extractRawText({ buffer }),
    mammoth.convertToHtml({ buffer }),
  ]);
  const tables = [...html.value.matchAll(/<table[^>]*>([\s\S]*?)<\/table>/gi)].map((match, index) => ({
    name: `table-${index + 1}`,
    rows: [...match[1].matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)].map((row) =>
      [...row[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((cell) => stripTags(cell[1])),
    ),
  }));
  const text = raw.value.replace(/\r/g, '').replace(/[ \t]+/g, ' ').trim();
  return {
    text,
    blocks: text.split(/\n{2,}/).map((block) => block.trim()).filter(Boolean),
    tables,
    metadata: { extractor: 'mammoth' },
  };
}