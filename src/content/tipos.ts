// Formas del contenido publicable. Todo el texto de las páginas estáticas vive como DATOS
// (bloques tipados), nunca como HTML crudo: así el generador puede escapar cada cadena y ningún
// texto de contenido puede inyectar marcado por descuido.
//
// Las interpolaciones son FUNCIONES, no plantillas posicionales tipo «{0}»: TypeScript comprueba
// la aridad y el tipo de cada sustitución, y el orden de las palabras (que en español y en inglés
// no coincide) lo decide cada idioma.

import type { DocumentPreset } from '../detect/presets';
import type { PatternKind } from '../types';

export type EtiquetasPatron = Record<PatternKind, string>;

/** Un bloque de prosa dentro del cuerpo de una guía. */
export type Bloque =
  | { t: 'p'; texto: string }
  | { t: 'h2'; texto: string }
  | { t: 'ul'; items: string[] }
  | { t: 'ol'; items: string[] }
  | { t: 'nota'; texto: string };

export interface EntradaFaq {
  pregunta: string;
  respuesta: string;
}

/**
 * Una guía informativa. `cuerpo` vacío significa "la página existe pero su HTML no lo genera
 * este motor" (las guías españolas son ficheros estáticos escritos a mano en public/guia/*).
 * De esas guías solo se usan el id y `tituloEnlace`, para el índice de la home y el sitemap.
 */
export interface ContenidoGuia {
  id: string;
  titulo: string;
  tituloEnlace: string;
  descripcion: string;
  cuerpo: Bloque[];
}

/** Textos del informe de comprobación. El informe ES el producto: aquí no entra ni una promesa. */
export interface CopiaInforme {
  titulo: string;
  subtituloBanda: string;
  referencia: (ref: string, fecha: string) => string;
  selloOk: string;
  selloMal: string;
  lineaOk: string;
  lineaMal: string;
  encabezadoDatos: string;
  encabezadoComprobaciones: string;
  encabezadoAlcance: string;
  filaArchivo: string;
  filaFecha: string;
  filaReferencia: string;
  filaHuella: string;
  subPatrones: string;
  subZonas: string;
  subMetadatos: string;
  subEscaneadas: string;
  // `unverifiableManualPages` se calculaba y se tiraba: el informe podia estampar VERIFICADO
  // sobre un documento cuyos tachados manuales NUNCA fueron verificables (una caja sobre una
  // pagina sin texto no deja nada que releer). El peor fallo posible es un falso verde.
  subNoVerificables: string;
  noVerificablePagina: (pagina: number) => string;
  /** Va DELANTE de la frase positiva y con un CONTADOR, no con la lista: encabezar con «no hay
   *  residuos» es lo que hace que el aviso se lea de refilon, y la lista podria desbordar el
   *  ancho del sello. El detalle por pagina va en su propia seccion del informe. */
  lineaOkConNoVerificables: (cuantas: number) => string;
  patronLimpio: (etiqueta: string) => string;
  patronSucio: (etiqueta: string, ocurrencias: number, paginas: string) => string;
  zonasPagina: (pagina: number, cuenta: number) => string;
  ninguna: string;
  ninguno: string;
  paginaEscaneada: (pagina: number) => string;
  alcance: string;
  lineaGratis: string;
  marcaAgua: string;
  pie: string;
  numeroPagina: (indice: number, total: number) => string;
  etiquetas: EtiquetasPatron;
}

/** Textos del comprobador (el diagnóstico gratuito). */
export interface CopiaComprobador {
  etiquetas: EtiquetasPatron;
  analizando: string;
  noEsPdf: string;
  passwordRequerida: string;
  errorGenerico: string;
  avisoEscaneadas: string;
  pagina: (numero: number) => string;
  cta: string;
  // Cuatro plantillas, no una. Con una sola, un PDF entero escaneado produce 0 hits y el titular
  // decía «contiene 0 datos personales detectables»: un veredicto en verde sobre el documento
  // MENOS verificable que existe. El peor fallo posible es un falso verde.
  veredictoNada: string;
  veredictoDatos: (total: number) => string;
  veredictoDatosYEscaneos: (total: number, escaneadas: number) => string;
  veredictoSoloEscaneos: (escaneadas: number) => string;
}

/** Textos de los controles de la aplicación (todo lo que solo existe después de actuar). */
export interface CopiaApp {
  licenciaPlaceholder: string;
  verificarLicencia: string;
  licenciaValida: string;
  licenciaNoActiva: (motivo: string) => string;
  botonEjemplo: string;
  pistaEjemplo: string;
  ejemploFallido: string;
  tipoDocumento: string;
  presets: Record<DocumentPreset, string>;
  checkboxRevisado: string;
  botonDescargar: string;
  /** Sufijo del nombre de fichero del informe: `acta.pdf` -> `acta-informe.pdf`. */
  sufijoInforme: string;
  comprarPro: string;
  comprarProCuotaAgotada: (limite: number) => string;
  cuotaPro: string;
  cuotaGratis: (usados: number, limite: number, maxPaginas: number) => string;
  cuotaAgotada: string;
  loteRequierePro: string;
  limitePaginas: (fichero: string, paginas: number, maxPaginas: number) => string;
  noSePudoAbrir: (fichero: string) => string;
  passwordPrompt: string;
  errorRender: string;
  errorProcesado: (detalle: string) => string;
  residuosEnLote: string;
  avisoEscaneadas: (paginas: string) => string;
  comoTachar: string;
  revisionVisual: (paginas: string) => string;
  paginaEscaneada: (numero: number) => string;
  tacharTodas: (valor: string, ocurrencias: number) => string;
  seleccionarHits: (pagina: number) => string;
  quitarTachado: string;
}
