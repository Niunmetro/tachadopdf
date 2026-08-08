import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { CONTENIDOS } from './index';
import { escTexto } from './html';
import { generarPagina } from './generar';
import { LOCALES, PAGINAS, ficheroDe, localesDe } from './registro';

const RAIZ = resolve(__dirname, '..', '..');

/** Texto que un rastreador ve SIN ejecutar JavaScript: fuera <script> y <style>, fuera etiquetas. */
export function textoVisible(html: string): string {
  return html
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const MINIMO_HOME = 1500;

const paginasApp = PAGINAS.filter((p) => p.tipo === 'app' && p.origen === 'generado');

describe('la portada se publica CON su texto dentro (no un div vacío)', () => {
  for (const pagina of paginasApp) {
    for (const locale of localesDe(pagina)) {
      const contenido = CONTENIDOS[locale];
      const html = generarPagina(pagina, locale);
      const visible = textoVisible(html);

      describe(`${ficheroDe(pagina, locale) ?? '?'} (${locale})`, () => {
        it(`tiene más de ${MINIMO_HOME} caracteres de texto visible sin ejecutar JavaScript`, () => {
          expect(visible.length).toBeGreaterThan(MINIMO_HOME);
        });

        it('el <div id="app"> NO es el único hijo del <body>: lleva contenido dentro', () => {
          const cuerpo = html.slice(html.indexOf('<body>'), html.indexOf('</body>'));
          const app = cuerpo.slice(cuerpo.indexOf('<div id="app"'));
          const interior = app.slice(app.indexOf('>') + 1);
          expect(interior.trim().length).toBeGreaterThan(MINIMO_HOME);
          expect(cuerpo).not.toMatch(/<div id="app"[^>]*>\s*<\/div>/);
        });

        it('el <h1> es el titular de la fuente de contenido', () => {
          expect(html).toContain(`<h1 class="hero__titular">${escTexto(contenido.landing.titular)}</h1>`);
        });

        it('el aviso de alcance y el texto del dolor están en el HTML', () => {
          expect(visible).toContain(contenido.landing.dolor);
          expect(visible).toContain(contenido.landing.avisoPrincipal);
        });

        it('las preguntas del FAQ están en el HTML, literales', () => {
          const presentes = contenido.faq.filter((item) => visible.includes(item.pregunta));
          expect(presentes.length).toBe(contenido.faq.length);
        });

        it('las tres secciones legales están en el HTML', () => {
          for (const seccion of contenido.legal.secciones) {
            expect(html).toContain(`<details id="${seccion.id}">`);
          }
        });

        it('enlaza TODAS las guías del idioma', () => {
          const enlazadas = contenido.guias.filter((g) => visible.includes(g.tituloEnlace));
          expect(enlazadas.length).toBe(contenido.guias.length);
        });
      });
    }
  }
});

// El guardián fuerte es el de arriba (sobre la fuente, que pages-generadas.test.ts ancla al
// disco). Este, además, mira el artefacto CONSTRUIDO si existe: es el fichero que de verdad se
// publica, y era justo el que salía vacío. Se salta si no hay dist/ porque `npm test` no
// construye — decirlo en voz alta es mejor que fingir cobertura.
describe('dist/ construido (si existe)', () => {
  const home = paginasApp[0];
  const rutaDist =
    home === undefined ? null : resolve(RAIZ, 'dist', ficheroDe(home, LOCALES[0] ?? 'es') ?? '');
  const hayDist = rutaDist !== null && existsSync(rutaDist);

  it.runIf(hayDist)('dist/index.html contiene el texto de la portada, no un div vacío', () => {
    const html = readFileSync(rutaDist ?? '', 'utf-8');
    expect(textoVisible(html).length).toBeGreaterThan(MINIMO_HOME);
    expect(html).not.toMatch(/<div id="app"[^>]*>\s*<\/div>/);
  });
});
