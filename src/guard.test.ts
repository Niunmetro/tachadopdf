import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

describe('guardias de repo: vocabulario y CSP', () => {
  const SRC_DIR = path.resolve(__dirname);
  const INDEX_HTML = path.resolve(__dirname, '..', 'index.html');
  const PUBLIC_DIR = path.resolve(__dirname, '..', 'public');

  function listarFicherosTs(dir: string): string[] {
    const resultado: string[] = [];
    for (const entrada of fs.readdirSync(dir, { withFileTypes: true })) {
      const rutaCompleta = path.join(dir, entrada.name);
      if (entrada.isDirectory()) {
        if (entrada.name === 'node_modules') continue;
        resultado.push(...listarFicherosTs(rutaCompleta));
      } else if (entrada.name.endsWith('.ts') && !entrada.name.endsWith('.test.ts')) {
        resultado.push(rutaCompleta);
      }
    }
    return resultado;
  }

  function listarFicherosHtml(dir: string): string[] {
    const resultado: string[] = [];
    for (const entrada of fs.readdirSync(dir, { withFileTypes: true })) {
      const rutaCompleta = path.join(dir, entrada.name);
      if (entrada.isDirectory()) {
        resultado.push(...listarFicherosHtml(rutaCompleta));
      } else if (entrada.name.endsWith('.html')) {
        resultado.push(rutaCompleta);
      }
    }
    return resultado;
  }

  describe('vocabulario prohibido en src/', () => {
    const ficheros = listarFicherosTs(SRC_DIR);
    const htmlPublic = listarFicherosHtml(PUBLIC_DIR);

    const PALABRAS_PROHIBIDAS = ['anonimiz', 'certific', 'rgpd garantizado', 'inteligencia artificial', ' ia '];

    it('recorre al menos un fichero de src/ (el escaneo no está vacío)', () => {
      expect(ficheros.length).toBeGreaterThan(0);
    });

    it.each(PALABRAS_PROHIBIDAS)('ningún fichero .ts de src/ contiene "%s"', (palabra) => {
      const infractores = ficheros.filter((fichero) =>
        fs.readFileSync(fichero, 'utf-8').toLowerCase().includes(palabra),
      );
      expect(infractores).toEqual([]);
    });

    it('index.html no contiene vocabulario prohibido', () => {
      const contenido = fs.readFileSync(INDEX_HTML, 'utf-8').toLowerCase();
      for (const palabra of PALABRAS_PROHIBIDAS) {
        expect(contenido).not.toContain(palabra);
      }
    });

    it('recorre al menos un fichero .html de public/ (el escaneo no está vacío)', () => {
      expect(htmlPublic.length).toBeGreaterThan(0);
    });

    it.each(PALABRAS_PROHIBIDAS)('ningún .html de public/ contiene "%s"', (palabra) => {
      const infractores = htmlPublic.filter((fichero) =>
        fs.readFileSync(fichero, 'utf-8').toLowerCase().includes(palabra),
      );
      expect(infractores).toEqual([]);
    });
  });

  describe('CSP en index.html', () => {
    const contenido = fs.readFileSync(INDEX_HTML, 'utf-8');
    const cspMatch = contenido.match(/content="([^"]*(?:default-src|connect-src|script-src)[^"]*)"/);
    const csp = cspMatch ? cspMatch[1] : '';

    it('CSP contiene "connect-src \'self\' https://api.gumroad.com"', () => {
      expect(csp).toContain("connect-src 'self' https://api.gumroad.com");
    });

    it('CSP contiene "script-src \'self\' \'wasm-unsafe-eval\'"', () => {
      expect(csp).toContain("script-src 'self' 'wasm-unsafe-eval'");
    });

    it('CSP no contiene \'unsafe-eval\' como token independiente', () => {
      // Buscar 'unsafe-eval' que no sea parte de 'wasm-unsafe-eval'
      // Usamos negativo lookbehind y lookahead para asegurar que no está precedido por 'wasm-'
      const pattern = /(?<!wasm-)'unsafe-eval'/;
      expect(csp).not.toMatch(pattern);
    });
  });
});
