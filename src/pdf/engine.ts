import * as mupdf from 'mupdf';
import type { BoxRect, PageMark } from '../types';

export class PdfPasswordError extends Error {
  constructor(message = 'Contraseña de PDF incorrecta o ausente') {
    super(message);
    this.name = 'PdfPasswordError';
  }
}

function quadToBoxRect(quad: mupdf.Quad): BoxRect {
  const xs = [quad[0], quad[2], quad[4], quad[6]];
  const ys = [quad[1], quad[3], quad[5], quad[7]];
  const x0 = Math.min(...xs);
  const y0 = Math.min(...ys);
  const x1 = Math.max(...xs);
  const y1 = Math.max(...ys);
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

export class PdfDoc {
  private readonly doc: mupdf.PDFDocument;
  private closed = false;

  constructor(doc: mupdf.PDFDocument) {
    this.doc = doc;
  }

  private page(index: number): mupdf.PDFPage {
    return this.doc.loadPage(index);
  }

  pageCount(): number {
    return this.doc.countPages();
  }

  extractText(page: number): string {
    return this.page(page).toStructuredText().asText();
  }

  extractAllText(): string[] {
    const total = this.pageCount();
    const result: string[] = [];
    for (let i = 0; i < total; i++) {
      result.push(this.extractText(i));
    }
    return result;
  }

  searchText(page: number, needle: string): BoxRect[] {
    const matches = this.page(page).search(needle);
    const boxes: BoxRect[] = [];
    for (const match of matches) {
      for (const quad of match) {
        boxes.push(quadToBoxRect(quad));
      }
    }
    return boxes;
  }

  pageHasTextLayer(page: number): boolean {
    return this.extractText(page).trim().length > 0;
  }

  scannedPages(): number[] {
    const total = this.pageCount();
    const result: number[] = [];
    for (let i = 0; i < total; i++) {
      if (!this.pageHasTextLayer(i)) {
        result.push(i);
      }
    }
    return result;
  }

  applyRedactions(marks: PageMark[]): void {
    for (const mark of marks) {
      const page = this.page(mark.page);
      for (const rect of mark.rects) {
        const annot = page.createAnnotation('Redact');
        annot.setRect([rect.x, rect.y, rect.x + rect.w, rect.y + rect.h]);
      }
      page.applyRedactions(
        true,
        mupdf.PDFPage.REDACT_IMAGE_PIXELS,
        mupdf.PDFPage.REDACT_LINE_ART_REMOVE_IF_TOUCHED,
        mupdf.PDFPage.REDACT_TEXT_REMOVE,
      );
    }
  }

  renderToPng(page: number, dpi: number): Uint8Array {
    const zoom = dpi / 72;
    const matrix = mupdf.Matrix.scale(zoom, zoom);
    const pixmap = this.page(page).toPixmap(matrix, mupdf.ColorSpace.DeviceRGB, false);
    return pixmap.asPNG();
  }

  save(): Uint8Array {
    return this.doc.saveToBuffer().asUint8Array();
  }

  close(): void {
    if (!this.closed) {
      this.doc.destroy();
      this.closed = true;
    }
  }
}

export async function loadPdf(bytes: Uint8Array, password?: string): Promise<PdfDoc> {
  const doc = new mupdf.PDFDocument(bytes);
  if (doc.needsPassword()) {
    if (password === undefined || !doc.authenticatePassword(password)) {
      throw new PdfPasswordError();
    }
  }
  return new PdfDoc(doc);
}
