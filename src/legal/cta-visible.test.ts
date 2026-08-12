import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { PAGINAS, ficheroDe, localesDe } from '../content/registro';
import { sistemaFuente } from '../estilo/sistema';

/**
 * NINGUN ELEMENTO PULSABLE PUEDE COMPARTIR COLOR DE RELLENO CON SU FONDO.
 *
 * Medido en el navegador, con el sistema en modo oscuro: en `/actas/` y en `/nominas/` el relleno
 * de los dos CTA y el fondo de la pagina eran los dos `rgb(15,23,42)`. Contraste 1:1 y cero borde:
 * los botones DESAPARECIAN y solo quedaba el texto blanco flotando. En claro se veian
 * perfectamente, asi que el defecto no aparecia en ninguna revision que no mirase la pagina en
 * oscuro — y son los dos unicos botones de conversion de una landing de sector.
 *
 * ⚠ ESTA GUARDA ABRIA DOS FICHEROS Y EL FALLO VIVIA EN DOCE QUE NUNCA MIRABA. Su lista era
 * `const PAGINAS = ['actas', 'nominas']`, y el mismo defecto seguia vivo, medido, en las SEIS
 * guias espanolas (CTA #0f172a sobre fondo #0f172a: 1,00:1, sin borde) y en las SEIS inglesas
 * (#1e293b sobre #0f172a: 1,22:1, cuando 1.4.11 pide 3:1). Doctrina de la casa: una excepcion a un
 * guardian sobrevive a la razon que la creo. Ahora la lista de paginas se DERIVA del registro del
 * sitio y son las dieciocho.
 *
 * Y la forma del arreglo cambia: en vez de repintar el tema oscuro, el sitio declara UNA SOLA
 * CARA, clara, en las dieciocho paginas. Motivos de visitante, no de gusto:
 *  1. lo que el producto entrega es un papel blanco, y la herramienta que lo fabrica pareciendose
 *     a el es lo verdadero;
 *  2. desaparece el FOGONAZO: con el movil en oscuro, el recorrido guia -> portada -> comprobador
 *     daba marino, blanco y marino, porque cada pagina hacia una cosa distinta (dos siempre
 *     blancas, dos siempre marino y catorce siguiendo al sistema);
 *  3. es donde vivia el fallo.
 * Coste, dicho en voz alta: quien navega de noche ve una pagina clara. Se mitiga con la paleta —
 * el papel es #f6f5f3 y la tinta es calida, no blanco puro con negro azulado.
 */

const RAIZ = resolve(__dirname, '..', '..');

/** Las dieciocho paginas del sitio, DERIVADAS del registro. Nunca una lista escrita a mano. */
const PAGINAS_DEL_SITIO: string[] = PAGINAS.flatMap((pagina) =>
  localesDe(pagina)
    .map((locale) => ficheroDe(pagina, locale))
    .filter((ruta): ruta is string => ruta !== null),
);

function html(ruta: string): string {
  return readFileSync(resolve(RAIZ, ruta), 'utf-8');
}

/** Todo el CSS que la pagina lleva dentro (puede traer mas de un <style>). */
function cssDe(pagina: string): string {
  return [...html(pagina).matchAll(/<style>([\s\S]*?)<\/style>/g)].map((m) => m[1] ?? '').join('\n');
}

/** Resuelve un valor de color a hexadecimal: acepta `var(--token)` y `#rrggbb`. */
function resolver(valor: string): string | null {
  const v = valor.trim().toLowerCase();
  const token = /^var\(--([\w-]+)\)$/.exec(v);
  if (token !== null) {
    const hex = new RegExp(`--${token[1]}:\\s*(#[0-9a-f]{6})`, 'i').exec(sistemaFuente())?.[1];
    return hex?.toLowerCase() ?? null;
  }
  return /^#[0-9a-f]{6}$/.test(v) ? v : null;
}

