import type { Hit } from '../types';
import type { ResumenComprobacion } from './types';

export function construirResumen(hits: Hit[], paginasEscaneadas: number[]): ResumenComprobacion {
  return { totalDatos: 0, categorias: [], paginasEscaneadas: [], veredicto: '' };
}
