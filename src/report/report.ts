import { type Color, type PDFFont, PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import type { PatternKind, ReportData } from '../types';

export const REPORT_TITLE = 'Informe de comprobación técnica';

export const SCOPE_TEXT =
  'Esta comprobación se limita al texto extraíble del archivo PDF resultante y a los píxeles de las zonas marcadas. No analiza el contenido visual de las imágenes no marcadas ni garantiza la ausencia de datos personales en el documento. No sustituye la revisión humana.';

const FREE_VERSION_LINE = 'Generado con TachadoPDF (versión gratuita)';

const PATTERN_LABELS: Record<PatternKind, string> = {
  dni: 'DNI',
  nie: 'NIE',
  iban: 'IBAN',
  nuss: 'Número de la Seguridad Social',
  telefono: 'Teléfono',
  email: 'Correo electrónico',
};

const PAGE_SIZE: [number, number] = [595, 842];
const MARGIN = 50;
const FONT_SIZE = 11;
const LINE_HEIGHT = 16;

export async function computeSha256(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', bytes as unknown as BufferSource);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const tentative = current.length === 0 ? word : `${current} ${word}`;
    if (current.length > 0 && font.widthOfTextAtSize(tentative, size) > maxWidth) {
      lines.push(current);
      current = word;
    } else {
      current = tentative;
    }
  }
  if (current.length > 0) lines.push(current);
  return lines;
}

export async function buildReport(data: ReportData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const maxWidth = PAGE_SIZE[0] - MARGIN * 2;
  let page = doc.addPage(PAGE_SIZE);
  let y = PAGE_SIZE[1] - MARGIN;

  const ensureSpace = (): void => {
    if (y < MARGIN) {
      page = doc.addPage(PAGE_SIZE);
      y = PAGE_SIZE[1] - MARGIN;
    }
  };

  const drawLine = (text: string, opts: { size?: number; font?: PDFFont; color?: Color } = {}): void => {
    ensureSpace();
    page.drawText(text, {
      x: MARGIN,
      y,
      size: opts.size ?? FONT_SIZE,
      font: opts.font ?? font,
      color: opts.color ?? rgb(0, 0, 0),
    });
    y -= LINE_HEIGHT;
  };

  const drawWrapped = (text: string, opts: { size?: number; font?: PDFFont; color?: Color } = {}): void => {
    const size = opts.size ?? FONT_SIZE;
    const usedFont = opts.font ?? font;
    for (const line of wrapText(text, usedFont, size, maxWidth)) {
      drawLine(line, opts);
    }
  };

  drawLine(REPORT_TITLE, { size: 18, font: bold });
  y -= 8;

  drawLine(`Fecha: ${data.date}`);
  drawLine(`Archivo: ${data.fileName}`);
  drawLine(`SHA-256: ${data.sha256}`);
  y -= 8;

  drawLine('Patrones buscados:', { font: bold });
  for (const kind of data.patternsSearched) {
    drawLine(`- ${PATTERN_LABELS[kind]}: 0 ocurrencias en el texto extraíble`);
  }
  y -= 8;

  drawLine('Zonas tachadas por página:', { font: bold });
  if (data.boxesPerPage.length === 0) {
    drawLine('- Ninguna');
  } else {
    for (const entry of data.boxesPerPage) {
      drawLine(`- Página ${entry.page}: ${entry.count} zona(s)`);
    }
  }
  y -= 8;

  drawLine('Categorías de metadatos eliminadas:', { font: bold });
  if (data.metadataRemoved.length === 0) {
    drawLine('- Ninguna');
  } else {
    for (const categoria of data.metadataRemoved) {
      drawLine(`- ${categoria}`);
    }
  }
  y -= 8;

  drawLine('Páginas sin capa de texto (advertencia):', { font: bold });
  if (data.scannedPages.length === 0) {
    drawLine('- Ninguna');
  } else {
    for (const p of data.scannedPages) {
      drawLine(`- Página ${p}: sin capa de texto, no verificable automáticamente`, {
        color: rgb(0.8, 0, 0),
      });
    }
  }
  y -= 8;

  drawLine('Alcance de esta comprobación:', { font: bold });
  drawWrapped(SCOPE_TEXT);

  if (data.freeVersion) {
    y -= 8;
    drawLine(FREE_VERSION_LINE);
  }

  return doc.save();
}
