export type PatternKind = 'dni' | 'nie' | 'iban' | 'nuss' | 'telefono' | 'email' | 'catastro';

export interface Hit {
  kind: PatternKind;
  value: string;
  start: number;
  end: number;
}

export interface BoxRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface PageMark {
  page: number;
  rects: BoxRect[];
}

export interface VerifyResidue {
  kind: PatternKind | 'manual';
  value: string;
  page: number | null;
}

export interface VerifyResult {
  /** true = todo lo que el usuario PIDIÓ tachar está verificado como borrado. NO significa «no
   *  queda ningún dato en el documento»: un dato detectado que el usuario decidió NO tachar sale
   *  en `datosNoTachados`, no bloquea la entrega, y degrada el sello a ámbar. */
  clean: boolean;
  /** Residuos BLOQUEANTES: algo que el usuario marcó para tachar (una caja manual, o un valor
   *  detectado que seleccionó) sigue siendo extraíble = falso verde real. Bloquea la descarga. */
  residues: VerifyResidue[];
  /** Datos detectados que el usuario NO marcó para tachar y siguen en el documento entregado. Es
   *  una decisión legítima suya (tachar solo una frase y dejar el resto), no un fallo: se ENTREGA
   *  el fichero, pero el informe lo dice y el sello no puede ser verde. Ausente = ninguno. */
  datosNoTachados?: VerifyResidue[];
}

/**
 * Los cinco estados del sello del informe. Se evaluan en escalera (ver `report/estado.ts`).
 * Un participio suelto («VERIFICADO») deja que el lector complete la frase, y la completa mal.
 * Cada estado nombra su objeto y solo E5 es verde.
 */
export type EstadoSello = 'E1' | 'E2' | 'E3' | 'E4' | 'E5';

/**
 * Estado de una categoria de objeto del PDF en el inventario del informe.
 * `noExaminado` significa: el documento LO TIENE y la herramienta no sabe mirarlo. Por eso
 * degrada el sello: un agujero conocido dicho en voz alta, no un hueco en silencio.
 */
export type EstadoObjeto = 'eliminado' | 'noHabia' | 'noExaminado';

export interface InventarioObjetos {
  info: EstadoObjeto;
  xmp: EstadoObjeto;
  anotaciones: EstadoObjeto;
  formularios: EstadoObjeto;
  adjuntos: EstadoObjeto;
  marcadores: EstadoObjeto;
  /** Textos alternativos y etiquetas de accesibilidad (`/Alt`, `/ActualText`, `/E`). */
  alternativos: EstadoObjeto;
  /** Objetos internos con texto que ningun lector enseña: miniaturas, XMP anidado en cualquier
   *  objeto, datos privados de aplicacion, etiquetas de pagina, nombres de capa, ficheros
   *  asociados, acciones y JavaScript. */
  ocultos: EstadoObjeto;
}

export const CATEGORIAS_OBJETO = [
  'info',
  'xmp',
  'anotaciones',
  'formularios',
  'adjuntos',
  'marcadores',
  'alternativos',
  'ocultos',
] as const satisfies readonly (keyof InventarioObjetos)[];

export interface ReportData {
  fileName: string;
  sha256: string;
  date: string;
  patternsSearched: PatternKind[];
  /** Denominador de TODA la cobertura. Sin el, «1 pagina sin capa de texto» no distingue
   *  1 de 40 (residual) de 1 de 1 (no se comprobo nada). Sin denominador no hay alcance. */
  totalPaginas: number;
  boxesPerPage: { page: number; count: number }[];
  objetos: InventarioObjetos;
  /** Paginas de las que no se puede extraer texto: no queda NADA que releer. */
  paginasSinCapaDeTexto: number[];
  /** Paginas CON capa de texto pero cubiertas por una imagen grande: su texto si se comprobo,
   *  el contenido de la imagen no. Es un hecho distinto de «sin capa de texto» y el informe
   *  lo decia mal: afirmaba de estas paginas que no tenian texto. */
  paginasImagenCompleta: number[];
  /** Paginas que llevan alguna imagen, SIN umbral. Su contenido visual no se comprueba, y por
   *  debajo del umbral de «imagen a pagina completa» el informe no las nombraba en absoluto. */
  paginasConImagen: number[];
  /** Paginas donde una caja manual no cubrio texto extraible: el borrado se aplico, pero NO se
   *  pudo confirmar releyendo el fichero. Constan en el informe; no se dan por buenas. */
  unverifiableManualPages: number[];
  /** Paginas que DIBUJAN texto que la herramienta no puede releer (un `/ToUnicode` que miente,
   *  una fuente subconjunto mal generada), con cuantos caracteres son. El humano lee lo que se
   *  dibuja; el detector lee lo que dice el `/ToUnicode`: ahi cabia un DNI entero, sin detectar,
   *  sin tachar y sin reencontrar, bajo un sello verde. */
  paginasTextoNoLegible: { page: number; caracteres: number }[];
  freeVersion: boolean;
  verify?: VerifyResult;
}

export interface LicenseStatus {
  pro: boolean;
  reason: 'valid' | 'invalid' | 'absent' | 'offline';
}

export interface QuotaStatus {
  usedThisMonth: number;
  limit: number;
  allowed: boolean;
}
