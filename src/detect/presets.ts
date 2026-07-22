import type { PatternKind } from '../types';

export type DocumentPreset = 'generico' | 'acta' | 'nomina';

const PRESET_PATTERNS: Record<DocumentPreset, PatternKind[]> = {
  generico: ['dni', 'nie', 'iban', 'nuss', 'telefono', 'email', 'catastro'],
  acta: ['dni', 'nie', 'iban', 'telefono', 'email', 'catastro'],
  nomina: ['dni', 'nie', 'nuss', 'iban', 'telefono'],
};

export function patternsForPreset(preset: DocumentPreset): PatternKind[] {
  return [...PRESET_PATTERNS[preset]];
}
