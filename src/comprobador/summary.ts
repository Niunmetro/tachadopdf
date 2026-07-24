import type { Hit, PatternKind } from '../types';
import type { CategoriaComprobada, ResumenComprobacion } from './types';
import { enmascarar } from './mask';

const ORDEN_KINDS: PatternKind[] = ['dni', 'nie', 'iban', 'nuss', 'telefono', 'email', 'catastro'];

export function construirResumen(hits: Hit[], paginasEscaneadas: number[]): ResumenComprobacion {
  const categorias: CategoriaComprobada[] = [];

  for (const kind of ORDEN_KINDS) {
    const hitsDeKind = hits.filter((hit) => hit.kind === kind);
    if (hitsDeKind.length === 0) continue;

    const valoresDistintos: string[] = [];
    for (const hit of hitsDeKind) {
      if (!valoresDistintos.includes(hit.value)) {
        valoresDistintos.push(hit.value);
      }
      if (valoresDistintos.length >= 3) break;
    }

    categorias.push({
      kind,
      count: hitsDeKind.length,
      ejemplos: valoresDistintos.map(enmascarar),
    });
  }

  const totalDatos = hits.length;

  return {
    totalDatos,
    categorias,
    paginasEscaneadas,
    veredicto: `Este PDF contiene ${totalDatos} datos personales detectables`,
  };
}
