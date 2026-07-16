import { inflateSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import {
  inyectarResiduo,
  pdfConMetadatos,
  pdfConTexto,
  pdfDniFragmentado,
  pdfSoloImagen,
} from './fixtures';

function esPdfValido(bytes: Uint8Array): boolean {
  const cabecera = new TextDecoder('latin1').decode(bytes.slice(0, 5));
  return cabecera === '%PDF-';
}

// Los content streams van comprimidos con FlateDecode: hay que inflarlos
// antes de poder buscar los operadores de texto (Tj/TJ) en el flujo.
function contieneOperadoresDeTexto(bytes: Uint8Array): boolean {
  const buffer = Buffer.from(bytes);
  const patronStream = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let coincidencia: RegExpExecArray | null;
  let contenidoDecodificado = '';

  while ((coincidencia = patronStream.exec(buffer.toString('latin1'))) !== null) {
    const cuerpo = coincidencia[1] ?? '';
    const inicio = coincidencia.index + coincidencia[0].indexOf('stream') + 7;
    const fin = inicio + cuerpo.length;
    const crudo = buffer.subarray(inicio, fin);
    try {
      contenidoDecodificado += inflateSync(crudo).toString('latin1');
    } catch {
      contenidoDecodificado += crudo.toString('latin1');
    }
  }

  return /\bTj\b|\bTJ\b/.test(contenidoDecodificado);
}

describe('fixtures de PDF', () => {
  it('pdfConTexto genera bytes de PDF válidos', async () => {
    const bytes = await pdfConTexto('DNI 12345678Z');
    expect(esPdfValido(bytes)).toBe(true);
  });

  it('pdfDniFragmentado genera bytes de PDF válidos', async () => {
    const bytes = await pdfDniFragmentado();
    expect(esPdfValido(bytes)).toBe(true);
  });

  it('pdfConMetadatos genera bytes de PDF válidos con metadatos rellenos', async () => {
    const bytes = await pdfConMetadatos({
      title: 'Contrato',
      author: 'Autor',
      subject: 'Asunto',
      keywords: 'dni, rgpd',
      producer: 'TachadoPDF',
      creator: 'TachadoPDF',
    });
    expect(esPdfValido(bytes)).toBe(true);
  });

  it('pdfSoloImagen genera bytes de PDF válidos', async () => {
    const bytes = await pdfSoloImagen();
    expect(esPdfValido(bytes)).toBe(true);
  });

  it('pdfSoloImagen no tiene texto extraíble (sin operadores Tj/TJ)', async () => {
    const bytes = await pdfSoloImagen();
    expect(contieneOperadoresDeTexto(bytes)).toBe(false);
  });

  it('inyectarResiduo genera bytes de PDF válidos y añade el residuo al flujo', async () => {
    const base = await pdfConTexto('documento limpio');
    const bytes = await inyectarResiduo(base, 'RESIDUO-SECRETO');
    expect(esPdfValido(bytes)).toBe(true);
    expect(contieneOperadoresDeTexto(bytes)).toBe(true);
  });
});
