// Generador de las páginas HTML del sitio. Una fuente de contenido, N salidas.
//
// POR QUÉ EXISTE: `dist/index.html` se publicaba con el cuerpo entero vacío
// (`<div id="app"></div>`) porque toda la página la pintaba JavaScript. Google ejecuta JS, pero
// Bing y los rastreadores de los modelos de lenguaje ven un div vacío — y traducir una página
// vacía da dos páginas vacías. El texto que lee un desconocido antes de tocar la herramienta va
// en el HTML; JavaScript solo monta los controles interactivos en los huecos.
//
// POR QUÉ GENERA FICHEROS COMMITEADOS y no un plugin de build: lo generado son textos legales,
// precios y metadatos — justo lo que hay que poder revisar en un pull request. Si la generación
// fuese invisible dentro de `vite build`, nadie revisaría nunca el legal de un idioma nuevo.
// Que el fichero de disco esté al día lo vigila src/content/pages-generadas.test.ts.

import { CONTENIDOS } from './index';
import { PRECIO_PRO } from '../config';
import { enlacePreloadFuente, sistemaCss } from '../estilo/sistema';
import { esc, escTexto, jsonLd, sangrar, texto } from './html';
import {
  LOCALES,
  LOCALE_POR_DEFECTO,
  PAGINAS,
  SITIO,
  type Locale,
  type PaginaRegistro,
  ficheroDe,
  localesDe,
  navHref,
  paginaPorId,
  rutaDe,
  urlCanonica,
} from './registro';
import type { Bloque, ContenidoGuia } from './tipos';

/** 'wasm-unsafe-eval' es OBLIGATORIO para instanciar mupdf-wasm; permite compilar WebAssembly
 *  pero NO eval() de JS arbitrario. connect-src limita el egress a Gumroad. */
export const CSP =
  "default-src 'self'; connect-src 'self' https://api.gumroad.com; img-src 'self' data: blob:; " +
  "style-src 'self' 'unsafe-inline'; script-src 'self' 'wasm-unsafe-eval'; font-src 'self'; " +
  "object-src 'none'; base-uri 'self'";

/** Verificación de propiedad del dominio en Search Console. Solo en la portada del sitio:
 *  verifican el dominio entero, duplicarlas en subrutas es ruido. */
const VERIFICACIONES_GOOGLE = [
  '0y8mSNb6_j9BfT2wCfVhPP4XowuUkIjkg5jz9M7EBdU',
  'wAB_9e6EFyixB6e1jITVlH5DFp1q5scYBpxHaxlFx9g',
];

/**
 * LA TARJETA SOCIAL, POR IDIOMA. La anterior mostraba un sello VERDE mientras el resultado normal
 * del producto es el ámbar: prometía por WhatsApp y LinkedIn el veredicto que casi nadie recibe.
 * La nueva es tipográfica y sobria (papel `--papel`, tinta `--tinta`, IBM Plex), con el símbolo,
 * la marca y el CLAIM LITERAL de la home — sin ningún sello de color que afirme un veredicto.
 * El idioma por defecto conserva el nombre `og-image.png` (las páginas estáticas lo citan tal
 * cual y su URL ya está repartida); cada otro idioma lleva su sufijo con su claim traducido.
 */
export function ogImage(locale: Locale): string {
  const sufijo = locale === LOCALE_POR_DEFECTO ? '' : `-${locale}`;
  return `${SITIO}/og-image${sufijo}.png`;
}

/**
 * LOS ICONOS DEL SITIO. Con ruta RELATIVA al documento (`prefijo`), igual que la fuente y el PDF
 * de ejemplo: una ruta raíz-absoluta (`/favicon.svg`) moriría bajo la base de emergencia
 * `/tachadopdf/`, que es justo el modo pensado para cuando el dominio se cae. Los tres son
 * self-hosted (viven en `public/`), así que la CSP `img-src 'self'` no cambia ni un byte.
 * El `.ico` (16/32/48) sirve a los navegadores viejos —hoy `/favicon.ico` da 404 en cada primera
 * visita—, el `.svg` a los modernos (escala sin pixelarse) y el `apple-touch` al iOS.
 */
export function enlacesFavicon(prefijo: string): string[] {
  return [
    `<link rel="icon" href="${prefijo}favicon.ico" sizes="32x32" />`,
    `<link rel="icon" href="${prefijo}favicon.svg" type="image/svg+xml" />`,
    `<link rel="apple-touch-icon" href="${prefijo}apple-touch-icon.png" />`,
  ];
}

export interface FicheroGenerado {
  /** Ruta relativa a la raíz del repositorio, siempre con '/'. */
  ruta: string;
  contenido: string;
}

interface Alternate {
  hreflang: string;
  href: string;
}

/** Los demás idiomas en los que existe la página. El tipo de retorno se anota a propósito:
 *  mientras solo haya un idioma declarado, TypeScript estrecha `l !== locale` a `never` y todo
 *  lo que venga detrás deja de compilar por un motivo que desaparece al añadir el segundo. */
function otrosIdiomas(pagina: PaginaRegistro, locale: Locale): Locale[] {
  const otros: Locale[] = localesDe(pagina).filter((l) => l !== locale);
  return otros;
}

function ogLocalesAlternos(pagina: PaginaRegistro, locale: Locale): string[] {
  return otrosIdiomas(pagina, locale).map((l) => CONTENIDOS[l].ogLocale);
}

interface OpcionesCabecera {
  lang: string;
  titulo: string;
  descripcion: string;
  canonical: string;
  ogTitulo: string;
  ogDescripcion: string;
  ogLocale: string;
  ogLocalesAlternos: string[];
  /** URL absoluta de la tarjeta social de ESTE idioma (`og-image.png`, `og-image-en.png`, …). */
  ogImage: string;
  alternates: Alternate[];
  /** Ruta de vuelta a la raíz del sitio DESDE ESTE DOCUMENTO ('./', '../', '../../../'). */
  prefijo: string;
  extra: string[];
}

function cabecera(o: OpcionesCabecera): string {
  const lineas: string[] = [
    '<meta charset="UTF-8" />',
    '<meta name="viewport" content="width=device-width, initial-scale=1.0" />',
    `<meta http-equiv="Content-Security-Policy" content="${esc(CSP)}">`,
    '',
    ...enlacesFavicon(o.prefijo),
    '',
    // El sistema visual va en TODAS las páginas y va ANTES que el <style> propio de cada una:
    // los tokens se declaran una sola vez (src/estilo/sistema.css) y lo de la página manda
    // encima. Las dieciséis páginas que no enlazan hoja externa recibían la letra del sistema
    // mientras la portada estrenaba tipografía; esto es lo que cierra ese desfase.
    enlacePreloadFuente(o.prefijo),
    `<style>\n${sistemaCss(o.prefijo)}</style>`,
    '',
    texto('title', {}, o.titulo),
    `<meta name="description" content="${esc(o.descripcion)}" />`,
    `<link rel="canonical" href="${esc(o.canonical)}" />`,
  ];

  for (const alt of o.alternates) {
    lineas.push(`<link rel="alternate" hreflang="${esc(alt.hreflang)}" href="${esc(alt.href)}" />`);
  }

  lineas.push(
    '',
    '<meta property="og:type" content="website" />',
    '<meta property="og:site_name" content="TachadoPDF" />',
    `<meta property="og:title" content="${esc(o.ogTitulo)}" />`,
    `<meta property="og:description" content="${esc(o.ogDescripcion)}" />`,
    `<meta property="og:image" content="${esc(o.ogImage)}" />`,
    `<meta property="og:url" content="${esc(o.canonical)}" />`,
    `<meta property="og:locale" content="${esc(o.ogLocale)}" />`,
  );
  for (const alterno of o.ogLocalesAlternos) {
    lineas.push(`<meta property="og:locale:alternate" content="${esc(alterno)}" />`);
  }

  if (o.extra.length > 0) lineas.push('', ...o.extra);

  return sangrar(lineas, 2);
}

function documento(lang: string, cabeceraHtml: string, cuerpo: string): string {
  return [
    '<!doctype html>',
    `<html lang="${esc(lang)}">`,
    '  <head>',
    cabeceraHtml,
    '  </head>',
    '  <body>',
    cuerpo,
    '  </body>',
    '</html>',
    '',
  ].join('\n');
}

// --- alternates y selector de idioma ---------------------------------------

/**
 * Juego de etiquetas hreflang de una página. Es FUNCIÓN PURA de la página: el mismo bloque, byte
 * a byte, se emite en todos los idiomas del grupo, que es justo lo que hace trivial comprobar la
 * reciprocidad. Una página que solo existe en un idioma no lleva alternates (no los necesita).
 * El canonical es SIEMPRE auto-referente: canonicalizar /en/ hacia / desindexaría el sitio
 * inglés entero.
 */
export function alternatesDe(pagina: PaginaRegistro): Alternate[] {
  const idiomas = localesDe(pagina);
  if (idiomas.length < 2) return [];
  const alternates: Alternate[] = idiomas.map((l) => ({
    hreflang: l,
    href: urlCanonica(pagina, l) ?? '',
  }));
  const porDefecto = urlCanonica(pagina, idiomas[0] as Locale);
  if (porDefecto !== null) alternates.push({ hreflang: 'x-default', href: porDefecto });
  return alternates;
}

/**
 * Selector de idioma: enlaces <a> reales, así que funciona con JavaScript desactivado y también
 * en las guías, que no cargan ningún script. Manda la RUTA, nunca `navigator.language`.
 * Va en TODAS las páginas mientras el sitio tenga más de un idioma: si esta página concreta no
 * existe en el otro idioma (las guías no son traducciones cruzadas), el enlace lleva a la
 * portada de ese idioma en vez de desaparecer y dejar al lector sin salida.
 * Cada idioma se rotula en SU PROPIO idioma; nunca banderas: una bandera es un país.
 */
