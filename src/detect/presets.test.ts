import { describe, expect, it } from 'vitest';
import { patternsForPreset } from './presets';

describe('patternsForPreset', () => {
  it('generico incluye los seis patrones (comportamiento actual)', () => {
    expect(patternsForPreset('generico')).toEqual([
      'dni',
      'nie',
      'iban',
      'nuss',
      'telefono',
      'email',
    ]);
  });

  it('acta incluye dni, nie, iban, telefono, email (sin nuss)', () => {
    expect(patternsForPreset('acta')).toEqual(['dni', 'nie', 'iban', 'telefono', 'email']);
  });

  it('nomina incluye dni, nie, nuss, iban, telefono (sin email)', () => {
    expect(patternsForPreset('nomina')).toEqual(['dni', 'nie', 'nuss', 'iban', 'telefono']);
  });

  it('es pura: llamadas repetidas devuelven el mismo resultado y no comparten referencia mutable', () => {
    const a = patternsForPreset('generico');
    a.push('email');
    const b = patternsForPreset('generico');
    expect(b).toEqual(['dni', 'nie', 'iban', 'nuss', 'telefono', 'email']);
  });
});
