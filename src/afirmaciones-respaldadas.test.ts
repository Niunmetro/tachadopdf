import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

/**
 * UNA AFIRMACIÓN RETIRADA DE LA FUENTE NO ESTÁ RETIRADA HASTA QUE ESTÁ RETIRADA DE PRODUCCIÓN.
 *
 * El 2026-08-08 se comprobaron las cifras de la web contra la fuente primaria y se retiraron dos
 * por no tener ningún expediente detrás («la AEPD ha sancionado a más de 200 comunidades de
 * propietarios» y «6.000 € por un listado de morosos»). Se retiraron de `src/legal/textos.ts`, con
 * su nota de «no las devuelvas sin un expediente detrás». El 2026-08-10, diecisiete días después,
 * seguían publicadas en el dominio: el registro de la retirada y el despliegue de la retirada son
 * la misma tarea, no dos, y no había NADA que lo vigilara.
 *
 * Esta guarda mide el HTML del repositorio, que es lo que sale por la puerta, no la intención
 * escrita en un comentario. La regla que impone es la que la guía de sanciones ya se había puesto
 * a sí misma en su cabecera: aquí no entra ningún importe de sanción sin su número de expediente.
 *
 * Por qué la ventana es de 700 caracteres y no de 200: medido sobre las páginas reales, la mayor
 * distancia legítima entre un importe y su expediente es de 570 (el titular de la guía de
 * sanciones y la cita que lo respalda, con una lista de por medio). Estrecharla convertiría la
 * guarda en ruido; ensancharla dejaría pasar una cifra suelta al otro extremo de la página.
 *
 * ⚠ LÍMITE MEDIDO DE LA GUARDA DE PROXIMIDAD, dicho aquí para que nadie la crea más fuerte de lo
 * que es: una cifra inventada que se cuele A DOS PÁRRAFOS de un expediente legítimo pasa. Se
 * comprobó reinyectando «6.000 € por un listado de morosos» en `/actas/`, junto al párrafo que
 * cita PS/00378/2019: la proximidad da verde y lo que la caza es el barrido literal de abajo. La
 * proximidad protege de la página nueva sin ninguna fuente; los literales protegen de la
 * reincidencia concreta. Hacen falta las dos.
 */
const RAIZ = resolve(__dirname, '..');
const SALTAR = new Set(['node_modules', 'dist', '.git', '.forja', 'forja', '.claude', 'arte-gumroad']);

/** Cuánto texto alrededor de un importe se admite como «su contexto». Medido, ver cabecera. */
const VENTANA = 700;

const IMPORTE = /([\d][\d.,]*)\s*(?:&nbsp;)?€/g;
/** El importe habla de una sanción y no de nuestro precio. */
const CONTEXTO_SANCION = /AEPD|Agencia Española de Protección de Datos|sanci|mult/i;
/** Un expediente de la AEPD, citado por su número o por la URL de su resolución. */
const EXPEDIENTE = /PS\/\d{5}\/\d{4}|ps-\d{5}-\d{4}/i;

function listarHtml(dir: string): string[] {
  const salida: string[] = [];
  for (const entrada of readdirSync(dir, { withFileTypes: true })) {
    if (SALTAR.has(entrada.name)) continue;
    const ruta = join(dir, entrada.name);
    if (entrada.isDirectory()) salida.push(...listarHtml(ruta));
    else if (entrada.name.endsWith('.html')) salida.push(ruta);
  }
  return salida;
}

const PAGINAS = listarHtml(RAIZ).map((f) => relative(RAIZ, f).split('\\').join('/'));

function contexto(html: string, indice: number): string {
  return html.slice(Math.max(0, indice - VENTANA), indice + VENTANA);
}

describe('ningún importe de sanción se publica sin su expediente', () => {
  it('el barrido cubre las páginas publicadas', () => {
    expect(PAGINAS).toContain('public/actas/index.html');
    expect(PAGINAS).toContain('public/guia/sanciones-aepd-comunidades-propietarios/index.html');
    expect(PAGINAS.length).toBeGreaterThanOrEqual(16);
  });

  it.each(PAGINAS)('%s: todo importe presentado como sanción cita su expediente', (relativo) => {
    const html = readFileSync(resolve(RAIZ, relativo), 'utf-8');
    for (const m of html.matchAll(IMPORTE)) {
      const ctx = contexto(html, m.index ?? 0);
      if (!CONTEXTO_SANCION.test(ctx)) continue; // es un precio nuestro, no una multa ajena
      expect(ctx, `importe «${m[0]}» en ${relativo}`).toMatch(EXPEDIENTE);
    }
  });
});

describe('las dos cifras retiradas el 2026-08-08 no pueden volver en silencio', () => {
  // La guía de sanciones SÍ nombra el recuento de las 200 comunidades — para desmentirlo. Un
  // barrido literal la marcaría y alguien acabaría borrando la advertencia, que es lo contrario
  // de lo que se quiere. Así que lo que se exige es la negación, no la ausencia.
  const DESMENTIDO = /no proced|no hemos podido rastrear|sin (?:ningún )?expediente|que circulan/i;

  it.each(PAGINAS)('%s: «más de N comunidades» solo aparece para desmentirlo', (relativo) => {
    const html = readFileSync(resolve(RAIZ, relativo), 'utf-8');
    for (const m of html.matchAll(/más de\s*\d+\s*comunidades/gi)) {
      expect(contexto(html, m.index ?? 0), `en ${relativo}`).toMatch(DESMENTIDO);
    }
  });

  it.each(PAGINAS)('%s: no afirma un plural de sanciones que no está contado', (relativo) => {
    const html = readFileSync(resolve(RAIZ, relativo), 'utf-8');
    // La guía de administradores atribuía a la Agencia una serie de expedientes contra
    // comunidades, en plural, cuando solo se ha comprobado uno. Un plural sin recuento detrás es
    // una afirmación sin respaldo. (El literal va aquí y NO en las páginas: un comentario HTML se
    // publica igual que el texto, así que citar la frase prohibida dentro de la página la
    // reintroduce — pasó al escribir esta misma corrección.)
    expect(html).not.toMatch(/multado a comunidades/i);
    expect(html).not.toMatch(/ha sancionado a más de/i);
  });

  // El comprador inglés es un despacho, y `/en/` no se había desplegado nunca: el deploy que
  // saca el ámbar a producción habría sido el acto que PUBLICA esta frase. `docs/ESTADO.md` la
  // tenía anotada como «viene de la redacción, no de una comprobación».
  it.each(PAGINAS)('%s: no afirma la guía del ICO de julio de 2025', (relativo) => {
    const html = readFileSync(resolve(RAIZ, relativo), 'utf-8');
    expect(html).not.toMatch(/ICO published dedicated guidance/i);
    expect(html).not.toMatch(/July 2025[^.]{0,120}ICO/i);
  });

  // La proximidad no habría cazado esta: reinyectada en `/actas/` cae a dos párrafos de
  // PS/00378/2019 y se da por respaldada. Si esta cifra vuelve, vuelve con SU expediente pegado.
  it.each(PAGINAS)('%s: la multa de 6.000 € no vuelve sin su propio expediente', (relativo) => {
    const html = readFileSync(resolve(RAIZ, relativo), 'utf-8');
    for (const m of html.matchAll(/6\.?000\s*(?:&nbsp;)?€/g)) {
      const i = m.index ?? 0;
      expect(html.slice(Math.max(0, i - 150), i + 150), `en ${relativo}`).toMatch(EXPEDIENTE);
    }
  });
});
