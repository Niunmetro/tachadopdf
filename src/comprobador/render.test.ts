// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { SCOPE_TEXT } from '../report/report';
import { renderResumen } from './render';
import type { ResumenComprobacion } from './types';

function crearRoot(): HTMLElement {
  const root = document.createElement('div');
  root.id = 'cp-resultado';
  return root;
}

describe('renderResumen', () => {
  it('muestra el veredicto', () => {
    const root = crearRoot();
    const resumen: ResumenComprobacion = {
      totalDatos: 0,
      categorias: [],
      paginasEscaneadas: [],
      veredicto: 'No se han encontrado datos personales en el texto extraíble.',
    };
    renderResumen(root, resumen);
    const veredicto = root.querySelector('.cp-veredicto');
    expect(veredicto).not.toBeNull();
    expect(veredicto?.textContent).toBe('No se han encontrado datos personales en el texto extraíble.');
  });

  it('muestra los ejemplos ya enmascarados, nunca el dato completo', () => {
    const root = crearRoot();
    const resumen: ResumenComprobacion = {
      totalDatos: 1,
      categorias: [{ kind: 'dni', count: 1, ejemplos: ['12345***Z'] }],
      paginasEscaneadas: [],
      veredicto: 'Se han encontrado datos personales.',
    };
    renderResumen(root, resumen);
    const texto = root.textContent ?? '';
    expect(texto).toContain('12345***Z');
    expect(texto).not.toContain('12345678Z');
    expect(root.querySelector('.cp-categoria')?.textContent).toContain('DNI');
  });

  it('no muestra el bloque de escaneadas si no hay paginas escaneadas', () => {
    const root = crearRoot();
    const resumen: ResumenComprobacion = {
      totalDatos: 0,
      categorias: [],
      paginasEscaneadas: [],
      veredicto: 'ok',
    };
    renderResumen(root, resumen);
    expect(root.querySelector('.cp-escaneadas')).toBeNull();
  });

  it('muestra el bloque rojo de escaneadas listando paginas en base 1', () => {
    const root = crearRoot();
    const resumen: ResumenComprobacion = {
      totalDatos: 0,
      categorias: [],
      paginasEscaneadas: [0, 2],
      veredicto: 'ok',
    };
    renderResumen(root, resumen);
    const bloque = root.querySelector('.cp-escaneadas');
    expect(bloque).not.toBeNull();
    expect(bloque?.textContent).toContain('Página 1');
    expect(bloque?.textContent).toContain('Página 3');
    expect(bloque?.textContent).toMatch(/escaneada/i);
  });

  it('incluye un CTA con utm_source=comprobador', () => {
    const root = crearRoot();
    const resumen: ResumenComprobacion = {
      totalDatos: 0,
      categorias: [],
      paginasEscaneadas: [],
      veredicto: 'ok',
    };
    renderResumen(root, resumen);
    const cta = root.querySelector<HTMLAnchorElement>('.cp-cta');
    expect(cta).not.toBeNull();
    expect(cta?.getAttribute('href')).toContain('utm_source=comprobador');
  });

  it('incluye el aviso legal con el texto de alcance', () => {
    const root = crearRoot();
    const resumen: ResumenComprobacion = {
      totalDatos: 0,
      categorias: [],
      paginasEscaneadas: [],
      veredicto: 'ok',
    };
    renderResumen(root, resumen);
    const aviso = root.querySelector('.cp-aviso');
    expect(aviso).not.toBeNull();
    expect(aviso?.textContent).toContain(SCOPE_TEXT);
  });

  it('vacia el root antes de pintar (no acumula sobre renders previos)', () => {
    const root = crearRoot();
    root.appendChild(document.createElement('span'));
    const resumen: ResumenComprobacion = {
      totalDatos: 0,
      categorias: [],
      paginasEscaneadas: [],
      veredicto: 'ok',
    };
    renderResumen(root, resumen);
    expect(root.querySelectorAll('span').length).toBe(0);
  });
});
