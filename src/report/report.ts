import { type Color, degrees, type PDFFont, type PDFPage, PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { VERSION_APP } from '../config';
import type { CopiaInforme } from '../content/tipos';
import { CATEGORIAS_OBJETO, type EstadoObjeto, type EstadoSello, type ReportData } from '../types';
import {
  estadoDelSello,
  paginasConReserva,
  paginasConZonas,
  paginasReleidas,
  zonasTachadas,
} from './estado';

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
const AMBER = rgb(0.71, 0.44, 0.03);
const AMBER_BG = rgb(0.996, 0.965, 0.886);
const GREY_BG = rgb(0.945, 0.953, 0.965);
const SOFT_BG = rgb(0.969, 0.98, 0.988);
const WHITE = rgb(1, 1, 1);
const BAND_SUB = rgb(0.72, 0.78, 0.87);

// Un color y un icono por estado. E3 va en ambar y no en rojo, pero las viñetas por pagina de
// las escaneadas siguen imprimiendose en rojo: lo que se atenua es el agregado, no el aviso.
const ESTILO_SELLO: Record<EstadoSello, { fg: Color; bg: Color; icono: 'aspa' | 'aspaHueca' | 'admiracion' | 'guion' | 'check' }> = {
  E1: { fg: BAD, bg: BAD_BG, icono: 'aspa' },
  E2: { fg: BAD, bg: BAD_BG, icono: 'aspaHueca' },
  E3: { fg: AMBER, bg: AMBER_BG, icono: 'admiracion' },
  E4: { fg: MUTED, bg: GREY_BG, icono: 'guion' },
  E5: { fg: OK, bg: OK_BG, icono: 'check' },
};

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

/**
 * La linea que va DEBAJO del rotulo del sello. Nombra el objeto y da los numeros: es la frase
 * que impide que el lector complete «el documento esta verificado» por su cuenta.
 */
export function lineaDelSello(estado: EstadoSello, data: ReportData, copia: CopiaInforme): string {
  const total = data.totalPaginas;
  if (estado === 'E1') {
    return data.verify?.clean === false
      ? copia.lineaBloqueadoResiduos
      : copia.lineaBloqueadoSinComprobacion;
  }
  if (estado === 'E2') return copia.lineaSinComprobacion(total);
  if (estado === 'E3') {
    const reservas = paginasConReserva(data).length;
    // «Comprobadas N de M» cuenta como comprobada la pagina SIN ninguna reserva: una pagina
    // tapada por una imagen se releyo, pero no esta comprobada del todo y decir lo contrario
    // seria volver a lo de siempre.
    const base =
      reservas > 0
        ? copia.lineaParcial(Math.max(0, total - reservas), total, reservas)
        : copia.lineaParcialSoloObjetos(total);
    return data.objetos.marcadores === 'noExaminado' ? `${base} ${copia.clausulaMarcadores}` : base;
  }
  if (estado === 'E4') return copia.lineaSinTachados(total);
  return copia.lineaVerificado(total, zonasTachadas(data));
}

function palabraEstado(copia: CopiaInforme, estado: EstadoObjeto): string {
  if (estado === 'eliminado') return copia.estadoEliminado;
  if (estado === 'noHabia') return copia.estadoNoHabia;
  return copia.estadoNoExaminado;
}

function etiquetaObjeto(copia: CopiaInforme, categoria: (typeof CATEGORIAS_OBJETO)[number]): string {
  const mapa: Record<(typeof CATEGORIAS_OBJETO)[number], string> = {
    info: copia.objetoInfo,
    xmp: copia.objetoXmp,
    anotaciones: copia.objetoAnotaciones,
    formularios: copia.objetoFormularios,
    adjuntos: copia.objetoAdjuntos,
    marcadores: copia.objetoMarcadores,
    alternativos: copia.objetoAlternativos,
    ocultos: copia.objetoOcultos,
  };
  return mapa[categoria];
}

/** Toda cifra de cobertura lleva su numero, tambien cuando es cero; si hay paginas, van al lado. */
function cifraConPaginas(copia: CopiaInforme, paginas: number[]): string {
  if (paginas.length === 0) return '0';
  return copia.conPaginas(paginas.length, paginas.map((p) => p + 1).join(', '));
}

function dibujarIcono(
  page: PDFPage,
  icono: (typeof ESTILO_SELLO)[EstadoSello]['icono'],
  cx: number,
  cy: number,
  fg: Color,
  bg: Color,
): void {
  if (icono === 'aspaHueca') {
    page.drawEllipse({ x: cx, y: cy, xScale: 11, yScale: 11, color: fg });
    page.drawEllipse({ x: cx, y: cy, xScale: 8.6, yScale: 8.6, color: bg });
    page.drawLine({ start: { x: cx - 4, y: cy - 4 }, end: { x: cx + 4, y: cy + 4 }, thickness: 1.8, color: fg });
    page.drawLine({ start: { x: cx - 4, y: cy + 4 }, end: { x: cx + 4, y: cy - 4 }, thickness: 1.8, color: fg });
    return;
  }
  page.drawEllipse({ x: cx, y: cy, xScale: 11, yScale: 11, color: fg });
  if (icono === 'check') {
    page.drawLine({ start: { x: cx - 5, y: cy }, end: { x: cx - 1.5, y: cy - 4 }, thickness: 1.8, color: WHITE });
    page.drawLine({ start: { x: cx - 1.5, y: cy - 4 }, end: { x: cx + 5.5, y: cy + 4.5 }, thickness: 1.8, color: WHITE });
  } else if (icono === 'aspa') {
    page.drawLine({ start: { x: cx - 4, y: cy - 4 }, end: { x: cx + 4, y: cy + 4 }, thickness: 1.8, color: WHITE });
    page.drawLine({ start: { x: cx - 4, y: cy + 4 }, end: { x: cx + 4, y: cy - 4 }, thickness: 1.8, color: WHITE });
  } else if (icono === 'admiracion') {
    page.drawLine({ start: { x: cx, y: cy + 5.5 }, end: { x: cx, y: cy - 1 }, thickness: 2, color: WHITE });
    page.drawEllipse({ x: cx, y: cy - 4.5, xScale: 1.3, yScale: 1.3, color: WHITE });
  } else {
    page.drawLine({ start: { x: cx - 5, y: cy }, end: { x: cx + 5, y: cy }, thickness: 2, color: WHITE });
  }
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

  // Las viñetas AJUSTAN el texto al ancho. Antes no: el aviso de un tachado no verificable mide
  // 150 caracteres y se dibujaba en una sola linea que se salia del papel — visible solo al abrir
  // el PDF, invisible para un test que extrae texto.
  const bullet = (s: string, dotColor: Color): void => {
    const lineas = wrapText(s, font, 9.7, CONTENT_W - 15);
    const alto = 13.5 + (lineas.length - 1) * 12;
    ensure(alto + 2);
    page.drawEllipse({ x: MARGIN + 4, y: y - 6.5, xScale: 2.4, yScale: 2.4, color: dotColor });
    lineas.forEach((ln, i) => write(ln, MARGIN + 15, y - 9.5 - i * 12, 9.7, font, INK));
    y -= alto;
  };

  const filaObjeto = (label: string, estadoObjeto: EstadoObjeto): void => {
    const labelLines = wrapText(label, font, 9.5, 300);
    const alto = Math.max(16, labelLines.length * 12 + 4);
    ensure(alto);
    labelLines.forEach((ln, i) => write(ln, MARGIN, y - 9.5 - i * 12, 9.5, font, MUTED));
    const destacado = estadoObjeto === 'noExaminado';
    write(
      palabraEstado(copia, estadoObjeto),
      MARGIN + 320,
      y - 9.5,
      9.5,
      destacado ? bold : font,
      destacado ? AMBER : INK,
    );
    y -= alto;
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
  // El sello NO es `clean ? verde : rojo`. Es funcion de (cobertura ∧ resultado): un resultado
  // limpio sobre una cobertura del 0 % (documento escaneado) no es verde, y un documento del que
  // no se elimino nada tampoco. La escalera vive en `./estado.ts` y es la unica fuente.
  const estado = estadoDelSello(data);
  const estilo = ESTILO_SELLO[estado];
  const lineasSello = wrapText(lineaDelSello(estado, data, copia), font, 9.3, CONTENT_W - 68);
  const badgeH = Math.max(58, 52 + (lineasSello.length - 1) * 11.5);
  page.drawRectangle({ x: MARGIN, y: y - badgeH, width: CONTENT_W, height: badgeH, color: estilo.bg });
  page.drawRectangle({ x: MARGIN, y: y - badgeH, width: 5, height: badgeH, color: estilo.fg });
  dibujarIcono(page, estilo.icono, MARGIN + 30, y - 24, estilo.fg, estilo.bg);
  write(copia.sellos[estado], MARGIN + 54, y - 28, 13, bold, estilo.fg);
  lineasSello.forEach((ln, i) => write(ln, MARGIN + 54, y - 46 - i * 11.5, 9.3, font, SOFT_INK));
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

  // Las listas de detalle solo se imprimen cuando NO estan vacias. El cero, con su denominador,
  // vive en «Cobertura»: un «Ninguna» suelto no distingue «no habia» de «no miramos».
  if (data.boxesPerPage.length > 0) {
    subLabel(copia.subZonas);
    for (const entry of data.boxesPerPage) bullet(copia.zonasPagina(entry.page + 1, entry.count), ACCENT);
    y -= 2;
  }

  // Dos listas, no una. Antes se imprimian juntas con la frase «sin capa de texto», alimentadas
  // con `visualReviewPages`: de una pagina que SI tiene texto y esta tapada por una imagen el
  // informe afirmaba, literalmente, que no tenia capa de texto.
  if (data.paginasSinCapaDeTexto.length > 0) {
    subLabel(copia.subSinCapaDeTexto);
    for (const p of data.paginasSinCapaDeTexto) bullet(copia.paginaSinCapaDeTexto(p + 1), BAD);
    y -= 2;
  }

  if (data.paginasImagenCompleta.length > 0) {
    subLabel(copia.subImagenCompleta);
    for (const p of data.paginasImagenCompleta) bullet(copia.paginaImagenCompleta(p + 1), AMBER);
    y -= 2;
  }

  // Una caja manual sobre una pagina sin texto SI borra pixeles, pero no deja nada que releer:
  // no se puede confirmar. Callarlo seria dar por verificado lo que no lo esta.
  if (data.unverifiableManualPages.length > 0) {
    subLabel(copia.subNoVerificables);
    for (const p of data.unverifiableManualPages) bullet(copia.noVerificablePagina(p + 1), BAD);
  }

  // --- cobertura: los numeros, con su denominador --------------------------
  heading(copia.encabezadoCobertura);
  row(copia.filaPaginasTotal, String(data.totalPaginas), 9.5);
  row(copia.filaPaginasReleidas, String(paginasReleidas(data)), 9.5);
  row(copia.filaPaginasSinTexto, cifraConPaginas(copia, data.paginasSinCapaDeTexto), 9.5);
  row(copia.filaPaginasImagenCompleta, cifraConPaginas(copia, data.paginasImagenCompleta), 9.5);
  row(copia.filaZonasTachadas, copia.zonasEnPaginas(zonasTachadas(data), paginasConZonas(data)), 9.5);
  row(copia.filaTachadosSinConfirmar, cifraConPaginas(copia, data.unverifiableManualPages), 9.5);

  // --- objetos del archivo: lista FIJA, con su agujero dicho en voz alta ----
  heading(copia.encabezadoObjetos);
  for (const categoria of CATEGORIAS_OBJETO) {
    filaObjeto(etiquetaObjeto(copia, categoria), data.objetos[categoria]);
  }

  // --- alcance -------------------------------------------------------------
  heading(copia.encabezadoAlcance);
  for (const parrafo of copia.alcanceParrafos) {
    const scopeLines = wrapText(parrafo, font, 9.5, CONTENT_W - 26);
    const boxH = scopeLines.length * 12.5 + 15;
    ensure(boxH + 8);
    page.drawRectangle({ x: MARGIN, y: y - boxH, width: CONTENT_W, height: boxH, color: SOFT_BG });
    page.drawRectangle({ x: MARGIN, y: y - boxH, width: 3, height: boxH, color: MUTED });
    scopeLines.forEach((ln, i) => write(ln, MARGIN + 14, y - 13.5 - i * 12.5, 9.5, font, SOFT_INK));
    y -= boxH + 7;
  }
  y -= 3;

  // --- como lo comprueba un tercero ----------------------------------------
  heading(copia.encabezadoVerificacion);
  for (const parrafo of copia.verificacionParrafos) {
    const lineas = wrapText(parrafo, font, 9.3, CONTENT_W);
    ensure(lineas.length * 12 + 10);
    lineas.forEach((ln, i) => write(ln, MARGIN, y - 9.5 - i * 12, 9.3, font, SOFT_INK));
    y -= lineas.length * 12 + 6;
  }
  ensure(16);
  write(copia.lineaHerramienta(VERSION_APP, data.date), MARGIN, y - 9, 8.5, font, MUTED);
  y -= 14;

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
