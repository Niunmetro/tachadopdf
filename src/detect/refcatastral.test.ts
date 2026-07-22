import { describe, it, expect } from 'vitest';
import { esRefCatastralValido } from './patterns';

describe('esRefCatastralValido', () => {
  it('acepta el ejemplo válido sin espacios', () => {
    expect(esRefCatastralValido('9872023VH5797S0001WX')).toBe(true);
  });

  it('acepta el ejemplo válido con espacios internos', () => {
    expect(esRefCatastralValido('9872023 VH5797S 0001 WX')).toBe(true);
  });

  it('acepta el ejemplo válido con puntos y guiones', () => {
    expect(esRefCatastralValido('9872023.VH5797S-0001WX')).toBe(true);
  });

  it('acepta en minúsculas', () => {
    expect(esRefCatastralValido('9872023vh5797s0001wx')).toBe(true);
  });

  it('rechaza 19 caracteres', () => {
    expect(esRefCatastralValido('9872023VH5797S0001W')).toBe(false);
  });

  it('rechaza 21 caracteres', () => {
    expect(esRefCatastralValido('9872023VH5797S0001WXY')).toBe(false);
  });

  it('rechaza cadena vacía', () => {
    expect(esRefCatastralValido('')).toBe(false);
  });

  it('rechaza caracteres no alfanuméricos', () => {
    expect(esRefCatastralValido('9872023VH5797S0001W#')).toBe(false);
  });

  it('rechaza cadena de solo dígitos', () => {
    expect(esRefCatastralValido('12345678901234567890')).toBe(false);
  });

  it('rechaza cadena de solo letras', () => {
    expect(esRefCatastralValido('ABCDEFGHIJKLMNOPQRST')).toBe(false);
  });
});