function selectorIdioma(pagina: PaginaRegistro, locale: Locale): string {
  if (LOCALES.length < 2) return '';
  const desde = rutaDe(pagina, locale) ?? '';
  const home = paginaPorId('home');
  const enlaces = LOCALES.map((l) => {
    // Se lee ANTES de comparar: con un solo idioma declarado, TypeScript estrecha la rama «otro
    // idioma» a `never` y `CONTENIDOS[l]` dejaría de compilar por un motivo temporal.
    const otro = CONTENIDOS[l];
    const codigo: string = l;
    const propia = rutaDe(pagina, l);
    const portada = home === undefined ? '' : (rutaDe(home, l) ?? '');
    const destino = propia ?? portada;
    if (l === locale) {
      return `<span class="idiomas__actual" lang="${esc(otro.htmlLang)}">${esc(otro.nombreIdioma)}</span>`;
    }
    return (
      `<a class="idiomas__enlace" hreflang="${esc(codigo)}" lang="${esc(otro.htmlLang)}" ` +
      `href="${esc(navHref(desde, destino))}">${esc(otro.nombreIdioma)}</a>`
    );
  });
  return `<nav class="idiomas" aria-label="${esc(CONTENIDOS[locale].secciones.idiomas)}">\n${sangrar(enlaces, 1)}\n</nav>`;
}

/**
 * EL SÍMBOLO DE LA MARCA, por fin en su ranura. Concepto B: un documento con renglones donde uno
 * tiene un HUECO limpio — el dato borrado DE VERDAD, no tapado con un rectángulo negro, que es la
 * promesa entera del producto dibujada. Una sola tinta vía `currentColor` (la hereda de
 * `.cabecera__marca`, que va en `--tinta`): no se parte en colores y no lleva degradado. NO es un
 * candado ni un escudo — es lo que usan las webs de phishing —: es una hoja de papel.
 * Se incrusta EN LÍNEA en vez de referenciar `public/simbolo.svg` para que tome `currentColor` y
 * no cueste una petición de red por página; el fichero suelto existe igual (es la fuente vectorial
 * y de él nacen el favicon y el apple-touch), y `content/marca.test.ts` ata que no deriven.
 */
export const SIMBOLO_MANCHETA =
  '<svg class="cabecera__simbolo" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
  'stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ' +
  'focusable="false">' +
  '<path d="M6 2.6h7.6L19 8v13.4H6z"/><path d="M13.4 2.6V8H19"/>' +
  '<line x1="8.7" y1="12.2" x2="16.3" y2="12.2"/><line x1="8.7" y1="15.2" x2="11.1" y2="15.2"/>' +
  '<line x1="13.6" y1="15.2" x2="16.3" y2="15.2"/><line x1="8.7" y1="18.2" x2="13.4" y2="18.2"/>' +
  '</svg>';

/**
 * LA MANCHETA. Una cabecera común a las dieciocho páginas: la marca a la izquierda, los idiomas a
 * la derecha, y un filete A SANGRE de borde a borde de la ventana. Ese filete es lo que hace que
 * 1440 px dejen de leerse como una columna suelta flotando en el vacío, y es lo que hoy le falta
 * a `/actas/` y `/nominas/`, que no tienen cabecera ninguna: en el móvil la palabra «TachadoPDF»
 * no aparecía hasta 1,83 pantallas, en las dos páginas donde cae el tráfico de pago.
 *
 * ES UNA MANCHETA DE PERIÓDICO CON SU SÍMBOLO. La marca se resuelve tipográficamente (Plex Sans
 * 600, 14 px, versalitas, `letter-spacing` .14em, en tinta) y el símbolo entra a su izquierda con
 * `gap: 8px` en una ranura de 20×20 px, sin mover nada más que su propio ancho. La palabra
 * `TACHADOPDF` NO se parte en colores y no se le tacha una parte — un tachado dentro del nombre
 * sería un segundo símbolo. El símbolo comparte la tinta de la palabra (`currentColor`), así que
 * la marca sigue en una sola tinta y el acento se reserva para «esto es lo que se pulsa».
 */
function mancheta(pagina: PaginaRegistro, locale: Locale): string {
  const c = CONTENIDOS[locale];
  const selector = selectorIdioma(pagina, locale);
  const marca = `<p class="cabecera__marca">${SIMBOLO_MANCHETA}${escTexto(c.marca)}</p>`;
  return [
    '<header class="cabecera">',
    sangrar(
      [
        '<div class="cabecera__interior">',
        sangrar([marca, selector], 1),
        '</div>',
      ],
      1,
    ),
    '</header>',
  ].join('\n');
}

// --- bloques de prosa -------------------------------------------------------

function bloque(b: Bloque): string {
  switch (b.t) {
    case 'p':
      return texto('p', {}, b.texto);
    case 'h2':
      return texto('h2', {}, b.texto);
    case 'nota':
      return texto('p', { class: 'nota' }, b.texto);
    case 'ul':
      return `<ul>\n${sangrar(b.items.map((i) => texto('li', {}, i)), 1)}\n</ul>`;
    case 'ol':
      return `<ol>\n${sangrar(b.items.map((i) => texto('li', {}, i)), 1)}\n</ol>`;
  }
}

// --- página de la aplicación (la home) --------------------------------------

function guiasDe(locale: Locale): { guia: ContenidoGuia; href: string }[] {
  const contenido = CONTENIDOS[locale];
  const salida: { guia: ContenidoGuia; href: string }[] = [];
  const home = paginaPorId('home');
  const desde = home === undefined ? '' : (rutaDe(home, locale) ?? '');
  for (const guia of contenido.guias) {
    const pagina = paginaPorId(guia.id);
    if (pagina === undefined) continue;
    const ruta = rutaDe(pagina, locale);
    if (ruta === null) continue;
    salida.push({ guia, href: navHref(desde, ruta) });
  }
  return salida;
}

/**
 * MICROCOPY DECORATIVO DE LA PORTADA, por idioma.
 *
 * Todo el TEXTO de venta y legal sale de la fuente de contenido (`CONTENIDOS`); esto es lo poco
 * que el rediseño «legal-tech premium» añade y que NO es prosa de contenido: los rótulos del
 * espécimen del hero (una ilustración con datos ficticios), la microcopia de «100 % en el
 * navegador» y los dos rótulos del bloque de precio. Vive aquí —no en la fuente de contenido—
 * porque es andamiaje de la maqueta, no copia que el producto prometa; `content/generar.ts` está
 * exento de `sin-cadenas-sueltas` justo por esto. Cada idioma tiene su juego; una clave sin
 * traducir se ve a simple vista porque el objeto es un `Record<Locale, …>` cerrado por tipos. */
interface DecorHome {
  heroMicro: string;
  ctaVerPro: string;
  toolMicro: string;
  exhibitEjemplo: string;
  exhibitInforme: string;
  exhibitActa: string;
  exhibitTapado: string;
  exhibitLegible: string;
  exhibitEliminado: string;
  exhibitNada: string;
  exhibitPagina: string;
  proUnaVez: string;
  proNota: string;
  proEtiquetaGratis: string;
  cierreBoton: string;
  /** Chips de identificadores. LOCALE-AWARE a propósito: fuera de España solo el email valida su
   *  dígito de control, así que la portada inglesa NO puede insinuar detección de DNI/NIE/IBAN —
   *  su propia `notaDeteccion` ya lo acota. Enseñar más chips que detectores sería un falso verde. */
  chips: string[];
}

const DECOR: Record<Locale, DecorHome> = {
  es: {
    heroMicro: '100 % en el navegador · el documento no se sube a ningún servidor',
    ctaVerPro: `Ver Pro — ${PRECIO_PRO}`,
    toolMicro: '100 % en el navegador',
    exhibitEjemplo: 'Ejemplo · datos ficticios',
    exhibitInforme: 'Informe de comprobación',
    exhibitActa: 'Acta de junta de propietarios',
    exhibitTapado: 'Tapado con un rectángulo',
    exhibitLegible: 'sigue siendo legible y copiable',
    exhibitEliminado: 'Eliminado del archivo',
    exhibitNada: 'no queda nada que seleccionar',
    exhibitPagina: 'pág. 1',
    proUnaVez: 'una vez',
    proNota: 'pago único · no suscripción',
    proEtiquetaGratis: 'Gratuito',
    cierreBoton: 'Ir a la herramienta',
    chips: ['DNI', 'NIE', 'IBAN', 'Nº Seguridad Social', 'Ref. catastral', 'Teléfono', 'Email'],
  },
  en: {
    heroMicro: '100% in your browser · the document is never uploaded to any server',
    ctaVerPro: `See Pro — ${PRECIO_PRO}`,
    toolMicro: '100% in your browser',
    exhibitEjemplo: 'Example · fictional data',
    exhibitInforme: 'Verification report',
    exhibitActa: "Homeowners' meeting minutes",
    exhibitTapado: 'Covered with a rectangle',
    exhibitLegible: 'still readable and copyable',
    exhibitEliminado: 'Removed from the file',
    exhibitNada: 'nothing left to select',
    exhibitPagina: 'p. 1',
    proUnaVez: 'one-time',
    proNota: 'one-time payment · not a subscription',
    proEtiquetaGratis: 'Free',
    cierreBoton: 'Go to the tool',
    chips: ['Email'],
  },
};

/** El símbolo del documento, a un tamaño arbitrario, en el acento. Ilustra el hero y las fichas. */
function iconoDoc(px: string, color = 'var(--acento)'): string {
  return (
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" ` +
    `stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ` +
    `style="width: ${px}; height: ${px}; flex: none; color: ${color};">` +
    '<path d="M6 2.6h7.6L19 8v13.4H6z"/><path d="M13.4 2.6V8H19"/>' +
    '<line x1="8.7" y1="12.2" x2="16.3" y2="12.2"/><line x1="8.7" y1="15.2" x2="11.1" y2="15.2"/>' +
    '<line x1="13.6" y1="15.2" x2="16.3" y2="15.2"/><line x1="8.7" y1="18.2" x2="13.4" y2="18.2"/>' +
    '</svg>'
  );
}

