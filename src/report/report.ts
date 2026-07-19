import { type Color, type PDFFont, type PDFPage, PDFDocument, StandardFonts, rgb } from 'pdf-lib';
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

const PAGE: [number, number] = [595, 842];
const MARGIN = 50;
const CONTENT_W = PAGE[0] - MARGIN * 2;

// Paleta sobria de despacho: tinta oscura, gris de etiqueta, línea fina, acento cielo, verde/rojo
// de veredicto. El objetivo es que parezca un documento formal, no un volcado de texto.
const INK = rgb(0.098, 0.129, 0.196);
const MUTED = rgb(0.42, 0.47, 0.55);
const SOFT_INK = rgb(0.28, 0.33, 0.4);
const LINE = rgb(0.86, 0.89, 0.93);
const BRAND = rgb(0.055, 0.086, 0.161);
const ACCENT = rgb(0.02, 0.6, 0.86);
const OK = rgb(0.086, 0.53, 0.32);
const OK_BG = rgb(0.925, 0.976, 0.945);
const BAD = rgb(0.77, 0.14, 0.14);
const BAD_BG = rgb(0.988, 0.929, 0.929);
const SOFT_BG = rgb(0.969, 0.98, 0.988);
const WHITE = rgb(1, 1, 1);
const BAND_SUB = rgb(0.72, 0.78, 0.87);

// pdf-lib usa fuentes estándar con codificación WinAnsi. Un nombre de fichero con emoji o CJK
// haría reventar drawText; sustituimos lo no codificable por '?' para no romper el informe.
const EXTRA_OK = new Set(['€', '–', '—', '•', '…', '‘', '’', '“', '”', '·']);
function safe(s: string): string {
  let out = '';
  for (const ch of s) {
    const c = ch.codePointAt(0) ?? 0;
    out += (c >= 0x20 && c <= 0x7e) || (c >= 0xa0 && c <= 0xff) || EXTRA_OK.has(ch) ? ch : '?';
  }
  return out;
}

