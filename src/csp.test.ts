import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { CSP } from './content/generar';
import { externalResourceRefs } from './test/landing-helpers';

const RAIZ = resolve(__dirname, '..');
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

/**
 * La CSP estaba SOLO en index.html y en comprobador/index.html: las dos landings de sector y las
 * seis guías españolas se publicaban sin ninguna. La promesa del producto es que nada sale del
 * navegador; una página del mismo dominio sin CSP es una excepción que nadie declaró.
 */
describe('CSP en TODAS las páginas del sitio', () => {
  it('el barrido ve todas las páginas', () => {
    expect(PAGINAS.length).toBeGreaterThanOrEqual(18);
  });

  it.each(PAGINAS)('%s declara la CSP por meta', (relativo) => {
    const html = readFileSync(resolve(RAIZ, relativo), 'utf-8');
    const m = html.match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)"/);
    expect(m).not.toBeNull();
    expect(m?.[1]).toBe(CSP);
  });

  it.each(PAGINAS)('%s no referencia ningún recurso externo', (relativo) => {
    const html = readFileSync(resolve(RAIZ, relativo), 'utf-8');
    expect(externalResourceRefs(html)).toEqual([]);
  });
});

describe('la CSP sigue diciendo lo que debe decir', () => {
  it('el único egress permitido es la verificación de licencia con Gumroad', () => {
    expect(CSP).toContain("connect-src 'self' https://api.gumroad.com");
  });

  it("permite WebAssembly pero NO 'unsafe-eval' de JavaScript", () => {
    expect(CSP).toContain("script-src 'self' 'wasm-unsafe-eval'");
    expect(CSP).not.toMatch(/(?<!wasm-)'unsafe-eval'/);
  });

  it('no permite orígenes de terceros para scripts, fuentes ni objetos', () => {
    expect(CSP).toContain("font-src 'self'");
    expect(CSP).toContain("object-src 'none'");
    expect(CSP).toContain("base-uri 'self'");
  });
});
