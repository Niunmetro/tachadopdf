import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { CONTENIDOS } from './index';
import { CSP } from './generar';
import { esc, escTexto } from './html';
import { PAGINAS, ficheroDe, rutaDe, urlCanonica } from './registro';
import { externalResourceRefs } from '../test/landing-helpers';

/**
 * LAS LANDINGS DE COLA LARGA SECTORIAL (2026-08-10).
 *
 * Cinco páginas nuevas, una por consulta real medida en el diagnóstico de keywords, que persiguen
 * la demanda que SÍ existe («censurar/ocultar/borrar/tapar datos de un PDF» por sector) donde los
 * gigantes son genéricos. Son `origen: 'generado'`, así que heredan sin copiar el sistema visual,
 * la CSP, el favicon, el canonical auto-referente y el sitemap; esta guarda ata que esa herencia
 * llegó al fichero de disco que de verdad se publica, y —lo más importante— que las páginas NO son
 * casi-duplicados.
 *
 * POR QUÉ EL PARECIDO ES LA GUARDA CLAVE: Google penaliza el «scaled content abuse» (contenido a
 * escala casi-idéntico con la keyword cambiada) tumbando el grueso del tráfico. Una plantilla
 * rellenada cinco veces es exactamente lo que hay que impedir. Se mide con Jaccard de 3-gramas de
 * palabra (tras normalizar acentos y puntuación), entre las cinco nuevas entre sí y contra las seis
 * guías españolas que ya existen y funcionan.
 *
 * ⚠ UMBRAL MEDIDO, no inventado: al escribir estas páginas el parecido MÁXIMO de cualquier par fue
 * 0,074 (nueva vs guía existente) y 0,061 (entre nuevas). Un clon con solo la keyword cambiada
 * puntúa por encima de 0,8. El umbral se fija en 0,30: deja un margen de 4× sobre lo medido y aun
 * así se pone rojo en cuanto alguien clone una página en vez de escribirla. Si una futura landing
 * legítima roza el umbral, el arreglo es diferenciar su contenido, NO subir el número.
 */
const RAIZ = resolve(__dirname, '..', '..');
const UMBRAL_PARECIDO = 0.3;

/** Las landings nuevas se DERIVAN del registro (guías generadas con slug español), nunca de una
 *  lista escrita a mano: si mañana se añade otra, entra en el barrido sola. Las guías inglesas
 *  generadas no tienen slug español, así que quedan fuera. */
const LANDINGS = PAGINAS.filter(
  (p) => p.tipo === 'guia' && p.origen === 'generado' && p.slugs.es !== undefined,
);
/** Las seis guías españolas escritas a mano, la referencia contra la que no puede haber duplicado. */
const GUIAS_ESTATICAS = PAGINAS.filter(
  (p) => p.tipo === 'guia' && p.origen === 'estatico' && p.slugs.es !== undefined,
);

function htmlDe(id: string): string {
  const pagina = PAGINAS.find((p) => p.id === id);
  if (pagina === undefined) throw new Error(`no existe la página ${id}`);
  return readFileSync(resolve(RAIZ, ficheroDe(pagina, 'es') ?? ''), 'utf-8');
}

function textoVisible(html: string): string {
  return html
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ');
}

/** Palabras normalizadas: minúsculas, sin acentos, sin puntuación. El parecido se mide sobre el
 *  contenido, no sobre la ortografía. */
function palabras(html: string): string[] {
  return textoVisible(html)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 0);
}

function trigramas(ws: string[]): Set<string> {
  const s = new Set<string>();
  for (let i = 0; i + 3 <= ws.length; i += 1) s.add(`${ws[i]} ${ws[i + 1]} ${ws[i + 2]}`);
  return s;
}

function jaccard(a: Set<string>, b: Set<string>): number {
  let inter = 0;
  for (const x of a) if (b.has(x)) inter += 1;
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}

