import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { SIMBOLO_MANCHETA } from './generar';

/**
 * EL SÍMBOLO DE LA MARCA EN SU RANURA, en las DIECIOCHO páginas.
 *
 * El hueco de 20×20 a la izquierda de «TachadoPDF» llevaba desde el rediseño AUSENTE del DOM a
 * propósito (un cuadrado vacío se lee como imagen rota). Ahora lo ocupa el símbolo — documento con
 * renglones, uno con un HUECO limpio: el dato borrado de verdad, no tapado con un rectángulo
 * negro. Estas guardas atan que:
 *   1. está en las 18 páginas, DENTRO de la marca y ANTES de la palabra (no flotando suelto);
 *   2. es UNA SOLA TINTA vía `currentColor` — nada de degradados, nada de un segundo color;
 *   3. es un DOCUMENTO, no un candado ni un escudo (lo que usan las webs de phishing);
 *   4. la copia inline de la mancheta y el fichero suelto `public/simbolo.svg` NO derivan.
 */

const RAIZ = resolve(__dirname, '..', '..');
const SALTAR = new Set(['node_modules', 'dist', '.git', '.forja', 'forja', '.claude', 'arte-gumroad']);

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

/** La palabra doblada en 24u que hace el contorno del documento. Su presencia distingue un papel
 *  de un candado (arco + cuerpo) o un escudo (uve inferior): ninguno lleva la esquina M13.4 2.6V8. */
const CONTORNO_DOCUMENTO = 'd="M6 2.6h7.6L19 8v13.4H6z"';
const ESQUINA_DOBLADA = 'd="M13.4 2.6V8H19"';
const RENGLON_CON_HUECO = '<line x1="13.6" y1="15.2" x2="16.3" y2="15.2"/>';

describe('el símbolo de la marca, en las 18 páginas', () => {
  it('el barrido ve todas las páginas', () => {
    expect(PAGINAS.length).toBeGreaterThanOrEqual(18);
  });

  it.each(PAGINAS)('%s lleva el símbolo dentro de la marca y antes del nombre', (relativo) => {
    const html = readFileSync(resolve(RAIZ, relativo), 'utf-8');
    // El símbolo va DENTRO de `.cabecera__marca` y pegado, antes de «TachadoPDF»: si flotara
    // suelto o fuera detrás de la palabra, esta expresión no casaría.
    const m = /<p class="cabecera__marca">(<svg class="cabecera__simbolo"[\s\S]*?<\/svg>)TachadoPDF<\/p>/.exec(
      html,
    );
    expect(m, 'símbolo en la ranura, antes del nombre').not.toBeNull();
    const svg = m?.[1] ?? '';
    // UNA SOLA TINTA: currentColor, y ni un degradado ni un segundo color escrito a mano.
    expect(svg).toContain('stroke="currentColor"');
    expect(svg).not.toMatch(/fill="#/);
    expect(svg).not.toMatch(/stroke="#/);
    expect(svg.toLowerCase()).not.toContain('gradient');
    // Es un DOCUMENTO con su esquina doblada y su renglón roto, no un candado ni un escudo.
    expect(svg).toContain(CONTORNO_DOCUMENTO);
    expect(svg).toContain(ESQUINA_DOBLADA);
    expect(svg).toContain(RENGLON_CON_HUECO);
  });
});

describe('el fichero vectorial suelto no deriva de la copia de la mancheta', () => {
  /** Núcleo geométrico compartido: las seis instrucciones de dibujo, sin envoltura. Es lo que no
   *  puede diferir entre el inline y el fichero; el resto (clase, aria) es propio de cada uso. */
  const NUCLEO = [
    'd="M6 2.6h7.6L19 8v13.4H6z"',
    'd="M13.4 2.6V8H19"',
    'x1="8.7" y1="12.2" x2="16.3" y2="12.2"',
    'x1="8.7" y1="15.2" x2="11.1" y2="15.2"',
    'x1="13.6" y1="15.2" x2="16.3" y2="15.2"',
    'x1="8.7" y1="18.2" x2="13.4" y2="18.2"',
  ];

  it('public/simbolo.svg existe, es una sola tinta y comparte el trazo con la mancheta', () => {
    const svg = readFileSync(resolve(RAIZ, 'public', 'simbolo.svg'), 'utf-8');
    expect(svg).toContain('viewBox="0 0 24 24"');
    expect(svg).toContain('stroke="currentColor"');
    expect(svg).not.toMatch(/fill="#/);
    expect(svg.toLowerCase()).not.toContain('gradient');
    for (const trozo of NUCLEO) {
      expect(svg, `simbolo.svg contiene ${trozo}`).toContain(trozo);
      expect(SIMBOLO_MANCHETA, `la mancheta contiene ${trozo}`).toContain(trozo);
    }
  });
});
