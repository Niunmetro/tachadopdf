import { describe, expect, it } from 'vitest';
import { CONTENIDOS } from './index';

/**
 * EL `<title>` QUE ENSEÑA GOOGLE NO PUEDE PASAR DE ~60 CARACTERES.
 *
 * Medido el 2026-10-29 con Search Console: los 21 títulos de las guías y landings españolas
 * medían 63-117 caracteres y Google los cortaba antes del gancho; siete páginas en la primera
 * página de resultados (posición 6-10) llevaban tres meses con cero clics. Las guías inglesas ya
 * tenían su tope (`enlazado-interno-en.test.ts`); esta guarda pone el mismo a las españolas que
 * declaran `metaTitulo` y a las páginas de herramienta, que lo llevan siempre.
 */
const TOPE_TITULO = 60;

const es = CONTENIDOS.es;

describe('los títulos de la SERP en español caben sin que Google los corte', () => {
  const guiasConTitulo = es.guias.filter((g) => g.metaTitulo !== undefined);

  it('hay guías españolas con título propio para la SERP', () => {
    expect(guiasConTitulo.length).toBeGreaterThan(0);
  });

  it.each(guiasConTitulo.map((g) => [g.id, g.metaTitulo ?? ''] as const))(
    '%s: el metaTitulo cabe',
    (_id, titulo) => {
      expect(titulo.length).toBeGreaterThan(20);
      expect(titulo.length).toBeLessThanOrEqual(TOPE_TITULO);
    },
  );

  it.each([
    ['portada', es.home.metaTitulo],
    ['comprobador', es.comprobador.metaTitulo],
    ['imagen', es.imagen.metaTitulo],
    ['metadatos', es.metadatos.metaTitulo],
    ['metadatos-pdf', es.metadatosPdf.metaTitulo],
  ] as const)('%s: el metaTitulo cabe', (_pagina, titulo) => {
    expect(titulo.length).toBeLessThanOrEqual(TOPE_TITULO);
  });
});