describe('las cinco landings de cola larga sectorial existen y están integradas', () => {
  it('el barrido ve las páginas generadas en español (derivadas del registro, no escritas a mano)', () => {
    // Las cinco landings de cola larga sectorial (2026-08-10) MÁS la pieza de autoridad AEO
    // (2026-08-12). Cualquier página generada en español entra sola en el barrido anti-duplicado:
    // ese es justo el punto, que ninguna sea casi-igual a otra ni a las guías que ya existen.
    expect(LANDINGS.map((p) => p.id).sort()).toEqual(
      [
        'guia-alumnos',
        'guia-copia-dni',
        'guia-curriculum',
        'guia-prueba-juicio',
        'guia-publicar-internet',
        'guia-recuperar-tachado',
      ].sort(),
    );
    expect(GUIAS_ESTATICAS.length).toBe(6);
  });

  for (const pagina of LANDINGS) {
    const guia = CONTENIDOS.es.guias.find((g) => g.id === pagina.id);
    const html = htmlDe(pagina.id);
    const nombre = ficheroDe(pagina, 'es') ?? pagina.id;

    describe(nombre, () => {
      it('está declarada como generada en español y solo en español (sin hreflang)', () => {
        expect(pagina.origen).toBe('generado');
        expect(pagina.slugs.en).toBeUndefined();
        expect(html).not.toContain('rel="alternate"');
      });

      it('declara la CSP del sitio, byte a byte', () => {
        const m = html.match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)"/);
        expect(m?.[1]).toBe(CSP);
      });

      it('no referencia ningún recurso externo', () => {
        expect(externalResourceRefs(html)).toEqual([]);
      });

      it('tiene canonical auto-referente y su meta description propia', () => {
        expect(html).toContain(`<link rel="canonical" href="${urlCanonica(pagina, 'es')}" />`);
        expect(guia).toBeDefined();
        expect(guia?.descripcion.length ?? 0).toBeGreaterThan(60);
        expect(html).toContain(`<meta name="description" content="${esc(guia?.descripcion ?? '')}" />`);
      });

      it('lleva su H1, su título y un cuerpo indexable de sobra sin ejecutar JavaScript', () => {
        expect(html).toContain(`<h1>${esc(guia?.titulo ?? '')}</h1>`);
        expect(html).toContain(`<title>${esc(guia?.titulo ?? '')} · TachadoPDF</title>`);
        expect(palabras(html).length).toBeGreaterThan(300);
      });

      it('da acceso al comprobador gratuito Y a la herramienta (los dos CTA)', () => {
        expect(guia?.enlaceComprobador).toBeDefined();
        expect(html).toContain('../../comprobador/?utm_source=guia');
        expect(html).toContain('../../?utm_source=guia');
      });

      it('está en el sitemap', () => {
        const sitemap = readFileSync(resolve(RAIZ, 'public', 'sitemap.xml'), 'utf-8');
        expect(sitemap).toContain(`<loc>${urlCanonica(pagina, 'es')}</loc>`);
      });
    });
  }
});

describe('la pieza de autoridad sirve su FAQ estructurada Y visible, sin divergir (AEO)', () => {
  // El valor de AEO es que un motor generativo cite la respuesta; para eso hace falta el FAQPage
  // de datos estructurados Y que esa misma respuesta esté visible en la página. Los dos salen del
  // mismo `guia.faqs` en el generador, pero esta guarda lo ata sobre el HTML de disco: si alguien
  // toca uno y no el otro, o cambia la fuente sin regenerar, se pone roja.
  const conFaqs = LANDINGS.map((p) => ({
    pagina: p,
    guia: CONTENIDOS.es.guias.find((g) => g.id === p.id),
  })).filter((x) => (x.guia?.faqs?.length ?? 0) > 0);

  it('al menos una página generada declara FAQ (el barrido no está vacío)', () => {
    expect(conFaqs.length).toBeGreaterThan(0);
  });

  for (const { pagina, guia } of conFaqs) {
    const html = htmlDe(pagina.id);
    const faqs = guia?.faqs ?? [];
    const nombre = ficheroDe(pagina, 'es') ?? pagina.id;

    describe(nombre, () => {
      it('el FAQPage tiene exactamente las preguntas y respuestas de la fuente, en orden', () => {
        let faqPage: { name: string; acceptedAnswer: { text: string } }[] | undefined;
        for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
          const datos = JSON.parse(m[1] ?? '') as {
            '@type'?: string;
            mainEntity?: { name: string; acceptedAnswer: { text: string } }[];
          };
          if (datos['@type'] === 'FAQPage') faqPage = datos.mainEntity;
        }
        expect(faqPage).toBeDefined();
        expect(faqPage?.map((q) => q.name)).toEqual(faqs.map((f) => f.pregunta));
        expect(faqPage?.map((q) => q.acceptedAnswer.text)).toEqual(faqs.map((f) => f.respuesta));
      });

      it('cada pregunta y su respuesta están VISIBLES en la página (details desnudo)', () => {
        for (const item of faqs) {
          expect(html).toContain(`<summary>${escTexto(item.pregunta)}</summary>`);
          expect(html).toContain(`<p>${escTexto(item.respuesta)}</p>`);
        }
      });
    });
  }
});

describe('ninguna landing es un casi-duplicado (scaled content abuse)', () => {
  const corpus = [...LANDINGS, ...GUIAS_ESTATICAS].map((p) => ({
    id: p.id,
    nueva: p.origen === 'generado',
    sh: trigramas(palabras(htmlDe(p.id))),
  }));

  const nuevas = corpus.filter((d) => d.nueva);

  it('cada par de landings nuevas está por debajo del umbral de parecido', () => {
    for (let i = 0; i < nuevas.length; i += 1) {
      for (let j = i + 1; j < nuevas.length; j += 1) {
        const s = jaccard(nuevas[i]!.sh, nuevas[j]!.sh);
        expect(s, `${nuevas[i]!.id} vs ${nuevas[j]!.id}`).toBeLessThan(UMBRAL_PARECIDO);
      }
    }
  });

  it('ninguna landing nueva se parece demasiado a una guía que ya existe', () => {
    const viejas = corpus.filter((d) => !d.nueva);
    for (const nueva of nuevas) {
      for (const vieja of viejas) {
        const s = jaccard(nueva.sh, vieja.sh);
        expect(s, `${nueva.id} vs ${vieja.id}`).toBeLessThan(UMBRAL_PARECIDO);
      }
    }
  });
});
