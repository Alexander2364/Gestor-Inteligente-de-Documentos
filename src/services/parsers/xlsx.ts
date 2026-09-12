import * as XLSX from 'xlsx';
import { NativeExtractedDocument } from './types';

export function parseXlsx(buffer: Buffer): NativeExtractedDocument {
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true, raw: false });
  const tables = workbook.SheetNames.map((name) => {
    const sheet = workbook.Sheets[name];
    const rows = XLSX.utils.sheet_to_json<string[]>(sheet, {
      header: 1,
      raw: false,
      defval: '',
    }).map((row) => row.map((cell) => String(cell)));
    return { name, rows };
  });
  const text = tables
    .flatMap(({ name, rows }) => [`Hoja: ${name}`, ...rows.map((row) => row.join(' | '))])
    .join('\n')
    .trim();
  return {
    text,
    blocks: tables.map(({ name }) => `Hoja: ${name}`),
    tables,
    metadata: { extractor: 'xlsx', sheets: workbook.SheetNames.length },
  };
}