/**
 * EL ESPÉCIMEN DEL HERO. Una sola ficha, sin tarjetas superpuestas ni rotaciones ni márgenes
 * negativos: eso era justo lo que producía los «cuadros tapando letras» del render original. El
 * dato tapado y el dato borrado se enseñan EN FILAS, con el rectángulo negro AL LADO del dato (no
 * encima), así que nada puede desbordar una banda ni pisar otro texto a ningún ancho. Datos
 * ficticios y rotulado como tal.
 */
function exhibitHero(locale: Locale): string {
  const d = DECOR[locale];
  const c = CONTENIDOS[locale];
  const sello = c.informe.sellos.E3;
  return `<figure class="hero__aparte" style="margin: 0; min-width: 0;">
              <figcaption style="font-family: var(--fuente-dato); font-size: var(--t-100); letter-spacing: 0.08em; text-transform: uppercase; color: var(--gris); margin: 0 0 var(--e-2);">${escTexto(d.exhibitEjemplo)}</figcaption>
              <div style="background: var(--superficie); border: 1px solid var(--linea-fuerte); border-radius: var(--radio); box-shadow: var(--sombra-hoja); overflow: hidden;">
                <div style="display: flex; align-items: center; justify-content: space-between; gap: var(--e-3); padding: var(--e-3) var(--e-4); border-bottom: 1px solid var(--linea); background: var(--papel); color: var(--tinta-suave);">
                  <span style="display: inline-flex; align-items: center; gap: var(--e-2); font-family: var(--fuente-dato); font-size: var(--t-100); letter-spacing: 0.06em; text-transform: uppercase;">${iconoDoc('1rem')}${escTexto(d.exhibitActa)}</span>
                  <span style="font-family: var(--fuente-dato); font-size: var(--t-100); font-weight: var(--peso-fuerte); color: var(--ambar); background: var(--ambar-fondo); padding: 0.1em var(--e-2); border-radius: var(--radio-marca); letter-spacing: 0.04em;">${escTexto(sello)}</span>
                </div>
                <div style="padding: var(--e-6); display: grid; gap: var(--e-6);">
                  <div>
                    <p style="margin: 0 0 var(--e-3); font-family: var(--fuente-dato); font-size: var(--t-100); letter-spacing: 0.08em; text-transform: uppercase; color: var(--gris);">${escTexto(d.exhibitTapado)}</p>
                    <div style="display: flex; align-items: center; gap: var(--e-3); flex-wrap: wrap;">
                      <span class="dato" style="color: var(--rojo); font-size: var(--t-300);">12345678Z</span>
                      <span aria-hidden="true" style="display: inline-block; height: 1.2em; width: 6em; background: var(--tinta); border-radius: var(--radio-marca);"></span>
                    </div>
                    <p style="margin: var(--e-2) 0 0; font-family: var(--fuente-dato); font-size: var(--t-100); color: var(--rojo);">${escTexto(d.exhibitLegible)}</p>
                  </div>
                  <div style="border-top: 1px dashed var(--linea-fuerte); padding-top: var(--e-6);">
                    <p style="margin: 0 0 var(--e-3); font-family: var(--fuente-dato); font-size: var(--t-100); letter-spacing: 0.08em; text-transform: uppercase; color: var(--verde);">${escTexto(d.exhibitEliminado)}</p>
                    <div style="display: inline-flex; align-items: center; gap: var(--e-3);">
                      <span aria-hidden="true" style="display: inline-block; height: 1.2em; width: 6em; border: 1px dashed var(--linea-fuerte); border-radius: var(--radio-marca); background: repeating-linear-gradient(135deg, transparent 0 5px, var(--linea) 5px 6px);"></span>
                      <svg viewBox="0 0 20 20" fill="none" stroke="var(--verde)" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="width: 1.1rem; height: 1.1rem; flex: none;"><path d="M4 10.5l4 4 8-9"/></svg>
                    </div>
                    <p style="margin: var(--e-2) 0 0; font-family: var(--fuente-dato); font-size: var(--t-100); color: var(--verde);">${escTexto(d.exhibitNada)}</p>
                  </div>
                </div>
                <div style="display: flex; align-items: center; justify-content: space-between; padding: var(--e-2) var(--e-4); border-top: 1px solid var(--linea); font-family: var(--fuente-dato); font-size: var(--t-100); color: var(--gris);">
                  <span>${escTexto(d.exhibitPagina)}</span>
                  <span style="letter-spacing: 0.1em;">SHA-256 ····</span>
                </div>
              </div>
            </figure>`;
}

/** Rótulo numérico mono de una sección (01…04), en el color que le corresponda a su masa. */
function numeroSeccion(n: string, color: string): string {
  return `<span style="font-family: var(--fuente-dato); font-size: var(--t-300); color: ${color}; letter-spacing: 0.1em;">${n}</span>`;
}