export async function computeSha256(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', bytes as unknown as BufferSource);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = safe(text).split(' ');
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

  let page = doc.addPage(PAGE);
  let y = PAGE[1];

  // --- helpers de dibujo ---------------------------------------------------
  const write = (s: string, x: number, baseline: number, size: number, f: PDFFont, color: Color): void => {
    page.drawText(safe(s), { x, y: baseline, size, font: f, color });
  };
  const newPage = (): void => {
    page = doc.addPage(PAGE);
    y = PAGE[1] - MARGIN;
  };
  const ensure = (needed: number): void => {
    if (y - needed < 72) newPage();
  };

  const heading = (title: string): void => {
    ensure(34);
    y -= 5;
    write(title.toUpperCase(), MARGIN, y - 10, 10.5, bold, INK);
    page.drawRectangle({ x: MARGIN, y: y - 17, width: 28, height: 2, color: ACCENT });
    y -= 22;
  };

  const subLabel = (s: string): void => {
    ensure(18);
    write(s, MARGIN, y - 9, 9.5, bold, SOFT_INK);
    y -= 15;
  };

  const bullet = (s: string, dotColor: Color): void => {
    ensure(15);
    page.drawEllipse({ x: MARGIN + 4, y: y - 6.5, xScale: 2.4, yScale: 2.4, color: dotColor });
    write(s, MARGIN + 15, y - 9.5, 9.7, font, INK);
    y -= 13.5;
  };

  const row = (label: string, value: string, valueSize = 10): void => {
    const vx = MARGIN + 170;
    const lines = wrapText(value, font, valueSize, CONTENT_W - 170);
    ensure(Math.max(16, lines.length * (valueSize + 2.5) + 4));
    write(label, MARGIN, y - 9.5, 9.5, font, MUTED);
    lines.forEach((ln, i) => write(ln, vx, y - 9.5 - i * (valueSize + 2.5), valueSize, font, INK));
    y -= Math.max(16, lines.length * (valueSize + 2.5) + 3);
  };

  // --- cabecera de marca ---------------------------------------------------
  const bandH = 84;
  page.drawRectangle({ x: 0, y: PAGE[1] - bandH, width: PAGE[0], height: bandH, color: BRAND });
  page.drawRectangle({ x: 0, y: PAGE[1] - bandH - 3, width: PAGE[0], height: 3, color: ACCENT });
  write('TachadoPDF', MARGIN, PAGE[1] - 46, 21, bold, WHITE);
  write('Comprobación técnica de tachado de datos personales en PDF', MARGIN, PAGE[1] - 65, 9.5, font, BAND_SUB);
  const domain = 'tachadopdf.com';
  write(domain, PAGE[0] - MARGIN - font.widthOfTextAtSize(domain, 9.5), PAGE[1] - 46, 9.5, font, BAND_SUB);
  y = PAGE[1] - bandH - 24;

  // --- título y referencia -------------------------------------------------
  write(REPORT_TITLE, MARGIN, y - 15, 15, bold, INK);
  y -= 24;
  const ref = `TP-${data.date.replace(/-/g, '')}-${data.sha256.slice(0, 8).toUpperCase()}`;
  write(`Referencia ${ref}   ·   Emitido el ${data.date}`, MARGIN, y - 9.5, 9.5, font, MUTED);
  y -= 22;
  page.drawRectangle({ x: MARGIN, y, width: CONTENT_W, height: 0.8, color: LINE });
  y -= 16;

  // --- sello de resultado --------------------------------------------------
  const clean = data.verify?.clean === true;
  const fg = clean ? OK : BAD;
  const badgeH = 58;
  page.drawRectangle({ x: MARGIN, y: y - badgeH, width: CONTENT_W, height: badgeH, color: clean ? OK_BG : BAD_BG });
  page.drawRectangle({ x: MARGIN, y: y - badgeH, width: 5, height: badgeH, color: fg });
  const cx = MARGIN + 30;
  const cy = y - badgeH / 2;
  page.drawEllipse({ x: cx, y: cy, xScale: 11, yScale: 11, color: fg });
  if (clean) {
    page.drawLine({ start: { x: cx - 5, y: cy }, end: { x: cx - 1.5, y: cy - 4 }, thickness: 1.8, color: WHITE });
    page.drawLine({ start: { x: cx - 1.5, y: cy - 4 }, end: { x: cx + 5.5, y: cy + 4.5 }, thickness: 1.8, color: WHITE });
  } else {
    page.drawLine({ start: { x: cx - 4, y: cy - 4 }, end: { x: cx + 4, y: cy + 4 }, thickness: 1.8, color: WHITE });
    page.drawLine({ start: { x: cx - 4, y: cy + 4 }, end: { x: cx + 4, y: cy - 4 }, thickness: 1.8, color: WHITE });
  }
  write(clean ? 'VERIFICADO' : 'NO APTO', MARGIN + 54, y - 24, 13, bold, fg);
  if (clean) {
    write(
      'Ningún dato de los patrones buscados es extraíble del texto del PDF resultante.',
      MARGIN + 54,
      y - 42,
      9.3,
      font,
      SOFT_INK,
    );
  } else {
    write('RESULTADO: RESIDUOS DETECTADOS - no apto como prueba de tachado', MARGIN + 54, y - 42, 9.7, bold, BAD);
  }
  y -= badgeH + 13;

  // --- datos del documento -------------------------------------------------
  heading('Datos del documento');
  row('Archivo comprobado', data.fileName);
  row('Fecha de emisión', data.date);
  row('Referencia del informe', ref);
  row('Huella SHA-256 del archivo final', data.sha256, 8.5);

  // --- comprobaciones ------------------------------------------------------
  heading('Comprobaciones realizadas');
  const residues = data.verify?.residues ?? [];

  subLabel('Patrones de datos buscados en el texto');
  for (const kind of data.patternsSearched) {
    const matching = residues.filter((r) => r.kind === kind);
    if (matching.length === 0) {
      bullet(`${PATTERN_LABELS[kind]}: 0 ocurrencias en el texto extraíble`, OK);
    } else {
      const pages = matching.map((r) => (r.page === null ? '?' : r.page + 1)).join(', ');
      bullet(
        `${PATTERN_LABELS[kind]}: ${matching.length} ocurrencia(s) en el texto extraíble (páginas: ${pages})`,
        BAD,
      );
    }
  }
  y -= 2;

  subLabel('Zonas tachadas por página');
  if (data.boxesPerPage.length === 0) {
    bullet('Ninguna', MUTED);
  } else {
    for (const entry of data.boxesPerPage) bullet(`Página ${entry.page + 1}: ${entry.count} zona(s)`, ACCENT);
  }
  y -= 2;

  subLabel('Metadatos eliminados');
  if (data.metadataRemoved.length === 0) {
    bullet('Ninguno', MUTED);
  } else {
    for (const categoria of data.metadataRemoved) bullet(categoria, ACCENT);
  }
  y -= 2;

  subLabel('Páginas sin capa de texto');
  if (data.scannedPages.length === 0) {
    bullet('Ninguna', MUTED);
  } else {
    for (const p of data.scannedPages) {
      bullet(`Página ${p + 1}: sin capa de texto, no verificable automáticamente`, BAD);
    }
  }

  // --- alcance -------------------------------------------------------------
  heading('Alcance y limitaciones');
  const scopeLines = wrapText(SCOPE_TEXT, font, 9.5, CONTENT_W - 26);
  const boxH = scopeLines.length * 13 + 18;
  ensure(boxH + 6);
  page.drawRectangle({ x: MARGIN, y: y - boxH, width: CONTENT_W, height: boxH, color: SOFT_BG });
  page.drawRectangle({ x: MARGIN, y: y - boxH, width: 3, height: boxH, color: MUTED });
  scopeLines.forEach((ln, i) => write(ln, MARGIN + 14, y - 14 - i * 13, 9.5, font, SOFT_INK));
  y -= boxH + 10;

  if (data.freeVersion) {
    ensure(16);
    write(FREE_VERSION_LINE, MARGIN, y - 9, 8.5, font, MUTED);
    y -= 14;
  }

  // --- pie en todas las páginas -------------------------------------------
  const allPages: PDFPage[] = doc.getPages();
  allPages.forEach((p, i) => {
    p.drawRectangle({ x: MARGIN, y: 58, width: CONTENT_W, height: 0.8, color: LINE });
    p.drawText(safe('Documento generado automáticamente por TachadoPDF · tachadopdf.com'), {
      x: MARGIN,
      y: 44,
      size: 8,
      font,
      color: MUTED,
    });
    const pn = `Página ${i + 1} de ${allPages.length}`;
    p.drawText(safe(pn), { x: PAGE[0] - MARGIN - font.widthOfTextAtSize(pn, 8), y: 44, size: 8, font, color: MUTED });
  });

  return doc.save();
}
