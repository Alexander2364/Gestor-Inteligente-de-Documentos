import puppeteer from 'puppeteer';

export async function htmlToPdf(html: string): Promise<Buffer> {
  const browser = await puppeteer.launch({ headless: true });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'load' });

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