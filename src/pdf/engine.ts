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

function rectFromBounds([x0, y0, x1, y1]: mupdf.Rect): BoxRect {
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

function rectsIntersect(a: BoxRect, b: BoxRect): boolean {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
}

function rectArea(rect: BoxRect): number {
  return Math.max(0, rect.w) * Math.max(0, rect.h);
}

/**
 * Fracción del área de la página que una imagen debe cubrir para que la página
 * se marque como "necesita revisión visual" (A7). Una foto o escaneo incrustado
 * como imagen a página completa puede ocultar datos que el detector de texto no
 * ve nunca, así que se avisa aunque la página sí tenga capa de texto.
 */
export const IMAGE_COVERAGE_THRESHOLD = 0.6;

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

  extractTextInRect(page: number, rect: BoxRect): string {
    if (rect.w <= 0 || rect.h <= 0) {
      return '';
    }
    const structured = this.page(page).toStructuredText();
    let text = '';
    structured.walk({
      onChar(c, _origin, _font, _size, quad) {
        if (rectsIntersect(rect, quadToBoxRect(quad))) {
          text += c;
        }
      },
    });
    return text;
  }

  /**
   * Páginas que necesitan revisión visual humana antes de dar el informe por
   * bueno: (a) sin capa de texto (igual que scannedPages, sin regresión) o
   * (b) con una o varias imágenes que cubren una fracción alta del área de la
   * página (>= IMAGE_COVERAGE_THRESHOLD), aunque sí tengan texto detectable.
   */
  pagesNeedingVisualReview(): number[] {
    const total = this.pageCount();
    const result: number[] = [];
    for (let i = 0; i < total; i++) {
      if (!this.pageHasTextLayer(i)) {
        result.push(i);
        continue;
      }
      const page = this.page(i);
      const pageArea = rectArea(rectFromBounds(page.getBounds()));
      if (pageArea <= 0) {
        continue;
      }
      const structured = page.toStructuredText('preserve-images');
      let imageArea = 0;
      structured.walk({
        onImageBlock(bbox) {
          imageArea += rectArea(rectFromBounds(bbox));
        },
      });
      if (imageArea / pageArea >= IMAGE_COVERAGE_THRESHOLD) {
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
      // REMOVE_IF_COVERED (en vez de REMOVE_IF_TOUCHED): una caja de redacción
      // que solo TOCA un trazo vectorial (línea, borde de tabla) no debe borrar
      // ese trazo entero; sólo se elimina el arte vectorial que la caja cubre
      // por completo. Evita destruir maquetación que no contiene el dato a tachar.
      page.applyRedactions(
        true,
        mupdf.PDFPage.REDACT_IMAGE_PIXELS,
        mupdf.PDFPage.REDACT_LINE_ART_REMOVE_IF_COVERED,
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
