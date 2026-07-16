import type { VerifyResidue, VerifyResult } from '../types';
import { detect } from '../detect/patterns';

export function verifyRedaction(
  pageTexts: string[],
  manualStrings: string[],
  metadataTexts: string[] = [],
): VerifyResult {
  const residues: VerifyResidue[] = [];

  pageTexts.forEach((texto, page) => {
    for (const hit of detect(texto)) {
      residues.push({ kind: hit.kind, value: hit.value, page });
    }
  });

  for (const manual of manualStrings) {
    if (manual.trim() === '') continue;
    pageTexts.forEach((texto, page) => {
      if (texto.includes(manual)) {
        residues.push({ kind: 'manual', value: manual, page });
      }
    });
  }

  for (const texto of metadataTexts) {
    for (const hit of detect(texto)) {
      residues.push({ kind: hit.kind, value: hit.value, page: null });
    }
    for (const manual of manualStrings) {
      if (manual.trim() === '') continue;
      if (texto.includes(manual)) {
        residues.push({ kind: 'manual', value: manual, page: null });
      }
    }
  }

  return { clean: residues.length === 0, residues };
}
