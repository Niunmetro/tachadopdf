import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

/**
 * Impide que vuelva a aparecer texto de cara al usuario incrustado en el punto de uso. Recorre
 * los .ts de producción de src/ buscando las formas que ponen texto en pantalla y falla si el
 * lado derecho es un LITERAL en vez de una referencia a la copia.
 *
 * LIMITACIÓN, dicha en voz alta: no caza el texto ensamblado a distancia
 * (`const m = 'hola'; x.textContent = m`). No hace falta que sea completo; hace falta que cace
 * el camino perezoso, que es el que se toma con prisa. Antes de este trabajo había 61
 * asignaciones `textContent = <literal>` en src/; el objetivo es mantener el cero.
 */

const SRC = resolve(__dirname, '..');

// El generador de páginas construye HTML: sus literales SON marcado, no copia. La copia que
// pinta la vigila el resto de la suite (contenido-indexable, pages-generadas).
const EXENTOS = new Set(['content/generar.ts', 'content/html.ts']);

const PATRONES: { nombre: string; regex: RegExp }[] = [
  {
    nombre: '.textContent = <literal>',
    regex: /\.textContent\s*=\s*(['"`])(?!\s*\1)/g,
  },
  {
    nombre: '.placeholder = <literal>',
    regex: /\.placeholder\s*=\s*(['"`])(?!\s*\1)/g,
  },
  {
    nombre: "setAttribute('aria-label'|'title'|'placeholder', <literal>)",
    regex: /setAttribute\(\s*['"](?:aria-label|title|placeholder)['"]\s*,\s*['"`](?!\s*['"`])/g,
  },
  {
    nombre: '.title = <literal>',
    regex: /\.title\s*=\s*(['"`])(?!\s*\1)/g,
  },
];

function listarTs(dir: string): string[] {
  const salida: string[] = [];
  for (const entrada of readdirSync(dir, { withFileTypes: true })) {
    const ruta = join(dir, entrada.name);
    if (entrada.isDirectory()) {
      salida.push(...listarTs(ruta));
    } else if (entrada.name.endsWith('.ts') && !entrada.name.endsWith('.test.ts')) {
      salida.push(ruta);
    }
  }
  return salida;
}

const ficheros = listarTs(SRC).filter(
  (f) => !EXENTOS.has(relative(SRC, f).split('\\').join('/')),
);

describe('nada de cadenas sueltas de cara al usuario en src/', () => {
  it('el escaneo no está vacío', () => {
    expect(ficheros.length).toBeGreaterThan(10);
  });

  it.each(PATRONES)('ningún fichero de producción usa $nombre', ({ regex }) => {
    const infractores: string[] = [];
    for (const fichero of ficheros) {
      const contenido = readFileSync(fichero, 'utf-8');
      for (const linea of contenido.split('\n').entries()) {
        const [numero, texto] = linea;
        // `'' ` (cadena vacía: limpiar un nodo) sí está permitido; lo excluye el lookahead.
        const buscador = new RegExp(regex.source, 'g');
        if (buscador.test(texto)) {
          infractores.push(`${relative(SRC, fichero)}:${numero + 1}  ${texto.trim()}`);
        }
      }
    }
    expect(infractores).toEqual([]);
  });
});
