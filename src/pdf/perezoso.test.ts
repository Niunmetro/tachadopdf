import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { PdfPasswordError } from './errores';
import { cargarEngine, cargarPipeline, memorizar } from './perezoso';

const SRC = resolve(__dirname, '..');

/**
 * mupdf instancia su wasm con un `await` a nivel de módulo: quien lo importa de forma ESTÁTICA no
 * ejecuta una línea hasta que se han bajado y compilado 10 MB de wasm. Con `src/main.ts` y
 * `src/comprobador/main.ts` importando `./pdf/engine` y `./pdf/pipeline`, la portada y el comprobador
 * descargaban el wasm al abrir la página —aunque el visitante no subiera ningún PDF— y el cableado
 * de los botones esperaba a esa descarga.
 *
 * Estos tests recorren los `import` ESTÁTICOS (los de tipo no cuentan: se borran al compilar) desde
 * el punto de entrada de cada página y fallan si alguna cadena llega a mupdf. Se mira el CLOSURE y no
 * solo el fichero de entrada a propósito: reimportar `./pdf/metadata` o `./pdf/occurrences` desde
 * cualquier módulo de la UI arrastraría mupdf igual de bien que importar `mupdf` directamente.
 * Lo que sí está permitido es `import()`: es exactamente lo que hace `perezoso.ts`.
 */

/** Páginas que NO deben bajar mupdf al cargarse. Las de PDF se abren con `import()` en `perezoso.ts`. */
const ENTRADAS = [
  'main.ts', // portada (ES y EN)
  'comprobador/main.ts', // comprobador (ES y EN)
  'imagen/main.ts', // redactor de imágenes (no abre PDF)
  'metadatos/main.ts', // limpiador de metadatos de foto (no abre PDF)
];

/** Módulos que arrastran mupdf: lo importan ellos mismos o por un import estático. */
const CON_MUPDF = ['pdf/engine.ts', 'pdf/pipeline.ts', 'pdf/metadata.ts', 'pdf/occurrences.ts'];

