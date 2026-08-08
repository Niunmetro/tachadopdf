import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { generarSitio } from './generar';
import { LOCALES, PAGINAS, ficheroDe, localesDe, urlCanonica } from './registro';

/**
 * EL ENCARGO CONVERTIDO EN INVARIANTE: añadir un idioma tiene que ser añadir DATOS al registro y
 * un fichero de contenido, nunca escribir código nuevo en el generador.
 *
 * Se comprueba de dos maneras que se apoyan la una en la otra:
 *  1. la salida del generador se compara con una expectativa DERIVADA del registro, no con una
 *     lista escrita a mano: si alguien emite una página fuera del registro, o se deja una, falla;
 *  2. ningún módulo del generador menciona un código de idioma literal. Ese es el fallo real que
 *     se quiere impedir: un `if (locale === 'en')` escondido en el generador.
 *
 * Lo que NO prueba (dicho en voz alta): no arranca un idioma inventado de punta a punta. Para eso
 * habría que inyectar un registro falso en cada función, y el coste no compensa mientras la
 * comprobación 2 sujete el único camino por el que se cuela un idioma cableado a mano.
 */

const RAIZ = resolve(__dirname, '..', '..');

const MODULOS_DEL_GENERADOR = ['content/generar.ts', 'content/html.ts', 'content/index.ts'];

describe('la salida se DERIVA del registro', () => {
  const ficheros = generarSitio();

  it('emite exactamente una página por (página generada × idioma en que existe), más el sitemap', () => {
    const esperados = PAGINAS.filter((p) => p.origen === 'generado').flatMap((p) =>
      localesDe(p).map((l) => ficheroDe(p, l)),
    );
    esperados.push('public/sitemap.xml');
    expect(ficheros.map((f) => f.ruta).sort()).toEqual(esperados.sort());
  });

  it('cada idioma declarado tiene su portada y su comprobador', () => {
    const rutas = new Set(ficheros.map((f) => f.ruta));
    for (const locale of LOCALES) {
      const home = PAGINAS.find((p) => p.id === 'home');
      const checker = PAGINAS.find((p) => p.id === 'comprobador');
      expect(home).toBeDefined();
      expect(checker).toBeDefined();
      if (home !== undefined) expect(rutas.has(ficheroDe(home, locale) ?? '')).toBe(true);
      if (checker !== undefined) expect(rutas.has(ficheroDe(checker, locale) ?? '')).toBe(true);
    }
  });

  it('el sitemap contiene una entrada por (página × idioma), sin faltar ni sobrar ninguna', () => {
    const sitemap = ficheros.find((f) => f.ruta === 'public/sitemap.xml')?.contenido ?? '';
    const locs = Array.from(sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)).map((m) => m[1]);
    const esperadas = PAGINAS.flatMap((p) => localesDe(p).map((l) => urlCanonica(p, l)));
    expect(locs.sort()).toEqual(esperadas.sort());
  });
});

describe('el generador no sabe qué idiomas existen', () => {
  it.each(MODULOS_DEL_GENERADOR)('%s no menciona ningún código de idioma literal', (relativo) => {
    const fuente = readFileSync(resolve(__dirname, '..', relativo), 'utf-8');
    // Se ignoran los comentarios: explicar «/en/» en una nota es correcto; ramificar por él, no.
    const codigo = fuente
      .split('\n')
      .filter((linea) => !/^\s*(\/\/|\*|\/\*)/.test(linea))
      .join('\n');
    const literales = LOCALES.flatMap((l) => [`'${l}'`, `"${l}"`]);
    const encontrados = literales.filter((literal) => codigo.includes(literal));
    // `index.ts` construye el mapa CONTENIDOS y ahí los nombres SÍ aparecen: es el registro de
    // datos, no lógica. Se le permite solo eso.
    const permitido = relativo === 'content/index.ts';
    if (!permitido) expect(encontrados).toEqual([]);
  });

  it('registro.ts es el único sitio donde se declara la lista de idiomas', () => {
    const registro = readFileSync(resolve(__dirname, 'registro.ts'), 'utf-8');
    expect(registro).toContain('export const LOCALES');
    const generador = readFileSync(resolve(__dirname, 'generar.ts'), 'utf-8');
    expect(generador).not.toContain('LOCALES = [');
  });

  it('vite.config.ts deriva sus entradas del registro y no lista ningún fichero a mano', () => {
    const config = readFileSync(resolve(RAIZ, 'vite.config.ts'), 'utf-8');
    expect(config).toContain('entradasVite()');
    expect(config).not.toContain('comprobador/index.html');
    expect(config).not.toContain('en/index.html');
  });
});
