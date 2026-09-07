import * as fs from 'node:fs';
import * as path from 'node:path';
import { describe, expect, it } from 'vitest';
import { externalResourceRefs } from '../test/landing-helpers';

// La página vive en la RAÍZ del repo (destino:'entrada'): Vite le inyecta src/metadatos-pdf/main.ts.
describe('página /metadatos-pdf/ (limpiador de metadatos de PDF)', () => {
  const HTML_PATH = path.resolve(__dirname, '..', '..', 'metadatos-pdf', 'index.html');
  const html = fs.readFileSync(HTML_PATH, 'utf-8');

  it('no referencia ningún recurso externo (CSP intacta, self-contained)', () => {
    expect(externalResourceRefs(html)).toEqual([]);
  });

  it('tiene rel="canonical" con la URL de /metadatos-pdf/', () => {
    expect(html).toMatch(/rel="canonical"\s+href="https:\/\/www\.tachadopdf\.com\/metadatos-pdf\/"/);
  });

  it('declara su par hreflang inglés /en/pdf-metadata/', () => {
    expect(html).toContain('https://www.tachadopdf.com/en/pdf-metadata/');
  });

  it('incluye JSON-LD WebApplication válido y además FAQPage', () => {
    const match = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    expect(match).not.toBeNull();
    const json = JSON.parse(match![1]!);
    expect(json['@type']).toBe('WebApplication');
    expect(json.url).toBe('https://www.tachadopdf.com/metadatos-pdf/');
    expect(html).toContain('"@type": "FAQPage"');
  });

  it('inyecta el módulo del limpiador de metadatos de PDF', () => {
    expect(html).toContain('<script type="module" src="/src/metadatos-pdf/main.ts"></script>');
  });

  it('trae los elementos que el módulo cablea por id', () => {
    for (const id of ['mdp-dropzone', 'mdp-file', 'mdp-stage', 'mdp-resultado', 'mdp-download', 'mdp-error']) {
      expect(html).toContain(`id="${id}"`);
    }
  });

  it('la zona de resultado (#mdp-stage) arranca oculta', () => {
    expect(html).toMatch(/<div id="mdp-stage" hidden>/);
  });

  it('el input acepta PDF y el CTA lleva utm_source=metadatos-pdf', () => {
    expect(html).toContain('accept="application/pdf"');
    expect(html).toContain('utm_source=metadatos-pdf');
  });

  it('tiene el <title> exacto orientado a búsqueda', () => {
    expect(html).toContain('<title>Ver y borrar los metadatos ocultos de un PDF</title>');
  });

  it('renderiza el FAQ visible con la pregunta clave del autor', () => {
    expect(html).toContain('¿Un PDF revela quién lo hizo?');
  });

  describe('vocabulario prohibido', () => {
    const contenido = html.toLowerCase();
    const PALABRAS_PROHIBIDAS = ['anonimiz', 'certific', 'rgpd garantizado', 'inteligencia artificial', ' ia '];

    it.each(PALABRAS_PROHIBIDAS)('no contiene "%s"', (palabra) => {
      expect(contenido).not.toContain(palabra);
    });

    const COMPETIDORES = ['ilovepdf', 'smallpdf', 'sejda', 'adobe', 'pdfescape'];

    it.each(COMPETIDORES)('no nombra al competidor "%s"', (nombre) => {
      expect(contenido).not.toContain(nombre);
    });
  });
});
