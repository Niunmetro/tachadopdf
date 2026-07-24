import type { Hit } from '../types';
import type { ResumenComprobacion } from './types';
import { loadPdf } from '../pdf/engine';
import { detect } from '../detect/patterns';
import { construirResumen } from './summary';

const FIRMA_PDF = [0x25, 0x50, 0x44, 0x46];

export class FicheroNoPdfError extends Error {}

function tieneFirmaPdf(bytes: Uint8Array): boolean {
  if (bytes.length < FIRMA_PDF.length) return false;
  return FIRMA_PDF.every((byte, i) => bytes[i] === byte);
}

export async function analizarPdf(bytes: Uint8Array, password?: string): Promise<ResumenComprobacion> {
  if (!tieneFirmaPdf(bytes)) {
    throw new FicheroNoPdfError('El fichero no es un PDF válido: falta la firma %PDF');
  }

  const doc = await loadPdf(bytes, password);
  try {
    const hits: Hit[] = [];
    for (const texto of doc.extractAllText()) {
      hits.push(...detect(texto));
    }
    const paginasEscaneadas = doc.scannedPages();
    return construirResumen(hits, paginasEscaneadas);
  } finally {
    doc.close();
  }
}
