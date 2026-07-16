import type { PageMark } from '../types';

export async function loadPdf(_bytes: Uint8Array): Promise<unknown> {
  throw new Error('no implementado');
}

export async function redactPdf(_bytes: Uint8Array, _marks: PageMark[]): Promise<Uint8Array> {
  throw new Error('no implementado');
}
