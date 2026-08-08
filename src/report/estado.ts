import { CATEGORIAS_OBJETO, type EstadoSello, type ReportData } from '../types';

/**
 * El sello del informe, como funcion pura y UNICA fuente.
 *
 * Tres principios, y cada uno cierra un falso verde reproducido:
 *
 * P1 — el sello nombra su objeto, nunca el documento. El texto vive en la copia; aqui solo
 *      se decide CUAL, pero la escalera existe para que ningun rotulo pueda ser un participio
 *      suelto que el lector complete con «el documento esta verificado».
 * P2 — el estado es funcion de (cobertura ∧ resultado), no de resultado. Antes bastaba
 *      `verify.clean === true`, que tambien es cierto cuando no habia NADA que leer (documento
 *      escaneado), cuando no se tacho nada, y cuando el detector nunca supo mirar.
 * P3 — objeto presente y no examinado ⇒ el sello baja. Asi, el dia que se añada una categoria
 *      a «no examinado», los documentos que la lleven degradan solos en vez de ampliar el
 *      agujero en silencio; y el dia que el motor la trate, el sello deja de degradarse sin
 *      tocar ni una linea de texto.
 *
 * La escalera se evalua de arriba abajo y gana el primero que se cumple, asi que los estados
 * son totales y exclusivos por construccion. `estado.test.ts` barre las 144 combinaciones.
 */
export function estadoDelSello(data: ReportData): EstadoSello {
  // E1 · falla cerrado: cualquier duda sobre si la comprobacion llego a correr cae aqui.
  if (data.verify === undefined || data.verify.clean !== true || data.totalPaginas <= 0) {
    return 'E1';
  }
  // E2 · el documento escaneado entero. No es que falte una parte: es que no hay comprobacion.
  if (paginasSinTexto(data) >= data.totalPaginas) {
    return 'E2';
  }
  // E3 · queda algo sin comprobar, en paginas o en objetos del archivo.
  if (paginasConReserva(data).length > 0 || hayObjetoNoExaminado(data)) {
    return 'E3';
  }
  // E4 · se releyo todo y salio limpio, pero la herramienta no elimino NADA.
  if (zonasTachadas(data) === 0) {
    return 'E4';
  }
  return 'E5';
}

/** Numero de paginas distintas sin capa de texto (tolerante a duplicados en la entrada). */
export function paginasSinTexto(data: ReportData): number {
  return new Set(data.paginasSinCapaDeTexto).size;
}

/**
 * Paginas sobre las que el informe tiene alguna reserva: sin capa de texto que releer, con
 * CUALQUIER imagen (su contenido no se lee), o con un tachado manual que no se pudo confirmar.
 *
 * Las paginas con imagen entran aqui desde que se reprodujo el falso verde mas comercial de
 * todos: un acta con texto normal y una FOTO del DNI pegada al 25 % del area salia
 * «TACHADO VERIFICADO», con el DNI a tamaño de titular al abrir el archivo entregado. El umbral
 * del 60 % no lo tapa: es que por debajo del umbral no degradaba NADA.
 *
 * Enumerar las paginas con imagen en la tabla de cobertura, como se hacia, no basta: una fila
 * mas en una tabla no cambia lo que el sello AFIRMA, y lo que afirmaba era falso.
 *
 * Coste medido sobre 129 PDF reales del disco: 111 (el 86 %) llevan alguna imagen — casi siempre
 * el logo del membrete —, asi que a partir de ahora el estado normal del producto es E3 y el
 * verde queda para documentos de solo texto. Se acepta a sabiendas: el contrato del producto dice
 * que el peor fallo posible es un falso verde, y «TACHADO VERIFICADO» sobre un acta con la foto
 * de un DNI dentro es una afirmacion citable en una reclamacion. Para que el ambar no se vuelva
 * ruido, el sello DICE cual es la reserva cuando la unica que hay son imagenes.
 */
export function paginasConReserva(data: ReportData): number[] {
  return [
    ...new Set([
      ...data.paginasSinCapaDeTexto,
      ...data.paginasImagenCompleta,
      ...data.paginasConImagen,
      ...data.unverifiableManualPages,
      ...data.paginasTextoNoLegible.map((p) => p.page),
    ]),
  ].sort((a, b) => a - b);
}

/**
 * La unica reserva son imagenes: todo se releyo, todos los tachados se confirmaron y ninguna
 * pagina esta tapada del todo. Es el caso corriente (un logo en el membrete) y merece una frase
 * propia: si el ambar dijera siempre lo mismo, el lector dejaria de leerlo.
 */
export function reservaSoloPorImagenes(data: ReportData): boolean {
  return (
    data.paginasConImagen.length > 0 &&
    data.paginasSinCapaDeTexto.length === 0 &&
    data.paginasImagenCompleta.length === 0 &&
    data.unverifiableManualPages.length === 0 &&
    data.paginasTextoNoLegible.length === 0
  );
}

/** Paginas que SI se releyeron tras el tachado. El denominador vive en `totalPaginas`. */
export function paginasReleidas(data: ReportData): number {
  return Math.max(0, data.totalPaginas - paginasSinTexto(data));
}

/**
 * COBERTURA COMPROBADA: la proporcion de paginas sobre las que la comprobacion llego a TODO el
 * contenido. Es lo que MIDE el medidor del sello ambar, que hasta ahora salia medio lleno
 * siempre: un dibujo con forma de medidor que no medía nada, y que dibujaba media cobertura
 * sobre un documento cuya cobertura real era cero.
 *
 * Numerador y denominador son los MISMOS numeros que ya imprime el sello y que ya enumera la
 * tabla «Cobertura»: el total de paginas menos las que llevan alguna reserva — exactamente las
 * que el sello cuenta («En N pagina(s) la comprobacion automatica no llega a todo el contenido»,
 * «lo que queda fuera es el contenido de N pagina(s) con imagenes») y las que la tabla destaca en
 * ambar. El dibujo y el texto no pueden decir cosas distintas.
 *
 * NO es «paginas releidas / total», que es la otra cifra del sello, por dos razones:
 *   1. Una pagina releida con una foto del DNI pegada dentro SI se releyo, pero la comprobacion
 *      no alcanza lo que hay en la imagen. Contarla como cubierta es el mismo falso verde que
 *      `paginasConReserva` existe para evitar.
 *   2. En el caso corriente —el 86 % de los documentos reales: un logo en el membrete— todas las
 *      paginas se releen, asi que esa medida marcaria el maximo justo en el estado que por
 *      definicion no esta completo, y los dos informes parciales seguirian siendo el mismo dibujo.
 * `sinReserva <= releidas` siempre, porque una pagina sin capa de texto ya lleva reserva por
 * serlo: de las dos medidas, esta es la conservadora.
 */
export function coberturaComprobada(data: ReportData): number {
  if (data.totalPaginas <= 0) return 0;
  const sinReserva = data.totalPaginas - paginasConReserva(data).length;
  return Math.min(1, Math.max(0, sinReserva / data.totalPaginas));
}

export function zonasTachadas(data: ReportData): number {
  return data.boxesPerPage.reduce((total, entrada) => total + entrada.count, 0);
}

export function paginasConZonas(data: ReportData): number {
  return new Set(data.boxesPerPage.filter((e) => e.count > 0).map((e) => e.page)).size;
}

export function hayObjetoNoExaminado(data: ReportData): boolean {
  return CATEGORIAS_OBJETO.some((categoria) => data.objetos[categoria] === 'noExaminado');
}
