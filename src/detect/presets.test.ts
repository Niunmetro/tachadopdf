import { describe, expect, it } from 'vitest';
import { patternsForPreset } from './presets';

describe('patternsForPreset', () => {
  it('generico incluye catastro', () => {
    expect(patternsForPreset('generico')).toEqual([
      'dni',
      'nie',
      'iban',
      'nuss',
      'telefono',
      'email',
      'catastro',
    ]);
  });

  it('acta incluye catastro', () => {
    expect(patternsForPreset('acta')).toEqual(['dni', 'nie', 'iban', 'telefono', 'email', 'catastro']);
  });

  it('nomina NO incluye catastro', () => {
    expect(patternsForPreset('nomina')).toEqual(['dni', 'nie', 'nuss', 'iban', 'telefono']);
  });

  it('es pura: llamadas repetidas devuelven el mismo resultado y no comparten referencia mutable', () => {
    const a = patternsForPreset('generico');
    a.push('extra' as any);
    const b = patternsForPreset('generico');
    expect(b).toEqual(['dni', 'nie', 'iban', 'nuss', 'telefono', 'email', 'catastro']);
  });
});
