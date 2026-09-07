import { describe, expect, it } from 'vitest';
import { analizarPdf } from '../pdf/metadata';
import { pdfConMetadatos, pdfConTexto } from '../test/fixtures';

describe('analizarPdf: revelado de metadatos de PDF', () => {
  it('lee el autor y el software del diccionario Info', async () => {
    const bytes = await pdfConMetadatos({ author: 'Juan Perez', creator: 'Microsoft Word' });
    const a = await analizarPdf(bytes);
    const claves = a.info.map((c) => c.clave);
    expect(claves).toContain('Author');
    expect(claves).toContain('Creator');
    expect(a.info.find((c) => c.clave === 'Author')?.valor).toBe('Juan Perez');
    expect(a.info.find((c) => c.clave === 'Creator')?.valor).toBe('Microsoft Word');
  });

  it('un PDF sin autor no reporta el campo Author', async () => {
    // pdf-lib pone un Producer por defecto, pero nunca un Author salvo que se lo demos.
    const bytes = await pdfConTexto('documento sin autor');
    const a = await analizarPdf(bytes);
    expect(a.info.map((c) => c.clave)).not.toContain('Author');
  });
});
