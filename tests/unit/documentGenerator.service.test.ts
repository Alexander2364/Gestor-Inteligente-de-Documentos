import { beforeEach, describe, expect, it, vi } from 'vitest';

const { launchMock } = vi.hoisted(() => ({
  launchMock: vi.fn(),
}));

vi.mock('puppeteer', () => ({
  default: {
    launch: launchMock,
  },
}));

import puppeteer from 'puppeteer';
import { htmlToPdf } from '../../src/services/documentGenerator.service';

describe('htmlToPdf', () => {
  const page = {
    setContent: vi.fn(),
    pdf: vi.fn(),
  };
  const browser = {
    newPage: vi.fn(),
    close: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    page.setContent.mockResolvedValue(undefined);
    page.pdf.mockResolvedValue(new Uint8Array([37, 80, 68, 70]));
    browser.newPage.mockResolvedValue(page);
    browser.close.mockResolvedValue(undefined);
    launchMock.mockResolvedValue(browser);
  });

  it('convierte HTML a un Buffer PDF en formato A4', async () => {
    const result = await htmlToPdf('<h1>Acta</h1>');

    expect(result).toBeInstanceOf(Buffer);
    expect(result).toEqual(Buffer.from([37, 80, 68, 70]));
    expect(puppeteer.launch).toHaveBeenCalledWith({ headless: true });
    expect(page.setContent).toHaveBeenCalledWith('<h1>Acta</h1>', { waitUntil: 'load' });
    expect(page.pdf).toHaveBeenCalledWith({
      format: 'A4',
      margin: {
        top: '5mm',
        right: '5mm',
        bottom: '5mm',
        left: '5mm',
      },
      printBackground: true,
    });
    expect(browser.close).toHaveBeenCalledOnce();
  });

  it('usa la ruta de Chromium configurada cuando está disponible', async () => {
    process.env.PUPPETEER_EXECUTABLE_PATH = '/usr/bin/chromium';

    await htmlToPdf('<h1>Acta</h1>');

    expect(puppeteer.launch).toHaveBeenCalledWith({
      headless: true,
      executablePath: '/usr/bin/chromium',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    delete process.env.PUPPETEER_EXECUTABLE_PATH;
  });

  it('cierra el browser cuando la generación del PDF falla', async () => {
    const error = new Error('No se pudo generar el PDF');
    page.pdf.mockRejectedValue(error);

    await expect(htmlToPdf('<p>Acta</p>')).rejects.toThrow(error);
    expect(browser.close).toHaveBeenCalledOnce();
  });
});
