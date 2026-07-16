import { describe, expect, it } from 'vitest';
import { legalSections } from './render';

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
