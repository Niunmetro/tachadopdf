import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

/**
 * LOS ICONOS DEL SITIO, en las DIECIOCHO páginas y en el artefacto que se publica.
 *
 * Hasta ahora `/favicon.ico` daba 404 en producción en cada primera visita (0 `rel="icon"` en
 * todo el sitio). Estas guardas atan que:
 *   1. las 18 páginas referencian el `.ico`, el `.svg` y el `apple-touch`, con ruta RELATIVA (una
 *      ruta raíz-absoluta moriría bajo la base de emergencia `/tachadopdf/`) y NUNCA externa;
 *   2. los ficheros existen en `public/` y son lo que dicen: el `.ico` lleva 16/32/48, el
 *      `apple-touch` es un PNG de 180×180, y el `.svg` es una sola tinta sin degradado;
 *   3. si hay `dist/` construido, esos ficheros — y el `og-image` — están dentro y el HTML los
 *      referencia. Es el fichero que de verdad se sube, y el favicon era justo el que faltaba.
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

/** Una ruta de recurso que NO cuelga fuera del propio documento: ni absoluta a un host ni
 *  raíz-absoluta con `/` (esa se sale del sitio bajo la base de emergencia). */
function esRelativaAlDocumento(href: string): boolean {
  return !/^(?:[a-z]+:)?\/\//i.test(href) && !href.startsWith('/');
}

describe('los iconos, en las 18 páginas', () => {
  it('el barrido ve todas las páginas', () => {
    expect(PAGINAS.length).toBeGreaterThanOrEqual(18);
  });

  it.each(PAGINAS)('%s referencia .ico, .svg y apple-touch, con ruta relativa', (relativo) => {
    const html = readFileSync(resolve(RAIZ, relativo), 'utf-8');
    const links = [...html.matchAll(/<link\b[^>]*>/gi)].map((m) => m[0]);
    const buscar = (archivo: string, rel: string): string => {
      const link = links.find((l) => l.includes(archivo) && new RegExp(`rel="${rel}"`).test(l));
      expect(link, `falta <link rel="${rel}"> a ${archivo}`).toBeDefined();
      return link ?? '';
    };
    const hrefDe = (link: string): string => /href="([^"]+)"/.exec(link)?.[1] ?? '';

    const ico = buscar('favicon.ico', 'icon');
    const svg = buscar('favicon.svg', 'icon');
    const apple = buscar('apple-touch-icon.png', 'apple-touch-icon');
    for (const [nombre, link] of [['ico', ico], ['svg', svg], ['apple', apple]] as const) {
      expect(esRelativaAlDocumento(hrefDe(link)), `${nombre} con ruta absoluta o externa`).toBe(true);
    }
    // El .svg declara su tipo para que el navegador moderno lo prefiera al .ico pixelado.
    expect(svg).toContain('type="image/svg+xml"');
  });
});

describe('los ficheros de icono existen y son lo que dicen', () => {
  it('favicon.svg es una sola tinta, sin degradado, y es el documento', () => {
    const svg = readFileSync(resolve(RAIZ, 'public', 'favicon.svg'), 'utf-8');
    expect(svg).toContain('viewBox="0 0 24 24"');
    expect(svg.toLowerCase()).not.toContain('gradient');
    // Papel + tinta de la paleta viva; ni un tercer color.
    const colores = new Set([...svg.matchAll(/#[0-9a-fA-F]{6}/g)].map((m) => m[0].toLowerCase()));
    expect([...colores].sort()).toEqual(['#1b1a17', '#f6f5f3']);
  });

  it('favicon.ico lleva 16, 32 y 48', () => {
    const buf = readFileSync(resolve(RAIZ, 'public', 'favicon.ico'));
    expect(buf.readUInt16LE(0)).toBe(0); // reserved
    expect(buf.readUInt16LE(2)).toBe(1); // type = icon
    const n = buf.readUInt16LE(4);
    const tamanos = new Set<number>();
    for (let i = 0; i < n; i++) {
      const off = 6 + i * 16;
      tamanos.add(buf[off] === 0 ? 256 : (buf[off] ?? 0));
    }
    for (const t of [16, 32, 48]) expect(tamanos.has(t), `el .ico no lleva ${t}px`).toBe(true);
  });

  it('apple-touch-icon.png es un PNG de 180×180', () => {
    const png = readFileSync(resolve(RAIZ, 'public', 'apple-touch-icon.png'));
    expect(png.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a'); // firma PNG
    expect(png.readUInt32BE(16)).toBe(180); // ancho (IHDR)
    expect(png.readUInt32BE(20)).toBe(180); // alto
  });
});

describe('el artefacto construido (si existe dist/)', () => {
  const dist = resolve(RAIZ, 'dist');
  const hayDist = existsSync(join(dist, 'index.html'));

  it.runIf(hayDist)('dist/ lleva los iconos y el og-image, y el HTML los referencia', () => {
    for (const archivo of ['favicon.ico', 'favicon.svg', 'apple-touch-icon.png', 'og-image.png']) {
      expect(existsSync(join(dist, archivo)), `dist/${archivo} no existe`).toBe(true);
    }
    const home = readFileSync(join(dist, 'index.html'), 'utf-8');
    expect(home).toMatch(/<link\b[^>]*rel="icon"[^>]*favicon\.svg/);
    expect(home).toMatch(/<link\b[^>]*rel="apple-touch-icon"[^>]*apple-touch-icon\.png/);
    expect(home).toMatch(/<meta property="og:image" content="[^"]*og-image\.png"/);
  });
});
