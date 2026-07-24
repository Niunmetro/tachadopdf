import { describe, it, expect } from 'vitest';
import { construirResumen } from './summary';
import { enmascarar } from './mask';
import type { Hit } from '../types';

function hit(kind: Hit['kind'], value: string): Hit {
  return { kind, value, start: 0, end: value.length };
}

describe('construirResumen', () => {
  it('agrupa por kind respetando el orden fijo dni, nie, iban, nuss, telefono, email, catastro', () => {
    const hits: Hit[] = [
      hit('catastro', '1234567AB1234C0001XY'),
      hit('email', 'a@b.com'),
      hit('dni', '12345678Z'),
      hit('iban', 'ES9121000418450200051332'),
    ];

    const resumen = construirResumen(hits, []);

    expect(resumen.categorias.map((c) => c.kind)).toEqual(['dni', 'iban', 'email', 'catastro']);
  });

  it('calcula count por categoría', () => {
    const hits: Hit[] = [
      hit('dni', '12345678Z'),
      hit('dni', '11111111H'),
      hit('email', 'x@y.com'),
    ];

    const resumen = construirResumen(hits, []);

    const dni = resumen.categorias.find((c) => c.kind === 'dni');
    const email = resumen.categorias.find((c) => c.kind === 'email');
    expect(dni?.count).toBe(2);
    expect(email?.count).toBe(1);
  });

  it('los ejemplos vienen enmascarados y nunca el dato completo', () => {
    const valor = '12345678Z';
    const hits: Hit[] = [hit('dni', valor)];

    const resumen = construirResumen(hits, []);

    const dni = resumen.categorias.find((c) => c.kind === 'dni');
    expect(dni?.ejemplos).toEqual([enmascarar(valor)]);
    expect(dni?.ejemplos[0]).not.toBe(valor);
  });

  it('limita los ejemplos a 3 valores distintos por categoría', () => {
    const hits: Hit[] = [
      hit('telefono', '600111111'),
      hit('telefono', '600222222'),
      hit('telefono', '600333333'),
      hit('telefono', '600444444'),
      hit('telefono', '600111111'), // repetido, no debe contar como nuevo ejemplo
    ];

    const resumen = construirResumen(hits, []);

    const telefono = resumen.categorias.find((c) => c.kind === 'telefono');
    expect(telefono?.count).toBe(5);
    expect(telefono?.ejemplos).toHaveLength(3);
    expect(telefono?.ejemplos).toEqual([
      enmascarar('600111111'),
      enmascarar('600222222'),
      enmascarar('600333333'),
    ]);
  });

  it('los kinds sin hits no aparecen en categorias', () => {
    const hits: Hit[] = [hit('nie', 'X1234567L')];

    const resumen = construirResumen(hits, []);

    expect(resumen.categorias).toHaveLength(1);
    expect(resumen.categorias[0].kind).toBe('nie');
  });

  it('produce el veredicto literal con el total de datos', () => {
    const hits: Hit[] = [
      hit('dni', '12345678Z'),
      hit('nuss', '281234567840'),
      hit('email', 'x@y.com'),
    ];

    const resumen = construirResumen(hits, []);

    expect(resumen.totalDatos).toBe(3);
    expect(resumen.veredicto).toBe('Este PDF contiene 3 datos personales detectables');
  });

  it('propaga paginasEscaneadas tal cual', () => {
    const resumen = construirResumen([], [2, 5, 7]);

    expect(resumen.paginasEscaneadas).toEqual([2, 5, 7]);
  });

  it('con cero hits el veredicto refleja 0 datos y no hay categorias', () => {
    const resumen = construirResumen([], []);

    expect(resumen.totalDatos).toBe(0);
    expect(resumen.categorias).toEqual([]);
    expect(resumen.veredicto).toBe('Este PDF contiene 0 datos personales detectables');
  });
});
