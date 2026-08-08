import type { DocumentPreset } from '../detect/presets';

/** Orden fijo de las opciones. Los VALORES son claves internas y no se traducen nunca; las
 *  etiquetas visibles llegan por parámetro. */
export const PRESET_VALUES: DocumentPreset[] = ['generico', 'acta', 'nomina'];

export function buildPresetSelector(
  doc: Document,
  onChange: (preset: DocumentPreset) => void,
  etiquetas: Record<DocumentPreset, string>,
): HTMLSelectElement {
  const select = doc.createElement('select');
  select.id = 'preset-tipo-documento';
  for (const value of PRESET_VALUES) {
    const optionEl = doc.createElement('option');
    optionEl.value = value;
    optionEl.textContent = etiquetas[value];
    select.appendChild(optionEl);
  }
  select.value = 'generico';
  select.addEventListener('change', () => {
    onChange(select.value as DocumentPreset);
  });
  return select;
}
