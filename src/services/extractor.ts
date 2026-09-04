//1. Imports
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { createWorker } from 'tesseract.js';
import sharp from 'sharp';

//2. Tipos exportados
export type SupportedMimeType =
  | 'application/pdf'
  | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  | 'application/wps-office.docx'
  | 'application/vnd.ms-word.document.macroEnabled.12'
  | 'application/vnd.openxmlformats-officedocument.wordprocessingml.template'
  | 'image/png'
  | 'image/jpeg'
  | 'image/jpg'
  | 'image/tiff'
  | 'image/bmp';

export interface ExtractResult {
  text: string;      // Texto extraído limpio
  mimeType: string;  // Mime-type original del archivo
  pages?: number;    // Solo para PDFs (opcional)
}
//3. Constantes mime-types
const PDF_MIME = 'application/pdf';
const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

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

//5. Función principal extractText
export async function extractText(buffer: Buffer, mimeType: string, originalName?: string): Promise<ExtractResult> {
  // 1. Si el mime-type es genérico, intentar detectar por extensión
  if (mimeType === 'application/octet-stream' && originalName) {
    const ext = originalName.toLowerCase().split('.').pop();
    if (ext === 'docx' || ext === 'docm' || ext === 'dotx') {
      mimeType = DOCX_MIME;
    } else if (['png', 'jpg', 'jpeg', 'tiff', 'bmp'].includes(ext || '')) {
      mimeType = `image/${ext === 'jpg' ? 'jpeg' : ext}` as SupportedMimeType;
    }
  }

  // 2. Normalizar mime-types conocidos de .docx al estándar
  if (DOCX_MIME_TYPES.has(mimeType)) {
    mimeType = DOCX_MIME;
  }

  // 3. Validar que sea un tipo soportado
  if (!isSupportedMimeType(mimeType)) {
    throw new Error(`Tipo de archivo no soportado: ${mimeType}`);
  }

  // 4. Procesar según tipo
  switch (mimeType) {
    case PDF_MIME:
    return extractFromPdf(buffer);
    case DOCX_MIME:
    case WPS_DOCX_MIME:
    return extractFromDocx(buffer);
    default:
    return extractFromImage(buffer, mimeType as SupportedMimeType);
  }
}

//6. extractFromPdf
async function extractFromPdf(buffer: Buffer): Promise<ExtractResult> {
  const data = await pdfParse(buffer);
  return {
    text: data.text.trim(),
    mimeType: PDF_MIME,
    pages: data.numpages,
  };
}

//7. extractFromDocx
async function extractFromDocx(buffer: Buffer): Promise<ExtractResult> {
    const {value: text} = await mammoth.extractRawText({buffer});
    return {
        text: text.trim(),
        mimeType: DOCX_MIME,
    };
}


//8. extractFromImage
async function extractFromImage(buffer: Buffer, mimeType: SupportedMimeType): Promise<ExtractResult> {
    const processedBuffer = await sharp(buffer)
        .grayscale()
        .normalize()
        .sharpen()
        .toBuffer();

    const worker = await getOcrWorker();
    const {data: {text}} = await worker.recognize(processedBuffer);
    return {
        text: text.trim(),
        mimeType
    }
}

//9. Cleanup
export async function closeOcrWorker(): Promise<void> {
    if (ocrWorker) {
        await ocrWorker.terminate();
        ocrWorker = null;
    }
}

export function isSupportedMimeType(mimeType: string): mimeType is SupportedMimeType {
  const baseTypes = [PDF_MIME, DOCX_MIME, ...IMAGE_MIMES];
  return baseTypes.includes(mimeType as SupportedMimeType) || DOCX_MIME_TYPES.has(mimeType);
}

export { DOCX_MIME_TYPES };
