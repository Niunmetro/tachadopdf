import * as fs from 'node:fs';
import * as path from 'node:path';
import { describe, expect, it } from 'vitest';
import { externalResourceRefs } from '../test/landing-helpers';

// La página vive en la RAÍZ del repo (destino:'entrada'): Vite le inyecta src/metadatos/main.ts.
describe('página /metadatos/ (limpiador de metadatos)', () => {
  const HTML_PATH = path.resolve(__dirname, '..', '..', 'metadatos', 'index.html');
  const html = fs.readFileSync(HTML_PATH, 'utf-8');

  it('no referencia ningún recurso externo (CSP intacta, self-contained)', () => {
    expect(externalResourceRefs(html)).toEqual([]);
  });

  it('tiene rel="canonical" con la URL de /metadatos/', () => {
    expect(html).toMatch(/rel="canonical"\s+href="https:\/\/www\.tachadopdf\.com\/metadatos\/"/);
  });

  it('declara su par hreflang inglés /en/remove-metadata/', () => {
    expect(html).toContain('https://www.tachadopdf.com/en/remove-metadata/');
  });

  it('incluye JSON-LD WebApplication válido y además FAQPage', () => {
    const match = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    expect(match).not.toBeNull();
    const json = JSON.parse(match![1]!);
    expect(json['@type']).toBe('WebApplication');
    expect(json.url).toBe('https://www.tachadopdf.com/metadatos/');
    expect(html).toContain('"@type": "FAQPage"');
  });

  it('inyecta el módulo del limpiador de metadatos', () => {
    expect(html).toContain('<script type="module" src="/src/metadatos/main.ts"></script>');
  });

  it('trae los elementos que el módulo cablea por id', () => {
    for (const id of ['md-dropzone', 'md-file', 'md-stage', 'md-resultado', 'md-download', 'md-error']) {
      expect(html).toContain(`id="${id}"`);
    }
  });

  it('la zona de resultado (#md-stage) arranca oculta', () => {
    expect(html).toMatch(/<div id="md-stage" hidden>/);
  });

  it('el input acepta imágenes y el CTA lleva utm_source=metadatos', () => {
    expect(html).toContain('accept="image/*"');
    expect(html).toContain('utm_source=metadatos');
  });

  it('tiene el <title> exacto orientado a búsqueda', () => {
    expect(html).toContain('<title>Ver y borrar los metadatos ocultos de una foto (EXIF, GPS)</title>');
  });

  it('renderiza el FAQ visible con la pregunta clave de la ubicación', () => {
    expect(html).toContain('¿Una foto puede revelar dónde vivo?');
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
