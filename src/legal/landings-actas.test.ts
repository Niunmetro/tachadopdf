import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { externalResourceRefs } from '../test/landing-helpers';

describe('landing /actas/ para administradores de fincas', () => {
  const HTML_PATH = path.resolve(__dirname, '..', '..', 'public', 'actas', 'index.html');
  const html = fs.readFileSync(HTML_PATH, 'utf-8');

  it('no referencia ningún recurso externo (CSP intacta)', () => {
    expect(externalResourceRefs(html)).toEqual([]);
  });

  it('el CTA lleva utm_campaign=actas', () => {
    expect(html).toContain('utm_campaign=actas');
  });

  it('tiene rel="canonical" con la URL de /actas/', () => {
    expect(html).toMatch(/rel="canonical"\s+href="https:\/\/www\.tachadopdf\.com\/actas\/"/);
  });

  it('incluye un bloque JSON-LD de tipo Article válido', () => {
    const match = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    expect(match).not.toBeNull();
    const json = JSON.parse(match![1]!);
    expect(json['@type']).toBe('Article');
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