function cuerpoHome(pagina: PaginaRegistro, locale: Locale): string {
  const c = CONTENIDOS[locale];
  const d = DECOR[locale];
  const ruta = rutaDe(pagina, locale) ?? '';
  const enlace = (id: string): string => {
    const destino = paginaPorId(id);
    const rutaDestino = destino === undefined ? null : rutaDe(destino, locale);
    return rutaDestino === null ? '' : navHref(ruta, rutaDestino);
  };

  const bloques: string[] = [];

  // 1 · HERO (papel). El titular va en `<h1 class="hero__titular">` DESNUDO —lo exige
  // `contenido-indexable`— y su tamaño lo pone el sistema (--t-700, ahora 28→48). El resto de la
  // columna y el espécimen se maquetan en línea. El orden del pliegue (marca < titular < sub <
  // carga < nota-local < gancho < aviso < argumento) lo sigue vigilando `estilo.test.ts`.
  bloques.push(`<section style="padding: clamp(2.5rem, 6vw, var(--e-24)) var(--e-4) var(--e-seccion);">
        <div style="max-width: var(--ancho-herramienta); margin: 0 auto; display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 26rem), 1fr)); gap: var(--e-12) var(--e-16); align-items: center;">
          <div style="max-width: 38rem;">
            <p style="display: inline-flex; align-items: center; gap: var(--e-2); margin: 0 0 var(--e-6); padding: var(--e-1) var(--e-3); background: var(--acento-tenue); border-radius: 999px; font-family: var(--fuente-dato); font-size: var(--t-100); letter-spacing: 0.04em; color: var(--acento-fuerte);"><span aria-hidden="true" style="width: 6px; height: 6px; border-radius: 50%; background: var(--acento);"></span>${escTexto(c.home.ofertaGratis)}</p>
            ${texto('h1', { class: 'hero__titular' }, c.landing.titular)}
            <p class="hero__sub" style="font-size: var(--t-400); line-height: var(--lh-texto); color: var(--tinta-suave); max-width: var(--medida); margin: var(--e-6) 0 0;">${escTexto(c.landing.subtitulo)}</p>
            <div style="display: flex; flex-wrap: wrap; gap: var(--e-3); margin-top: var(--e-8);">
              <a href="#herramienta" style="display: inline-flex; align-items: center; justify-content: center; min-height: 3rem; padding: var(--e-3) var(--e-6); font-weight: var(--peso-fuerte); color: var(--tinta-inversa); background: var(--acento); border: 1px solid var(--acento); border-radius: var(--radio); text-decoration: none;">${escTexto(c.secciones.trabajo)}</a>
              <a href="#pro" style="display: inline-flex; align-items: center; justify-content: center; min-height: 3rem; padding: var(--e-3) var(--e-6); font-weight: var(--peso-fuerte); color: var(--acento); background: var(--superficie); border: 1px solid var(--linea-fuerte); border-radius: var(--radio); text-decoration: none;">${escTexto(d.ctaVerPro)}</a>
            </div>
            <p class="hero__aparte" style="margin: var(--e-6) 0 0; font-family: var(--fuente-dato); font-size: var(--t-100); color: var(--gris); letter-spacing: 0.02em;">${escTexto(d.heroMicro)}</p>
          </div>
          ${exhibitHero(locale)}
        </div>
      </section>`);

  // 2 · LA MESA DE TRABAJO (tinta). La herramienta real es el centro de gravedad: se sienta en una
  // ficha blanca sobre la masa de tinta. Los cuatro huecos que rellena `main.ts` —#carga,
  // #gancho, #trabajo (y #licencia más abajo)— viven DENTRO de la ficha, en el mismo orden que la
  // primera pantalla acordada; `nota-local` y `aviso-principal` conservan su clase y su texto
  // íntegro (los pide `contenido-indexable`). La casilla y el botón de descarga los monta `main.ts`
  // al final de #trabajo, que es el pie del panel: es donde el diseño los quería, sin tocar la app.
  bloques.push(`<section id="herramienta" style="background: var(--tinta); padding: var(--e-seccion) var(--e-4);">
        <div style="max-width: var(--ancho-herramienta); margin: 0 auto;">
          <div style="display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: var(--e-4); margin: 0 0 var(--e-8);">
            <div style="display: flex; align-items: baseline; gap: var(--e-4);">
              ${numeroSeccion('01', 'var(--acento-tenue)')}
              ${texto('h2', { style: 'margin: 0; font-size: var(--t-600); font-weight: var(--peso-fuerte); line-height: var(--lh-corto); color: var(--tinta-inversa); letter-spacing: -0.01em;' }, c.secciones.trabajo)}
            </div>
          </div>
          <div style="background: var(--superficie); border: 1px solid var(--linea-fuerte); border-radius: var(--radio); box-shadow: var(--sombra-mesa); overflow: hidden;">
            <div style="display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--e-2) var(--e-4); padding: var(--e-3) var(--e-6); border-bottom: 1px solid var(--linea); background: var(--papel);">
              <span aria-hidden="true" style="display: inline-flex; gap: 5px;"><span style="width: 8px; height: 8px; border-radius: 50%; background: var(--linea-fuerte);"></span><span style="width: 8px; height: 8px; border-radius: 50%; background: var(--linea-fuerte);"></span><span style="width: 8px; height: 8px; border-radius: 50%; background: var(--linea-fuerte);"></span></span>
              <span style="display: inline-flex; align-items: center; gap: var(--e-2); font-family: var(--fuente-dato); font-size: var(--t-100); color: var(--gris); letter-spacing: 0.06em; text-transform: uppercase;"><span aria-hidden="true" style="width: 6px; height: 6px; border-radius: 50%; background: var(--verde);"></span>${escTexto(d.toolMicro)}</span>
            </div>
            <div style="padding: var(--e-6);">
              <div id="carga"></div>
              ${texto('p', { class: 'nota-local' }, c.landing.procesadoLocal)}
              <div id="gancho"></div>
              ${texto('p', { class: 'aviso-principal' }, c.landing.avisoPrincipal)}
              <div id="trabajo"></div>
            </div>
          </div>
        </div>
      </section>`);

  // 3 · CUATRO ARGUMENTOS (blanco). Van en `<section class="argumento">` DESNUDA —la marca del
  // pliegue— y las cuatro viñetas de la fuente (`hero__bullets`) se pintan como fichas.
  const fichasArg = c.landing.bullets
    .map(
      (b, i) => `<li style="background: var(--papel); border: 1px solid var(--linea); border-radius: var(--radio); padding: var(--e-6); display: flex; flex-direction: column; gap: var(--e-6);">
              <div style="display: flex; align-items: center; justify-content: space-between;">${iconoDoc('2rem')}<span style="font-family: var(--fuente-dato); font-size: var(--t-100); color: var(--gris); letter-spacing: 0.1em;">0${i + 1}</span></div>
              <span style="font-size: var(--t-300); line-height: var(--lh-corto); color: var(--tinta); font-weight: var(--peso-fuerte);">${escTexto(b)}</span>
            </li>`,
    )
    .join('\n            ');
  bloques.push(`<section class="argumento">
        <div style="max-width: var(--ancho-herramienta); margin: 0 auto;">
          <ul class="hero__bullets" style="list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 15rem), 1fr)); gap: var(--e-4);">
            ${fichasArg}
          </ul>
        </div>
      </section>`);

  // 4 · QUÉ SE DETECTA (azul tenue). El texto íntegro de `notaDeteccion` (clase `hero__deteccion`)
  // y, al lado, los identificadores como chips (repiten términos que ya están en ese texto).
  const chips = d.chips
    .map(
      (t) =>
        `<span style="font-family: var(--fuente-dato); font-size: var(--t-200); color: var(--tinta); background: var(--superficie); border: 1px solid var(--linea-fuerte); border-radius: 999px; padding: var(--e-1) var(--e-3);">${escTexto(t)}</span>`,
    )
    .join('\n              ');
  bloques.push(`<section style="background: var(--acento-tenue); padding: var(--e-seccion) var(--e-4);">
        <div style="max-width: var(--ancho); margin: 0 auto; display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 22rem), 1fr)); gap: var(--e-8) var(--e-12); align-items: start;">
          ${texto('p', { class: 'hero__deteccion', style: 'margin: 0; font-size: var(--t-300); line-height: var(--lh-texto); color: var(--tinta); max-width: var(--medida);' }, c.landing.notaDeteccion)}
          <div>
            <p style="margin: 0 0 var(--e-3); font-family: var(--fuente-dato); font-size: var(--t-100); letter-spacing: 0.08em; text-transform: uppercase; color: var(--acento-fuerte);">${escTexto(c.secciones.trabajo)}</p>
            <div style="display: flex; flex-wrap: wrap; gap: var(--e-2);">
              ${chips}
            </div>
          </div>
        </div>
      </section>`);

  // 5 · EL PRECEDENTE (tinta). El texto del dolor va ÍNTEGRO en un solo `<p class="hero__dolor">`
  // (lo exige `contenido-indexable`, y `afirmaciones-respaldadas` pide que el importe cite su
  // expediente: los dos van juntos en la propia frase). El aside repite la cifra CON su expediente
  // adyacente, así que también queda respaldado.
  bloques.push(`<section style="background: var(--tinta); color: var(--tinta-inversa); padding: var(--e-seccion) var(--e-4);">
        <div style="max-width: var(--ancho); margin: 0 auto; display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 18rem), 1fr)); gap: var(--e-8) var(--e-12); align-items: start;">
          ${texto('p', { class: 'hero__dolor', style: 'margin: 0; font-size: var(--t-400); line-height: var(--lh-texto); color: rgba(255,255,255,0.88); max-width: var(--medida);' }, c.landing.dolor)}
          <aside style="border: 1px solid rgba(255,255,255,0.28); border-radius: var(--radio); padding: var(--e-6); align-self: start;">
            <p style="margin: 0; font-family: var(--fuente-dato); font-size: var(--t-700); font-weight: var(--peso-veredicto); line-height: 1; color: var(--tinta-inversa);">15.000&nbsp;€</p>
            <p style="margin: var(--e-4) 0 0; padding-top: var(--e-3); border-top: 1px solid rgba(255,255,255,0.28); font-family: var(--fuente-dato); font-size: var(--t-100); letter-spacing: 0.04em; color: var(--acento-tenue);">AEPD · Expediente PS/00378/2019</p>
          </aside>
        </div>
      </section>`);

  // 6 · EL INFORME (papel). Una figura del informe con su banda ámbar (el 86 % de las entregas) y,
  // al lado, el nicho (`hero__nicho`) íntegro. La banda usa el sello E3 real, sin inventar.
  const filasInforme = [c.informe.subZonas, c.informe.subPatrones, c.informe.subSinCapaDeTexto]
    .map(
      (t) =>
        `<li style="display: flex; align-items: baseline; justify-content: space-between; gap: var(--e-4); padding: var(--e-3) var(--e-6); border-bottom: 1px solid var(--linea); font-size: var(--t-200); color: var(--tinta-suave);"><span>${escTexto(t)}</span><span aria-hidden="true" style="flex: 0 0 4rem; height: 1px; background: var(--linea-fuerte);"></span></li>`,
    )
    .join('\n              ');
  bloques.push(`<section style="background: var(--papel); padding: var(--e-seccion) var(--e-4);">
        <div style="max-width: var(--ancho); margin: 0 auto; display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 20rem), 1fr)); gap: var(--e-8) var(--e-12); align-items: center;">
          <div style="min-width: 0;">
            <p style="margin: 0 0 var(--e-4); font-family: var(--fuente-dato); font-size: var(--t-100); letter-spacing: 0.08em; text-transform: uppercase; color: var(--gris);">${escTexto(c.informe.titulo)}</p>
            <div style="border: 1px solid var(--linea-fuerte); border-radius: var(--radio); background: var(--superficie); overflow: hidden; box-shadow: var(--sombra-hoja);">
              <p style="margin: 0; padding: var(--e-4) var(--e-6); background: var(--ambar-fondo); color: var(--ambar); font-weight: var(--peso-veredicto); font-size: var(--t-500); line-height: var(--lh-corto); letter-spacing: 0.02em; display: flex; align-items: center; gap: var(--e-3);"><span aria-hidden="true" style="width: 10px; height: 10px; border-radius: 50%; background: var(--ambar);"></span>${escTexto(c.informe.sellos.E3)}</p>
              <ul style="list-style: none; margin: 0; padding: 0; border-top: 1px solid var(--linea);">
              ${filasInforme}
                <li style="display: flex; align-items: baseline; justify-content: space-between; gap: var(--e-4); padding: var(--e-3) var(--e-6); font-family: var(--fuente-dato); font-size: var(--t-200); color: var(--tinta);"><span>${escTexto(c.informe.filaHuella)}</span><span style="color: var(--gris); letter-spacing: 0.08em;">a1f4···9c</span></li>
              </ul>
            </div>
          </div>
          ${texto('p', { class: 'hero__nicho', style: 'margin: 0; font-size: var(--t-300); line-height: var(--lh-texto); color: var(--tinta-suave); max-width: var(--medida);' }, c.landing.nicho)}
        </div>
      </section>`);

  // 7 · VERSIÓN PRO (blanco). Dos fichas: Pro (tinta, 59 € grande + su argumento + el hueco
  // #licencia, donde `main.ts` monta la verificación de clave y el enlace de compra) y Gratuito
  // (su texto). `#licencia` DEBE ser descendiente de #app para que `main.ts` lo encuentre.
  bloques.push(`<section id="pro" style="background: var(--superficie); border-top: 1px solid var(--linea); padding: var(--e-seccion) var(--e-4);">
        <div style="max-width: var(--ancho); margin: 0 auto;">
          <div style="display: flex; align-items: baseline; gap: var(--e-4); margin: 0 0 var(--e-8);">
            ${numeroSeccion('02', 'var(--gris)')}
            ${texto('h2', { style: 'margin: 0; font-size: var(--t-600); font-weight: var(--peso-fuerte); line-height: var(--lh-corto); letter-spacing: -0.01em;' }, c.secciones.pro)}
          </div>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 21rem), 1fr)); gap: var(--e-6); align-items: stretch;">
            <div style="background: var(--tinta); color: var(--tinta-inversa); border-radius: var(--radio); padding: var(--e-8); box-shadow: var(--sombra-mesa); display: flex; flex-direction: column;">
              <div style="display: flex; align-items: center; justify-content: space-between; gap: var(--e-3);">
                <span style="font-family: var(--fuente-dato); font-size: var(--t-100); font-weight: var(--peso-fuerte); color: var(--acento-tenue); letter-spacing: 0.1em; text-transform: uppercase;">Pro</span>
                <span style="font-family: var(--fuente-dato); font-size: var(--t-100); color: rgba(255,255,255,0.72); border: 1px solid rgba(255,255,255,0.3); border-radius: 999px; padding: var(--e-1) var(--e-3);">${escTexto(d.proNota)}</span>
              </div>
              <p style="margin: var(--e-6) 0 0; display: flex; align-items: baseline; gap: var(--e-3);"><span style="font-size: clamp(3rem, 8vw, 4.5rem); font-weight: var(--peso-veredicto); line-height: 1; letter-spacing: -0.03em; color: var(--tinta-inversa);">${escTexto(PRECIO_PRO)}</span><span style="font-family: var(--fuente-dato); font-size: var(--t-200); color: rgba(255,255,255,0.72);">${escTexto(d.proUnaVez)}</span></p>
              <p style="margin: var(--e-6) 0 var(--e-6); font-size: var(--t-300); line-height: var(--lh-texto); color: rgba(255,255,255,0.88);">${escTexto(c.pro.argumento)}</p>
              <div id="licencia" style="margin-top: auto; border-top: 1px solid rgba(255,255,255,0.22); padding-top: var(--e-6);"></div>
            </div>
            <div style="background: var(--papel); border: 1px solid var(--linea); border-radius: var(--radio); padding: var(--e-8); display: flex; flex-direction: column;">
              <span style="font-family: var(--fuente-dato); font-size: var(--t-100); font-weight: var(--peso-fuerte); color: var(--tinta); letter-spacing: 0.1em; text-transform: uppercase;">${escTexto(d.proEtiquetaGratis)}</span>
              <p style="margin: var(--e-6) 0 0; font-size: var(--t-300); line-height: var(--lh-texto); color: var(--tinta-suave);">${escTexto(c.pro.gratis)}</p>
              <a href="#herramienta" style="display: inline-flex; align-items: center; min-height: 2.75rem; margin-top: auto; padding-top: var(--e-8); font-weight: var(--peso-fuerte); color: var(--acento); text-decoration: none;">${escTexto(c.secciones.trabajo)} →</a>
            </div>
          </div>
        </div>
      </section>`);

  // 8 · FAQ (papel). El acordeón conserva `<details class="faq__item">` con `<summary>` y `<p>`
  // DESNUDOS, byte a byte —lo exige `faq-paridad`, que lee del disco— y se reestila por CSS.
  const faq = c.faq.map((item) =>
    [
      '<details class="faq__item">',
      sangrar([texto('summary', {}, item.pregunta), texto('p', {}, item.respuesta)], 1),
      '</details>',
    ].join('\n'),
  );
  bloques.push(`<section style="background: var(--papel); border-top: 1px solid var(--linea); padding: var(--e-seccion) var(--e-4);" aria-label="${esc(c.secciones.faq)}">
        <div style="max-width: var(--ancho); margin: 0 auto;">
          <div style="display: flex; align-items: baseline; gap: var(--e-4); margin: 0 0 var(--e-8);">
            ${numeroSeccion('03', 'var(--gris)')}
            ${texto('h2', { style: 'margin: 0; font-size: var(--t-600); font-weight: var(--peso-fuerte); line-height: var(--lh-corto); letter-spacing: -0.01em;' }, c.secciones.faq)}
          </div>
          <div class="faq">
${sangrar(faq, 6)}
          </div>
        </div>
      </section>`);

  // 9 · GUÍAS (azul tenue). Rejilla de fichas. `<nav class="guias">` y `.guias a` conservan sus
  // reglas de diana táctil (44 px) en la hoja; la ficha se maqueta en línea sobre el <a>.
  const fichasGuia = guiasDe(locale)
    .map(
      (g) =>
        `<li><a href="${esc(g.href)}" style="display: flex; flex-direction: column; height: 100%; background: var(--superficie); border: 1px solid var(--linea-fuerte); border-radius: var(--radio); padding: var(--e-6); text-decoration: none; color: var(--tinta);">
              <span aria-hidden="true" style="margin-bottom: var(--e-6);">${iconoDoc('2rem')}</span>
              <span style="font-size: var(--t-300); font-weight: var(--peso-fuerte); line-height: var(--lh-corto);">${escTexto(g.guia.tituloEnlace)}</span>
            </a></li>`,
    )
    .join('\n            ');
  bloques.push(`<nav class="guias" aria-label="${esc(c.secciones.guias)}" style="background: var(--acento-tenue); padding: var(--e-seccion) var(--e-4);">
        <div style="max-width: var(--ancho-herramienta); margin: 0 auto;">
          <div style="display: flex; align-items: baseline; gap: var(--e-4); margin: 0 0 var(--e-8);">
            ${numeroSeccion('04', 'var(--acento-fuerte)')}
            ${texto('h2', { style: 'margin: 0; font-size: var(--t-600); font-weight: var(--peso-fuerte); line-height: var(--lh-corto); letter-spacing: -0.01em;' }, c.secciones.guias)}
          </div>
          <ul style="list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 20rem), 1fr)); gap: var(--e-4);">
            ${fichasGuia}
          </ul>
        </div>
      </nav>`);

  // 10 · CIERRE (tinta). El titular es `c.guiaCta` (existente) y el botón lleva a la herramienta.
  bloques.push(`<section style="background: var(--tinta); color: var(--tinta-inversa); padding: var(--e-seccion) var(--e-4);">
        <div style="max-width: var(--ancho); margin: 0 auto; text-align: center;">
          <p style="margin: 0 auto; max-width: 26rem; font-size: var(--t-600); font-weight: var(--peso-veredicto); line-height: var(--lh-titular); letter-spacing: -0.015em;">${escTexto(c.guiaCta)}</p>
          <a href="#herramienta" style="display: inline-flex; align-items: center; justify-content: center; margin-top: var(--e-8); min-height: 3rem; padding: var(--e-3) var(--e-8); font-size: var(--t-400); font-weight: var(--peso-fuerte); color: var(--tinta); background: var(--tinta-inversa); border-radius: var(--radio); text-decoration: none;">${escTexto(d.cierreBoton)}</a>
        </div>
      </section>`);

  // 11 · PIE (papel). El pie legal conserva `<footer class="legales">` con los `<details id>` que
  // publican el Aviso Legal, los Términos y la Privacidad ÍNTEGROS (los exige `contenido-indexable`
  // y `legal.test.ts`), el `pie` y los enlaces de sector, sobre una mancheta de marca.
  const legales = c.legal.secciones.map((s) =>
    [
      `<details id="${esc(s.id)}">`,
      sangrar([texto('summary', {}, s.titulo), texto('pre', {}, s.cuerpo)], 1),
      '</details>',
    ].join('\n'),
  );
  const enlacesSector: string[] = [];
  const hrefActas = enlace('actas');
  if (hrefActas.length > 0) enlacesSector.push(texto('a', { href: hrefActas }, c.legal.enlaceActas));
  const hrefNominas = enlace('nominas');
  if (hrefNominas.length > 0) enlacesSector.push(texto('a', { href: hrefNominas }, c.legal.enlaceNominas));
  const hrefComprobador = enlace('comprobador');
  if (hrefComprobador.length > 0) {
    enlacesSector.push(texto('a', { href: hrefComprobador }, c.legal.enlaceComprobador));
  }
  const hrefImagen = enlace('redactor-imagen');
  if (hrefImagen.length > 0) {
    enlacesSector.push(texto('a', { href: hrefImagen }, c.legal.enlaceImagen));
  }
  bloques.push(
    [
      `<footer class="legales" aria-label="${esc(c.secciones.legal)}">`,
      sangrar(
        [
          `<p class="cabecera__marca" style="margin: 0 0 var(--e-4);">${SIMBOLO_MANCHETA}${escTexto(c.marca)}</p>`,
          ...legales,
          texto('p', { class: 'pie' }, c.legal.pie),
          `<p class="enlaces-sector">\n${sangrar(enlacesSector, 1)}\n</p>`,
        ],
        1,
      ),
      '</footer>',
    ].join('\n'),
  );

  // El PDF de ejemplo vive en la raíz del sitio; la ruta se calcula relativa AL DOCUMENTO para
  // que funcione igual en / que en /en/ y bajo la base de emergencia.
  const ejemplo = `${navHref(ruta, '')}ejemplo-acta-comunidad.pdf`.replace(/^\.\//, '');

  return [
    sangrar([mancheta(pagina, locale)], 2),
    `    <div id="app" data-lang="${esc(c.htmlLang)}" data-ejemplo="${esc(ejemplo)}">`,
    sangrar(bloques, 3),
    '    </div>',
    '    <script type="module" src="/src/main.ts"></script>',
  ].join('\n');
}

function jsonLdHome(locale: Locale, canonical: string): string {
  const c = CONTENIDOS[locale];
  return [
    jsonLd({
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: c.marca,
      applicationCategory: 'BusinessApplication',
      operatingSystem: c.home.sistemaOperativo,
      description: c.home.jsonLdDescripcion,
      url: canonical,
      inLanguage: c.htmlLang,
      offers: [
        { '@type': 'Offer', price: '0', priceCurrency: 'EUR', name: c.home.ofertaGratis },
        { '@type': 'Offer', price: '59', priceCurrency: 'EUR', name: c.home.ofertaPro },
      ],
    }),
    jsonLd({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: c.faq.map((item) => ({
        '@type': 'Question',
        name: item.pregunta,
        acceptedAnswer: { '@type': 'Answer', text: item.respuesta },
      })),
    }),
  ].join('\n');
}

function paginaHome(pagina: PaginaRegistro, locale: Locale): string {
  const c = CONTENIDOS[locale];
  const canonical = urlCanonica(pagina, locale) ?? `${SITIO}/`;
  const esPortadaDelSitio = locale === LOCALES[0];
  const extra: string[] = [];
  if (esPortadaDelSitio) {
    for (const token of VERIFICACIONES_GOOGLE) {
      extra.push(`<meta name="google-site-verification" content="${esc(token)}" />`);
    }
  }
  extra.push(
    '<meta name="twitter:card" content="summary_large_image" />',
    `<meta name="twitter:title" content="${esc(c.home.ogTitulo)}" />`,
    `<meta name="twitter:description" content="${esc(c.home.twitterDescripcion)}" />`,
    `<meta name="twitter:image" content="${esc(ogImage(locale))}" />`,
    '',
    jsonLdHome(locale, canonical),
  );

  return documento(
    c.htmlLang,
    cabecera({
      lang: c.htmlLang,
      titulo: c.home.metaTitulo,
      descripcion: c.home.metaDescripcion,
      canonical,
      ogTitulo: c.home.ogTitulo,
      ogDescripcion: c.home.ogDescripcion,
      ogLocale: c.ogLocale,
      ogLocalesAlternos: ogLocalesAlternos(pagina, locale),
      ogImage: ogImage(locale),
      alternates: alternatesDe(pagina),
      prefijo: navHref(rutaDe(pagina, locale) ?? '', ''),
      extra,
    }),
    cuerpoHome(pagina, locale),
  );
}

// --- página del comprobador -------------------------------------------------

/** Estilo propio del comprobador. Va en línea (la CSP lo permite con 'unsafe-inline' en
 *  style-src) para que la página se vea bien sin depender de ninguna hoja externa.
 *
 *  EL COMPROBADOR ERA LA ÚNICA PÁGINA NEGRA DEL SITIO. Con el móvil en claro, la herramienta
 *  gratuita —la que hace de embudo— era una pantalla azul marino en un sitio blanco; con el móvil
 *  en oscuro, el recorrido guía → portada → comprobador daba marino, FOGONAZO BLANCO y marino
 *  otra vez, porque la portada no declaraba tema y las guías seguían al sistema. Lo que este
 *  producto ENTREGA es un papel blanco: la herramienta que lo fabrica pareciéndose a él es lo
 *  verdadero, y de paso el salto entre páginas desaparece. Registro «fondo negro» es estética de
 *  pentester; el comprador es una gestoría con el Excel abierto a las diez de la mañana. */
const CSS_COMPROBADOR = `  main {
    max-width: var(--ancho);
    margin: 0 auto;
    padding: var(--e-12) var(--e-4) var(--e-16);
  }
  h1 {
    font-size: var(--t-600);
    line-height: var(--lh-titular);
    font-weight: var(--peso-fuerte);
    margin: 0 0 var(--e-2);
  }
  p {
    margin: 0 0 var(--e-4);
    max-width: var(--medida);
  }
  .cp-intro {
    font-size: var(--t-400);
    color: var(--tinta-suave);
  }
  /* La zona de soltar reutiliza la gramática del producto: HUECO/DISCONTINUO = pendiente de
     decidir. Su borde llegó a estar a 1,72:1 sobre el fondo; ahora es el borde de control de la
     casa, 3,37:1 sobre papel y 3,67 sobre blanco. */
  #cp-dropzone {
    border: 2px dashed var(--linea-fuerte);
    border-radius: var(--radio);
    padding: var(--e-8) var(--e-4);
    text-align: center;
    margin: var(--e-8) 0;
    background: var(--superficie);
    max-width: var(--medida);
  }
  #cp-dropzone label {
    display: inline-flex;
    align-items: center;
    min-height: 2.75rem;
    cursor: pointer;
    font-weight: var(--peso-fuerte);
    color: var(--acento);
  }
  #cp-password-form {
    margin-top: var(--e-4);
    display: flex;
    flex-direction: column;
    gap: var(--e-2);
    align-items: center;
  }
  /* El marcador de posicion se cortaba a media frase y sin cerrar el parentesis —«Contraseña del
     PDF (si tiene»— porque el campo era mas estrecho que su propio texto. Un campo que no cabe lo
     que dice lee como pagina rota, y esta es la herramienta gratuita que hace de embudo. */
  #cp-password {
    width: 100%;
    max-width: 21rem;
    min-height: 2.75rem;
    padding: var(--e-2) var(--e-3);
    border-radius: var(--radio);
    border: 1px solid var(--linea-fuerte);
    background: var(--superficie);
    color: var(--tinta);
  }
  /* La caja la pone ya #cp-dropzone: aqui el control solo aporta su boton, que es el mismo del
     sistema que usa la herramienta de pago. Dos recuadros anidados serian dos zonas de carga. */
  #cp-file {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--e-3);
    justify-content: center;
    width: 100%;
    margin-top: var(--e-4);
  }
  .cp-aviso {
    font-size: var(--t-200);
    color: var(--tinta-suave);
    border-left: 3px solid var(--linea-fuerte);
    padding-left: var(--e-4);
    margin: var(--e-8) 0;
    max-width: var(--medida);
  }
  #cp-error {
    color: var(--rojo);
  }
  .cp-cta {
    display: inline-flex;
    align-items: center;
    min-height: 2.75rem;
    margin-top: var(--e-8);
    padding: var(--e-3) var(--e-6);
    background: var(--acento);
    color: var(--tinta-inversa);
    font-weight: var(--peso-fuerte);
    text-decoration: none;
    border-radius: var(--radio);
  }
  .cp-cta:hover {
    background: var(--acento-fuerte);
  }`;

function paginaComprobador(pagina: PaginaRegistro, locale: Locale): string {
  const c = CONTENIDOS[locale];
  const canonical = urlCanonica(pagina, locale) ?? `${SITIO}/`;
  const ruta = rutaDe(pagina, locale) ?? '';
  const home = paginaPorId('home');
  const rutaHome = home === undefined ? '' : (rutaDe(home, locale) ?? '');
  const ctaHref = `${navHref(ruta, rutaHome)}?utm_source=comprobador`;

  const extra = [
    jsonLd({
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: c.comprobador.jsonLdNombre,
      applicationCategory: 'SecurityApplication',
      url: canonical,
      inLanguage: c.htmlLang,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
    }),
    '',
    `<style>\n${CSS_COMPROBADOR}\n</style>`,
  ];

  const cuerpo = [
    texto('h1', {}, c.comprobador.titular),
    texto('p', { class: 'cp-intro' }, c.comprobador.intro),
    texto('p', {}, c.comprobador.introLocal),
    '',
    '<div id="cp-dropzone">',
    sangrar(
      [
        texto('label', { for: 'cp-file' }, c.comprobador.dropzone),
        '<form id="cp-password-form">',
        sangrar(
          [
            '<input type="file" id="cp-file" accept="application/pdf" />',
            `<input type="password" id="cp-password" placeholder="${esc(c.comprobador.passwordPlaceholder)}" />`,
          ],
          1,
        ),
        '</form>',
      ],
      1,
    ),
    '</div>',
    '',
    `<div id="cp-resultado" data-cta-href="${esc(ctaHref)}"></div>`,
    '<div id="cp-error"></div>',
    '',
    texto('p', { class: 'cp-aviso' }, c.comprobador.avisoAlcance),
    '',
    texto('a', { class: 'cp-cta', href: ctaHref }, c.comprobador.cta),
  ];

  const main = [
    sangrar([mancheta(pagina, locale)], 2),
    '    <main>',
    sangrar(cuerpo, 3),
    '    </main>',
    '    <script type="module" src="/src/comprobador/main.ts"></script>',
  ].join('\n');

  return documento(
    c.htmlLang,
    cabecera({
      lang: c.htmlLang,
      titulo: c.comprobador.metaTitulo,
      descripcion: c.comprobador.metaDescripcion,
      canonical,
      ogTitulo: c.comprobador.ogTitulo,
      ogDescripcion: c.comprobador.ogDescripcion,
      ogLocale: c.ogLocale,
      ogLocalesAlternos: ogLocalesAlternos(pagina, locale),
      ogImage: ogImage(locale),
      alternates: alternatesDe(pagina),
      prefijo: navHref(ruta, ''),
      extra,
    }),
    main,
  );
}

// --- página del redactor de imágenes ---------------------------------------

/** Estilo propio del redactor de imágenes. Va en línea (la CSP lo permite en style-src) y comparte
 *  la gramática visual del comprobador —misma zona de soltar, mismos avisos— para que la segunda
 *  herramienta gratuita se lea como parte del MISMO producto y no como otra web. El <canvas> lleva
 *  `touch-action: none` porque el marcado es un arrastre: sin eso, en móvil el dedo haría scroll en
 *  vez de dibujar el recuadro. */
const CSS_IMAGEN = `  main {
    max-width: var(--ancho);
    margin: 0 auto;
    padding: var(--e-12) var(--e-4) var(--e-16);
  }
  h1 {
    font-size: var(--t-600);
    line-height: var(--lh-titular);
    font-weight: var(--peso-fuerte);
    margin: 0 0 var(--e-2);
  }
  p {
    margin: 0 0 var(--e-4);
    max-width: var(--medida);
  }
  .cp-intro {
    font-size: var(--t-400);
    color: var(--tinta-suave);
  }
  #img-dropzone {
    border: 2px dashed var(--linea-fuerte);
    border-radius: var(--radio);
    padding: var(--e-8) var(--e-4);
    text-align: center;
    margin: var(--e-8) 0;
    background: var(--superficie);
    max-width: var(--medida);
  }
  #img-dropzone label {
    display: inline-flex;
    align-items: center;
    min-height: 2.75rem;
    cursor: pointer;
    font-weight: var(--peso-fuerte);
    color: var(--acento);
  }
  #img-file {
    display: block;
    margin: var(--e-4) auto 0;
    max-width: 100%;
  }
  .img-formatos {
    font-size: var(--t-200);
    color: var(--tinta-suave);
    margin: var(--e-2) 0 0;
  }
  #img-stage {
    margin: var(--e-8) 0;
  }
  #img-instrucciones {
    font-size: var(--t-200);
    color: var(--tinta-suave);
    margin-bottom: var(--e-3);
  }
  #img-canvas {
    display: block;
    max-width: 100%;
    height: auto;
    touch-action: none;
    cursor: crosshair;
    border: 1px solid var(--linea-fuerte);
    border-radius: var(--radio);
    background: var(--superficie);
  }
  #img-controles {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--e-3);
    margin-top: var(--e-4);
  }
  #img-count {
    font-size: var(--t-200);
    color: var(--tinta-suave);
  }
  .img-boton {
    display: inline-flex;
    align-items: center;
    min-height: 2.75rem;
    padding: var(--e-3) var(--e-6);
    font-weight: var(--peso-fuerte);
    border-radius: var(--radio);
    border: 1px solid var(--linea-fuerte);
    background: var(--superficie);
    color: var(--tinta);
    cursor: pointer;
  }
  .img-boton--principal {
    background: var(--acento);
    color: var(--tinta-inversa);
    border-color: var(--acento);
  }
  .img-boton--principal:hover {
    background: var(--acento-fuerte);
  }
  .img-boton:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  h2 {
    font-size: var(--t-500);
    line-height: var(--lh-corto);
    font-weight: var(--peso-fuerte);
    margin: var(--e-12) 0 var(--e-2);
    max-width: var(--medida);
  }
  .faq__item {
    max-width: var(--medida);
    border-top: 1px solid var(--linea-fuerte);
    padding: var(--e-3) 0;
  }
  .faq__item summary {
    cursor: pointer;
    font-weight: var(--peso-fuerte);
  }
  .faq__item p {
    margin: var(--e-2) 0 0;
  }
  .cp-aviso {
    font-size: var(--t-200);
    color: var(--tinta-suave);
    border-left: 3px solid var(--linea-fuerte);
    padding-left: var(--e-4);
    margin: var(--e-8) 0;
    max-width: var(--medida);
  }
  #img-error {
    color: var(--rojo);
  }
  .cp-cta {
    display: inline-flex;
    align-items: center;
    min-height: 2.75rem;
    margin-top: var(--e-8);
    padding: var(--e-3) var(--e-6);
    background: var(--acento);
    color: var(--tinta-inversa);
    font-weight: var(--peso-fuerte);
    text-decoration: none;
    border-radius: var(--radio);
  }
  .cp-cta:hover {
    background: var(--acento-fuerte);
  }`;

function paginaRedactorImagen(pagina: PaginaRegistro, locale: Locale): string {
  const c = CONTENIDOS[locale];
  const canonical = urlCanonica(pagina, locale) ?? `${SITIO}/`;
  const ruta = rutaDe(pagina, locale) ?? '';
  const home = paginaPorId('home');
  const rutaHome = home === undefined ? '' : (rutaDe(home, locale) ?? '');
  const ctaHref = `${navHref(ruta, rutaHome)}?utm_source=imagen`;

  const extra = [
    jsonLd({
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: c.imagen.jsonLdNombre,
      applicationCategory: 'SecurityApplication',
      url: canonical,
      inLanguage: c.htmlLang,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
    }),
    jsonLd({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: c.imagen.faqs.map((item) => ({
        '@type': 'Question',
        name: item.pregunta,
        acceptedAnswer: { '@type': 'Answer', text: item.respuesta },
      })),
    }),
    '',
    `<style>\n${CSS_IMAGEN}\n</style>`,
  ];

  // Las mismas preguntas del FAQPage, ahora VISIBLES: un motor generativo cita la respuesta solo si
  // está también en la página, y salen del MISMO `c.imagen.faqs` que el schema, así que no divergen.
  const faqVisible: string[] = [texto('h2', {}, c.secciones.faq)];
  for (const item of c.imagen.faqs) {
    faqVisible.push(
      '<details class="faq__item">',
      sangrar([texto('summary', {}, item.pregunta), texto('p', {}, item.respuesta)], 1),
      '</details>',
    );
  }

  const cuerpo = [
    texto('h1', {}, c.imagen.titular),
    texto('p', { class: 'cp-intro' }, c.imagen.intro),
    texto('p', {}, c.imagen.introLocal),
    '',
    '<div id="img-dropzone">',
    sangrar(
      [
        texto('label', { for: 'img-file' }, c.imagen.dropzone),
        '<input type="file" id="img-file" accept="image/*" />',
        texto('p', { class: 'img-formatos' }, c.imagen.formatos),
      ],
      1,
    ),
    '</div>',
    '',
    '<div id="img-stage" hidden>',
    sangrar(
      [
        texto('p', { id: 'img-instrucciones' }, c.imagen.instrucciones),
        '<canvas id="img-canvas"></canvas>',
        '<div id="img-controles">',
        sangrar(
          [
            texto(
              'button',
              {
                type: 'button',
                id: 'img-download',
                class: 'img-boton img-boton--principal',
                disabled: '',
              },
              c.imagen.botonDescargar,
            ),
            texto(
              'button',
              { type: 'button', id: 'img-clear', class: 'img-boton' },
              c.imagen.botonLimpiar,
            ),
            '<span id="img-count"></span>',
          ],
          1,
        ),
        '</div>',
      ],
      1,
    ),
    '</div>',
    '',
    '<div id="img-error"></div>',
    '',
    texto('p', { class: 'cp-aviso' }, c.imagen.aviso),
    '',
    ...faqVisible,
    '',
    texto('a', { class: 'cp-cta', href: ctaHref }, c.guiaCta),
  ];

  const main = [
    sangrar([mancheta(pagina, locale)], 2),
    '    <main>',
    sangrar(cuerpo, 3),
    '    </main>',
    '    <script type="module" src="/src/imagen/main.ts"></script>',
  ].join('\n');

  return documento(
    c.htmlLang,
    cabecera({
      lang: c.htmlLang,
      titulo: c.imagen.metaTitulo,
      descripcion: c.imagen.metaDescripcion,
      canonical,
      ogTitulo: c.imagen.ogTitulo,
      ogDescripcion: c.imagen.ogDescripcion,
      ogLocale: c.ogLocale,
      ogLocalesAlternos: ogLocalesAlternos(pagina, locale),
      ogImage: ogImage(locale),
      alternates: alternatesDe(pagina),
      prefijo: navHref(ruta, ''),
      extra,
    }),
    main,
  );
}

// --- guías ------------------------------------------------------------------

/** Estilo de artículo, el mismo para las guías escritas a mano y para las generadas. En línea,
 *  sin hoja externa (lo exige la CSP).
 *
 *  UNA SOLA CARA, CLARA. El bloque `prefers-color-scheme: dark` desaparece, y con él el defecto
 *  que vivía dentro: medido en modo oscuro forzado, el CTA de las SEIS guías españolas era
 *  relleno #0f172a sobre fondo #0f172a —1,00:1, sin borde: el botón dejaba de existir y solo
 *  flotaba su texto cian— y el de las SEIS inglesas, 1,22:1 (1.4.11 pide 3:1). Es exactamente el
 *  defecto que la casa ya cazó y escribió como regla, arreglado en /actas/ y /nominas/… mientras
 *  el guardián solo abría esos dos ficheros y el fallo vivía en doce que nunca miraba. */
const CSS_GUIA = `  main, article, footer {
    max-width: var(--ancho); margin: 0 auto; padding-left: var(--e-4); padding-right: var(--e-4);
  }
  main, article { padding-top: var(--e-12); padding-bottom: var(--e-16); }
  /* El texto se capa a la MEDIDA, pero el bloque se alinea con la marca de la mancheta: una
     columna centrada dentro de otra columna deja el articulo flotando a la deriva del titulo. */
  h1, h2, p, li, .nota, .lede, .cp-cta, .cta { max-width: var(--medida); }
  ul, ol { max-width: var(--medida); }
  p, li { font-size: var(--t-400); }
  h1 { font-size: var(--t-600); line-height: var(--lh-titular); font-weight: var(--peso-fuerte); margin: 0 0 var(--e-4); }
  h2 { font-size: var(--t-500); line-height: var(--lh-corto); font-weight: var(--peso-fuerte); margin: var(--e-12) 0 var(--e-2); }
  p { margin: 0 0 var(--e-4); }
  ul, ol { padding-left: var(--e-6); margin: 0 0 var(--e-4); }
  li { margin: 0 0 var(--e-2); }
  .lede { color: var(--tinta-suave); }
  /* Una nota es una SALVEDAD, no una alarma: el rojo de esta casa significa E1, tachado no
     superado, y no se gasta en un aparte de una guia. */
  .nota {
    background: var(--ambar-fondo); border-left: 3px solid var(--ambar);
    padding: var(--e-3) var(--e-4); border-radius: var(--radio-marca); color: var(--tinta);
    font-size: var(--t-300); margin: 0 0 var(--e-4);
  }
  .cp-cta, .cta {
    display: block; margin: var(--e-12) 0 0; padding: var(--e-4);
    background: var(--acento); color: var(--tinta-inversa); border-radius: var(--radio);
    text-decoration: none; font-weight: var(--peso-fuerte); font-size: var(--t-300);
  }
  .cp-cta:hover, .cta:hover { background: var(--acento-fuerte); }
  /* FAQ de la pieza de autoridad: <details> desnudo reestilado con los tokens del sistema. */
  details.faq__item { max-width: var(--medida); border-top: 1px solid var(--linea); padding: var(--e-3) 0; }
  details.faq__item summary { font-weight: var(--peso-fuerte); cursor: pointer; font-size: var(--t-400); }
  details.faq__item p { margin: var(--e-2) 0 0; }
  footer {
    margin-top: var(--e-16); padding-top: var(--e-6); border-top: 1px solid var(--linea);
    font-size: var(--t-200); color: var(--tinta-suave);
  }
  @media (max-width: 640px) {
    footer a { display: inline-flex; align-items: center; min-height: 2.75rem; }
  }`;

/**
 * Estilo del bloque «Related guides» del enlazado interno. Va APARTE de `CSS_GUIA` y se añade solo
 * a las guías que declaran `relacionadas`, para que las páginas que NO llevan bloque —las cinco
 * landings del experimento y la pieza de autoridad, cuya copia es la variable de un experimento en
 * curso— sigan byte a byte iguales: su `<style>` no gana ni una regla que no vaya a usar. Lista sin
 * viñetas, cada enlace con su diana táctil de 44 px para el móvil (WCAG 2.5.8), en el azul de enlace
 * de la casa.
 */
const CSS_RELACIONADAS = `  .relacionadas { max-width: var(--medida); margin: var(--e-12) 0 0; }
  .relacionadas ul { list-style: none; padding: 0; margin: var(--e-4) 0 0; display: grid; gap: var(--e-2); }
  .relacionadas a { display: inline-flex; align-items: center; min-height: 2.75rem; font-weight: var(--peso-fuerte); }`;

function paginaGuia(pagina: PaginaRegistro, locale: Locale, guia: ContenidoGuia): string {
  const c = CONTENIDOS[locale];
  const canonical = urlCanonica(pagina, locale) ?? `${SITIO}/`;
  const ruta = rutaDe(pagina, locale) ?? '';
  const home = paginaPorId('home');
  const rutaHome = home === undefined ? '' : (rutaDe(home, locale) ?? '');

  // Datos estructurados: SIEMPRE el Article de la guía y, si la guía declara `faqs`, además un
  // FAQPage. El FAQPage y los <details> visibles de abajo salen del MISMO `guia.faqs`, así que no
  // pueden divergir por construcción (el fallo que `faq-paridad` cazó en la home). Un buscador con
  // motor generativo cita la respuesta de una pregunta explícita: por eso la pieza de autoridad las
  // sirve estructuradas (regla 55, AEO).
  const faqSchema =
    guia.faqs === undefined
      ? []
      : [
          jsonLd({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: guia.faqs.map((item) => ({
              '@type': 'Question',
              name: item.pregunta,
              acceptedAnswer: { '@type': 'Answer', text: item.respuesta },
            })),
          }),
          '',
        ];

  const extra = [
    jsonLd({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: guia.titulo,
      description: guia.descripcion,
      inLanguage: c.htmlLang,
      mainEntityOfPage: canonical,
      author: { '@type': 'Organization', name: c.marca },
      publisher: { '@type': 'Organization', name: c.marca },
    }),
    '',
    ...faqSchema,
    // El bloque de relacionadas trae su propio CSS SOLO si esta guía lo lleva: así las páginas del
    // experimento (sin relacionadas) no ven cambiar ni un byte de su `<style>`.
    `<style>\n${CSS_GUIA}${
      guia.relacionadas !== undefined && guia.relacionadas.length > 0 ? `\n${CSS_RELACIONADAS}` : ''
    }\n</style>`,
  ];

  // Al pie: un enlace al comprobador gratuito (solo si la guía lo pide) y SIEMPRE el CTA a la
  // herramienta. Reutilizan la clase `.cp-cta`, que `legal/cta-visible` ya vigila en las dos
  // direcciones de contraste: ningún estilo nuevo, ninguna guarda de color que reapuntar. El
  // enlace al comprobador va primero porque es la puerta de menor fricción (diagnostica sin tachar).
  const ctas: string[] = [];
  if (guia.enlaceComprobador !== undefined) {
    const comprobador = paginaPorId('comprobador');
    const rutaComprobador = comprobador === undefined ? null : rutaDe(comprobador, locale);
    if (rutaComprobador !== null) {
      ctas.push(
        texto(
          'a',
          { class: 'cp-cta', href: `${navHref(ruta, rutaComprobador)}?utm_source=guia` },
          guia.enlaceComprobador,
        ),
      );
    }
  }
  ctas.push(
    texto('a', { class: 'cp-cta', href: `${navHref(ruta, rutaHome)}?utm_source=guia` }, c.guiaCta),
  );

  // Las mismas preguntas del FAQPage, ahora VISIBLES: un motor generativo exige que la respuesta
  // que cita esté también en la página. `<details>` desnudo con <summary>/<p>, derivado de
  // `guia.faqs` igual que el schema, para que los dos no puedan decir cosas distintas.
  const faqVisible: string[] = [];
  if (guia.faqs !== undefined) {
    faqVisible.push(texto('h2', {}, c.secciones.faq));
    for (const item of guia.faqs) {
      faqVisible.push(
        '<details class="faq__item">',
        sangrar([texto('summary', {}, item.pregunta), texto('p', {}, item.respuesta)], 1),
        '</details>',
      );
    }
  }

  // ENLAZADO INTERNO: bloque «Related guides» al pie. Cada guía puede declarar 2-4 ids de guías
  // hermanas del MISMO idioma; el generador las resuelve contra el registro y enlaza con `navHref`
  // (RELATIVO al documento: un href raíz-absoluto rompería la base de emergencia `/tachadopdf/`).
  // Un id que no exista en este idioma se ignora en silencio. El rótulo es el `tituloEnlace` de la
  // guía destino, el mismo que usa el índice de la home, así que no aparece copia nueva.
  const relacionadasBloque: string[] = [];
  if (guia.relacionadas !== undefined && guia.relacionadas.length > 0) {
    const enlaces: string[] = [];
    for (const relId of guia.relacionadas) {
      const relPagina = paginaPorId(relId);
      if (relPagina === undefined) continue;
      const relRuta = rutaDe(relPagina, locale);
      if (relRuta === null) continue;
      const relGuia = c.guias.find((g) => g.id === relId);
      if (relGuia === undefined) continue;
      enlaces.push(`<li>${texto('a', { href: navHref(ruta, relRuta) }, relGuia.tituloEnlace)}</li>`);
    }
    if (enlaces.length > 0) {
      relacionadasBloque.push(
        `<nav class="relacionadas" aria-label="${esc(c.secciones.guias)}">`,
        sangrar(
          [texto('h2', {}, c.secciones.guias), `<ul>\n${sangrar(enlaces, 1)}\n</ul>`],
          1,
        ),
        '</nav>',
      );
    }
  }

  const cuerpo = [
    texto('h1', {}, guia.titulo),
    ...guia.cuerpo.map(bloque),
    ...faqVisible,
    ...relacionadasBloque,
    '',
    ...ctas,
  ];

  const main = [
    sangrar([mancheta(pagina, locale)], 2),
    '    <main>',
    sangrar(cuerpo, 3),
    '    </main>',
  ].join('\n');

  return documento(
    c.htmlLang,
    cabecera({
      lang: c.htmlLang,
      // El `<title>` de la SERP: la guía puede fijar un `metaTitulo` corto con la keyword al frente
      // (distinto del H1 descriptivo). Si no lo declara —las guías generadas en español, cuyo título
      // está fijado por su guarda de dedup— se cae al patrón `${titulo} · TachadoPDF`.
      titulo: guia.metaTitulo ?? `${guia.titulo} · ${c.marca}`,
      descripcion: guia.descripcion,
      canonical,
      ogTitulo: guia.titulo,
      ogDescripcion: guia.descripcion,
      ogLocale: c.ogLocale,
      ogLocalesAlternos: ogLocalesAlternos(pagina, locale),
      ogImage: ogImage(locale),
      alternates: alternatesDe(pagina),
      prefijo: navHref(ruta, ''),
      extra,
    }),
    main,
  );
}

// --- sitemap ----------------------------------------------------------------

/** Un solo sitemap con TODAS las URL de TODOS los idiomas, y cada <url> con su juego completo de
 *  alternos. Lo emite el mismo registro que emite el HTML: así el sitemap no puede discrepar de
 *  la realidad, que es como acabó listando 7 URL mientras el sitio ya tenía 10. */
export function generarSitemap(): string {
  const lineas: string[] = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
  ];
  for (const pagina of PAGINAS) {
    const alternates = alternatesDe(pagina);
    for (const locale of localesDe(pagina)) {
      const loc = urlCanonica(pagina, locale);
      if (loc === null) continue;
      if (alternates.length === 0) {
        lineas.push(`  <url><loc>${esc(loc)}</loc></url>`);
        continue;
      }
      lineas.push(`  <url>`, `    <loc>${esc(loc)}</loc>`);
      for (const alt of alternates) {
        lineas.push(
          `    <xhtml:link rel="alternate" hreflang="${esc(alt.hreflang)}" href="${esc(alt.href)}" />`,
        );
      }
      lineas.push('  </url>');
    }
  }
  lineas.push('</urlset>', '');
  return lineas.join('\n');
}

