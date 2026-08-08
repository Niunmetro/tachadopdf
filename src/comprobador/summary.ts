import type { CopiaComprobador } from '../content/tipos';
import type { Hit, PatternKind } from '../types';
import type { CategoriaComprobada, ResumenComprobacion } from './types';
import { enmascarar } from './mask';

const ORDEN_KINDS: PatternKind[] = ['dni', 'nie', 'iban', 'nuss', 'telefono', 'email', 'catastro'];

/**
 * El veredicto ramifica por DOS ejes (¿hay datos? ¿hay páginas ilegibles?), no por uno. Con una
 * sola plantilla, un PDF entero escaneado daba `totalDatos = 0` y el titular decía «contiene 0
 * datos personales detectables»: verde sobre el documento menos verificable que existe.
 */
function veredictoDe(copia: CopiaComprobador, total: number, escaneadas: number): string {
  if (total > 0 && escaneadas > 0) return copia.veredictoDatosYEscaneos(total, escaneadas);
  if (total > 0) return copia.veredictoDatos(total);
  if (escaneadas > 0) return copia.veredictoSoloEscaneos(escaneadas);
  return copia.veredictoNada;
}

export function construirResumen(
  hits: Hit[],
  paginasEscaneadas: number[],
  copia: CopiaComprobador,
): ResumenComprobacion {
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
    veredicto: veredictoDe(copia, totalDatos, paginasEscaneadas.length),
  };
}
