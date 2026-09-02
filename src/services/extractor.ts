//1. Imports
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { createWorker } from 'tesseract.js';
import sharp from 'sharp';

//2. Tipos exportados
export type SupportedMimeType =
  | 'application/pdf'
  | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
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
export async function extractText(buffer: Buffer, mimeType: string): Promise<ExtractResult> {
  if (!isSupportedMimeType(mimeType)) {
    throw new Error(`Tipo de archivo no soportado: ${mimeType}`);
  }

  switch (mimeType) {
    case PDF_MIME:
      return extractFromPdf(buffer);
    case DOCX_MIME:
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

//7.extractFromDocx
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
        .grayscale()    //1 canal (gris) en vez de 3 (RGB)
        .normalize()    //Estira histograma: negro puro -> blanco puro
        .sharpen()      //Filtro "unsharp mask": realiza bordes
        .toBuffer();    //Devuelve Buffer procesado

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

//10.TypeGuard isSupportedMimeType
export function isSupportedMimeType(mimeType: string): mimeType is SupportedMimeType {
    return [PDF_MIME, DOCX_MIME, ...IMAGE_MIMES].includes(mimeType as SupportedMimeType);
}