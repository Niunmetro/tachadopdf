import type { PatternKind, VerifyResidue, VerifyResult } from '../types';
import { detect } from '../detect/patterns';

/**
 * Un dato puede quedar PARTIDO por un salto de linea (una celda estrecha de tabla parte
 * `12345678Z` en `1234` / `5678Z`). Medido: `detect` no lo ve, y `searchText` de mupdf TAMPOCO lo
 * encuentra, asi que la herramienta no puede ni ofrecer una caja para tacharlo. El dato seguia
 * siendo extraible del archivo entregado y el informe lo sellaba en verde.
 *
 * La guarda lo mira tambien con los saltos quitados. Como la herramienta no puede tacharlo sola,
 * el resultado es un BLOQUEO con su patron y su pagina, para que el usuario lo tache a mano — que
 * es una salida que existe: una caja manual sobre las dos lineas lo elimina y desbloquea.
 */
export function textoSinSaltos(texto: string): string {
  return texto.replace(/[ \t]*\r?\n[ \t]*/g, '');
}

/**
 * Juntar dos lineas puede FABRICAR una coincidencia: `7500` y `43210` en filas consecutivas dan
 * nueve digitos seguidos, que es exactamente la forma de un telefono espanol. Por eso el barrido
 * de saltos de linea solo cuenta para los patrones que llevan digito de control, mas el correo,
 * que necesita una arroba.
 *
 * Es una decision con su coste: un TELEFONO o una REFERENCIA CATASTRAL partidos en dos lineas no
 * se reencuentran. Se elige asi porque el bloqueo por un residuo inventado no tendria salida —el
 * usuario no puede quitar un dato que no existe— y un informe que no se puede emitir nunca es
 * peor que uno que declara su alcance. La referencia catastral queda fuera porque son veinte
 * caracteres alfanumericos sin mas comprobacion: juntar dos codigos de una tabla los produce.
 */
const PATRONES_ROBUSTOS_AL_SALTO: ReadonlySet<PatternKind> = new Set<PatternKind>([
  'dni',
  'nie',
  'iban',
  'nuss',
  'email',
]);

export function verifyRedaction(
  pageTexts: string[],
  manualStrings: string[],
  metadataTexts: string[] = [],
): VerifyResult {
  const residues: VerifyResidue[] = [];

  pageTexts.forEach((texto, page) => {
    for (const hit of detect(texto)) {
      residues.push({ kind: hit.kind, value: hit.value, page });
    }

    const unido = textoSinSaltos(texto);
    if (unido === texto) return;
    const yaVistos = new Set(detect(texto).map((hit) => `${hit.kind}:${hit.value}`));
    for (const hit of detect(unido)) {
      if (!PATRONES_ROBUSTOS_AL_SALTO.has(hit.kind)) continue;
      if (yaVistos.has(`${hit.kind}:${hit.value}`)) continue;
      residues.push({ kind: hit.kind, value: hit.value, page });
    }
  });

  for (const manual of manualStrings) {
    if (manual.trim() === '') continue;
    const manualUnido = textoSinSaltos(manual);
    pageTexts.forEach((texto, page) => {
      if (texto.includes(manual)) {
        residues.push({ kind: 'manual', value: manual, page });
        return;
      }
      // El texto que se capturo de una caja manual viene sin saltos: si reaparece repartido en
      // dos lineas, `includes` no lo ve. Es el mismo punto ciego, en el otro lado de la guarda.
      if (manualUnido !== '' && textoSinSaltos(texto).includes(manualUnido)) {
        residues.push({ kind: 'manual', value: manual, page });
      }
    });
  }

  for (const texto of metadataTexts) {
    for (const hit of detect(texto)) {
      residues.push({ kind: hit.kind, value: hit.value, page: null });
    }
    for (const manual of manualStrings) {
      if (manual.trim() === '') continue;
      if (texto.includes(manual)) {
        residues.push({ kind: 'manual', value: manual, page: null });
      }
    }
  }

  return { clean: residues.length === 0, residues };
}
