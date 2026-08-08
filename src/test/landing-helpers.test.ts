import { describe, expect, it } from 'vitest';
import { externalResourceRefs } from './landing-helpers';

describe('externalResourceRefs', () => {
  it('devuelve [] para una landing self-contained (sin recursos externos)', () => {
    const html = `
      <!doctype html>
      <html>
        <head>
          <link rel="canonical" href="https://www.tachadopdf.com/actas/" />
          <meta property="og:url" content="https://www.tachadopdf.com/actas/" />
          <meta property="og:image" content="https://www.tachadopdf.com/og.png" />
          <link rel="stylesheet" href="/assets/estilos.css" />
          <script src="/assets/app.js"></script>
        </head>
        <body>
          <img src="/img/local.png" alt="" />
        </body>
      </html>
    `;
    expect(externalResourceRefs(html)).toEqual([]);
  });

  // Las etiquetas hreflang son identidad de la página, no una petición de red: si contaran como
  // recurso externo, ninguna página multiidioma podría declarar sus alternos.
  it('no cuenta <link rel="alternate" hreflang> con URL absoluta como recurso externo', () => {
    const html = `
      <html>
        <head>
          <link rel="alternate" hreflang="es" href="https://www.tachadopdf.com/" />
          <link rel="alternate" hreflang="en" href="https://www.tachadopdf.com/en/" />
          <link rel="alternate" hreflang="x-default" href="https://www.tachadopdf.com/" />
        </head>
        <body></body>
      </html>
    `;
    expect(externalResourceRefs(html)).toEqual([]);
  });

  it('sigue detectando una hoja de estilo remota (el hueco de rel=alternate no abre la puerta)', () => {
    const html = '<html><head><link rel="stylesheet" href="https://cdn.ejemplo.com/x.css" /></head></html>';
    expect(externalResourceRefs(html).length).toBeGreaterThan(0);
  });

  it('detecta un <script src> a un host externo', () => {
    const html = `
      <html>
        <head><script src="https://cdn.ejemplo.com/lib.js"></script></head>
        <body></body>
      </html>
    `;
    const resultado = externalResourceRefs(html);
    expect(resultado.length).toBeGreaterThan(0);
    expect(resultado[0]).toContain('cdn.ejemplo.com');
  });
});
