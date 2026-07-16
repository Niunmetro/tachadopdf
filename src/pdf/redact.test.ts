import * as mupdf from 'mupdf';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { describe, expect, it } from 'vitest';
import { loadPdf } from './engine';

async function pdfConTrazoYTextoDentro(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595, 842]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  page.drawRectangle({
    x: 40,
    y: 700,
    width: 500,
    height: 100,
    borderWidth: 4,
    borderColor: rgb(0, 0, 0),
  });
  page.drawText('Secreto123', { x: 50, y: 740, size: 14, font });
  return doc.save();
}

// Caja de redacción en coordenadas de página de mupdf (las mismas que usa
// PdfDoc.applyRedactions y que devuelve searchText): toca el borde izquierdo
// del rectángulo vectorial y cubre el texto, pero NO cubre el rectángulo
// completo, que se extiende mucho más allá hacia la derecha.
const CAJA_QUE_TOCA_SIN_CUBRIR = { x: 35, y: 80, w: 105, h: 35 };

function pixelDeBordeDerecho(bytes: Uint8Array): number[] {
  const doc = new mupdf.PDFDocument(bytes);
  const page = doc.loadPage(0);
  const pixmap = page.toPixmap(mupdf.Matrix.identity, mupdf.ColorSpace.DeviceRGB, false);
  const width = pixmap.getWidth();
  const samples = pixmap.getPixels();
  // Punto sobre el borde derecho del rectángulo, lejos de la caja de redacción.
  const x = 540;
  const y = 92;
  const idx = (y * width + x) * 3;
  return Array.from(samples.slice(idx, idx + 3));
}

describe('redacción de arte vectorial (M3): REMOVE_IF_COVERED no es tan agresivo como REMOVE_IF_TOUCHED', () => {
  it('round-trip: la caja borra el texto interior pero el trazo vectorial no cubierto por completo permanece', async () => {
    const bytes = await pdfConTrazoYTextoDentro();
    const doc = await loadPdf(bytes);

    doc.applyRedactions([{ page: 0, rects: [CAJA_QUE_TOCA_SIN_CUBRIR] }]);

    const texto = doc.extractText(0);
    expect(texto).not.toContain('Secreto123');

    const guardado = doc.save();
    doc.close();

    // El borde derecho del rectángulo, lejos de la caja de redacción, sigue
    // siendo negro: el trazo vectorial no se ha destruido por completo.
    expect(pixelDeBordeDerecho(guardado)).toEqual([0, 0, 0]);
  });

  it('contraste: el modo antiguo REMOVE_IF_TOUCHED sí destruiría ese mismo trazo con la misma caja', async () => {
    const bytes = await pdfConTrazoYTextoDentro();
    const mdoc = new mupdf.PDFDocument(bytes);
    const mpage = mdoc.loadPage(0);

    const annot = mpage.createAnnotation('Redact');
    annot.setRect([
      CAJA_QUE_TOCA_SIN_CUBRIR.x,
      CAJA_QUE_TOCA_SIN_CUBRIR.y,
      CAJA_QUE_TOCA_SIN_CUBRIR.x + CAJA_QUE_TOCA_SIN_CUBRIR.w,
      CAJA_QUE_TOCA_SIN_CUBRIR.y + CAJA_QUE_TOCA_SIN_CUBRIR.h,
    ]);
    mpage.applyRedactions(
      true,
      mupdf.PDFPage.REDACT_IMAGE_PIXELS,
      mupdf.PDFPage.REDACT_LINE_ART_REMOVE_IF_TOUCHED,
      mupdf.PDFPage.REDACT_TEXT_REMOVE,
    );

    const guardado = mdoc.saveToBuffer().asUint8Array();

    // Con REMOVE_IF_TOUCHED el rectángulo entero desaparece: el borde derecho,
    // lejos de la caja, queda blanco. Por eso el motor usa REMOVE_IF_COVERED.
    expect(pixelDeBordeDerecho(guardado)).toEqual([255, 255, 255]);
  });
});
