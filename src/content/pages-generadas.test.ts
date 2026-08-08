import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { generarSitio } from './generar';

const RAIZ = resolve(__dirname, '..', '..');

/**
 * Este es el test que sostiene a todos los demás sobre HTML: prohíbe editar a mano cualquier
 * página generada. Sin él, un cambio en el contenido y una edición manual del HTML pueden
 * divergir en silencio — que es exactamente lo que pasó con el FAQ («marches» en textos.ts
 * frente a «marques» en el JSON-LD de index.html, durante semanas y sin que nada fallara).
 *
 * Se comparan los saltos de línea normalizados a '\n' a propósito: `core.autocrlf` está a true
 * en el repo, así que el árbol de trabajo puede tener CRLF y el generador siempre escribe LF.
 * Lo contractual es el CONTENIDO, no la política de finales de línea del checkout.
 */
function normalizar(texto: string): string {
  return texto.replace(/\r\n/g, '\n');
}

describe('las páginas generadas están al día en disco', () => {
  const ficheros = generarSitio();

  it('el generador produce al menos la home, el comprobador y el sitemap', () => {
    const rutas = ficheros.map((f) => f.ruta);
    expect(rutas).toContain('index.html');
    expect(rutas).toContain('comprobador/index.html');
    expect(rutas).toContain('public/sitemap.xml');
  });

  it.each(ficheros.map((f) => f.ruta))(
    '%s en disco coincide byte a byte con lo que produce el generador',
    (ruta) => {
      const esperado = ficheros.find((f) => f.ruta === ruta);
      expect(esperado).toBeDefined();
      const enDisco = readFileSync(resolve(RAIZ, ruta), 'utf-8');
      expect(normalizar(enDisco)).toBe(normalizar(esperado?.contenido ?? ''));
    },
  );
});
