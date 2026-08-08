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
 * Paginas sobre las que el informe tiene alguna reserva: sin capa de texto que releer, cubiertas
 * por una imagen a pagina completa, o con un tachado manual que no se pudo confirmar.
 */
export function paginasConReserva(data: ReportData): number[] {
  return [
    ...new Set([
      ...data.paginasSinCapaDeTexto,
      ...data.paginasImagenCompleta,
      ...data.unverifiableManualPages,
    ]),
  ].sort((a, b) => a - b);
}

/** Paginas que SI se releyeron tras el tachado. El denominador vive en `totalPaginas`. */
export function paginasReleidas(data: ReportData): number {
  return Math.max(0, data.totalPaginas - paginasSinTexto(data));
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
