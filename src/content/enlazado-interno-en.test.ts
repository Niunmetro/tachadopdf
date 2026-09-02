import { describe, expect, it } from 'vitest';
import { CONTENIDOS } from './index';
import { generarPagina } from './generar';
import { esc } from './html';
import { PAGINAS, rutaDe } from './registro';

/**
 * ENLAZADO INTERNO Y TÍTULOS DE LAS GUÍAS INGLESAS (pasada de calidad SEO on-page, 2026-08-27).
 *
 * El embudo inglés se rompe ARRIBA, en descubrimiento, y en inglés «offline» ya no nos diferencia
 * (los gigantes y una camada de clones lo dicen igual). Donde sí ganamos es en el ÁNGULO —el
 * informe de comprobación como prueba adjuntable y la consulta de miedo «¿se recupera un tachado?»—
 * y en la HIGIENE on-page que los clones no cuidan: títulos con la keyword al frente y ≤60
 * caracteres, y enlazado interno entre guías + a la herramienta gratuita.
 *
 * Esta guarda ata esa higiene sobre el HTML que de verdad produce el generador, para que una
 * futura edición no la deshaga en silencio:
 *   1. cada guía inglesa declara un `metaTitulo` corto (≤60, keyword al frente) y ese es su <title>;
 *   2. cada guía enlaza a la HERRAMIENTA (el comprobador `/en/checker/`), con su UTM;
 *   3. cada guía lleva un bloque «Related guides» con 2-4 enlaces a OTRAS guías inglesas;
 *   4. TODO enlace de navegación es RELATIVO al documento — un href raíz-absoluto (`/…`) rompe la
 *      base de emergencia `/tachadopdf/`, que es justo el modo para cuando el dominio se cae.
 *
 * Se deriva del registro (no de una lista escrita a mano): una guía inglesa nueva entra sola.
 */

/** Las guías generadas que existen SOLO en inglés (no son traducción de una española). */
const GUIAS_EN = PAGINAS.filter(
  (p) => p.tipo === 'guia' && p.origen === 'generado' && p.slugs.en !== undefined && p.slugs.es === undefined,
);

const IDS_EN = new Set(GUIAS_EN.map((p) => p.id));

/** El `<title>` de la SERP no debería pasar de ~60 caracteres o Google lo recorta. */
const TOPE_TITULO = 60;

describe('las guías inglesas están enlazadas y con títulos aptos para la SERP', () => {
  it('el barrido ve las seis guías inglesas (derivadas del registro)', () => {
    expect(GUIAS_EN.map((p) => p.id).sort()).toEqual(
      [
        'guia-en-caja-negra',
        'guia-en-comprobar',
        'guia-en-dsar',
        'guia-en-nominas',
        'guia-en-sin-acrobat',
        'guia-en-sin-subir',
        'guia-en-tribunales',
      ].sort(),
    );
  });

  for (const pagina of GUIAS_EN) {
    const guia = CONTENIDOS.en.guias.find((g) => g.id === pagina.id);
    const html = generarPagina(pagina, 'en');
    const ruta = rutaDe(pagina, 'en') ?? '';

    describe(ruta || pagina.id, () => {
      it('declara un metaTitulo corto (≤60, con keyword al frente) y ese es su <title>', () => {
        expect(guia).toBeDefined();
        const metaTitulo = guia?.metaTitulo ?? '';
        expect(metaTitulo.length, `metaTitulo de ${pagina.id}: "${metaTitulo}"`).toBeGreaterThan(10);
        expect(metaTitulo.length, `metaTitulo de ${pagina.id}: "${metaTitulo}"`).toBeLessThanOrEqual(
          TOPE_TITULO,
        );
        expect(html).toContain(`<title>${esc(metaTitulo)}</title>`);
        // El H1 (descriptivo, puede ser más largo) NO se usa como <title>.
        expect(html).toContain(`<h1>${esc(guia?.titulo ?? '')}</h1>`);
      });

      it('tiene su meta description propia, no vacía', () => {
        expect((guia?.descripcion.length ?? 0)).toBeGreaterThan(60);
        expect(html).toContain(`<meta name="description" content="${esc(guia?.descripcion ?? '')}" />`);
      });

      it('enlaza a la herramienta gratuita (el comprobador /en/checker/) con su UTM', () => {
        expect(guia?.enlaceComprobador).toBeDefined();
        expect(html).toContain('href="../../checker/?utm_source=guia"');
      });

      it('lleva un bloque «Related guides» con 2-4 enlaces a OTRAS guías inglesas', () => {
        const relacionadas = guia?.relacionadas ?? [];
        expect(relacionadas.length).toBeGreaterThanOrEqual(2);
        expect(relacionadas.length).toBeLessThanOrEqual(4);
        // Cada id relacionado existe, es OTRA guía inglesa, y no se enlaza a sí misma.
        for (const id of relacionadas) {
          expect(IDS_EN.has(id), `related id inexistente: ${id}`).toBe(true);
          expect(id).not.toBe(pagina.id);
        }
        expect(html).toContain('<nav class="relacionadas"');
        // Los enlaces relacionados apuntan a hermanas por ruta relativa (../slug/).
        const enlacesNav = [...html.matchAll(/<li><a href="([^"]+)">/g)].map((m) => m[1] ?? '');
        expect(enlacesNav.length).toBeGreaterThanOrEqual(2);
        for (const href of enlacesNav) {
          expect(href.startsWith('../'), `enlace relacionado no relativo: ${href}`).toBe(true);
          expect(href.endsWith('/'), `enlace relacionado sin barra final: ${href}`).toBe(true);
        }
      });

      it('no emite NINGÚN enlace de navegación raíz-absoluto (rompería la base de emergencia)', () => {
        // El canonical y og:url son absolutos al dominio (identidad), no navegación: usan
        // `href="https://…"`, así que la subcadena `href="/` no puede aparecer por ellos.
        expect(html).not.toContain('href="/');
        expect(html).not.toContain("href='/");
      });
    });
  }
});
