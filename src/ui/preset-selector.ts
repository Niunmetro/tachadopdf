import type { DocumentPreset } from '../detect/presets';

export const PRESET_OPTIONS: { value: DocumentPreset; label: string }[] = [
  { value: 'generico', label: 'Generico' },
  { value: 'acta', label: 'Acta de comunidad' },
  { value: 'nomina', label: 'Nomina/expediente' },
];

export function buildPresetSelector(
  doc: Document,
  onChange: (preset: DocumentPreset) => void,
): HTMLSelectElement {
  const select = doc.createElement('select');
  select.id = 'preset-tipo-documento';
  for (const option of PRESET_OPTIONS) {
    const optionEl = doc.createElement('option');
    optionEl.value = option.value;
    optionEl.textContent = option.label;
    select.appendChild(optionEl);
  }
  select.value = 'generico';
  select.addEventListener('change', () => {
    onChange(select.value as DocumentPreset);
  });
  return select;
}
