// Reescribe src/content/fechas.ts con las fechas REALES de cada página, sacadas del historial git.
//
// `publicado` = día del primer commit que añadió el fichero HTML; `actualizado` = día del último
// commit que lo cambió, o HOY si el fichero tiene cambios sin commitear (sin contar fines de línea).
// Nada se inventa: si git no conoce el fichero, se para con error.
//
// Uso, ANTES de commitear un cambio de páginas:
//   npm run fechas && npm run gen:pages
// (la segunda pasada de `gen:pages` ya escribe el `dateModified` y el `<lastmod>` nuevos; las páginas
// estáticas de public/ llevan su Article escrito a mano: ver src/content/fechas.test.ts).
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PAGINAS, ficheroDe, localesDe } from '../src/content/registro';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function git(args: string[]): string {
  return execFileSync('git', args, { cwd: RAIZ, encoding: 'utf-8' }).trim();
}

function tieneCambios(ruta: string): boolean {
  try {
    execFileSync('git', ['diff', '--quiet', '--ignore-cr-at-eol', 'HEAD', '--', ruta], { cwd: RAIZ });
    return false;
  } catch {
    return true;
  }
}

const hoy = new Date().toISOString().slice(0, 10);
const lineas: string[] = [];
for (const pagina of PAGINAS) {
  for (const locale of localesDe(pagina)) {
    const ruta = ficheroDe(pagina, locale);
    if (ruta === null) continue;
    const altas = git(['log', '--diff-filter=A', '--format=%cs', '--', ruta]).split('\n').filter(Boolean);
    const publicado = altas.at(-1);
    if (publicado === undefined) throw new Error(`git no conoce ${ruta}: no se inventa una fecha`);
    const actualizado = tieneCambios(ruta) ? hoy : git(['log', '-1', '--format=%cs', '--', ruta]);
    lineas.push(`  '${ruta}': { publicado: '${publicado}', actualizado: '${actualizado}' },`);
  }
}

const contenido = `// GENERADO por scripts/fechas.ts (\`npm run fechas\`) a partir del historial git. No editar a mano.
// Alimenta el <lastmod> del sitemap y el datePublished/dateModified de las guías.

export interface FechasPagina {
  /** Día (AAAA-MM-DD) del primer commit que añadió la página. */
  publicado: string;
  /** Día (AAAA-MM-DD) del último commit que la cambió. */
  actualizado: string;
}

/** Clave: el fichero HTML de la página, tal como lo devuelve \`ficheroDe\`. */
export const FECHAS: Record<string, FechasPagina> = {
${lineas.join('\n')}
};
`;
writeFileSync(resolve(RAIZ, 'src/content/fechas.ts'), contenido, 'utf-8');
console.log(`escrito src/content/fechas.ts (${lineas.length} páginas)`);
