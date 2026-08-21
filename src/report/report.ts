import { type Color, degrees, type PDFFont, type PDFPage, PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { VERSION_APP } from '../config';
import type { CopiaInforme } from '../content/tipos';
import { detect } from '../detect/patterns';
import { CATEGORIAS_OBJETO, type EstadoObjeto, type EstadoSello, type ReportData } from '../types';
import {
  coberturaComprobada,
  estadoDelSello,
  hayObjetoNoExaminado,
  paginasConReserva,
  paginasConZonas,
  paginasReleidas,
  reservaSoloPorImagenes,
  zonasTachadas,
} from './estado';

// Todo el texto del informe llega por parámetro (`copia`). No hay valor por defecto a propósito:
// un idioma sin cablear tiene que romper la compilación, no imprimir en español sin avisar.

const PAGE: [number, number] = [595, 842];
const MARGIN = 50;
const CONTENT_W = PAGE[0] - MARGIN * 2;
// La caja de TINTA que mide un lector es un pelo mas ancha que la suma de anchuras de avance con
// la que ajusta pdf-lib: ajustar al ancho exacto se sale del margen por ~2 pt. Medido, no supuesto
// (`maquetacion.test.ts` lo vigila glifo a glifo).
const HOLGURA = 8;

// Paleta sobria de despacho: tinta oscura, gris de etiqueta, línea fina, acento cielo, verde/rojo
// de veredicto. El objetivo es que parezca un documento formal, no un volcado de texto.
//
// Las tintas de estado se OSCURECIERON manteniendo el matiz. Medido sobre el PDF rasterizado, el
// rótulo del sello daba 3,68:1 en ámbar, 4,06 en gris y 4,16 en verde sobre sus propios rellenos:
// por debajo del 4,5 que necesita un texto de ese cuerpo. El único que pasaba era el rojo, o sea
// que el esfuerzo de contraste se lo llevaba el estado que casi nadie ve y el que se lee el 86 %
// de las veces era el más difícil de leer del documento. Los cuatro pares nuevos dan 5,8-7,0:1.
const INK = rgb(0.098, 0.129, 0.196);
const MUTED = rgb(0.29, 0.333, 0.408);
const SOFT_INK = rgb(0.28, 0.33, 0.4);
const LINE = rgb(0.86, 0.89, 0.93);
const BRAND = rgb(0.055, 0.086, 0.161);
const ACCENT = rgb(0.02, 0.6, 0.86);
const OK = rgb(0.086, 0.53, 0.32);
const BAD = rgb(0.77, 0.14, 0.14);
const AMBER = rgb(0.71, 0.44, 0.03);
const SOFT_BG = rgb(0.969, 0.98, 0.988);
const WHITE = rgb(1, 1, 1);
const BAND_SUB = rgb(0.72, 0.78, 0.87);

/**
 * Un estado del sello se dibuja con CUATRO decisiones, no con un color:
 *
 * - `banda`  el relleno de la caja del veredicto,
 * - `tinta`  el texto DENTRO de esa caja,
 * - `acento` el mismo estado sobre papel blanco (barra lateral, pie de página),
 * - `icono`  una forma distinta por estado — y en el ámbar, además, una MEDIDA: el disco de
 *            «cobertura» se llena en la proporción real de páginas comprobadas del todo.
 *
 * Por qué son cuatro y no dos: convertidos a escala de grises, los cinco rellenos antiguos caben
 * en SEIS niveles de 255 — el informe se imprime, se fotocopia y se archiva, y en cuanto sale de
 * la pantalla los cinco sellos eran la misma caja gris. E1 pasa a banda roja maciza con texto en
 * blanco: en gris queda en ~75 frente a ~240 de los demás, o sea que la única alarma del producto
 * se distingue del resto SIN color. El resto se distinguen por la forma del icono y el rótulo.
 *
 * E1 y E2 comparten familia roja a propósito: la regla de producto dice que las páginas sin capa
 * de texto SIEMPRE se advierten en rojo. Lo que se corrige es que antes eran el MISMO rojo con el
 * mismo relleno y solo cambiaba el relleno del aspa; ahora una está invertida y la otra no.
 */
interface EstiloSello {
  banda: Color;
  tinta: Color;
  acento: Color;
  barra: Color;
  icono: 'aspa' | 'aspaHueca' | 'cobertura' | 'guion' | 'check';
}

const ROJO_BANDA = rgb(0.722, 0.11, 0.11);
const ROJO_TINTA = rgb(0.608, 0.11, 0.11);
const ROJO_BARRA = rgb(0.451, 0.055, 0.055);
const ROJO_BG = rgb(0.984, 0.914, 0.914);
const AMBAR_TINTA = rgb(0.486, 0.29, 0.012);
const AMBAR_BG = rgb(0.984, 0.941, 0.824);
const GRIS_TINTA = rgb(0.29, 0.333, 0.408);
const GRIS_BG = rgb(0.902, 0.918, 0.937);
const VERDE_TINTA = rgb(0.059, 0.42, 0.255);
const VERDE_BG = rgb(0.89, 0.961, 0.918);

const ESTILO_SELLO: Record<EstadoSello, EstiloSello> = {
  E1: { banda: ROJO_BANDA, tinta: WHITE, acento: ROJO_TINTA, barra: ROJO_BARRA, icono: 'aspa' },
  E2: { banda: ROJO_BG, tinta: ROJO_TINTA, acento: ROJO_TINTA, barra: ROJO_TINTA, icono: 'aspaHueca' },
  E3: { banda: AMBAR_BG, tinta: AMBAR_TINTA, acento: AMBAR_TINTA, barra: AMBAR_TINTA, icono: 'cobertura' },
  E4: { banda: GRIS_BG, tinta: GRIS_TINTA, acento: GRIS_TINTA, barra: GRIS_TINTA, icono: 'guion' },
  E5: { banda: VERDE_BG, tinta: VERDE_TINTA, acento: VERDE_TINTA, barra: VERDE_TINTA, icono: 'check' },
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

/** Parte una palabra que NO cabe entera. Una huella SHA-256 son 64 caracteres sin un solo
 *  espacio: sin esto se dibujaba en una linea unica que se salia del papel. */
function partirPalabra(word: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const trozos: string[] = [];
  let actual = '';
  for (const ch of word) {
    if (actual.length > 0 && font.widthOfTextAtSize(actual + ch, size) > maxWidth) {
      trozos.push(actual);
      actual = ch;
    } else {
      actual += ch;
    }
  }
  if (actual.length > 0) trozos.push(actual);
  return trozos;
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
    if (font.widthOfTextAtSize(current, size) > maxWidth) {
      const trozos = partirPalabra(current, font, size, maxWidth);
      lines.push(...trozos.slice(0, -1));
      current = trozos[trozos.length - 1] ?? '';
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
    const sinTachar = data.verify?.datosNoTachados?.length ?? 0;
    const reservas = paginasConReserva(data).length;
    // La reserva de COBERTURA (páginas releídas con imágenes / sin capa de texto, u objetos sin
    // examinar), si la hay. Dos cifras con significado exacto: las páginas RELEÍDAS (total menos
    // las que no tienen capa de texto) y las que llevan alguna reserva. Y cuando la ÚNICA reserva
    // son imágenes —el caso corriente, un membrete— el sello lo dice con todas las letras en vez
    // de mandar al lector a la tabla: un ámbar que siempre dice lo mismo se deja de leer. Cuando
    // la única razón del ámbar es que quedaron datos sin tachar, no hay reserva de cobertura y
    // esta parte queda vacía.
    let cobertura = '';
    if (reservas > 0) {
      cobertura = reservaSoloPorImagenes(data)
        ? copia.lineaParcialSoloImagenes(total, data.paginasConImagen.length)
        : copia.lineaParcial(paginasReleidas(data), total, reservas);
      if (hayObjetoNoExaminado(data)) cobertura += ` ${copia.clausulaObjetosSinExaminar}`;
    } else if (hayObjetoNoExaminado(data)) {
      // `lineaParcialSoloObjetos` YA nombra los objetos: no se le encola la cláusula.
      cobertura = copia.lineaParcialSoloObjetos(total);
    }
    // Los datos que el usuario dejó sin tachar van PRIMERO: es lo más importante que decir de un
    // ámbar así —siguen en el documento entregado— y precede a cualquier reserva de cobertura.
    if (sinTachar > 0) {
      const clausula = copia.lineaParcialDatosSinTachar(sinTachar);
      return cobertura === '' ? clausula : `${clausula} ${cobertura}`;
    }
    return cobertura;
  }
  if (estado === 'E4') return copia.lineaSinTachados(total);
  return copia.lineaVerificado(total, zonasTachadas(data));
}

/**
 * El informe imprimia `data.fileName` TAL CUAL. Con la convencion de nombrado de cualquier
 * gestoria — `nomina-12345678Z-julio.pdf` — el DNI quedaba dentro del entregable, y el
 * entregable es el informe que se guarda como registro de diligencia. El propio producto
 * publicaba el dato que acababa de tachar.
 *
 * Se sustituyen las coincidencias de los MISMOS patrones que busca el resto del informe, de
 * derecha a izquierda para no invalidar los indices.
 */
export function nombreSinDatos(fileName: string, marcador: string): string {
  const hits = [...detect(fileName)].sort((a, b) => b.start - a.start);
  let salida = fileName;
  let ultimoInicio = Number.POSITIVE_INFINITY;
  for (const hit of hits) {
    // Dos patrones pueden solapar sobre el mismo trozo (un NUSS dentro de un telefono, p. ej.):
    // se salta el que ya quedo dentro de una sustitucion.
    if (hit.end > ultimoInicio) continue;
    salida = salida.slice(0, hit.start) + marcador + salida.slice(hit.end);
    ultimoInicio = hit.start;
  }
  return salida;
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

/**
 * EL TOPE DEL MEDIDOR. La línea de lleno total queda por debajo del borde del disco: al 100 % se
 * pinta el 80 % del diámetro y el casquete de arriba se queda siempre vacío.
 *
 * No es adorno. En E3 SIEMPRE queda algo sin comprobar —esa es la definición del estado, y el
 * 100 % de páginas sin reserva se da cuando lo pendiente es un objeto del archivo, no una
 * página—, así que un disco lleno del todo junto a «COMPROBACIÓN PARCIAL» insinuaría el verde
 * que el motor no ha dado, y encima sería el mismo disco macizo que lleva el estado verificado.
 * Un círculo relleno hasta el borde con su orla, además, es la forma que empieza a leerse como
 * un sello de conformidad, y eso está prohibido también cuando lo dice el DIBUJO.
 *
 * La escala sigue siendo lineal y monótona (0 → vacío, 1 → 80 % del diámetro): el medidor nunca
 * dibuja MÁS cobertura de la que hay; como mucho, un poco menos.
 */
const TOPE_MEDIDOR = 0.8;

/**
 * EL MEDIDOR DE COBERTURA, la única pieza del sello que lleva un dato dentro.
 *
 * Antes tenía forma de medidor y no medía nada: salía medio lleno siempre. Los dos informes
 * parciales —uno con 3 de 6 páginas comprobadas del todo, otro con 0 de 4 porque todas llevan
 * imágenes— dibujaban exactamente la misma media luna, y el segundo es el que importa: cobertura
 * real cero, dibujo de media cobertura. Es la familia de defecto que este producto lleva dos
 * pasadas cerrando, la presentación insinuando lo que el motor no ha hecho.
 *
 * Ahora el relleno es `coberturaComprobada(data)`, que sale de las mismas cifras que imprime el
 * sello y destaca la tabla «Cobertura».
 *
 * Los dos extremos, que son donde un medidor miente:
 *   - CERO no se dibuja como un icono ausente. La PISTA —el disco blanco— se pinta siempre, así
 *     que el vacío se ve como un recipiente vacío y no como un hueco: es una medida tomada, no
 *     algo que no aplique. Y cero es cero: no hay suelo de relleno que finja una pizca de
 *     cobertura donde no la hay.
 *   - CIEN no se dibuja lleno: ver `TOPE_MEDIDOR`.
 *
 * En ESCALA DE GRISES el medidor sigue leyéndose, que es la prueba que este informe no puede
 * perder: el contraste no está entre dos ámbares parecidos sino entre la tinta del relleno
 * (~110 de 255) y el blanco de la pista (255), con el aro cerrando la silueta. El informe se
 * imprime y se fotocopia.
 *
 * El segmento circular se dibuja con `drawSvgPath` (un arco partido en dos mitades de menos de
 * 180°, así que el flag de arco grande no entra en juego). Sigue sin haber nada remoto: es una
 * primitiva de pdf-lib, no un icono descargado.
 */
function dibujarMedidor(page: PDFPage, cx: number, cy: number, R: number, e: EstiloSello, cobertura: number): void {
  const proporcion = Math.min(1, Math.max(0, cobertura));
  const f = proporcion * TOPE_MEDIDOR;
  page.drawEllipse({ x: cx, y: cy, xScale: R, yScale: R, color: WHITE });
  if (f > 0) {
    const dy = -R + f * 2 * R; // altura de la línea de llenado respecto al centro
    const hc = Math.sqrt(Math.max(0, R * R - dy * dy));
    // `drawSvgPath` trabaja en coordenadas SVG (Y hacia abajo) con origen en (x, y): de ahí el
    // signo cambiado de `dy`. Se recorre de la orilla izquierda al fondo y del fondo a la derecha.
    page.drawSvgPath(`M ${-hc} ${-dy} A ${R} ${R} 0 0 0 0 ${R} A ${R} ${R} 0 0 0 ${hc} ${-dy} Z`, {
      x: cx,
      y: cy,
      color: e.tinta,
    });
  }
  page.drawEllipse({ x: cx, y: cy, xScale: R, yScale: R, borderColor: e.tinta, borderWidth: 2.2 });
}

/**
 * Los cinco iconos, dibujados con primitivas de pdf-lib (ni fuente de iconos ni SVG: la CSP del
 * producto no admite nada remoto y un informe no puede depender de un recurso que no viaja dentro).
 *
 * El ámbar ya NO es un signo de admiración. El disco con «!» es el glifo de alerta de cualquier
 * cuadro de error del sistema, y desde que CUALQUIER imagen degrada el sello, el ámbar es el
 * resultado NORMAL: 111 de 129 PDF reales llevan alguna. Un cartel de error como respuesta
 * habitual o se ignora o espanta, y las dos cosas son peores que decir la verdad. El icono es un
 * MEDIDOR DE COBERTURA: no tranquiliza ni alarma, cuantifica — y encaja con la familia entera
 * leída como cobertura: lleno (✓), medio (parcial), vacío (⊗), ninguna (–), fallida (✕).
 */
function dibujarIcono(
  page: PDFPage,
  icono: EstiloSello['icono'],
  cx: number,
  cy: number,
  e: EstiloSello,
  cobertura: number,
): void {
  const R = 13;
  if (icono === 'aspaHueca') {
    page.drawEllipse({ x: cx, y: cy, xScale: R, yScale: R, color: e.tinta });
    page.drawEllipse({ x: cx, y: cy, xScale: R - 2.6, yScale: R - 2.6, color: e.banda });
    page.drawLine({ start: { x: cx - 4.6, y: cy - 4.6 }, end: { x: cx + 4.6, y: cy + 4.6 }, thickness: 2, color: e.tinta });
    page.drawLine({ start: { x: cx - 4.6, y: cy + 4.6 }, end: { x: cx + 4.6, y: cy - 4.6 }, thickness: 2, color: e.tinta });
    return;
  }
  if (icono === 'cobertura') {
    dibujarMedidor(page, cx, cy, R, e, cobertura);
    return;
  }
  page.drawEllipse({ x: cx, y: cy, xScale: R, yScale: R, color: icono === 'aspa' ? WHITE : e.tinta });
  if (icono === 'check') {
    page.drawLine({ start: { x: cx - 6, y: cy }, end: { x: cx - 1.8, y: cy - 4.8 }, thickness: 2.2, color: e.banda });
    page.drawLine({ start: { x: cx - 1.8, y: cy - 4.8 }, end: { x: cx + 6.5, y: cy + 5.4 }, thickness: 2.2, color: e.banda });
  } else if (icono === 'aspa') {
    page.drawLine({ start: { x: cx - 4.8, y: cy - 4.8 }, end: { x: cx + 4.8, y: cy + 4.8 }, thickness: 2.4, color: e.banda });
    page.drawLine({ start: { x: cx - 4.8, y: cy + 4.8 }, end: { x: cx + 4.8, y: cy - 4.8 }, thickness: 2.4, color: e.banda });
  } else {
    page.drawLine({ start: { x: cx - 6, y: cy }, end: { x: cx + 6, y: cy }, thickness: 2.4, color: e.banda });
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
  // El pie creció (filete de estado + rótulo + línea de marca), así que el suelo del cuerpo sube.
  const SUELO = 84;
  const ensure = (needed: number): void => {
    if (y - needed < SUELO) newPage();
  };

  //
  // CONTROL DE VIUDAS Y HUERFANAS. `alto` es lo que la seccion necesita DEBAJO del encabezado para
  // no quedarse colgando sola al final de una hoja. Sin esto: «COBERTURA DE ESTA COMPROBACION»
  // cerraba la pagina 1 sin una sola fila debajo, la pagina 2 arrancaba con una fila suelta sin
  // encabezado encima, y «COMO COMPROBAR ESTE INFORME» se quedaba en una hoja con su cuerpo en la
  // siguiente. En un documento que se archiva como prueba, una hoja que empieza por una fila
  // huerfana parece un fallo de impresion y le resta credibilidad al informe entero.
  const heading = (title: string, alto = 40): void => {
    ensure(32 + alto);
    y -= 3;
    write(title.toUpperCase(), MARGIN, y - 10, 10.5, bold, INK);
    page.drawRectangle({ x: MARGIN, y: y - 17, width: 28, height: 2, color: ACCENT });
    y -= 20;
  };

  const subLabel = (s: string): void => {
    ensure(18);
    write(s, MARGIN, y - 9, 9.5, bold, SOFT_INK);
    y -= 15;
  };

  // Las viñetas AJUSTAN el texto al ancho. Antes no: el aviso de un tachado no verificable mide
  // 150 caracteres y se dibujaba en una sola linea que se salia del papel — visible solo al abrir
  // el PDF, invisible para un test que extrae texto.
  //
  // El punto tiene TRES estados, no dos. Un punto macizo verde afirma «comprobado y sin
  // hallazgos», y eso era falso justo donde mas duele: en un documento entero escaneado —sello
  // ROJO, cero paginas releidas, ninguna capa de texto— se dibujaban SIETE puntos verdes en fila
  // bajo «0 ocurrencias en el texto extraible». La frase es literalmente cierta (no habia texto
  // que leer); el punto verde decia otra cosa. Es el falso verde que se cerro en el texto,
  // sobreviviendo en los pixeles.
  //   macizo verde  = se comprobo y no habia,
  //   anillo hueco  = no se pudo comprobar,
  //   macizo rojo   = encontrado.
  // El texto de cada linea no cambia ni una coma: lo que deja de contradecirlo es el punto.
  const bullet = (s: string, dotColor: Color, hueco = false): void => {
    const lineas = wrapText(s, font, 9.7, CONTENT_W - 15);
    const alto = 13 + (lineas.length - 1) * 11.8;
    ensure(alto + 2);
    page.drawEllipse({ x: MARGIN + 4, y: y - 6.5, xScale: 2.7, yScale: 2.7, color: dotColor });
    if (hueco) page.drawEllipse({ x: MARGIN + 4, y: y - 6.5, xScale: 1.4, yScale: 1.4, color: WHITE });
    lineas.forEach((ln, i) => write(ln, MARGIN + 15, y - 9.5 - i * 12, 9.7, font, INK));
    y -= alto;
  };

  const altoObjeto = (label: string): number =>
    Math.max(16, wrapText(label, font, 9.5, 300).length * 12 + 4);

  const filaObjeto = (label: string, estadoObjeto: EstadoObjeto): void => {
    const labelLines = wrapText(label, font, 9.5, 300);
    const alto = altoObjeto(label);
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

  // La etiqueta AJUSTA, igual que el valor. Con la columna fija de 170 pt, «Paginas con imagenes
  // (su contenido visual no se ha comprobado)» se montaba encima de su propia cifra, y la huella
  // SHA-256 se salia del papel. Se ve abriendo el PDF; ningun test de texto lo nota.
  //
  // `reserva` marca la fila que EXIGE algo del lector. Es el recurso que el informe ya usaba bien
  // en «Objetos del archivo» —«NO EXAMINADO» en versalita ámbar, el único valor que rompe el gris
  // y lo rompe justo donde está la excepción— extendido a la tabla que sostiene el veredicto.
  // Hasta ahora, «Páginas con imágenes … 4 · páginas 1, 2, 3, 4» (la ÚNICA línea accionable del
  // informe ámbar) se dibujaba con el mismo gris, el mismo cuerpo y el mismo interlineado que
  // «Páginas del documento 4» y que «Tachados sin confirmación posterior 0»: ocho filas idénticas.
  // El sello delega ahí —«constan en «Cobertura»»— y ahí la instrucción no se distinguía del
  // inventario. El «4» accionable y el «0» inocuo se dibujaban exactamente igual.
  const LABEL_W = 225;
  // La altura sale del texto REAL envuelto, no de una constante: con la altura fija, la fila que
  // seguía a una etiqueta de dos líneas se pegaba a ella (medido: 7 px de hueco frente a los 27 del
  // resto) y las dos se leían como una sola. Salía en todos los informes.
  const altoFila = (label: string, value: string, valueSize = 10, reserva = false): number =>
    Math.max(
      wrapText(label, font, 9.5, LABEL_W - (reserva ? 10 : 0)).length * 12,
      wrapText(value, font, valueSize, CONTENT_W - LABEL_W - 12).length * (valueSize + 2.5),
      12,
    ) + 8;

  const row = (label: string, value: string, valueSize = 10, reserva = false): void => {
    const sangria = reserva ? 10 : 0;
    const vx = MARGIN + LABEL_W + 12;
    const labelLines = wrapText(label, font, 9.5, LABEL_W - sangria);
    const valueLines = wrapText(value, font, valueSize, CONTENT_W - LABEL_W - 12);
    const alto = altoFila(label, value, valueSize, reserva);
    ensure(alto);
    if (reserva) {
      page.drawRectangle({ x: MARGIN, y: y - alto + 2, width: CONTENT_W, height: alto - 2, color: AMBAR_BG });
      page.drawRectangle({ x: MARGIN, y: y - alto + 2, width: 3, height: alto - 2, color: AMBAR_TINTA });
    }
    labelLines.forEach((ln, i) => write(ln, MARGIN + sangria, y - 11 - i * 12, 9.5, font, reserva ? AMBAR_TINTA : MUTED));
    valueLines.forEach((ln, i) =>
      write(ln, vx, y - 11 - i * (valueSize + 2.5), valueSize, reserva ? bold : font, reserva ? AMBAR_TINTA : INK),
    );
    y -= alto;
  };

  /**
   * VIUDAS Y HUÉRFANAS EN UNA TABLA. Un encabezado no puede cerrar la hoja sin filas debajo (lo
   * cubre `heading`), pero tampoco puede caer una fila suelta al principio de la hoja siguiente:
   * la página 2 arrancaba con «Páginas con texto dibujado que no se puede releer  0», sola y sin
   * encabezado encima. En un documento que se archiva como prueba eso parece un fallo de impresión.
   *
   * Se planifica el corte ANTES de dibujar: se mide cada fila, se ve cuántas caben, y si al otro
   * lado quedarían menos de tres se adelanta el corte. Si no caben tres a este lado, la tabla
   * entera salta de página. Devuelve cuántas filas van antes del salto.
   */
  const MIN_FILAS_A_CADA_LADO = 2;
  const planificarCorte = (alturas: number[]): number => {
    let caben = 0;
    let acumulado = 0;
    for (const alto of alturas) {
      if (y - acumulado - alto < SUELO) break;
      acumulado += alto;
      caben++;
    }
    if (caben >= alturas.length) return alturas.length;
    if (alturas.length - caben < MIN_FILAS_A_CADA_LADO) caben = alturas.length - MIN_FILAS_A_CADA_LADO;
    return caben >= MIN_FILAS_A_CADA_LADO ? caben : 0;
  };

  const tabla = (filas: { alto: number; pinta: () => void }[]): void => {
    const corte = planificarCorte(filas.map((f) => f.alto));
    if (corte === 0) newPage();
    filas.forEach((fila, i) => {
      if (i === corte && corte > 0) newPage();
      fila.pinta();
    });
  };

  // --- cabecera de marca ---------------------------------------------------
  // La banda medía 84 pt y su logotipo era el texto más grande del papel: la marca (38 px de altura
  // de mayúscula a 180 dpi) por encima del título genérico (27) y este por encima del veredicto
  // (25). Los dos elementos mayores de la página eran justamente los dos IDÉNTICOS en los cinco
  // estados, así que el ojo entraba por donde no hay respuesta. La banda baja a 50 pt y la marca
  // al cuerpo de un pie: quien abre el informe hace UNA pregunta y no es de quién es la herramienta.
  const bandH = 50;
  page.drawRectangle({ x: 0, y: PAGE[1] - bandH, width: PAGE[0], height: bandH, color: BRAND });
  page.drawRectangle({ x: 0, y: PAGE[1] - bandH - 3, width: PAGE[0], height: 3, color: ACCENT });
  write('TachadoPDF', MARGIN, PAGE[1] - 22, 12, bold, WHITE);
  write(copia.subtituloBanda, MARGIN, PAGE[1] - 38, 8, font, BAND_SUB);
  const domain = 'tachadopdf.com';
  write(domain, PAGE[0] - MARGIN - font.widthOfTextAtSize(domain, 8), PAGE[1] - 22, 8, font, BAND_SUB);
  y = PAGE[1] - bandH - 22;

  // --- antetítulo y referencia ---------------------------------------------
  // El título deja de ser un titular y pasa a antetítulo: nombra el género del documento, no su
  // resultado. La referencia se va a su derecha, en cuerpo de nota. Los dos siguen imprimiéndose
  // palabra por palabra; lo que cambia es quién manda en la página.
  const ref = `TP-${data.date.replace(/-/g, '')}-${data.sha256.slice(0, 8).toUpperCase()}`;
  // En su caja original, NO en mayúsculas: el título se afirma como literal congelado en
  // `report.test.ts` y una versalita de adorno lo haría desaparecer del texto extraído. La
  // jerarquía se consigue con el cuerpo y el color, que es lo que se puede cambiar sin mentir.
  write(copia.titulo, MARGIN, y - 9, 9.5, bold, MUTED);
  const refTexto = safe(copia.referencia(ref, data.date));
  write(refTexto, PAGE[0] - MARGIN - font.widthOfTextAtSize(refTexto, 8.5), y - 9, 8.5, font, MUTED);
  y -= 16;
  page.drawRectangle({ x: MARGIN, y, width: CONTENT_W, height: 0.8, color: LINE });
  y -= 14;

  // --- sello de resultado --------------------------------------------------
  // El sello NO es `clean ? verde : rojo`. Es funcion de (cobertura ∧ resultado): un resultado
  // limpio sobre una cobertura del 0 % (documento escaneado) no es verde, y un documento del que
  // no se elimino nada tampoco. La escalera vive en `./estado.ts` y es la unica fuente.
  //
  // El rótulo pasa a 19 pt: es el texto mayor de la página, por encima de la marca (12) y del
  // antetítulo (9,5). Es el único elemento cuyo contenido cambia según el resultado, así que es
  // el único que merece entrar primero por el ojo.
  const estado = estadoDelSello(data);
  const estilo = ESTILO_SELLO[estado];
  const SELLO_X = MARGIN + 62;
  const lineasSello = wrapText(lineaDelSello(estado, data, copia), font, 9.3, PAGE[0] - MARGIN - SELLO_X);
  const badgeH = 52 + lineasSello.length * 12 + 7;
  page.drawRectangle({ x: MARGIN, y: y - badgeH, width: CONTENT_W, height: badgeH, color: estilo.banda });
  page.drawRectangle({ x: MARGIN, y: y - badgeH, width: 6, height: badgeH, color: estilo.barra });
  dibujarIcono(page, estilo.icono, MARGIN + 34, y - 30, estilo, coberturaComprobada(data));
  write(copia.sellos[estado], SELLO_X, y - 35, 19, bold, estilo.tinta);
  const tintaLineas = estado === 'E1' ? WHITE : SOFT_INK;
  lineasSello.forEach((ln, i) => write(ln, SELLO_X, y - 53 - i * 12, 9.3, font, tintaLineas));
  y -= badgeH + 13;

  // --- datos del documento -------------------------------------------------
  heading(copia.encabezadoDatos, 90);
  const nombreMostrado = nombreSinDatos(data.fileName, copia.nombreOculto);
  row(copia.filaArchivo, nombreMostrado);
  // El aviso va PEGADO a la fila del archivo, que es a lo que se refiere, y con la misma anatomía
  // que el sello en pequeño: barra roja, fondo teñido y una medida legible. Antes flotaba suelto
  // entre dos secciones, detrás de la huella SHA-256, a sangre completa y con la línea más larga
  // del informe (122 caracteres) — un aviso ACCIONABLE (hay que renombrar el fichero antes de
  // enviarlo) presentado como si fuera texto de relleno mal colocado.
  if (nombreMostrado !== data.fileName) {
    const avisoLineas = wrapText(copia.avisoNombreOculto, font, 8.7, CONTENT_W - 30);
    const avisoH = avisoLineas.length * 11.5 + 13;
    ensure(avisoH + 6);
    page.drawRectangle({ x: MARGIN, y: y - avisoH, width: CONTENT_W, height: avisoH, color: ROJO_BG });
    page.drawRectangle({ x: MARGIN, y: y - avisoH, width: 3, height: avisoH, color: ROJO_TINTA });
    avisoLineas.forEach((ln, i) => write(ln, MARGIN + 14, y - 12.5 - i * 11.5, 8.7, font, ROJO_TINTA));
    y -= avisoH + 6;
  }
  row(copia.filaFecha, data.date);
  row(copia.filaReferencia, ref);
  row(copia.filaHuella, data.sha256, 8.5);

  // --- comprobaciones ------------------------------------------------------
  heading(copia.encabezadoComprobaciones, 60);
  const residues = data.verify?.residues ?? [];

  // El punto verde afirma «comprobado y limpio». Cuando no hubo NADA que releer —ninguna página
  // con capa de texto— o la comprobación no llegó a ejecutarse, esa afirmación es falsa aunque la
  // frase que la acompaña sea cierta. Ojo con la regla: NO es «el estado es rojo o ámbar». En un
  // ámbar por imágenes la cobertura de TEXTO es completa y el verde ahí es correcto; la reserva
  // está en la imagen, y de eso habla el sello.
  const sinTextoQueReleer = paginasReleidas(data) === 0 || data.verify === undefined;

  const noTachados = data.verify?.datosNoTachados ?? [];
  subLabel(copia.subPatrones);
  for (const kind of data.patternsSearched) {
    const matching = residues.filter((r) => r.kind === kind);
    const dejados = noTachados.filter((r) => r.kind === kind);
    if (matching.length > 0) {
      // Residuo BLOQUEANTE: algo que se pidió tachar sobrevivió. Rojo.
      const pages = matching.map((r) => (r.page === null ? '?' : r.page + 1)).join(', ');
      bullet(copia.patronSucio(copia.etiquetas[kind], matching.length, pages), BAD);
    } else if (dejados.length > 0) {
      // Detectado y NO tachado por elección del usuario: sigue en el documento. NO es «limpio»
      // —pintarlo verde aquí sería un falso verde dentro del propio informe— pero tampoco un
      // fallo del tachado: ámbar, «presente, sin tachar».
      const pages = dejados.map((r) => (r.page === null ? '?' : r.page + 1)).join(', ');
      bullet(copia.patronSinTachar(copia.etiquetas[kind], dejados.length, pages), AMBER);
    } else {
      bullet(copia.patronLimpio(copia.etiquetas[kind]), sinTextoQueReleer ? MUTED : OK, sinTextoQueReleer);
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

  // El texto que se DIBUJA y no se puede releer. Lo ve el que abre el documento y no lo ve la
  // comprobacion: ahi cabia un DNI entero bajo un sello verde.
  if (data.paginasTextoNoLegible.length > 0) {
    subLabel(copia.subTextoNoLegible);
    for (const entrada of data.paginasTextoNoLegible) {
      bullet(copia.paginaTextoNoLegible(entrada.page + 1, entrada.caracteres), BAD);
    }
    y -= 2;
  }

  // Una caja manual sobre una pagina sin texto SI borra pixeles, pero no deja nada que releer:
  // no se puede confirmar. Callarlo seria dar por verificado lo que no lo esta.
  if (data.unverifiableManualPages.length > 0) {
    subLabel(copia.subNoVerificables);
    for (const p of data.unverifiableManualPages) bullet(copia.noVerificablePagina(p + 1), BAD);
  }

  // --- cobertura: los numeros, con su denominador --------------------------
  // Las filas con RESERVA se destacan; las de inventario, no. Son exactamente las que componen
  // `paginasConReserva`, o sea las que bajan el sello: lo que el veredicto delega a esta tabla se
  // encuentra ahora de un vistazo en vez de rastrearse entre ocho filas grises.
  const noLegibles = data.paginasTextoNoLegible.map((p) => p.page);
  const cobertura: [string, string, boolean][] = [
    [copia.filaPaginasTotal, String(data.totalPaginas), false],
    // EL NUMERADOR DEL MEDIDOR, EN LA TABLA. El disco del sello ambar se llena en la proporcion
    // `sinReserva / total` y esa cifra no se imprimia en ninguna parte: el dibujo era el unico
    // portador de la unica afirmacion que un tercero no podia contrastar. Va pegada a la fila del
    // total para que el par se lea como fraccion.
    // Cifra desnuda (no «0 de 4»): `report/cobertura-destacada` parsea los digitos de la linea, y
    // el denominador ya esta en la fila de encima. Y NO se destaca: destacar es la marca de una
    // reserva, y esta fila es el resultado de haberlas contado, no una mas.
    [
      copia.filaPaginasSinReserva,
      String(data.totalPaginas - paginasConReserva(data).length),
      false,
    ],
    [copia.filaPaginasReleidas, String(paginasReleidas(data)), false],
    [copia.filaPaginasSinTexto, cifraConPaginas(copia, data.paginasSinCapaDeTexto), data.paginasSinCapaDeTexto.length > 0],
    [copia.filaPaginasImagenCompleta, cifraConPaginas(copia, data.paginasImagenCompleta), data.paginasImagenCompleta.length > 0],
    [copia.filaPaginasConImagen, cifraConPaginas(copia, data.paginasConImagen), data.paginasConImagen.length > 0],
    [copia.filaZonasTachadas, copia.zonasEnPaginas(zonasTachadas(data), paginasConZonas(data)), false],
    [copia.filaTachadosSinConfirmar, cifraConPaginas(copia, data.unverifiableManualPages), data.unverifiableManualPages.length > 0],
    [copia.filaPaginasTextoNoLegible, cifraConPaginas(copia, noLegibles), noLegibles.length > 0],
  ];
  heading(copia.encabezadoCobertura, 20 * MIN_FILAS_A_CADA_LADO);
  tabla(
    cobertura.map(([label, valor, reserva]) => ({
      alto: altoFila(label, valor, 9.5, reserva),
      pinta: () => row(label, valor, 9.5, reserva),
    })),
  );

  // --- objetos del archivo: lista FIJA, con su agujero dicho en voz alta ----
  heading(copia.encabezadoObjetos, 20 * MIN_FILAS_A_CADA_LADO);
  tabla(
    CATEGORIAS_OBJETO.map((categoria) => {
      const label = etiquetaObjeto(copia, categoria);
      return { alto: altoObjeto(label), pinta: () => filaObjeto(label, data.objetos[categoria]) };
    }),
  );

  // --- alcance -------------------------------------------------------------
  heading(copia.encabezadoAlcance, 95);
  for (const parrafo of copia.alcanceParrafos) {
    const scopeLines = wrapText(parrafo, font, 9.5, CONTENT_W - 26);
    const boxH = scopeLines.length * 12.2 + 13;
    ensure(boxH + 6);
    page.drawRectangle({ x: MARGIN, y: y - boxH, width: CONTENT_W, height: boxH, color: SOFT_BG });
    page.drawRectangle({ x: MARGIN, y: y - boxH, width: 3, height: boxH, color: MUTED });
    scopeLines.forEach((ln, i) => write(ln, MARGIN + 14, y - 12.5 - i * 12.2, 9.5, font, SOFT_INK));
    y -= boxH + 6;
  }
  y -= 3;

  // --- como lo comprueba un tercero ----------------------------------------
  heading(copia.encabezadoVerificacion, 60);
  for (const parrafo of copia.verificacionParrafos) {
    const lineas = wrapText(parrafo, font, 9.3, CONTENT_W - HOLGURA);
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
  // EL VEREDICTO VIAJA CON EL PAPEL. Medido antes de este cambio: la página 2 del informe que dice
  // TACHADO NO SUPERADO y la página 2 del que dice TACHADO VERIFICADO eran el MISMO fichero de
  // píxeles, byte a byte. El veredicto existía solo en la mitad superior de la página 1, así que
  // quien imprime y grapa, quien archiva, quien abre por la última hoja o quien reenvía una sola
  // página tenía delante un documento sin resultado — incluido el caso en que esa página suelta
  // pertenece a un informe que dice «no entregues este archivo».
  //
  // El pie ya existía y estaba vacío de información. Ahora lleva el filete teñido con el color del
  // estado y su rótulo COMPLETO. Completo y no abreviado a propósito: la regla G8 exige que ningún
  // rótulo sea subcadena de otro, y un «PARCIAL» a secas la rompería y con ella los tests que
  // impiden que una página escaneada salga verde.
  const allPages: PDFPage[] = doc.getPages();
  allPages.forEach((p, i) => {
    p.drawRectangle({ x: MARGIN, y: 66, width: CONTENT_W, height: 2, color: estilo.barra });
    p.drawEllipse({ x: MARGIN + 3.4, y: 53.4, xScale: 3.4, yScale: 3.4, color: estilo.acento });
    p.drawText(safe(copia.sellos[estado]), { x: MARGIN + 13, y: 50, size: 8, font: bold, color: estilo.acento });
    const pn = copia.numeroPagina(i + 1, allPages.length);
    p.drawText(safe(pn), { x: PAGE[0] - MARGIN - font.widthOfTextAtSize(pn, 8), y: 50, size: 8, font, color: MUTED });
    p.drawText(safe(copia.pie), { x: MARGIN, y: 36, size: 7.6, font, color: MUTED });
  });

  // --- marca de agua DEMO (solo versión gratuita) --------------------------
  // La diagonal salia del centro de la pagina hacia arriba y a la derecha, o sea que atravesaba
  // justo la banda del sello: medido, 7.621 pixeles de marca de agua DENTRO del veredicto, por el
  // centro de las lineas que explican que queda pendiente, y de paso por encima de la fila de la
  // huella SHA-256. La version gratuita es la que ve el 100 % de los usuarios nuevos: el trazo
  // publicitario degradaba exactamente la pieza que responde a la unica pregunta que importa y el
  // dato con el que un tercero contrasta el archivo.
  //
  // Se reencamina por la mitad INFERIOR, que es donde el informe respira, y se baja la opacidad.
  // Sigue cruzando la hoja entera de lado a lado —su funcion comercial no cambia— sin pisar ni el
  // sello ni la huella.
  if (data.freeVersion) {
    const wmText = safe(copia.marcaAgua);
    const wmSize = 30;
    const wmColor = rgb(0.6, 0.6, 0.6);
    const wmWidth = bold.widthOfTextAtSize(wmText, wmSize);
    // El texto girado 45 grados avanza lo mismo en X que en Y: se centra su proyeccion en el
    // ancho util y se arranca lo bastante abajo para que la punta no llegue al sello.
    const avance = wmWidth / Math.SQRT2;
    allPages.forEach((p) => {
      p.drawText(wmText, {
        x: PAGE[0] / 2 - avance / 2,
        y: 110,
        size: wmSize,
        font: bold,
        color: wmColor,
        opacity: 0.22,
        rotate: degrees(45),
      });
    });
  }

  return doc.save();
}