// --- salida completa --------------------------------------------------------

export function generarPagina(pagina: PaginaRegistro, locale: Locale): string {
  switch (pagina.tipo) {
    case 'app':
      return paginaHome(pagina, locale);
    case 'comprobador':
      return paginaComprobador(pagina, locale);
    case 'imagen':
      return paginaRedactorImagen(pagina, locale);
    case 'guia': {
      const guia = CONTENIDOS[locale].guias.find((g) => g.id === pagina.id);
      if (guia === undefined) {
        throw new Error(`Falta el contenido de la guía "${pagina.id}" en el idioma "${locale}"`);
      }
      return paginaGuia(pagina, locale, guia);
    }
    case 'landing':
      throw new Error(`La landing "${pagina.id}" es estática: el generador no la escribe`);
  }
}

/** Todos los ficheros que este generador posee, con su ruta relativa a la raíz del repo. */
export function generarSitio(): FicheroGenerado[] {
  const ficheros: FicheroGenerado[] = [];
  for (const pagina of PAGINAS) {
    if (pagina.origen !== 'generado') continue;
    for (const locale of localesDe(pagina)) {
      const ruta = ficheroDe(pagina, locale);
      if (ruta === null) continue;
      ficheros.push({ ruta, contenido: generarPagina(pagina, locale) });
    }
  }
  ficheros.push({ ruta: 'public/sitemap.xml', contenido: generarSitemap() });
  return ficheros;
}

