import { describe, expect, it } from 'vitest';
import { analizarPdf, FicheroNoPdfError } from './analyze';
import { pdfConTexto, pdfSoloImagen, pdfMultiPagina } from '../test/fixtures';

describe('analizarPdf', () => {
  it('detecta y cuenta un DNI válido', async () => {
    const bytes = await pdfConTexto('DNI 12345678Z');
    const resumen = await analizarPdf(bytes);
    const categoriaDni = resumen.categorias.find((c) => c.kind === 'dni');
    expect(categoriaDni).toBeDefined();
    expect(categoriaDni?.count).toBe(1);
    expect(resumen.totalDatos).toBe(1);
  });

  it('marca como escaneada una página solo-imagen', async () => {
    const bytes = await pdfSoloImagen();
    const resumen = await analizarPdf(bytes);
    expect(resumen.paginasEscaneadas).toContain(0);
  });

  it('detecta datos en todas las páginas de un PDF multipágina', async () => {
    const bytes = await pdfMultiPagina(['DNI 12345678Z', 'sin datos aquí', 'contacto@ejemplo.com']);
    const resumen = await analizarPdf(bytes);
    const categoriaDni = resumen.categorias.find((c) => c.kind === 'dni');
    const categoriaEmail = resumen.categorias.find((c) => c.kind === 'email');
    expect(categoriaDni?.count).toBe(1);
    expect(categoriaEmail?.count).toBe(1);
    expect(resumen.paginasEscaneadas).toEqual([]);
  });

  it('lanza FicheroNoPdfError si los bytes no empiezan por la firma %PDF', async () => {
    const bytes = new Uint8Array([0x00, 0x01, 0x02, 0x03]);
    await expect(analizarPdf(bytes)).rejects.toThrow(FicheroNoPdfError);
  });
});
