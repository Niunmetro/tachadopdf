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
import { enlacePreloadFuente, sistemaCss } from '../estilo/sistema';
import { esc, jsonLd, sangrar, texto } from './html';
import {
  LOCALES,
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

const OG_IMAGE = `${SITIO}/og-image.png`;

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
    `<meta property="og:image" content="${esc(OG_IMAGE)}" />`,
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

function cuerpoHome(pagina: PaginaRegistro, locale: Locale): string {
  const c = CONTENIDOS[locale];
  const ruta = rutaDe(pagina, locale) ?? '';
  const enlace = (id: string): string => {
    const destino = paginaPorId(id);
    const rutaDestino = destino === undefined ? null : rutaDe(destino, locale);
    return rutaDestino === null ? '' : navHref(ruta, rutaDestino);
  };

  const bloques: string[] = [];

  const selector = selectorIdioma(pagina, locale);
  if (selector.length > 0) bloques.push(selector);

  bloques.push(
    [
      '<header class="hero">',
      sangrar(
        [
          texto('p', { class: 'hero__marca' }, c.marca),
          texto('h1', { class: 'hero__titular' }, c.landing.titular),
          texto('p', { class: 'hero__dolor' }, c.landing.dolor),
          texto('p', { class: 'hero__sub' }, c.landing.subtitulo),
          `<ul class="hero__bullets">\n${sangrar(c.landing.bullets.map((b) => texto('li', {}, b)), 1)}\n</ul>`,
          texto('p', { class: 'hero__deteccion' }, c.landing.notaDeteccion),
          texto('p', { class: 'hero__local' }, c.landing.procesadoLocal),
          texto('p', { class: 'hero__nicho' }, c.landing.nicho),
        ],
        1,
      ),
      '</header>',
    ].join('\n'),
  );

  // Hueco de la herramienta: el título y el aviso de alcance son texto indexable; los controles
  // (input de fichero, visor, botón de descarga) los monta initApp aquí dentro.
  bloques.push(
    [
      '<section class="panel" id="herramienta">',
      sangrar(
        [
          texto('h2', { class: 'panel__titulo' }, c.secciones.trabajo),
          texto('p', { class: 'aviso-principal' }, c.landing.avisoPrincipal),
        ],
        1,
      ),
      '</section>',
    ].join('\n'),
  );

  bloques.push(
    [
      '<section class="panel" id="licencia">',
      sangrar(
        [
          texto('h2', { class: 'panel__titulo' }, c.secciones.pro),
          texto('p', { class: 'pro__gratis' }, c.pro.gratis),
          texto('p', { class: 'pro__argumento' }, c.pro.argumento),
        ],
        1,
      ),
      '</section>',
    ].join('\n'),
  );

  const faq = c.faq.map((item) =>
    [
      '<details class="faq__item">',
      sangrar([texto('summary', {}, item.pregunta), texto('p', {}, item.respuesta)], 1),
      '</details>',
    ].join('\n'),
  );
  bloques.push(
    [
      `<section class="panel faq" aria-label="${esc(c.secciones.faq)}">`,
      sangrar([texto('h2', { class: 'panel__titulo' }, c.secciones.faq), ...faq], 1),
      '</section>',
    ].join('\n'),
  );

  const guias = guiasDe(locale).map((g) => `<li>${texto('a', { href: g.href }, g.guia.tituloEnlace)}</li>`);
  bloques.push(
    [
      `<nav class="guias" aria-label="${esc(c.secciones.guias)}">`,
      sangrar([texto('h2', {}, c.secciones.guias), `<ul>\n${sangrar(guias, 1)}\n</ul>`], 1),
      '</nav>',
    ].join('\n'),
  );

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
  bloques.push(
    [
      `<footer class="legales" aria-label="${esc(c.secciones.legal)}">`,
      sangrar(
        [
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
    `<meta name="twitter:image" content="${esc(OG_IMAGE)}" />`,
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
      alternates: alternatesDe(pagina),
      prefijo: navHref(rutaDe(pagina, locale) ?? '', ''),
      extra,
    }),
    cuerpoHome(pagina, locale),
  );
}

// --- página del comprobador -------------------------------------------------

/** Estilo propio del comprobador. Va en línea (la CSP lo permite con 'unsafe-inline' en
 *  style-src) para que la página se vea bien sin depender de ninguna hoja externa. */
const CSS_COMPROBADOR = `  :root {
    color-scheme: light dark;
    --cp-fondo: #0f172a;
    --cp-texto: #e2e8f0;
    --cp-acento: #38bdf8;
    --cp-borde: #334155;
  }
  body {
    margin: 0;
    background: var(--cp-fondo);
    color: var(--cp-texto);
  }
  main {
    max-width: 720px;
    margin: 0 auto;
    padding: 2.5rem 1.25rem 4rem;
  }
  h1 {
    font-size: var(--t-600);
    line-height: var(--lh-titular);
    font-weight: var(--peso-fuerte);
    margin-bottom: 0.75rem;
  }
  p {
    margin: 0 0 1rem;
    max-width: var(--medida);
  }
  .cp-intro {
    font-size: var(--t-400);
  }
  .idiomas {
    display: flex;
    gap: 0.75rem;
    font-size: var(--t-200);
    margin-bottom: 1.5rem;
  }
  .idiomas a {
    color: var(--cp-acento);
  }
  /* El borde de la zona de soltar era var(--cp-borde) (#334155) sobre el navy del fondo: 1,72:1.
     La afordancia principal de la pagina estaba delineada por un borde que casi no se ve, y lo
     unico que la salvaba era el texto de dentro. El minimo para el contorno de un control es 3:1. */
  #cp-dropzone {
    border: 2px dashed #94a3b8;
    border-radius: 12px;
    padding: 2rem 1.25rem;
    text-align: center;
    margin: 1.75rem 0;
    background: rgba(148, 163, 184, 0.06);
  }
  #cp-dropzone label {
    display: inline-block;
    cursor: pointer;
    font-weight: 600;
  }
  #cp-password-form {
    margin-top: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    align-items: center;
  }
  /* El marcador de posicion se cortaba a media frase y sin cerrar el parentesis —«Contraseña del
     PDF (si tiene»— porque el campo era mas estrecho que su propio texto. Un campo que no cabe lo
     que dice lee como pagina rota, y esta es la herramienta gratuita que hace de embudo. */
  #cp-password {
    width: 100%;
    max-width: 340px;
    padding: 0.4rem 0.6rem;
    border-radius: 6px;
    border: 1px solid var(--cp-borde);
    background: transparent;
    color: inherit;
  }
  .cp-aviso {
    font-size: var(--t-200);
    color: #94a3b8;
    border-left: 3px solid var(--cp-borde);
    padding-left: 0.9rem;
    margin: 1.5rem 0;
  }
  #cp-error {
    color: #fca5a5;
  }
  .cp-cta {
    display: inline-block;
    margin-top: 2rem;
    padding: 0.85rem 1.5rem;
    background: var(--cp-acento);
    color: #0f172a;
    font-weight: 700;
    text-decoration: none;
    border-radius: 8px;
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

  const selector = selectorIdioma(pagina, locale);
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
    '    <main>',
    sangrar(selector.length > 0 ? [selector, ...cuerpo] : cuerpo, 3),
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
      alternates: alternatesDe(pagina),
      prefijo: navHref(ruta, ''),
      extra,
    }),
    main,
  );
}

// --- guías ------------------------------------------------------------------

/** Estilo de artículo, con el mismo aspecto que las guías españolas escritas a mano: claro por
 *  defecto, oscuro si el sistema lo pide. En línea, sin hoja externa (lo exige la CSP). */
const CSS_GUIA = `  :root { color-scheme: light dark; }
  body {
    max-width: 720px; margin: 0 auto; padding: 2rem 1.2rem 4rem;
    font-size: var(--t-400);
    color: #1e293b; background: #fff;
  }
  p, li { max-width: var(--medida); }
  h1 { font-size: var(--t-600); line-height: var(--lh-titular); font-weight: var(--peso-fuerte); margin: 0 0 .8rem; }
  h2 { font-size: var(--t-500); line-height: var(--lh-corto); font-weight: var(--peso-fuerte); margin: 2.2rem 0 .6rem; }
  a { color: #0369a1; }
  ul, ol { padding-left: 1.3rem; }
  li { margin: .35rem 0; }
  .idiomas { display: flex; gap: .9rem; font-size: var(--t-200); margin: 0 0 1.5rem; }
  .idiomas__actual { font-weight: 700; }
  .nota {
    background: #fef2f2; border-left: 4px solid #ef4444;
    padding: .8rem 1rem; border-radius: 6px; color: #7f1d1d;
  }
  .cp-cta {
    display: block; margin: 2.4rem 0 0; padding: 1.2rem 1.4rem;
    background: #0f172a; color: #7dd3fc; border-radius: 10px;
    text-decoration: none; font-weight: 600;
  }
  @media (prefers-color-scheme: dark) {
    body { background: #0f172a; color: #e2e8f0; }
    a { color: #7dd3fc; }
    .nota { background: #450a0a; color: #fecaca; border-color: #ef4444; }
    .cp-cta { background: #1e293b; }
  }`;

function paginaGuia(pagina: PaginaRegistro, locale: Locale, guia: ContenidoGuia): string {
  const c = CONTENIDOS[locale];
  const canonical = urlCanonica(pagina, locale) ?? `${SITIO}/`;
  const ruta = rutaDe(pagina, locale) ?? '';
  const home = paginaPorId('home');
  const rutaHome = home === undefined ? '' : (rutaDe(home, locale) ?? '');

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
    `<style>\n${CSS_GUIA}\n</style>`,
  ];

  const selector = selectorIdioma(pagina, locale);
  const cuerpo = [
    texto('h1', {}, guia.titulo),
    ...guia.cuerpo.map(bloque),
    '',
    texto('a', { class: 'cp-cta', href: `${navHref(ruta, rutaHome)}?utm_source=guia` }, c.guiaCta),
  ];

  const main = [
    '    <main>',
    sangrar(selector.length > 0 ? [selector, ...cuerpo] : cuerpo, 3),
    '    </main>',
  ].join('\n');

  return documento(
    c.htmlLang,
    cabecera({
      lang: c.htmlLang,
      titulo: `${guia.titulo} · ${c.marca}`,
      descripcion: guia.descripcion,
      canonical,
      ogTitulo: guia.titulo,
      ogDescripcion: guia.descripcion,
      ogLocale: c.ogLocale,
      ogLocalesAlternos: ogLocalesAlternos(pagina, locale),
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

