import * as mupdf from 'mupdf';
import { describe, expect, it } from 'vitest';
import {
  pdfConTexto,
  pdfDniFragmentado,
  pdfSoloImagen,
} from '../test/fixtures';
import { loadPdf, PdfPasswordError } from './engine';

async function pdfCifrado(userPassword: string): Promise<Uint8Array> {
  const abierto = await pdfConTexto('contenido protegido');
  const doc = new mupdf.PDFDocument(abierto);
  const buf = doc.saveToBuffer(`encrypt=aes-256,user-password=${userPassword},owner-password=owner-${userPassword}`);
  return buf.asUint8Array();
}

describe('motor mupdf', () => {
  it('carga un PDF y cuenta sus páginas', async () => {
    const bytes = await pdfConTexto('documento simple');
    const doc = await loadPdf(bytes);
    expect(doc.pageCount()).toBe(1);
    doc.close();
  });

  it('extractText / extractAllText devuelven el texto de la página', async () => {
    const bytes = await pdfConTexto('DNI 12345678Z');
    const doc = await loadPdf(bytes);
    expect(doc.extractText(0)).toContain('DNI 12345678Z');
    expect(doc.extractAllText()).toEqual([doc.extractText(0)]);
    doc.close();
  });

  it('round-trip: buscar y redactar un DNI hace que el texto desaparezca y el resto permanece', async () => {
    const bytes = await pdfConTexto('Nombre: Juan. DNI 12345678Z. Fin.');
    const doc = await loadPdf(bytes);

    const boxes = doc.searchText(0, 'DNI 12345678Z');
    expect(boxes.length).toBeGreaterThan(0);

    doc.applyRedactions([{ page: 0, rects: boxes }]);

    const textoTrasRedactar = doc.extractText(0);
    expect(textoTrasRedactar).not.toContain('DNI 12345678Z');
    expect(textoTrasRedactar).toContain('Nombre: Juan');
    expect(textoTrasRedactar).toContain('Fin.');

    doc.close();
  });

  it('fragmentación: localiza y borra un DNI fragmentado en varias llamadas de texto', async () => {
    const bytes = await pdfDniFragmentado();
    const doc = await loadPdf(bytes);

    const boxesEspaciado = doc.searchText(0, 'DNI 12345678Z');
    expect(boxesEspaciado.length).toBeGreaterThan(0);

    const boxesConPuntos = doc.searchText(0, '12.345.678-Z');
    expect(boxesConPuntos.length).toBeGreaterThan(0);

    doc.applyRedactions([
      { page: 0, rects: [...boxesEspaciado, ...boxesConPuntos] },
    ]);

    const texto = doc.extractText(0);
    expect(texto).not.toContain('12345678Z');
    expect(texto).not.toContain('12.345.678-Z');

    doc.close();
  });

  it('scannedPages detecta páginas sin capa de texto', async () => {
    const bytes = await pdfSoloImagen();
    const doc = await loadPdf(bytes);

    expect(doc.pageHasTextLayer(0)).toBe(false);
    expect(doc.scannedPages()).toEqual([0]);

    doc.close();
  });

  it('una página con texto normal no aparece en scannedPages', async () => {
    const bytes = await pdfConTexto('texto visible');
    const doc = await loadPdf(bytes);

    expect(doc.pageHasTextLayer(0)).toBe(true);
    expect(doc.scannedPages()).toEqual([]);

    doc.close();
  });

  it('renderToPng produce PNG válido y la redacción de una zona cambia sus píxeles', async () => {
    const bytes = await pdfSoloImagen();
    const doc = await loadPdf(bytes);

    const antes = doc.renderToPng(0, 72);
    expect(antes.length).toBeGreaterThan(0);
    // Cabecera PNG
    expect(Array.from(antes.slice(0, 8))).toEqual([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    ]);

    doc.applyRedactions([
      { page: 0, rects: [{ x: 40, y: 700, w: 500, h: 100 }] },
    ]);

    const despues = doc.renderToPng(0, 72);
    expect(despues.length).toBeGreaterThan(0);
    expect(Buffer.compare(Buffer.from(antes), Buffer.from(despues))).not.toBe(0);

    doc.close();
  });

  it('save() devuelve bytes de PDF válidos tras redactar', async () => {
    const bytes = await pdfConTexto('DNI 12345678Z');
    const doc = await loadPdf(bytes);
    const boxes = doc.searchText(0, 'DNI 12345678Z');
    doc.applyRedactions([{ page: 0, rects: boxes }]);

    const guardado = doc.save();
    const cabecera = Buffer.from(guardado.slice(0, 5)).toString('latin1');
    expect(cabecera).toBe('%PDF-');

    doc.close();
  });

  it('carga un PDF cifrado con la contraseña correcta', async () => {
    const bytes = await pdfCifrado('correcta123');
    const doc = await loadPdf(bytes, 'correcta123');
    expect(doc.pageCount()).toBe(1);
    expect(doc.extractText(0)).toContain('contenido protegido');
    doc.close();
  });

  it('lanza PdfPasswordError si falta la contraseña de un PDF cifrado', async () => {
    const bytes = await pdfCifrado('correcta123');
    await expect(loadPdf(bytes)).rejects.toBeInstanceOf(PdfPasswordError);
  });

  it('lanza PdfPasswordError si la contraseña de un PDF cifrado es incorrecta', async () => {
    const bytes = await pdfCifrado('correcta123');
    await expect(loadPdf(bytes, 'incorrecta')).rejects.toBeInstanceOf(PdfPasswordError);
  });
});
