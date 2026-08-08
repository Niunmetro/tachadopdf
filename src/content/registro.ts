// Registro de idiomas y páginas. ESTE FICHERO ES LA FUENTE DE VERDAD del mapa del sitio:
// las rutas, el sitemap, las etiquetas hreflang, el selector de idioma y las entradas de Vite se
// DERIVAN de aquí. Añadir un idioma debe ser añadir datos a este fichero, nunca escribir código
// nuevo (lo vigila src/content/alta-de-idioma.test.ts).

export type Locale = 'es' | 'en';

/** Orden de presentación del selector de idioma. El primero es el idioma por defecto del sitio. */
export const LOCALES: Locale[] = ['es', 'en'];

export const LOCALE_POR_DEFECTO: Locale = 'es';

/** Origen absoluto de producción. Se usa SOLO para identidad (canonical, og:url, sitemap,
 *  hreflang), nunca para navegar: los enlaces de navegación se emiten relativos al documento
 *  para que el modo de emergencia (base '/tachadopdf/') siga funcionando sin regenerar nada. */
export const SITIO = 'https://www.tachadopdf.com';

/** Prefijo de ruta del idioma. El idioma por defecto vive en la raíz y NO lleva prefijo: las
 *  URLs españolas están indexadas y GitHub Pages no puede emitir un 301, así que moverlas sería
 *  romperlas sin poder redirigirlas. */
export function prefijoDe(locale: Locale): string {
  return locale === LOCALE_POR_DEFECTO ? '' : `${locale}/`;
}

export type TipoPagina = 'app' | 'comprobador' | 'guia' | 'landing';

/** 'entrada' = la procesa Vite (necesita que le inyecte el <script> del módulo) y por eso su
 *  HTML vive en la raíz del repo. 'public' = Vite la copia tal cual desde public/. */
export type Destino = 'entrada' | 'public';

/** 'generado' = su HTML lo escribe scripts/gen-pages.ts. 'estatico' = fichero escrito a mano
 *  que el generador NO toca; solo aporta su ruta al sitemap y su título al índice. */
export type Origen = 'generado' | 'estatico';

export interface PaginaRegistro {
  id: string;
  tipo: TipoPagina;
  origen: Origen;
  destino: Destino;
  /** Ruta sin prefijo de idioma y sin barras en los extremos. '' es la portada.
   *  Un idioma ausente significa que esa página no existe en ese idioma. */
  slugs: Partial<Record<Locale, string>>;
}

export const PAGINAS: PaginaRegistro[] = [
  { id: 'home', tipo: 'app', origen: 'generado', destino: 'entrada', slugs: { es: '', en: '' } },
  {
    id: 'comprobador',
    tipo: 'comprobador',
    origen: 'generado',
    destino: 'entrada',
    slugs: { es: 'comprobador', en: 'checker' },
  },
  { id: 'actas', tipo: 'landing', origen: 'estatico', destino: 'public', slugs: { es: 'actas' } },
  { id: 'nominas', tipo: 'landing', origen: 'estatico', destino: 'public', slugs: { es: 'nominas' } },
  {
    id: 'guia-tachar-dni',
    tipo: 'guia',
    origen: 'estatico',
    destino: 'public',
    slugs: { es: 'guia/tachar-dni-pdf' },
  },
  {
    id: 'guia-rectangulo-negro',
    tipo: 'guia',
    origen: 'estatico',
    destino: 'public',
    slugs: { es: 'guia/rectangulo-negro-pdf-no-borra' },
  },
  {
    id: 'guia-fincas',
    tipo: 'guia',
    origen: 'estatico',
    destino: 'public',
    slugs: { es: 'guia/proteccion-datos-administradores-fincas' },
  },
  {
    id: 'guia-sin-subir',
    tipo: 'guia',
    origen: 'estatico',
    destino: 'public',
    slugs: { es: 'guia/tachar-pdf-sin-subir-internet' },
  },
  {
    id: 'guia-sanciones',
    tipo: 'guia',
    origen: 'estatico',
    destino: 'public',
    slugs: { es: 'guia/sanciones-aepd-comunidades-propietarios' },
  },
  {
    id: 'guia-nominas',
    tipo: 'guia',
    origen: 'estatico',
    destino: 'public',
    slugs: { es: 'guia/enviar-nominas-pdf-datos-personales' },
  },

  // Guías inglesas. NO son la traducción de las españolas y por eso NO forman pareja hreflang
  // con ellas: dos de las españolas (sanciones de la AEPD, administradores de fincas) no tienen
  // audiencia inglesa, y tres de las inglesas (Rule 5.2, DSAR, comprobar el tachado) no tienen
  // original español. Emparejar páginas que no son equivalentes es peor que no emparejarlas.
  {
    id: 'guia-en-caja-negra',
    tipo: 'guia',
    origen: 'generado',
    destino: 'public',
    slugs: { en: 'guide/black-box-pdf-not-redacted' },
  },
  {
    id: 'guia-en-comprobar',
    tipo: 'guia',
    origen: 'generado',
    destino: 'public',
    slugs: { en: 'guide/check-pdf-redaction' },
  },
  {
    id: 'guia-en-tribunales',
    tipo: 'guia',
    origen: 'generado',
    destino: 'public',
    slugs: { en: 'guide/redact-court-filing' },
  },
  {
    id: 'guia-en-dsar',
    tipo: 'guia',
    origen: 'generado',
    destino: 'public',
    slugs: { en: 'guide/redact-subject-access-request' },
  },
  {
    id: 'guia-en-sin-subir',
    tipo: 'guia',
    origen: 'generado',
    destino: 'public',
    slugs: { en: 'guide/redact-pdf-without-uploading' },
  },
  {
    id: 'guia-en-nominas',
    tipo: 'guia',
    origen: 'generado',
    destino: 'public',
    slugs: { en: 'guide/redact-payslips-hr-documents' },
  },
];

