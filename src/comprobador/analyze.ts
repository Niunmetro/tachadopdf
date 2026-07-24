import type { ResumenComprobacion } from './types';

export class FicheroNoPdfError extends Error {}

export async function analizarPdf(bytes: Uint8Array, password?: string): Promise<ResumenComprobacion> {
  return { totalDatos: 0, categorias: [], paginasEscaneadas: [], veredicto: '' };
}
