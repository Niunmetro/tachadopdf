import { describe, expect, it } from 'vitest';
import { pdfMultiPagina, pdfSoloImagen } from '../test/fixtures';
import { loadPdf } from './engine';
import { findAllOccurrenceMarks } from './occurrences';

describe('findAllOccurrenceMarks', () => {
  it('encuentra todas las apariciones de un valor en varias páginas', async () => {
    const bytes = await pdfMultiPagina([
      'DNI 12345678Z aquí',
      'Nada relevante',
      'Repetido DNI 12345678Z otra vez',
    ]);
    const doc = await loadPdf(bytes);

    const marks = findAllOccurrenceMarks(doc, 'DNI 12345678Z', []);

    expect(marks.map((m) => m.page)).toEqual([0, 2]);
    expect(marks.map((m) => m.rects.length)).toEqual([1, 1]);

    doc.close();
  });

  it('salta las páginas indicadas en reviewPages aunque contengan el valor', async () => {
    const bytes = await pdfMultiPagina(['DNI 12345678Z', 'DNI 12345678Z']);
    const doc = await loadPdf(bytes);

    const marks = findAllOccurrenceMarks(doc, 'DNI 12345678Z', [0]);

    expect(marks.map((m) => m.page)).toEqual([1]);

    doc.close();
  });

  it('devuelve [] si value es cadena vacía', async () => {
    const bytes = await pdfMultiPagina(['algo de texto']);
    const doc = await loadPdf(bytes);

    expect(findAllOccurrenceMarks(doc, '', [])).toEqual([]);

    doc.close();
  });

  it('devuelve [] si el valor no aparece en ninguna página', async () => {
    const bytes = await pdfMultiPagina(['algo de texto', 'otra página']);
    const doc = await loadPdf(bytes);

    expect(findAllOccurrenceMarks(doc, 'inexistente-xyz', [])).toEqual([]);

    doc.close();
  });

  it('una página sin capa de texto no aporta marcas aunque no esté en reviewPages', async () => {
    const bytes = await pdfSoloImagen();
    const doc = await loadPdf(bytes);

    expect(findAllOccurrenceMarks(doc, 'lo que sea', [])).toEqual([]);

    doc.close();
  });
});