export function paginaPorId(id: string): PaginaRegistro | undefined {
  return PAGINAS.find((p) => p.id === id);
}

/** Ruta de la página relativa a la raíz del sitio, con barra final ('' para la portada del
 *  idioma por defecto). `null` si esa página no existe en ese idioma. */
export function rutaDe(pagina: PaginaRegistro, locale: Locale): string | null {
  const slug = pagina.slugs[locale];
  if (slug === undefined) return null;
  return slug === '' ? prefijoDe(locale) : `${prefijoDe(locale)}${slug}/`;
}

/** Idiomas en los que existe la página, en el orden de LOCALES. */
export function localesDe(pagina: PaginaRegistro): Locale[] {
  return LOCALES.filter((l) => pagina.slugs[l] !== undefined);
}

function segmentos(ruta: string): string[] {
  return ruta.split('/').filter((seg) => seg.length > 0);
}

/**
 * Enlace de navegación RELATIVO AL DOCUMENTO entre dos rutas del sitio.
 * Relativo y no absoluto a propósito: con base '/tachadopdf/' (modo de emergencia, el que se usa
 * justo cuando el dominio está caído) un href que empiece por '/' apunta fuera del sitio. Los
 * enlaces escritos a mano de las guías ya tienen ese defecto; lo generado no lo tendrá.
 * Se descarta el prefijo común para que el enlace sea el más corto posible: de /en/checker/ a
 * /en/ sale '../' y no '../../en/', que resuelve igual pero se lee mal en la revisión.
 */
export function navHref(desde: string, hacia: string): string {
  const origen = segmentos(desde);
  const destino = segmentos(hacia);
  let comun = 0;
  while (comun < origen.length && comun < destino.length && origen[comun] === destino[comun]) {
    comun += 1;
  }
  const subidas = '../'.repeat(origen.length - comun);
  const bajada = destino
    .slice(comun)
    .map((seg) => `${seg}/`)
    .join('');
  const href = `${subidas}${bajada}`;
  return href === '' ? './' : href;
}

/** URL absoluta de producción: identidad de la página (canonical, og:url, sitemap, hreflang). */
export function urlCanonica(pagina: PaginaRegistro, locale: Locale): string | null {
  const ruta = rutaDe(pagina, locale);
  return ruta === null ? null : `${SITIO}/${ruta}`;
}

/** Ruta del fichero HTML que le corresponde a una página, relativa a la raíz del repo. */
export function ficheroDe(pagina: PaginaRegistro, locale: Locale): string | null {
  const ruta = rutaDe(pagina, locale);
  if (ruta === null) return null;
  const base = pagina.destino === 'public' ? 'public/' : '';
  return `${base}${ruta}index.html`;
}

/**
 * Entradas HTML que Vite debe procesar (son las que necesitan que les inyecte el <script> del
 * módulo). Se derivan del registro para que añadir un idioma NO obligue a tocar vite.config.ts.
 * Este módulo es hoja a propósito: vite.config.ts lo importa y no debe arrastrar contenido.
 */
export function entradasVite(): Record<string, string> {
  const entradas: Record<string, string> = {};
  for (const pagina of PAGINAS) {
    if (pagina.destino !== 'entrada') continue;
    for (const locale of localesDe(pagina)) {
      const ruta = ficheroDe(pagina, locale);
      if (ruta === null) continue;
      entradas[`${pagina.id}-${locale}`] = ruta;
    }
  }
  return entradas;
}
