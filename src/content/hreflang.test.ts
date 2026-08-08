import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { CONTENIDOS } from './index';
import { alternatesDe } from './generar';
import { LOCALES, PAGINAS, ficheroDe, localesDe, urlCanonica } from './registro';

const RAIZ = resolve(__dirname, '..', '..');

function bloqueAlternates(html: string): string[] {
  return Array.from(html.matchAll(/<link rel="alternate"[^>]*>/g)).map((m) => m[0]);
}

function atributo(html: string, patron: RegExp): string | null {
  const m = html.match(patron);
  return m?.[1] ?? null;
}

const generadas = PAGINAS.filter((p) => p.origen === 'generado');

/**
 * Se lee el FICHERO DE DISCO, no la salida del generador en memoria. Comprobar la salida del
 * generador contra sí misma es una guarda que no guarda: la primera versión de este test daba
 * verde con la línea `hreflang="en"` borrada a mano de index.html. Lo que se publica es el
 * fichero.
 */
function htmlDe(pagina: (typeof PAGINAS)[number], locale: (typeof LOCALES)[number]): string {
  return readFileSync(resolve(RAIZ, ficheroDe(pagina, locale) ?? ''), 'utf-8');
}

describe('hreflang: reciprocidad, x-default y canonical auto-referente', () => {
  for (const pagina of generadas) {
    const idiomas = localesDe(pagina);

    for (const locale of idiomas) {
      const html = htmlDe(pagina, locale);
      const nombre = `${ficheroDe(pagina, locale) ?? '?'} (${locale})`;

      it(`${nombre}: <html lang> coincide con el idioma`, () => {
        expect(atributo(html, /<html lang="([^"]+)">/)).toBe(CONTENIDOS[locale].htmlLang);
      });

      // EL ERROR FATAL a evitar: canonicalizar /en/ hacia / desindexa el sitio inglés entero.
      it(`${nombre}: el canonical es AUTO-REFERENTE`, () => {
        expect(atributo(html, /<link rel="canonical" href="([^"]+)"/)).toBe(
          urlCanonica(pagina, locale),
        );
        expect(atributo(html, /<meta property="og:url" content="([^"]+)"/)).toBe(
          urlCanonica(pagina, locale),
        );
      });

      if (idiomas.length < 2) {
        it(`${nombre}: al existir en un solo idioma NO declara alternos`, () => {
          expect(bloqueAlternates(html)).toEqual([]);
        });
        continue;
      }

      it(`${nombre}: declara un alterno por idioma más un x-default`, () => {
        const bloque = bloqueAlternates(html);
        expect(bloque.length).toBe(idiomas.length + 1);
        for (const l of idiomas) {
          expect(bloque.some((linea) => linea.includes(`hreflang="${l}"`))).toBe(true);
        }
        expect(bloque.filter((linea) => linea.includes('hreflang="x-default"')).length).toBe(1);
      });

      it(`${nombre}: el x-default apunta al idioma por defecto del sitio`, () => {
        const bloque = bloqueAlternates(html);
        const xDefault = bloque.find((linea) => linea.includes('hreflang="x-default"')) ?? '';
        expect(xDefault).toContain(`href="${urlCanonica(pagina, LOCALES[0] ?? 'es')}"`);
      });
    }

    if (idiomas.length < 2) continue;

    // El bloque es función pura de la página: por eso la reciprocidad se comprueba comparando
    // los dos sentidos byte a byte, no reconstruyendo la expectativa a mano.
    it(`${pagina.id}: el bloque de alternos es IDÉNTICO en todos los idiomas del grupo`, () => {
      const bloques = idiomas.map((l) => bloqueAlternates(htmlDe(pagina, l)));
      const primero = bloques[0] ?? [];
      for (const bloque of bloques) expect(bloque).toEqual(primero);
    });

    it(`${pagina.id}: cada alterno apunta a la URL canónica real de ese idioma`, () => {
      for (const alt of alternatesDe(pagina)) {
        if (alt.hreflang === 'x-default') continue;
        const l = LOCALES.find((x) => x === alt.hreflang);
        expect(l).toBeDefined();
        if (l !== undefined) expect(alt.href).toBe(urlCanonica(pagina, l));
      }
    });
  }
});

describe('og:locale y og:locale:alternate', () => {
  for (const pagina of generadas) {
    for (const locale of localesDe(pagina)) {
      const html = htmlDe(pagina, locale);
      const otros = localesDe(pagina).filter((l) => l !== locale);

      it(`${ficheroDe(pagina, locale) ?? '?'}: declara su og:locale y el de los demás idiomas`, () => {
        expect(html).toContain(
          `<meta property="og:locale" content="${CONTENIDOS[locale].ogLocale}" />`,
        );
        for (const otro of otros) {
          expect(html).toContain(
            `<meta property="og:locale:alternate" content="${CONTENIDOS[otro].ogLocale}" />`,
          );
        }
      });
    }
  }
});

describe('el sitemap declara los mismos alternos que el HTML', () => {
  const sitemap = readFileSync(resolve(RAIZ, 'public', 'sitemap.xml'), 'utf-8');

  it('contiene todas las URL de todos los idiomas y ninguna de más', () => {
    const locs = Array.from(sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)).map((m) => m[1]);
    const esperadas = PAGINAS.flatMap((p) => localesDe(p).map((l) => urlCanonica(p, l)));
    expect(locs.sort()).toEqual(esperadas.sort());
  });

  it('declara el espacio de nombres xhtml (sin él, los alternos no valen)', () => {
    expect(sitemap).toContain('xmlns:xhtml="http://www.w3.org/1999/xhtml"');
  });

  it.each(generadas.filter((p) => localesDe(p).length > 1).map((p) => p.id))(
    '%s: el sitemap repite el juego completo de alternos en cada idioma',
    (id) => {
      const pagina = PAGINAS.find((p) => p.id === id);
      expect(pagina).toBeDefined();
      if (pagina === undefined) return;
      for (const alt of alternatesDe(pagina)) {
        const linea = `<xhtml:link rel="alternate" hreflang="${alt.hreflang}" href="${alt.href}" />`;
        expect(sitemap.split(linea).length - 1).toBe(localesDe(pagina).length);
      }
    },
  );
});
