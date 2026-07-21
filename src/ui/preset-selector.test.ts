// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { buildPresetSelector, PRESET_OPTIONS } from './preset-selector';

describe('PRESET_OPTIONS', () => {
  it('expone las tres opciones en orden: generico, acta, nomina', () => {
    expect(PRESET_OPTIONS).toEqual([
      { value: 'generico', label: 'Generico' },
      { value: 'acta', label: 'Acta de comunidad' },
      { value: 'nomina', label: 'Nomina/expediente' },
    ]);
  });
});

describe('buildPresetSelector', () => {
  it('crea un <select id="preset-tipo-documento"> con una opción por PRESET_OPTIONS y valor inicial generico', () => {
    const select = buildPresetSelector(document, () => {});

    expect(select.tagName).toBe('SELECT');
    expect(select.id).toBe('preset-tipo-documento');
    expect(select.value).toBe('generico');

    const options = Array.from(select.querySelectorAll('option'));
    expect(options.map((o) => o.value)).toEqual(['generico', 'acta', 'nomina']);
    expect(options.map((o) => o.textContent)).toEqual([
      'Generico',
      'Acta de comunidad',
      'Nomina/expediente',
    ]);
  });

  it('dispara onChange con el value elegido al cambiar la selección', () => {
    const seen: string[] = [];
    const select = buildPresetSelector(document, (preset) => seen.push(preset));

    select.value = 'nomina';
    select.dispatchEvent(new Event('change'));

    expect(seen).toEqual(['nomina']);
  });
});
