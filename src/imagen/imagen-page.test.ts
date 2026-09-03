import * as fs from 'node:fs';
import * as path from 'node:path';
import { describe, expect, it } from 'vitest';
import { externalResourceRefs } from '../test/landing-helpers';

// La página vive en la RAÍZ del repo (destino:'entrada'), no en public/, porque Vite le inyecta
// el módulo src/imagen/main.ts. Estos ficheros los escribe scripts/gen-pages.ts.
describe('página /imagen/ (redactor de imágenes)', () => {
  const HTML_PATH = path.resolve(__dirname, '..', '..', 'imagen', 'index.html');
  const html = fs.readFileSync(HTML_PATH, 'utf-8');

  it('no referencia ningún recurso externo (CSP intacta, self-contained)', () => {
    expect(externalResourceRefs(html)).toEqual([]);
  });

  it('tiene rel="canonical" con la URL de /imagen/', () => {
    expect(html).toMatch(/rel="canonical"\s+href="https:\/\/www\.tachadopdf\.com\/imagen\/"/);
  });

  it('declara su par hreflang inglés /en/redact-image/', () => {
    expect(html).toContain('https://www.tachadopdf.com/en/redact-image/');
  });

  it('incluye un bloque JSON-LD de tipo WebApplication válido', () => {
    const match = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    expect(match).not.toBeNull();
    const json = JSON.parse(match![1]!);
    expect(json['@type']).toBe('WebApplication');
    expect(json.url).toBe('https://www.tachadopdf.com/imagen/');
    expect(json.inLanguage).toBe('es');
    expect(json.offers.price).toBe('0');
  });

  it('inyecta el módulo del redactor de imágenes', () => {
    expect(html).toContain('<script type="module" src="/src/imagen/main.ts"></script>');
  });

  it('incluye datos estructurados FAQPage (AEO)', () => {
    expect(html).toContain('"@type": "FAQPage"');
  });

  it('renderiza el FAQ visible con la pregunta clave del difuminado reversible', () => {
    expect(html).toContain('¿Se puede recuperar una imagen difuminada o pixelada?');
    expect(html).toMatch(/<details class="faq__item">/);
  });

  it('trae los elementos que el módulo cablea por id', () => {
    for (const id of ['img-dropzone', 'img-file', 'img-stage', 'img-canvas', 'img-download', 'img-clear', 'img-count', 'img-error']) {
      expect(html).toContain(`id="${id}"`);
    }
  });

  it('la zona de trabajo (#img-stage) arranca oculta', () => {
    expect(html).toMatch(/<div id="img-stage" hidden>/);
  });

  it('el input de archivo acepta imágenes', () => {
    expect(html).toContain('accept="image/*"');
  });

  it('el CTA lleva utm_source=imagen', () => {
    expect(html).toContain('utm_source=imagen');
  });

  it('tiene el <title> exacto orientado a búsqueda', () => {
    expect(html).toContain('<title>Tachar una imagen o captura: borra los datos, no los tapa</title>');
  });

  // El aviso de verificación es el corazón del diferencial: negro sólido, sin capa oculta.
  it('declara el aviso de que es una imagen plana con negro sólido', () => {
    expect(html).toContain('negro sólido');
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
