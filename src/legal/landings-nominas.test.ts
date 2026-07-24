import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { externalResourceRefs } from '../test/landing-helpers';

describe('landing /nominas/', () => {
  const RUTA = path.resolve(__dirname, '..', '..', 'public', 'nominas', 'index.html');
  const html = fs.readFileSync(RUTA, 'utf-8');

  it('es 100% self-contained: sin referencias a recursos externos', () => {
    expect(externalResourceRefs(html)).toEqual([]);
  });

  it('el CTA apunta a la herramienta con utm_campaign=nominas', () => {
    expect(html).toContain('utm_campaign=nominas');
  });

  it('contiene un enlace a /comprobador/', () => {
    expect(html).toContain('/comprobador/');
  });

  it('tiene <link rel="canonical"> con la URL de la landing de nóminas', () => {
    expect(html).toMatch(/<link\b[^>]*\srel=["']canonical["'][^>]*\shref=["']https:\/\/www\.tachadopdf\.com\/nominas\/["']/);
  });

  it('incluye un <script type="application/ld+json"> con Article válido', () => {
    const match = html.match(/<script\s+type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/i);
    expect(match).not.toBeNull();
    const json = JSON.parse(match![1]!);
    expect(json['@type']).toBe('Article');
  });

  describe('vocabulario', () => {
    const contenido = html.toLowerCase();
    const PALABRAS_PROHIBIDAS = ['anonimiz', 'certific', 'rgpd garantizado', 'inteligencia artificial', ' ia '];
    const COMPETIDORES = ['ilovepdf', 'anondocs'];

    it.each(PALABRAS_PROHIBIDAS)('no contiene la palabra prohibida "%s"', (palabra) => {
      expect(contenido).not.toContain(palabra);
    });

    it.each(COMPETIDORES)('no nombra al competidor "%s"', (competidor) => {
      expect(contenido).not.toContain(competidor);
    });
  });
});
