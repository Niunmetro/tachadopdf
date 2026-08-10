import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { generarPagina, ogImage } from './generar';
import { LOCALE_POR_DEFECTO, PAGINAS, localesDe } from './registro';

/**
 * LA TARJETA SOCIAL, honesta y por idioma.
 *
 * La anterior mostraba un sello VERDE mientras el resultado normal del producto es el ámbar: la
 * primera impresión que se reparte por WhatsApp y LinkedIn prometía el veredicto que casi nadie
 * recibe — el falso verde mudado a marketing. La nueva es tipográfica y sobria, SIN sello de
 * color, y cada idioma lleva su propio claim. Estas guardas atan:
 *   1. cada página generada referencia la tarjeta de SU idioma (es → og-image.png,
 *      en → og-image-en.png), en `og:image` y en `twitter:image`;
 *   2. las dos tarjetas existen, son PNG y miden 1200×630 — la medida estándar de OG y, de paso,
 *      distinta de la vieja (1280×720): revertir a aquella imagen pone esto en rojo;
 *   3. la inglesa NO es un duplicado byte a byte de la española (llevan claims distintos).
 */

const RAIZ = resolve(__dirname, '..', '..');

/** Ancho y alto de un PNG leídos de su cabecera IHDR (sin decodificar la imagen). */
function dimsPng(ruta: string): { w: number; h: number; esPng: boolean } {
  const b = readFileSync(ruta);
  const esPng = b.subarray(0, 8).toString('hex') === '89504e470d0a1a0a';
  return { esPng, w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}

const generadas = PAGINAS.filter((p) => p.origen === 'generado').flatMap((p) =>
  localesDe(p).map((l) => ({ pagina: p, locale: l })),
);

describe('la tarjeta social por idioma', () => {
  it('ogImage() da el nombre plano al idioma por defecto y el sufijado al resto', () => {
    expect(ogImage(LOCALE_POR_DEFECTO)).toBe('https://www.tachadopdf.com/og-image.png');
    expect(ogImage('en')).toBe('https://www.tachadopdf.com/og-image-en.png');
  });

  it.each(generadas.map((g) => [`${g.pagina.id} (${g.locale})`, g] as const))(
    '%s referencia en og:image la tarjeta de su idioma y de ningún otro',
    (_n, g) => {
      const html = generarPagina(g.pagina, g.locale);
      const esperado = ogImage(g.locale);
      expect(html).toContain(`<meta property="og:image" content="${esperado}" />`);
      // El resto de tarjetas NO puede aparecer en esta página (un idioma no promete en otro).
      for (const otra of ['og-image.png', 'og-image-en.png']) {
        const url = `https://www.tachadopdf.com/${otra}`;
        if (url !== esperado) expect(html).not.toContain(`content="${url}"`);
      }
    },
  );

  // `twitter:image` solo lo emite la portada; ahí también tiene que ser la tarjeta del idioma.
  const portadas = PAGINAS.filter((p) => p.tipo === 'app' && p.origen === 'generado').flatMap((p) =>
    localesDe(p).map((l) => ({ pagina: p, locale: l })),
  );
  it.each(portadas.map((g) => [`${g.pagina.id} (${g.locale})`, g] as const))(
    '%s: twitter:image es la tarjeta de su idioma',
    (_n, g) => {
      const html = generarPagina(g.pagina, g.locale);
      expect(html).toContain(`<meta name="twitter:image" content="${ogImage(g.locale)}" />`);
    },
  );
});

describe('las dos tarjetas existen y son honestas por su forma', () => {
  it.each([
    ['og-image.png', 'es'],
    ['og-image-en.png', 'en'],
  ])('%s es un PNG de 1200×630 (medida OG, distinta de la vieja 1280×720)', (archivo) => {
    const { esPng, w, h } = dimsPng(resolve(RAIZ, 'public', archivo));
    expect(esPng, `${archivo} no es un PNG`).toBe(true);
    expect([w, h]).toEqual([1200, 630]);
  });

  it('la inglesa no es un duplicado byte a byte de la española', () => {
    const es = readFileSync(resolve(RAIZ, 'public', 'og-image.png'));
    const en = readFileSync(resolve(RAIZ, 'public', 'og-image-en.png'));
    expect(es.equals(en)).toBe(false);
  });
});
