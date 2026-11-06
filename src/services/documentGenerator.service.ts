import puppeteer from 'puppeteer';

/** Tope de espera para que Puppeteer lance el navegador y renderice el HTML. */
const PUPPETEER_TIMEOUT_MS = Number(process.env.PUPPETEER_TIMEOUT_MS ?? 60_000);

export async function htmlToPdf(html: string): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    ...(process.env.PUPPETEER_EXECUTABLE_PATH
      ? {
          executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
        }
      : {}),
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'load', timeout: PUPPETEER_TIMEOUT_MS });

    const pdf = await page.pdf({
      format: 'A4',
      margin: {
        top: '5mm',
        right: '5mm',
        bottom: '5mm',
        left: '5mm',
      },
      printBackground: true,
    });

    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
