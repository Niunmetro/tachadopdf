import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const RAIZ = resolve(__dirname, '..');

/**
 * EL CNAME. `vite build` vacía dist/ en cada build, así que el CNAME solo existía en la ventana
 * entre la línea que lo escribía y la que publicaba: cualquier otra ruta de publicación
 * (`npx gh-pages -d dist` a mano, un workflow de Actions, un deploy desde otro árbol) publicaba
 * sin él y desvinculaba el dominio de GitHub Pages. Ese es el mecanismo exacto del 404 de cuatro
 * días.
 *
 * `public/.nojekyll` ya estaba resuelto así y era indestructible; la lección no se había
 * aplicado al CNAME. Ahora sí: `public/CNAME` se copia en cada build.
 *
 * Se comprueba `public/` y no `dist/` a propósito: meter un `vite build` dentro de `npm test`
 * sería un test lentísimo, y que Vite copie public/ es una invariante en la que el repositorio
 * ya se apoya para .nojekyll.
 */
describe('CNAME: el dominio no puede perderse por olvido', () => {
  it('public/CNAME existe y contiene exactamente el dominio de producción', () => {
    const cname = readFileSync(resolve(RAIZ, 'public', 'CNAME'), 'utf-8');
    expect(cname).toBe('www.tachadopdf.com\n');
  });

  /**
   * Si el test de arriba falla con `'www.tachadopdf.com\r\n'`, la causa es ESTA y no otra:
   * `core.autocrlf` está a true en el repo, así que sin un pin en `.gitattributes` cualquier
   * checkout en Windows materializa el CNAME con CRLF. Y lo que se publica es el ARCHIVO DEL
   * ÁRBOL DE TRABAJO: Vite lo copia de `public/` a `dist/` tal cual, y `gh-pages` lo sube tal
   * cual. El objeto de git siempre tuvo LF; el fichero que salía por la puerta, no.
   */
  it('.gitattributes fija el CNAME a LF (lo que se publica son los bytes del árbol de trabajo)', () => {
    const attrs = readFileSync(resolve(RAIZ, '.gitattributes'), 'utf-8');
    expect(attrs).toMatch(/^public\/CNAME\s+text\s+eol=lf$/m);
  });

  it('public/.nojekyll sigue ahí (el mismo mecanismo que protege al CNAME)', () => {
    expect(() => readFileSync(resolve(RAIZ, 'public', '.nojekyll'))).not.toThrow();
  });

  it('el modo de emergencia sigue siendo el ÚNICO camino que quita el CNAME', () => {
    const script = readFileSync(resolve(RAIZ, 'scripts', 'deploy-pages.mjs'), 'utf-8');
    expect(script).toContain("rmSync('dist/CNAME', { force: true })");
    // El borrado va dentro de la rama sin dominio, nunca en el camino normal.
    const sinDominio = script.slice(script.indexOf('} else {'));
    expect(sinDominio).toContain("rmSync('dist/CNAME'");
  });

  it('el despliegue publica dist/ con dotfiles (sin eso, ni CNAME ni .nojekyll llegan)', () => {
    const script = readFileSync(resolve(RAIZ, 'scripts', 'deploy-pages.mjs'), 'utf-8');
    expect(script).toContain("publish('dist', { dotfiles: true }");
  });
});
