import { describe, expect, it, vi } from 'vitest';
import { guardarClaveLicencia, leerClaveLicencia } from './persistencia';

/** Almacén de juguete con la misma forma que `Storage` para los dos métodos que usamos. */
function almacenFalso(inicial: Record<string, string> = {}): Storage & { datos: Record<string, string> } {
  const datos = { ...inicial };
  return {
    datos,
    getItem: (k: string) => (k in datos ? datos[k]! : null),
    setItem: (k: string, v: string) => {
      datos[k] = v;
    },
    removeItem: (k: string) => {
      delete datos[k];
    },
    clear: () => {
      for (const k of Object.keys(datos)) delete datos[k];
    },
    key: () => null,
    length: 0,
  };
}

describe('persistencia de la clave de licencia', () => {
  it('lo guardado se vuelve a leer (round-trip)', () => {
    const almacen = almacenFalso();
    guardarClaveLicencia('ABCD-1234-EFGH-5678', almacen);
    expect(leerClaveLicencia(almacen)).toBe('ABCD-1234-EFGH-5678');
  });

  it('sin nada guardado devuelve cadena vacía (no null)', () => {
    expect(leerClaveLicencia(almacenFalso())).toBe('');
  });

  it('leer NO lanza si el almacén falla (modo privado): devuelve cadena vacía', () => {
    const roto = { getItem: vi.fn(() => { throw new Error('SecurityError'); }) };
    expect(leerClaveLicencia(roto)).toBe('');
  });

  it('guardar NO lanza si el almacén falla: se ignora en silencio', () => {
    const roto = { setItem: vi.fn(() => { throw new Error('QuotaExceededError'); }) };
    expect(() => guardarClaveLicencia('X', roto)).not.toThrow();
  });
});
