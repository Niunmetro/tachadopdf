// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { buildPresetSelector, PRESET_VALUES } from './preset-selector';
import { es } from '../content/es';

const ETIQUETAS = es.app.presets;

describe('PRESET_VALUES', () => {
  it('expone las tres claves internas en orden: generico, acta, nomina', () => {
    expect(PRESET_VALUES).toEqual(['generico', 'acta', 'nomina']);
  });
});

describe('buildPresetSelector', () => {
  it('crea un <select id="preset-tipo-documento"> con una opcion por PRESET_VALUES y valor inicial generico', () => {
    const select = buildPresetSelector(document, () => {}, ETIQUETAS);

    expect(select.tagName).toBe('SELECT');
    expect(select.id).toBe('preset-tipo-documento');
    expect(select.value).toBe('generico');

    const options = Array.from(select.querySelectorAll('option'));
    expect(options.map((o) => o.value)).toEqual(['generico', 'acta', 'nomina']);
    expect(options.map((o) => o.textContent)).toEqual([
      ETIQUETAS.generico,
      ETIQUETAS.acta,
      ETIQUETAS.nomina,
    ]);
  });

  it('dispara onChange con el value elegido al cambiar la selección', () => {
    const seen: string[] = [];
    const select = buildPresetSelector(document, (preset) => seen.push(preset), ETIQUETAS);

    select.value = 'nomina';
    select.dispatchEvent(new Event('change'));

    expect(seen).toEqual(['nomina']);
  });
});
