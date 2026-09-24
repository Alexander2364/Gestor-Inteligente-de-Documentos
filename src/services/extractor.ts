//1. Imports
import pdfParse from 'pdf-parse';
import { createWorker } from 'tesseract.js';
import { parseDocx } from './parsers/docx';
import { parseXlsx } from './parsers/xlsx';
import { preprocessImage } from './ocr/preprocess';

//2. Tipos exportados
export type SupportedMimeType =
| 'application/pdf'
| 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
| 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
| 'application/wps-office.docx'
| 'application/vnd.ms-word.document.macroEnabled.12'
| 'application/vnd.openxmlformats-officedocument.wordprocessingml.template'
| 'image/png'
| 'image/jpeg'
| 'image/jpg'
| 'image/tiff'
| 'image/bmp';
export interface ExtractResult {
 text: string;
 mimeType: string;
 pages?: number;
 blocks?: string[];
 tables?: Array<{ name: string; rows: string[][] }>;
 metadata?: Record<string, string | number>;
}

//3. Constantes mime-types
const PDF_MIME = 'application/pdf';
const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const WPS_DOCX_MIME = 'application/wps-office.docx';
const DOCX_MIMES = [DOCX_MIME, WPS_DOCX_MIME];
// MIME types conocidos para .docx de diferentes suites ofimáticas
const DOCX_MIME_TYPES = new Set([
    DOCX_MIME,                                           // Microsoft Office (estándar)
    'application/wps-office.docx',                       // WPS Office
    'application/vnd.ms-word.document.macroEnabled.12',  // .docm (Word con macros)
    'application/vnd.openxmlformats-officedocument.wordprocessingml.template', // .dotx
]);
const IMAGE_MIMES: SupportedMimeType[] = ['image/png', 'image/jpeg', 'image/jpg', 'image/tiff', 'image/bmp'];

//4. Singleton OCR Worker
let ocrWorker: Awaited<ReturnType<typeof createWorker>> | null = null;
async function getOcrWorker() {
    if (!ocrWorker) {
        ocrWorker = await createWorker('spa'); // 'spa' = español
    }
    return ocrWorker;
}

/**
 * Limpia y estandariza el texto extraído para eliminar artefactos comunes (múltiples espacios, saltos de línea excesivos, etc.)
 * @param text El texto bruto extraído.
 * @returns Texto normalizado.
 */
function normalizeText(text: string): string {
    if (!text) return "";

    // 1. Reemplazar múltiples saltos de línea consecutivo por dos saltos de línea (un párrafo vacío)
    let normalized = text.replace(/(\r?\n){3,}/g, '\n\n');

    // 2. Reemplazar cualquier secuencia de espacios en blanco (espacios, tabs, múltiples espacios) por un único espacio.
    normalized = normalized.replace(/[ \t]+/g, ' ');

    // 3. Eliminar espacios en blanco al inicio o al final de las cadenas de texto detectadas (más allá del trim inicial).
    normalized = normalized.trim();

    return normalized;
}

//6. Función principal extractText
export async function extractText(buffer: Buffer, mimeType: string, originalName?: string): Promise<ExtractResult> {
    // 1. Si el mime-type es genérico, intentar detectar por extensión
    if (mimeType === 'application/octet-stream' && originalName) {
        const ext = originalName.toLowerCase().split('.').pop();
        if (ext === 'docx' || ext === 'docm' || ext === 'dotx') {
            mimeType = DOCX_MIME;
        } else if (ext === 'xlsx' || ext === 'xlsm') {
            mimeType = XLSX_MIME;
        } else if (['png', 'jpg', 'jpeg', 'tiff', 'bmp'].includes(ext || '')) {
            mimeType = `image/${ext === 'jpg' ? 'jpeg' : ext}` as SupportedMimeType;
        }
    }
    //7. Normalizar mime-types conocidos de .docx al estándar
    if (DOCX_MIME_TYPES.has(mimeType)) {
        mimeType = DOCX_MIME;
    }
    //8. Validar que sea un tipo soportado
    if (!isSupportedMimeType(mimeType)) {
        throw new Error(`Tipo de archivo no soportado: ${mimeType}`);
    }
    //9. Procesar según tipo
    switch (mimeType) {
        case PDF_MIME:
            return extractFromPdf(buffer);
        case DOCX_MIME:
        case WPS_DOCX_MIME:
            return extractFromDocx(buffer);
        case XLSX_MIME:
            return extractFromXlsx(buffer);
        default:
            return extractFromImage(buffer, mimeType as SupportedMimeType);
    }
}

//10. extractFromPdf
async function extractFromPdf(buffer: Buffer): Promise<ExtractResult> {
    const data = await pdfParse(buffer);
    return {
        text: normalizeText(data.text), // APLICACIÓN DE NORMALIZACIÓN
        mimeType: PDF_MIME,
        pages: data.numpages,
    };
}

//11. extractFromDocx
async function extractFromDocx(buffer: Buffer): Promise<ExtractResult> {
    const document = await parseDocx(buffer);
    return {
        text: normalizeText(document.text),
        mimeType: DOCX_MIME,
        blocks: document.blocks,
        tables: document.tables,
        metadata: document.metadata,
    };
}

async function extractFromXlsx(buffer: Buffer): Promise<ExtractResult> {
    const document = await parseXlsx(buffer); // ← Se añade 'async' y 'await'
    return {
        text: normalizeText(document.text),
        mimeType: XLSX_MIME,
        blocks: document.blocks,
        tables: document.tables,
        metadata: document.metadata,
    };
}

//12. extractFromImage
async function extractFromImage(buffer: Buffer, mimeType: SupportedMimeType): Promise<ExtractResult> {
    let processedBuffer!: Buffer;

    try {
        processedBuffer = await preprocessImage(buffer);
    } catch (error) {
        const msg = error instanceof Error ? error.message : 'Error desconocido';
        throw new Error(`Error preprocesando imagen de tipo ${mimeType}: ${msg}`);
    }

    let text = '';
    const maxAttempts = 2;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
            const worker = await getOcrWorker();
            const { data: { text: extractedText } } = await worker.recognize(processedBuffer);
            text = normalizeText(extractedText);
            if (text.trim() !== '') {
                break;
            }
        } catch (error) {
            const msg = error instanceof Error ? error.message : 'Error desconocido';
            console.error(`Intento ${attempt + 1} fallido de OCR:`, msg);
            if (attempt === maxAttempts - 1) {
                throw new Error(`Error en OCR después de ${maxAttempts} reintentos: ${msg}`);
            }
        }
    }

    if (text.trim() === '') {
        throw new Error(`Texto extraído está vacío para tipo ${mimeType}`);
    }

    return {
        text,
        mimeType
    };
}

//13. Cleanup
export async function closeOcrWorker(): Promise<void> {
    if (ocrWorker) {
        await ocrWorker.terminate();
        ocrWorker = null;
    }
}

export function isSupportedMimeType(mimeType: string): mimeType is SupportedMimeType {
    const baseTypes = [PDF_MIME, DOCX_MIME, XLSX_MIME, ...IMAGE_MIMES];
    return baseTypes.includes(mimeType as SupportedMimeType) || DOCX_MIME_TYPES.has(mimeType);
}

export { DOCX_MIME_TYPES };