function sinComentarios(codigo: string): string {
  return codigo
    .replace(/^\s*\/\*[\s\S]*?\*\//gm, '') // bloques /* … */ y JSDoc que empiezan en su línea
    .replace(/^\s*\/\/.*$/gm, ''); // líneas // enteras
}

interface ImportEstatico {
  especificador: string;
}

/**
 * `import x from 'y'`, `import 'y'` y `export … from 'y'` que sobreviven a la compilación.
 * Quedan fuera `import type …` y `import { type A, type B } …` (todo tipo): se borran al compilar.
 */
function importsEstaticos(codigo: string): ImportEstatico[] {
  const limpio = sinComentarios(codigo);
  const salida: ImportEstatico[] = [];

  const conClausula = /^\s*(?:import|export)\s+(type\s+)?([\w\s{},*$]*?)\s*from\s*['"]([^'"]+)['"]/gm;
  for (const m of limpio.matchAll(conClausula)) {
    const [, tipo, clausula, especificador] = m;
    if (tipo !== undefined) continue;
    const todoTipo = /^\{\s*(?:type\s+[\w$]+(?:\s+as\s+[\w$]+)?\s*,?\s*)+\}$/.test((clausula ?? '').trim());
    if (todoTipo) continue;
    if (especificador !== undefined) salida.push({ especificador });
  }

  const efectoLateral = /^\s*import\s+['"]([^'"]+)['"]/gm;
  for (const m of limpio.matchAll(efectoLateral)) {
    if (m[1] !== undefined) salida.push({ especificador: m[1] });
  }
  return salida;
}

function resolverRelativo(desde: string, especificador: string): string | null {
  const base = resolve(dirname(desde), especificador);
  for (const candidato of [`${base}.ts`, resolve(base, 'index.ts')]) {
    if (existsSync(candidato)) return candidato;
  }
  return null; // un .css u otro recurso: no es código que pueda arrastrar mupdf
}

/** Todo lo que se ejecuta al cargar `entrada`: ficheros de `src/` y paquetes npm. */
function cierreEstatico(entrada: string): { ficheros: Set<string>; paquetes: Set<string> } {
  const ficheros = new Set<string>();
  const paquetes = new Set<string>();
  const pendientes = [entrada];
  while (pendientes.length > 0) {
    const actual = pendientes.pop();
    if (actual === undefined || ficheros.has(actual)) continue;
    ficheros.add(actual);
    for (const { especificador } of importsEstaticos(readFileSync(actual, 'utf-8'))) {
      if (especificador.startsWith('.')) {
        const destino = resolverRelativo(actual, especificador);
        if (destino !== null) pendientes.push(destino);
      } else {
        paquetes.add(especificador);
      }
    }
  }
  return { ficheros, paquetes };
}

const rel = (ruta: string): string => relative(SRC, ruta).split('\\').join('/');

describe('la carga de la página no baja mupdf (wasm con await a nivel de módulo)', () => {
  it.each(ENTRADAS)('%s no importa mupdf de forma estática, ni directa ni indirecta', (entrada) => {
    const { ficheros, paquetes } = cierreEstatico(resolve(SRC, entrada));
    const alcanzados = [...ficheros].map(rel);

    expect(paquetes.has('mupdf')).toBe(false);
    for (const modulo of CON_MUPDF) expect(alcanzados).not.toContain(modulo);
  });

  it('el recorrido ve de verdad los imports (si no, los tests de arriba no probarían nada)', () => {
    // `pdf/pipeline.ts` importa `./engine`, que importa `mupdf`: el recorrido tiene que encontrarlo.
    const { ficheros, paquetes } = cierreEstatico(resolve(SRC, 'pdf/pipeline.ts'));
    expect([...ficheros].map(rel)).toContain('pdf/engine.ts');
    expect(paquetes.has('mupdf')).toBe(true);
    // Y la portada sí alcanza sus módulos ligeros.
    expect([...cierreEstatico(resolve(SRC, 'main.ts')).ficheros].map(rel)).toContain('pdf/perezoso.ts');
  });

  it('el analizador del comprobador y el cargador perezoso no importan nada pesado', () => {
    for (const modulo of ['comprobador/analyze.ts', 'pdf/perezoso.ts', 'pdf/errores.ts']) {
      const { paquetes, ficheros } = cierreEstatico(resolve(SRC, modulo));
      expect(paquetes.has('mupdf'), modulo).toBe(false);
      for (const pesado of CON_MUPDF) expect([...ficheros].map(rel), modulo).not.toContain(pesado);
    }
  });

  it('perezoso.ts es el único sitio que pide el motor, y lo pide con import()', () => {
    const fuente = readFileSync(resolve(SRC, 'pdf/perezoso.ts'), 'utf-8');
    expect(fuente).toMatch(/import\(\s*['"]\.\/engine['"]\s*\)/);
    expect(fuente).toMatch(/import\(\s*['"]\.\/pipeline['"]\s*\)/);
    expect(importsEstaticos(fuente)).toEqual([]);
  });
});

describe('PdfPasswordError sale de un módulo sin mupdf', () => {
  it('engine.ts la reexporta: es la MISMA clase (los instanceof de la UI siguen valiendo)', async () => {
    const { PdfPasswordError: desdeEngine } = await cargarEngine();
    expect(desdeEngine).toBe(PdfPasswordError);
    expect(new desdeEngine()).toBeInstanceOf(PdfPasswordError);
  });
});

describe('cargadores perezosos', () => {
  it('el motor y el pipeline se piden una sola vez (promesa compartida)', async () => {
    expect(cargarEngine()).toBe(cargarEngine());
    expect(cargarPipeline()).toBe(cargarPipeline());
    const [engine, pipeline] = await Promise.all([cargarEngine(), cargarPipeline()]);
    expect(typeof engine.loadPdf).toBe('function');
    expect(typeof pipeline.processDocument).toBe('function');
    expect(typeof pipeline.detectAutomaticBoxes).toBe('function');
  });

  it('un fallo de carga NO se queda memorizado en esta capa: el siguiente intento vuelve a pedirlo', async () => {
    let llamadas = 0;
    const cargar = memorizar(async () => {
      llamadas++;
      if (llamadas === 1) throw new Error('sin conexión');
      return 'motor';
    });

    await expect(cargar()).rejects.toThrow('sin conexión');
    await expect(cargar()).resolves.toBe('motor');
    expect(llamadas).toBe(2);
    // Con éxito sí se comparte: no hay una tercera petición.
    await expect(cargar()).resolves.toBe('motor');
    expect(llamadas).toBe(2);
  });
});
