import { describe, it, expect } from 'vitest';
import { enmascarar } from './mask';

describe('enmascarar', () => {
  it('enmascara dígitos centrales: "12345678Z" -> "12******Z"', () => {
    expect(enmascarar('12345678Z')).toBe('12******Z');
  });

  it('conserva separadores: "12.345.678-Z" -> "12.***.***-Z"', () => {
    expect(enmascarar('12.345.678-Z')).toBe('12.***.***-Z');
  });

  it('no muestra dígitos centrales en ningún caso', () => {
    const input = '1234567890';
    const output = enmascarar(input);
    // Los dígitos centrales son 3-9
    expect(output).not.toContain('3');
    expect(output).not.toContain('4');
    expect(output).not.toContain('5');
    expect(output).not.toContain('6');
    expect(output).not.toContain('7');
    expect(output).not.toContain('8');
    expect(output).not.toContain('9');
  });

  it('conserva separadores no alfanuméricos', () => {
    const input = 'A.B-C D@E';
    const output = enmascarar(input);
    expect(output).toContain('.');
    expect(output).toContain('-');
    expect(output).toContain(' ');
    expect(output).toContain('@');
  });

  it('enmascara todos excepto el primero si hay 1 alfanumérico', () => {
    expect(enmascarar('A')).toBe('A');
  });

  it('enmascara todos excepto el primero si hay 2 alfanuméricos', () => {
    expect(enmascarar('AB')).toBe('A*');
  });

  it('enmascara todos excepto el primero si hay 3 alfanuméricos', () => {
    expect(enmascarar('ABC')).toBe('A**');
  });

  it('conserva primer, segundo y último si hay 4 alfanuméricos', () => {
    expect(enmascarar('ABCD')).toBe('AB*D');
  });

  it('conserva primer, segundo y último con separadores', () => {
    expect(enmascarar('AB-CD')).toBe('AB-*D');
  });

  it('maneja cadena vacía', () => {
    expect(enmascarar('')).toBe('');
  });

  it('maneja solo separadores', () => {
    expect(enmascarar('...---   ')).toBe('...---   ');
  });

  it('ejemplo complejo: email con muchos caracteres', () => {
    const output = enmascarar('usuario.largo.123456@example.com');
    // Primeros dos alfanuméricos: u, s
    // Último: m
    // El resto enmascarado
    expect(output.startsWith('us')).toBe(true);
    expect(output.endsWith('m')).toBe(true);
  });

  it('conserva letra mayúscula y minúscula en posiciones permitidas', () => {
    expect(enmascarar('AbCdEfGh')).toBe('Ab*****h');
  });
});
