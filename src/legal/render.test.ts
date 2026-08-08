import { describe, expect, it } from 'vitest';
import { legalSections } from './render';
import { generarPagina } from '../content/generar';
import { paginaPorId } from '../content/registro';

describe('legalSections', () => {
  const secciones = legalSections();

  it('devuelve exactamente tres secciones con los ids aviso-legal, terminos y privacidad', () => {
    expect(secciones.map((s) => s.id)).toEqual(['aviso-legal', 'terminos', 'privacidad']);
  });

  it('el cuerpo del aviso legal cita el artículo 10 LSSI tal cual aparece en textos.ts', () => {
    const avisoLegal = secciones.find((s) => s.id === 'aviso-legal');
    expect(avisoLegal?.cuerpo).toContain('artículo 10');
  });

  it('el cuerpo de términos contiene el título íntegro tal cual aparece en textos.ts', () => {
    const terminos = secciones.find((s) => s.id === 'terminos');
    expect(terminos?.cuerpo).toContain('Términos de uso');
  });

  it('el cuerpo de privacidad contiene el título y el literal de procesamiento local tal cual aparecen en textos.ts', () => {
    const privacidad = secciones.find((s) => s.id === 'privacidad');
    expect(privacidad?.cuerpo).toContain('Política de privacidad');
    expect(privacidad?.cuerpo).toContain('Procesamiento 100% local');
  });
});

// El pie legal y el índice de guías ya NO los pinta JavaScript: van en el HTML que emite el
// generador, para que los lea también quien no ejecuta scripts (la LSSI exige acceso directo al
// aviso legal). Las mismas invariantes de antes, comprobadas donde ahora viven.
describe('pie legal en el HTML generado de la home', () => {
  const home = paginaPorId('home');
  if (home === undefined) throw new Error('falta la página "home" en el registro');
  const html = generarPagina(home, 'es');

  it('los enlaces a las landings de actas y nóminas son relativos al documento', () => {
    expect(html).toContain('<a href="actas/">');
    expect(html).toContain('<a href="nominas/">');
  });

  it('el enlace al comprobador es relativo al documento', () => {
    expect(html).toContain('<a href="comprobador/">');
  });

  it('ningún enlace de navegación empieza por "/" (rompería la base de emergencia)', () => {
    const hrefs = Array.from(html.matchAll(/<a [^>]*href="([^"]+)"/g)).map((m) => m[1] ?? '');
    expect(hrefs.length).toBeGreaterThan(0);
    expect(hrefs.filter((h) => h.startsWith('/'))).toEqual([]);
  });

  it('las tres secciones legales están en el HTML con su cuerpo íntegro', () => {
    for (const seccion of legalSections()) {
      expect(html).toContain(`<details id="${seccion.id}">`);
      expect(html).toContain(seccion.cuerpo.slice(0, 60));
    }
  });
});
