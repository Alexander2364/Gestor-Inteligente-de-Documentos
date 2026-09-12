import sharp from 'sharp';

export async function preprocessImage(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .rotate()
    .resize({ width: 2200, withoutEnlargement: false })
    .grayscale()
    .normalize()
    .sharpen({ sigma: 1.1 })
    .threshold(180)
    .png()
    .toBuffer();
}