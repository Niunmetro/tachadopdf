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
