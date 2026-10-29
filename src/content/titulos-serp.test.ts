import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CONTENIDOS } from './index';
import { PAGINAS, ficheroDe, localesDe } from './registro';

/**
 * EL `<title>` QUE ENSEÑA GOOGLE NO PUEDE PASAR DE ~60 CARACTERES.
 *
 * Medido el 2026-10-29 con Search Console: los 21 títulos de las guías y landings españolas
 * medían 63-117 caracteres y Google los cortaba antes del gancho; siete páginas en la primera
 * página de resultados (posición 6-10) llevaban tres meses con cero clics. Las guías inglesas ya
 * tenían su tope (`enlazado-interno-en.test.ts`); esta guarda pone el mismo a las españolas que
 * declaran `metaTitulo` y a las páginas de herramienta, que lo llevan siempre.
 */
const TOPE_TITULO = 60;

const es = CONTENIDOS.es;

describe('los títulos de la SERP en español caben sin que Google los corte', () => {
  const guiasConTitulo = es.guias.filter((g) => g.metaTitulo !== undefined);

  it('hay guías españolas con título propio para la SERP', () => {
    expect(guiasConTitulo.length).toBeGreaterThan(0);
  });

  it.each(guiasConTitulo.map((g) => [g.id, g.metaTitulo ?? ''] as const))(
    '%s: el metaTitulo cabe',
    (_id, titulo) => {
      expect(titulo.length).toBeGreaterThan(20);
      expect(titulo.length).toBeLessThanOrEqual(TOPE_TITULO);
    },
  );

  it.each([
    ['portada', es.home.metaTitulo],
    ['comprobador', es.comprobador.metaTitulo],
    ['imagen', es.imagen.metaTitulo],
    ['metadatos', es.metadatos.metaTitulo],
    ['metadatos-pdf', es.metadatosPdf.metaTitulo],
  ] as const)('%s: el metaTitulo cabe', (_pagina, titulo) => {
    expect(titulo.length).toBeLessThanOrEqual(TOPE_TITULO);
  });
});

/**
 * Y el `<title>` que de verdad se sirve, en TODAS las páginas: las generadas y las escritas a
 * mano (landings de sector y seis guías estáticas), que no pasan por `metaTitulo` y se alargaban
 * sin que nada se pusiera en rojo. La lista sale del registro, nunca escrita a mano.
 */
const RAIZ = resolve(__dirname, '..', '..');
const PAGINAS_DEL_SITIO: string[] = PAGINAS.flatMap((pagina) =>
  localesDe(pagina)
    .map((locale) => ficheroDe(pagina, locale))
    .filter((ruta): ruta is string => ruta !== null),
);

function tituloServido(ruta: string): string {
  const html = readFileSync(resolve(RAIZ, ruta), 'utf-8');
  const crudo = /<title>([\s\S]*?)<\/title>/.exec(html)?.[1] ?? '';
  return crudo
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"');
}

describe('el <title> servido de cada página cabe en la SERP', () => {
  it('el barrido ve las cuarenta y dos páginas del sitio', () => {
    expect(PAGINAS_DEL_SITIO.length).toBe(42);
  });

  it.each(PAGINAS_DEL_SITIO)('%s', (ruta) => {
    const titulo = tituloServido(ruta);
    expect(titulo.length, `<title> de ${ruta}: «${titulo}»`).toBeGreaterThan(20);
    expect(titulo.length, `<title> de ${ruta}: «${titulo}»`).toBeLessThanOrEqual(TOPE_TITULO);
  });
});
