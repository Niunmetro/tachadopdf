import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { PAGINAS, ficheroDe, localesDe } from '../content/registro';

/**
 * LOS ENLACES DE NAVEGACIÓN DE LAS PÁGINAS ESTÁTICAS SON RELATIVOS AL DOCUMENTO (2026-09-08).
 *
 * Las páginas GENERADAS ya emiten su navegación con `navHref` (relativo) a propósito, y sus guardas
 * (enlazado-interno-en, landings-keyword) lo atan. Las OCHO páginas estáticas escritas a mano —las
 * seis guías + /actas/ + /nominas/— tenían sus `<a>` internos en ABSOLUTO
 * (`https://www.tachadopdf.com/…`), aunque sus ASSETS (favicon, fuentes) ya eran relativos: una
 * inconsistencia que rompía justo la base de emergencia `/tachadopdf/`, el modo pensado para cuando
 * el dominio se cae (ya ocurrió una vez, ver docs). Bajo esa base, un `<a href="https://www.tachadopdf.com/…">`
 * manda al usuario al dominio caído en vez de al fallback.
 *
 * Esta guarda ata la corrección sobre el HTML de disco que de verdad se publica: ningún enlace de
 * navegación de una página estática puede ser raíz-absoluto (`/…`) ni apuntar en absoluto al propio
 * dominio. Los enlaces EXTERNOS (otro dominio) sí pueden ser absolutos —son externos—, y la
 * IDENTIDAD (canonical, og) DEBE seguir absoluta: eso también se comprueba, para que un futuro
 * «arreglo» no relativice por error lo que no debe.
 */
const RAIZ = resolve(__dirname, '..', '..');

const ESTATICAS: string[] = PAGINAS.filter((p) => p.origen === 'estatico').flatMap((p) =>
  localesDe(p)
    .map((locale) => ficheroDe(p, locale))
    .filter((ruta): ruta is string => ruta !== null),
);

function html(ruta: string): string {
  return readFileSync(resolve(RAIZ, ruta), 'utf-8');
}

describe('las páginas estáticas navegan con rutas relativas (base de emergencia)', () => {
  it('el barrido ve las ocho páginas estáticas (derivadas del registro)', () => {
    expect(ESTATICAS.length).toBe(8);
  });

  it.each(ESTATICAS)('%s: ningún <a> de navegación es raíz-absoluto ni al propio dominio', (ruta) => {
    const contenido = html(ruta);
    const absolutosPropios = [...contenido.matchAll(/<a\b[^>]*\bhref="https:\/\/www\.tachadopdf\.com[^"]*"/g)].map(
      (m) => m[0],
    );
    expect(absolutosPropios, `enlaces al propio dominio en ${ruta}`).toEqual([]);

    const raizAbsolutos = [...contenido.matchAll(/<a\b[^>]*\bhref="\/[^"]*"/g)].map((m) => m[0]);
    expect(raizAbsolutos, `enlaces raíz-absolutos en ${ruta}`).toEqual([]);
  });

  it.each(ESTATICAS)('%s: la IDENTIDAD (canonical) sigue absoluta al dominio', (ruta) => {
    // La navegación se relativiza; la identidad NO (canonical/og son URLs absolutas del dominio, no
    // enlaces por los que se navega). Se comprueba para que nadie relativice el canonical por error.
    expect(html(ruta)).toMatch(/<link rel="canonical" href="https:\/\/www\.tachadopdf\.com[^"]*" \/>/);
  });
});
