import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { CONTENIDOS } from './index';
import { escTexto } from './html';
import { PAGINAS, ficheroDe, localesDe } from './registro';

const RAIZ = resolve(__dirname, '..', '..');

/**
 * El FAQ vive en TRES sitios: la fuente de contenido, los <details> que ve el usuario y el
 * bloque FAQPage de datos estructurados que ve Google. Estaban duplicados a mano y ya habían
 * divergido: la fuente decía «la zona que marches a mano» y el JSON-LD decía «marques», durante
 * semanas, sin que nada fallara — `faq-jsonld.test.ts` comprobaba que el JSON fuera JSON, no que
 * dijera lo mismo. Ahora los tres salen del generador, y este test lo ancla.
 */

interface Pregunta {
  name: string;
  acceptedAnswer: { text: string };
}

function faqPageDe(html: string): Pregunta[] {
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    const bruto = m[1];
    if (bruto === undefined) continue;
    const datos = JSON.parse(bruto) as { '@type'?: string; mainEntity?: Pregunta[] };
    if (datos['@type'] === 'FAQPage') return datos.mainEntity ?? [];
  }
  return [];
}

const homes = PAGINAS.filter((p) => p.tipo === 'app' && p.origen === 'generado');

describe('paridad FAQ: fuente == <details> == FAQPage, por idioma', () => {
  for (const pagina of homes) {
    for (const locale of localesDe(pagina)) {
      const ruta = ficheroDe(pagina, locale) ?? '';
      const html = readFileSync(resolve(RAIZ, ruta), 'utf-8');
      const fuente = CONTENIDOS[locale].faq;

      it(`${ruta}: el FAQPage tiene exactamente las preguntas de la fuente, en el mismo orden`, () => {
        const jsonLd = faqPageDe(html);
        expect(jsonLd.map((q) => q.name)).toEqual(fuente.map((f) => f.pregunta));
      });

      it(`${ruta}: cada respuesta del FAQPage es la de la fuente, palabra por palabra`, () => {
        const jsonLd = faqPageDe(html);
        expect(jsonLd.map((q) => q.acceptedAnswer.text)).toEqual(fuente.map((f) => f.respuesta));
      });

      it(`${ruta}: los <details> visibles llevan la misma pregunta y la misma respuesta`, () => {
        for (const item of fuente) {
          expect(html).toContain(`<summary>${escTexto(item.pregunta)}</summary>`);
          expect(html).toContain(`<p>${escTexto(item.respuesta)}</p>`);
        }
      });
    }
  }
});
