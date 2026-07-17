import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { detect } from '../detect/patterns';
import { loadPdf } from './engine';
import { processDocument } from './pipeline';

// Prueba de ROBUSTEZ end-to-end con un PDF realista (acta de comunidad, 2 páginas) que trae los
// datos en los formatos difíciles que aparecen de verdad: DNI con puntos, IBAN con y sin espacios,
// teléfonos con guiones/espacios, NIE, NUSS con «/», emails. Equivalente automatizado a "probarlo
// con un PDF real". El fichero se genera con scripts/gen-acta-real.mjs (pdf-lib).
function actaReal(): Uint8Array {
  return new Uint8Array(readFileSync(new URL('./fixtures/acta-real.pdf', import.meta.url)));
}

describe('PDF realista: detección y tachado end-to-end sobre formatos reales', () => {
  it('detecta DNI/IBAN/teléfono/NIE/NUSS/email en todas sus variantes', async () => {
    const doc = await loadPdf(actaReal());
    const kinds = new Set(detect(doc.extractAllText().join('\n')).map((h) => h.kind));
    expect(kinds.has('dni')).toBe(true); // "12.345.678-Z" (puntos) y "87654321X" (pegado)
    expect(kinds.has('iban')).toBe(true); // "ES91 2100 ..." (espacios) y sin espacios
    expect(kinds.has('telefono')).toBe(true); // "612 34 56 78" y "91-234-56-78"
    expect(kinds.has('nie')).toBe(true); // "Y1234567X"
    expect(kinds.has('nuss')).toBe(true); // "28/12345678/40"
    expect(kinds.has('email')).toBe(true); // "limpieza@ejemplo.com"
  });

  it('tras el pipeline completo, NINGÚN dato sigue siendo extraíble (verify.clean) y el PDF final está limpio', async () => {
    const result = await processDocument({
      bytes: actaReal(),
      fileName: 'acta-real.pdf',
      freeVersion: false,
      manual: [],
    });

    // La verificación anti-falso-verde del propio producto declara el trabajo limpio.
    expect(result.verify.clean).toBe(true);
    expect(result.verify.residues).toEqual([]);

    // Y comprobamos de forma INDEPENDIENTE releyendo el PDF final: los valores concretos ya no están.
    const finalDoc = await loadPdf(result.cleanedBytes);
    const textoFinal = finalDoc.extractAllText().join('\n');
    for (const dato of [
      '12345678Z',
      '87654321X',
      'ES9121000418450200051332',
      'Y1234567X',
      'limpieza@ejemplo.com',
    ]) {
      expect(textoFinal).not.toContain(dato);
    }
    // Y sobre el texto final, el detector ya no encuentra nada.
    expect(detect(textoFinal)).toEqual([]);
  });
});
