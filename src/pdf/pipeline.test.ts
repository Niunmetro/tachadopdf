import { describe, expect, it } from 'vitest';
import { pdfConTexto, pdfSoloImagen } from '../test/fixtures';
import { loadPdf } from './engine';
import { processDocument } from './pipeline';

describe('processDocument (T10: pipeline DOM-free)', () => {
  it('tacha manualmente un nombre que no casa con ningún patrón automático: clean=true y el nombre desaparece del texto final', async () => {
    const nombre = 'Fulanito de Tal';
    const bytes = await pdfConTexto(`Contrato firmado por ${nombre} el día de hoy.`);

    const previo = await loadPdf(bytes);
    const rects = previo.searchText(0, nombre);
    previo.close();
    expect(rects.length).toBeGreaterThan(0);

    const result = await processDocument({
      bytes,
      fileName: 'contrato.pdf',
      freeVersion: true,
      manual: [{ page: 0, rects }],
    });

    expect(result.verify.clean).toBe(true);
    expect(result.unverifiableManualPages).toEqual([]);

    const finalDoc = await loadPdf(result.cleanedBytes);
    const textoFinal = finalDoc.extractText(0);
    finalDoc.close();
    expect(textoFinal).not.toContain(nombre);
  });

  it('una caja manual sobre una página sin texto no aporta texto capturable: la página consta en unverifiableManualPages', async () => {
    const bytes = await pdfSoloImagen();

    const result = await processDocument({
      bytes,
      fileName: 'imagen.pdf',
      freeVersion: true,
      manual: [{ page: 0, rects: [{ x: 40, y: 700, w: 500, h: 100 }] }],
    });

    expect(result.unverifiableManualPages).toEqual([0]);
  });

  it('un DNI válido detectado automáticamente se redacta sin intervención manual: clean=true', async () => {
    const bytes = await pdfConTexto('DNI 12345678Z, gracias por su colaboración.');

    const result = await processDocument({
      bytes,
      fileName: 'dni.pdf',
      freeVersion: true,
      manual: [],
    });

    expect(result.verify.clean).toBe(true);
    expect(result.boxesPerPage.some((b) => b.page === 0 && b.count > 0)).toBe(true);
  });
});
