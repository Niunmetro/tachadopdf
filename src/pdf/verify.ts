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

/**
 * `declinedValues` = valores que la herramienta SÍ ofreció tachar (los detectó como caja
 * automática) y que el usuario dejó SIN seleccionar a propósito. Es la clave que separa un FALSO
 * VERDE de una decisión legítima, y la distinción NO es «objetivo/no», sino «¿pudo el usuario
 * elegir dejarlo?»:
 *
 *  - un dato detectado que la herramienta OFRECIÓ y el usuario RECHAZÓ (tachar solo una frase y
 *    dejar el DNI) = decisión suya → sale en `datosNoTachados`, se ENTREGA el fichero, sello ámbar.
 *  - cualquier otro dato que siga extraíble —uno que se pidió tachar y sobrevivió, uno partido en
 *    dos renglones que nunca se pudo ofrecer, uno escondido en una clave de metadatos— NO se pudo
 *    rechazar: es un falso verde → residuo bloqueante, no se entrega.
 *
 * ⚠ FALLA CERRADO: si `declinedValues` es `undefined` (un llamador que no dice qué se ofreció y
 * rechazó), NADA se considera rechazado — todo residuo bloquea, el comportamiento antiguo. Solo el
 * pipeline, que sabe qué cajas ofreció y cuáles dejó el usuario sin marcar, pasa el conjunto y
 * relaja el bloqueo. Un default que fallara abierto sería un generador de falsos verdes.
 */
export function verifyRedaction(
  pageTexts: string[],
  manualStrings: string[],
  metadataTexts: string[] = [],
  declinedValues?: ReadonlySet<string>,
): VerifyResult {
  const residues: VerifyResidue[] = [];
  const datosNoTachados: VerifyResidue[] = [];
  // Solo lo que la herramienta ofreció Y el usuario dejó sin marcar cuenta como decisión suya.
  const esRechazado = (value: string): boolean =>
    declinedValues !== undefined && declinedValues.has(value);

  pageTexts.forEach((texto, page) => {
    const directos = detect(texto);
    for (const hit of directos) {
      // Detectado directamente en el texto ⇒ la herramienta lo ofreció como caja. Si el usuario la
      // rechazó, su presencia es una decisión (ámbar, no bloquea); si no, es un tachado que falló.
      if (esRechazado(hit.value)) datosNoTachados.push({ kind: hit.kind, value: hit.value, page });
      else residues.push({ kind: hit.kind, value: hit.value, page });
    }

    const unido = textoSinSaltos(texto);
    if (unido === texto) return;
    const yaVistos = new Set(directos.map((hit) => `${hit.kind}:${hit.value}`));
    for (const hit of detect(unido)) {
      if (!PATRONES_ROBUSTOS_AL_SALTO.has(hit.kind)) continue;
      if (yaVistos.has(`${hit.kind}:${hit.value}`)) continue;
      // Un dato que SOLO aparece al juntar dos renglones nunca se pudo ofrecer como caja, así que
      // el usuario no pudo rechazarlo: es un residuo bloqueante. (Si el MISMO valor ya salió entero
      // en otra página y allí se rechazó, ya consta en `datosNoTachados`; aquí no se duplica.)
      if (esRechazado(hit.value)) continue;
      residues.push({ kind: hit.kind, value: hit.value, page });
    }
  });

  for (const manual of manualStrings) {
    if (manual.trim() === '') continue;
    const manualUnido = textoSinSaltos(manual);
    pageTexts.forEach((texto, page) => {
      // Una caja manual es, por definición, algo que el usuario pidió tachar: si su texto
      // sobrevive es SIEMPRE residuo bloqueante, nunca «dato dejado a propósito».
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
    // Los metadatos se limpian solos: el usuario no elige por objeto, así que un dato que sobrevive
    // en una clave interna NUNCA es una decisión suya. Siempre bloquea.
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

  return { clean: residues.length === 0, residues, datosNoTachados };
}
