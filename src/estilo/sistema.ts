// Acceso al sistema visual desde el generador de páginas.
//
// `sistema.css` es la ÚNICA fuente de tokens del sitio. Este módulo lo lee del disco y le pone
// a cada página su prefijo de ruta: no reescribe nada, no interpreta nada y no tiene una copia
// de los valores. Si alguien añade un token, llega a las dieciocho páginas sin tocar aquí.
//
// Este módulo NO se empaqueta para el navegador: solo lo importan `src/content/generar.ts`
// (que a su vez solo lo usan `scripts/gen-pages.ts` y los tests) y las guardas de estilo.
import { readFileSync } from 'node:fs';

/** Marcador que cada página sustituye por su prefijo de profundidad. */
export const MARCA_RUTA = '__RUTA__';

/** Los bytes tal cual de la única fuente de tokens, comentarios incluidos. Es lo que se REVISA. */
export function sistemaFuente(): string {
  return readFileSync(new URL('./sistema.css', import.meta.url), 'utf-8').replace(/\r\n/g, '\n');
}

/**
 * Lo que se PUBLICA: la misma hoja sin los comentarios y sin la sangría.
 *
 * Medido: la hoja documentada pesa 8,0 kB y sus reglas, 1,1 kB. Ese bloque va incrustado en las
 * DIECIOCHO páginas, así que publicarlo con sus comentarios serían ~8 kB por página y por visita
 * de explicaciones escritas para quien revisa el repositorio, no para quien compra. Los
 * comentarios de esta casa son largos a propósito y tienen que seguir siéndolo; lo que no puede
 * es pagarlos el visitante. El porqué vive en el repositorio; por el cable van las reglas.
 */
function publicable(css: string): string {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .map((linea) => linea.trim())
    .filter((linea) => linea.length > 0)
    .join('\n')
    .concat('\n');
}

/**
 * El bloque del sistema listo para incrustar en una página.
 *
 * `prefijo` es la ruta de vuelta a la raíz del sitio DESDE EL DOCUMENTO ('./' en la portada,
 * '../' en /en/, '../../../' en /en/guide/loquesea/). Se calcula con `navHref(ruta, '')`, el
 * mismo mecanismo que ya usa el PDF de ejemplo, y por el mismo motivo: dentro de un <style> en
 * línea las URL se resuelven contra el documento, y una ruta raíz-absoluta se sale del sitio
 * bajo la base de emergencia '/tachadopdf/'.
 */
export function sistemaCss(prefijo: string): string {
  return publicable(sistemaFuente()).split(MARCA_RUTA).join(prefijo);
}

/**
 * Precarga del sans. Solo del sans: el mono lo baja el navegador únicamente donde de verdad se
 * pinta un identificador, y precargarlo obligaría a pagarlo a quien todavía no ha abierto nada.
 * `crossorigin` es OBLIGATORIO aunque el fichero sea nuestro —las fuentes se piden en modo CORS
 * anónimo—: sin él el navegador descarga el fichero dos veces.
 */
export function enlacePreloadFuente(prefijo: string): string {
  return (
    `<link rel="preload" href="${prefijo}fuentes/ibm-plex-sans/ibm-plex-sans-latin-wght-normal.woff2" ` +
    'as="font" type="font/woff2" crossorigin />'
  );
}
