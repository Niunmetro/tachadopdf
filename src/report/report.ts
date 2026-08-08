import { type Color, degrees, type PDFFont, type PDFPage, PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import type { CopiaInforme } from '../content/tipos';
import type { ReportData } from '../types';

// Todo el texto del informe llega por parámetro (`copia`). No hay valor por defecto a propósito:
// un idioma sin cablear tiene que romper la compilación, no imprimir en español sin avisar.

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

export async function buildReport(data: ReportData, copia: CopiaInforme): Promise<Uint8Array> {
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
  write(copia.subtituloBanda, MARGIN, PAGE[1] - 65, 9.5, font, BAND_SUB);
  const domain = 'tachadopdf.com';
  write(domain, PAGE[0] - MARGIN - font.widthOfTextAtSize(domain, 9.5), PAGE[1] - 46, 9.5, font, BAND_SUB);
  y = PAGE[1] - bandH - 24;

  // --- título y referencia -------------------------------------------------
  write(copia.titulo, MARGIN, y - 15, 15, bold, INK);
  y -= 24;
  const ref = `TP-${data.date.replace(/-/g, '')}-${data.sha256.slice(0, 8).toUpperCase()}`;
  write(copia.referencia(ref, data.date), MARGIN, y - 9.5, 9.5, font, MUTED);
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
  write(clean ? copia.selloOk : copia.selloMal, MARGIN + 54, y - 24, 13, bold, fg);
  if (clean) {
    write(copia.lineaOk, MARGIN + 54, y - 42, 9.3, font, SOFT_INK);
  } else {
    write(copia.lineaMal, MARGIN + 54, y - 42, 9.7, bold, BAD);
  }
  y -= badgeH + 13;

  // --- datos del documento -------------------------------------------------
  heading(copia.encabezadoDatos);
  row(copia.filaArchivo, data.fileName);
  row(copia.filaFecha, data.date);
  row(copia.filaReferencia, ref);
  row(copia.filaHuella, data.sha256, 8.5);

  // --- comprobaciones ------------------------------------------------------
  heading(copia.encabezadoComprobaciones);
  const residues = data.verify?.residues ?? [];

  subLabel(copia.subPatrones);
  for (const kind of data.patternsSearched) {
    const matching = residues.filter((r) => r.kind === kind);
    if (matching.length === 0) {
      bullet(copia.patronLimpio(copia.etiquetas[kind]), OK);
    } else {
      const pages = matching.map((r) => (r.page === null ? '?' : r.page + 1)).join(', ');
      bullet(copia.patronSucio(copia.etiquetas[kind], matching.length, pages), BAD);
    }
  }
  y -= 2;

  subLabel(copia.subZonas);
  if (data.boxesPerPage.length === 0) {
    bullet(copia.ninguna, MUTED);
  } else {
    for (const entry of data.boxesPerPage) bullet(copia.zonasPagina(entry.page + 1, entry.count), ACCENT);
  }
  y -= 2;

  subLabel(copia.subMetadatos);
  if (data.metadataRemoved.length === 0) {
    bullet(copia.ninguno, MUTED);
  } else {
    for (const categoria of data.metadataRemoved) bullet(categoria, ACCENT);
  }
  y -= 2;

  subLabel(copia.subEscaneadas);
  if (data.scannedPages.length === 0) {
    bullet(copia.ninguna, MUTED);
  } else {
    for (const p of data.scannedPages) {
      bullet(copia.paginaEscaneada(p + 1), BAD);
    }
  }

  // --- alcance -------------------------------------------------------------
  heading(copia.encabezadoAlcance);
  const scopeLines = wrapText(copia.alcance, font, 9.5, CONTENT_W - 26);
  const boxH = scopeLines.length * 13 + 18;
  ensure(boxH + 6);
  page.drawRectangle({ x: MARGIN, y: y - boxH, width: CONTENT_W, height: boxH, color: SOFT_BG });
  page.drawRectangle({ x: MARGIN, y: y - boxH, width: 3, height: boxH, color: MUTED });
  scopeLines.forEach((ln, i) => write(ln, MARGIN + 14, y - 14 - i * 13, 9.5, font, SOFT_INK));
  y -= boxH + 10;

  if (data.freeVersion) {
    ensure(16);
    write(copia.lineaGratis, MARGIN, y - 9, 8.5, font, MUTED);
    y -= 14;
  }

  // --- pie en todas las páginas -------------------------------------------
  const allPages: PDFPage[] = doc.getPages();
  allPages.forEach((p, i) => {
    p.drawRectangle({ x: MARGIN, y: 58, width: CONTENT_W, height: 0.8, color: LINE });
    p.drawText(safe(copia.pie), {
      x: MARGIN,
      y: 44,
      size: 8,
      font,
      color: MUTED,
    });
    const pn = copia.numeroPagina(i + 1, allPages.length);
    p.drawText(safe(pn), { x: PAGE[0] - MARGIN - font.widthOfTextAtSize(pn, 8), y: 44, size: 8, font, color: MUTED });
  });

  // --- marca de agua DEMO (solo versión gratuita) --------------------------
  if (data.freeVersion) {
    const wmText = safe(copia.marcaAgua);
    const wmSize = 32;
    const wmColor = rgb(0.6, 0.6, 0.6);
    const wmWidth = bold.widthOfTextAtSize(wmText, wmSize);
    allPages.forEach((p) => {
      p.drawText(wmText, {
        x: PAGE[0] / 2 - wmWidth / 2,
        y: PAGE[1] / 2,
        size: wmSize,
        font: bold,
        color: wmColor,
        opacity: 0.28,
        rotate: degrees(45),
      });
    });
  }

  return doc.save();
}