function contraste(a: string, b: string): number {
  const luz = (hex: string): number => {
    const canal = (i: number): number => {
      const x = Number.parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16) / 255;
      return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * canal(0) + 0.7152 * canal(1) + 0.0722 * canal(2);
  };
  const [x, y] = [luz(a), luz(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

/** Ultimo `background` declarado para un selector dentro de un trozo de CSS. */
function fondoDe(css: string, selector: string): string | null {
  const bloques = [...css.matchAll(new RegExp(`${selector}\\s*\\{([^}]*)\\}`, 'g'))];
  let valor: string | null = null;
  for (const bloque of bloques) {
    const m = /(?:^|;)\s*background(?:-color)?\s*:\s*([^;]+)/.exec(bloque[1] ?? '');
    if (m?.[1] !== undefined) valor = m[1].trim();
  }
  return valor;
}

describe('G17: las paginas del sitio declaran UNA cara y ningun CTA se funde con su fondo', () => {
  // Eran dieciocho; el 2026-08-10 se sumaron las CINCO landings de cola larga sectorial (guias
  // generadas, solo en espanol) y el sitio paso a veintitres; el 2026-08-12 la pieza de autoridad
  // AEO (generada, solo en espanol) lo dejo en veinticuatro.
  it('el barrido ve las veinticuatro paginas del sitio', () => {
    expect(PAGINAS_DEL_SITIO.length).toBe(24);
  });

  it.each(PAGINAS_DEL_SITIO)('%s no declara ningun bloque de tema oscuro', (pagina) => {
    expect(html(pagina)).not.toContain('prefers-color-scheme');
  });

  it.each(PAGINAS_DEL_SITIO)('%s declara `color-scheme: light`', (pagina) => {
    // Va en el bloque del sistema, que llevan las dieciocho: asi los controles nativos (campos,
    // desplegables, barras) tampoco se pintan en oscuro sobre una pagina clara.
    expect(cssDe(pagina)).toMatch(/color-scheme:\s*light\s*;/);
    expect(cssDe(pagina)).not.toMatch(/color-scheme:\s*light dark/);
  });

  /**
   * El relleno de un pulsable frente al de su fondo, calculando. Se barren los CTA de todas las
   * familias que existen en el sitio (`.cta` en las landings y las guias escritas a mano,
   * `.cp-cta` en el comprobador y las guias generadas), y donde no hay CTA no hay nada que
   * comprobar — pero el barrido SI pasa por la pagina, que es lo que fallaba antes.
   */
  it.each(PAGINAS_DEL_SITIO)('%s: el CTA no comparte relleno con la pagina', (pagina) => {
    const css = cssDe(pagina);
    const fondoPagina = resolver(fondoDe(css, '\\bbody') ?? 'var(--papel)');
    expect(fondoPagina, 'el fondo de la pagina se resuelve').not.toBeNull();

    for (const selector of ['\\.cta', '\\.cp-cta', '\\.comprar']) {
      const declarado = fondoDe(css, selector);
      if (declarado === null) continue;
      const fondoCta = resolver(declarado);
      expect(fondoCta, `${selector} declara un relleno resoluble`).not.toBeNull();
      expect(fondoCta).not.toBe(fondoPagina);
      // 3:1 es el minimo de 1.4.11 para el contorno de un componente; un boton macizo que solo se
      // distingue del papel por un pelo es un boton que no esta.
      expect(
        contraste(fondoCta ?? '#000000', fondoPagina ?? '#ffffff'),
        `${selector} contra el fondo de ${pagina}`,
      ).toBeGreaterThanOrEqual(3);
    }
  });

  it.each(PAGINAS_DEL_SITIO)('%s: el texto del CTA se lee sobre su relleno (>= 4,5:1)', (pagina) => {
    const css = cssDe(pagina);
    for (const selector of ['\\.cta', '\\.cp-cta', '\\.comprar']) {
      const relleno = fondoDe(css, selector);
      if (relleno === null) continue;
      const bloque = new RegExp(`${selector}\\s*\\{([^}]*)\\}`).exec(css)?.[1] ?? '';
      const color = /(?:^|;)\s*color\s*:\s*([^;]+)/.exec(bloque)?.[1] ?? '';
      const tinta = resolver(color);
      const fondo = resolver(relleno);
      if (tinta === null || fondo === null) continue;
      expect(contraste(tinta, fondo), `${selector} en ${pagina}`).toBeGreaterThanOrEqual(4.5);
    }
  });
});
