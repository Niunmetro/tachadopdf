import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { externalResourceRefs } from '../test/landing-helpers';

describe('página /comprobador/', () => {
  const HTML_PATH = path.resolve(__dirname, '..', '..', 'comprobador', 'index.html');
  const html = fs.readFileSync(HTML_PATH, 'utf-8');

  it('no referencia ningún recurso externo (CSP intacta, self-contained)', () => {
    expect(externalResourceRefs(html)).toEqual([]);
  });

  it('tiene rel="canonical" con la URL de /comprobador/', () => {
    expect(html).toMatch(
      /rel="canonical"\s+href="https:\/\/www\.tachadopdf\.com\/comprobador\/"/,
    );
  });

  it('incluye un bloque JSON-LD de tipo WebApplication válido', () => {
    const match = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    expect(match).not.toBeNull();
    const json = JSON.parse(match![1]!);
    expect(json['@type']).toBe('WebApplication');
    expect(json.url).toBe('https://www.tachadopdf.com/comprobador/');
    expect(json.inLanguage).toBe('es');
    expect(json.offers.price).toBe('0');
  });

  it('el CTA lleva utm_source=comprobador', () => {
    expect(html).toContain('utm_source=comprobador');
  });

  it('tiene el <title> exacto orientado a búsqueda', () => {
    expect(html).toMatch(
      /<title>Comprobador: qué datos personales contiene tu PDF<\/title>/,
    );
  });

  describe('vocabulario prohibido', () => {
    const contenido = html.toLowerCase();
    const PALABRAS_PROHIBIDAS = [
      'anonimiz',
      'certific',
      'rgpd garantizado',
      'inteligencia artificial',
      ' ia ',
    ];

    it.each(PALABRAS_PROHIBIDAS)('no contiene "%s"', (palabra) => {
      expect(contenido).not.toContain(palabra);
    });

    const COMPETIDORES = ['ilovepdf', 'smallpdf', 'sejda', 'adobe', 'pdfescape'];

    it.each(COMPETIDORES)('no nombra al competidor "%s"', (nombre) => {
      expect(contenido).not.toContain(nombre);
    });
  });
});
