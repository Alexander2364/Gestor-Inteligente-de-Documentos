import { Workbook, Row, CellValue } from 'exceljs';
import { NativeExtractedDocument } from './types';

export async function parseXlsx(buffer: Buffer): Promise<NativeExtractedDocument> {
  try {
    const workbook = new Workbook();
    
    // @ts-expect-error: Conflicto de tipos conocido entre @types/node (Buffer<ArrayBufferLike>) 
    // y las definiciones de exceljs. En tiempo de ejecución, el Buffer de Node.js es 100% compatible.
    await workbook.xlsx.load(buffer);

    const tables = await Promise.all(
      workbook.worksheets.map(async (sheet) => {
        const rows: string[][] = [];
        
        // eachRow itera sobre las filas reales de la hoja
        sheet.eachRow({ includeEmpty: false }, (row: Row) => {
          // row.values puede ser null o un array de CellValue
          if (row.values && Array.isArray(row.values)) {
            // Los valores en exceljs son 1-indexados (el índice 0 es null)
            const cells = (row.values as CellValue[])
              .slice(1)
              .map((cell: CellValue) => {
                if (cell === null || cell === undefined) return '';
                return String(cell);
              });
            rows.push(cells);
          }
        });

        return {
          name: sheet.name || 'Hoja sin nombre',
          rows,
        };
      })
    );

    // Unificar el texto manteniendo el formato original del proyecto
    const text = tables
      .flatMap(({ name, rows }) => [`Hoja: ${name}`, ...rows.map((row) => row.join(' | '))])
      .join('\n')
      .trim();

    return {
      text,
      blocks: tables.map(({ name }) => `Hoja: ${name}`),
      tables,
      metadata: { extractor: 'exceljs', sheets: workbook.worksheets.length },
    };
  } catch (error) {
    // Manejo de errores estricto
    const msg = error instanceof Error ? error.message : 'Error desconocido procesando archivo XLSX';
    throw new Error(msg);
  }
}