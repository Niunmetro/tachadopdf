import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { FECHAS } from './fechas';
import { generarSitemap } from './generar';
import { PAGINAS, ficheroDe, localesDe } from './registro';

/**
 * LAS FECHAS QUE VE GOOGLE SON LAS DEL HISTORIAL, Y DICEN LO MISMO EN TODAS PARTES.
 *
 * Auditoría del 2026-10-29: cero fechas en todo el sitio (ni `lastmod` en el sitemap ni
 * `datePublished`/`dateModified` en los Article). Los buscadores con motor generativo eligen fuente
 * también por frescura. Las fechas salen de `scripts/fechas.ts` (git), nunca se escriben a ojo; esta
 * guarda exige que cada página tenga las suyas y que el sitemap, el Article generado y el Article
 * escrito a mano de las páginas estáticas digan exactamente lo mismo.
 */
const RAIZ = resolve(__dirname, '..', '..');
const ISO = /^\d{4}-\d{2}-\d{2}$/;

const PAGINAS_DEL_SITIO = PAGINAS.flatMap((pagina) =>
  localesDe(pagina).flatMap((locale) => {
    const fichero = ficheroDe(pagina, locale);
    return fichero === null ? [] : [{ pagina, locale, fichero }];
  }),
);

function articulos(fichero: string): Record<string, unknown>[] {
  const html = readFileSync(resolve(RAIZ, fichero), 'utf-8');
  const bloques = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  return bloques
    .map((m) => JSON.parse(m[1] ?? '') as Record<string, unknown>)
    .filter((dato) => dato['@type'] === 'Article');
}

describe('fechas reales de cada página', () => {
  it('cada página del sitio tiene fechas, y no sobra ninguna', () => {
    expect(Object.keys(FECHAS).sort()).toEqual(PAGINAS_DEL_SITIO.map((p) => p.fichero).sort());
  });

  it.each(PAGINAS_DEL_SITIO.map((p) => p.fichero))('%s: fechas ISO y en orden', (fichero) => {
    const fechas = FECHAS[fichero];
    expect(fechas?.publicado).toMatch(ISO);
    expect(fechas?.actualizado).toMatch(ISO);
    expect((fechas?.publicado ?? '') <= (fechas?.actualizado ?? '')).toBe(true);
  });

  it('el sitemap lleva el lastmod de cada URL', () => {
    const sitemap = generarSitemap();
    const urls = sitemap.split('<url>').slice(1);
    expect(urls).toHaveLength(PAGINAS_DEL_SITIO.length);
    for (const url of urls) expect(url).toMatch(/<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/);
  });
});

describe('cada guía y landing publica su Article con las mismas fechas', () => {
  const conArticulo = PAGINAS_DEL_SITIO.filter(
    (p) => p.pagina.tipo === 'guia' || p.pagina.tipo === 'landing',
  );

  it('el barrido ve todas las guías y landings', () => {
    expect(conArticulo.length).toBeGreaterThanOrEqual(30);
  });

  it.each(conArticulo.map((p) => p.fichero))('%s', (fichero) => {
    const lista = articulos(fichero);
    expect(lista, `${fichero} no tiene Article`).toHaveLength(1);
    const articulo = lista[0] ?? {};
    expect(articulo['datePublished']).toBe(FECHAS[fichero]?.publicado);
    expect(articulo['dateModified']).toBe(FECHAS[fichero]?.actualizado);
    const autor = articulo['author'] as Record<string, unknown> | undefined;
    expect(autor?.['@id']).toBe('https://www.tachadopdf.com/#organization');
  });
});
