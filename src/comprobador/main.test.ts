// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';

vi.mock('./analyze', async () => {
  const real = await vi.importActual<typeof import('./analyze')>('./analyze');
  return { ...real, analizarPdf: vi.fn() };
});

import { PdfPasswordError } from '../pdf/engine';
import { FicheroNoPdfError, analizarPdf } from './analyze';
import type { ResumenComprobacion } from './types';
import { procesarFichero, type ElementosComprobador } from './main';

const analizarPdfMock = vi.mocked(analizarPdf);

function crearElementos(): ElementosComprobador {
  const dropzone = document.createElement('div');
  const fichero = document.createElement('input');
  fichero.type = 'file';
  const password = document.createElement('input');
  password.type = 'password';
  const resultado = document.createElement('div');
  const error = document.createElement('div');
  return { dropzone, fichero, password, resultado, error };
}

function crearFicheroPdf(): File {
  return new File([new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d])], 'prueba.pdf', {
    type: 'application/pdf',
  });
}

describe('procesarFichero', () => {
  it('analiza el fichero y pinta el resumen en cp-resultado', async () => {
    const elementos = crearElementos();
    const resumen: ResumenComprobacion = {
      totalDatos: 2,
      categorias: [{ kind: 'dni', count: 2, ejemplos: ['12.***.***-Z'] }],
      paginasEscaneadas: [],
      veredicto: 'Este PDF contiene 2 datos personales detectables.',
    };
    analizarPdfMock.mockResolvedValueOnce(resumen);

    await procesarFichero(crearFicheroPdf(), elementos);

    expect(elementos.error.textContent).toBe('');
    expect(elementos.resultado.querySelector('.cp-veredicto')?.textContent).toBe(
      'Este PDF contiene 2 datos personales detectables.',
    );
  });

  it('pasa la contraseña del campo cuando no está vacía', async () => {
    const elementos = crearElementos();
    elementos.password.value = 'secreta';
    analizarPdfMock.mockResolvedValueOnce({
      totalDatos: 0,
      categorias: [],
      paginasEscaneadas: [],
      veredicto: 'Sin datos.',
    });

    await procesarFichero(crearFicheroPdf(), elementos);

    expect(analizarPdfMock).toHaveBeenCalledWith(expect.any(Uint8Array), 'secreta');
  });

  it('muestra el mensaje de contraseña cuando el PDF está protegido', async () => {
    const elementos = crearElementos();
    analizarPdfMock.mockRejectedValueOnce(new PdfPasswordError());

    await procesarFichero(crearFicheroPdf(), elementos);

    expect(elementos.resultado.textContent).toBe('');
    expect(elementos.error.textContent).toContain('contraseña');
  });

  it('muestra el mensaje de no-PDF ante FicheroNoPdfError', async () => {
    const elementos = crearElementos();
    analizarPdfMock.mockRejectedValueOnce(new FicheroNoPdfError('sin firma'));

    await procesarFichero(crearFicheroPdf(), elementos);

    expect(elementos.error.textContent).toContain('no parece un PDF');
  });

  it('muestra un error genérico ante fallos inesperados', async () => {
    const elementos = crearElementos();
    analizarPdfMock.mockRejectedValueOnce(new Error('boom'));

    await procesarFichero(crearFicheroPdf(), elementos);

    expect(elementos.error.textContent).toContain('No se ha podido analizar');
  });
});
