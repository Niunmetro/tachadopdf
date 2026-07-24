import type { PatternKind } from '../types';

export interface CategoriaComprobada {
  kind: PatternKind;
  count: number;
  ejemplos: string[];
}

export interface ResumenComprobacion {
  totalDatos: number;
  categorias: CategoriaComprobada[];
  paginasEscaneadas: number[];
  veredicto: string;
}
