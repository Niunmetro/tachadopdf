// Reescribe src/content/fechas.ts con las fechas REALES de cada página, sacadas del historial git, y
// copia esas fechas al Article escrito a mano de las páginas estáticas de public/.
//
// `publicado` = día del primer commit que añadió el fichero HTML.
// `actualizado` = día del último commit que cambió el TEXTO VISIBLE de la página (o HOY si el texto
// visible en disco difiere del de HEAD). Retocar la meta descripción, el JSON-LD, el CSS o un href
// no es una actualización para el lector y no mueve la fecha: inflar la frescura es justo lo que hace
// que un buscador deje de fiarse del `lastmod`. Nada se inventa: si git no conoce el fichero, se para.
//
// Uso, ANTES de commitear un cambio de páginas: `npm run fechas` (genera, fecha y vuelve a generar,
// porque la fecha nueva sale en el propio HTML).
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PAGINAS, ficheroDe, localesDe } from '../src/content/registro';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function git(args: string[]): string {
  return execFileSync('git', args, { cwd: RAIZ, encoding: 'utf-8', maxBuffer: 64 * 1024 * 1024 }).trim();
}

/** Contenido de `ruta` en `revision`, o null si en esa revisión no existía. */
function enRevision(revision: string, ruta: string): string | null {
  try {
    return execFileSync('git', ['show', `${revision}:${ruta}`], {
      cwd: RAIZ,
      encoding: 'utf-8',
      maxBuffer: 64 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'ignore'],
    });
  } catch {
    return null;
  }
}

/** Lo que el lector ve: el <body> sin scripts, estilos, etiquetas ni la propia línea de la fecha. */
export function textoVisible(html: string): string {
  const cuerpo = /<body[\s\S]*<\/body>/i.exec(html)?.[0] ?? html;
  return cuerpo
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<p class="guia-fecha">[\s\S]*?<\/p>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function ultimoCambioVisible(ruta: string, publicado: string): string {
  const disco = textoVisible(readFileSync(resolve(RAIZ, ruta), 'utf-8'));
  const head = enRevision('HEAD', ruta);
  if (head === null || textoVisible(head) !== disco) return new Date().toISOString().slice(0, 10);
  const commits = git(['log', '--no-merges', '--format=%H %cs', '--', ruta]).split('\n').filter(Boolean);
  for (const linea of commits) {
    const [hash = '', dia = ''] = linea.split(' ');
    const despues = enRevision(hash, ruta);
    const antes = enRevision(`${hash}^`, ruta);
    if (despues === null) continue;
    if (antes === null || textoVisible(antes) !== textoVisible(despues)) return dia;
  }
  return publicado;
}

const lineas: string[] = [];
for (const pagina of PAGINAS) {
  for (const locale of localesDe(pagina)) {
    const ruta = ficheroDe(pagina, locale);
    if (ruta === null) continue;
    const altas = git(['log', '--diff-filter=A', '--format=%cs', '--', ruta]).split('\n').filter(Boolean);
    const publicado = altas.at(-1);
    if (publicado === undefined) throw new Error(`git no conoce ${ruta}: no se inventa una fecha`);
    const actualizado = ultimoCambioVisible(ruta, publicado);
    lineas.push(`  '${ruta}': { publicado: '${publicado}', actualizado: '${actualizado}' },`);

    // Las páginas estáticas llevan su Article escrito a mano: se le copian las fechas (no es texto
    // visible, así que esto no mueve `actualizado`). `fechas.test.ts` exige que coincidan.
    if (pagina.origen === 'estatico') {
      const destino = resolve(RAIZ, ruta);
      const html = readFileSync(destino, 'utf-8');
      const nuevo = html
        .replace(/"datePublished": "\d{4}-\d{2}-\d{2}"/, `"datePublished": "${publicado}"`)
        .replace(/"dateModified": "\d{4}-\d{2}-\d{2}"/, `"dateModified": "${actualizado}"`);
      if (nuevo !== html) writeFileSync(destino, nuevo, 'utf-8');
    }
  }
}

const contenido = `// GENERADO por scripts/fechas.ts (\`npm run fechas\`) a partir del historial git. No editar a mano.
// Alimenta el <lastmod> del sitemap y el datePublished/dateModified de las guías.

export interface FechasPagina {
  /** Día (AAAA-MM-DD) del primer commit que añadió la página. */
  publicado: string;
  /** Día (AAAA-MM-DD) del último commit que cambió su texto visible. */
  actualizado: string;
}

/** Clave: el fichero HTML de la página, tal como lo devuelve \`ficheroDe\`. */
export const FECHAS: Record<string, FechasPagina> = {
${lineas.join('\n')}
};
`;
writeFileSync(resolve(RAIZ, 'src/content/fechas.ts'), contenido, 'utf-8');
console.log(`escrito src/content/fechas.ts (${lineas.length} páginas)`);
