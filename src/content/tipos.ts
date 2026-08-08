// Formas del contenido publicable. Todo el texto de las páginas estáticas vive como DATOS
// (bloques tipados), nunca como HTML crudo: así el generador puede escapar cada cadena y ningún
// texto de contenido puede inyectar marcado por descuido.
//
// Las interpolaciones son FUNCIONES, no plantillas posicionales tipo «{0}»: TypeScript comprueba
// la aridad y el tipo de cada sustitución, y el orden de las palabras (que en español y en inglés
// no coincide) lo decide cada idioma.

import type { DocumentPreset } from '../detect/presets';
import type { EstadoSello, PatternKind } from '../types';

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

  /**
   * Un rótulo por estado del sello. `Record` obliga por tipos: un idioma al que le falte un
   * estado NO compila, así que no puede imprimirse un sello en blanco ni caer al español.
   * REGLA DE DISEÑO, probada en `estado.test.ts`: ningún rótulo puede ser subcadena de otro.
   * Si el ámbar se llamara «VERIFICADO CON RESERVAS», el test «una página escaneada no puede
   * salir verde» sería imposible de escribir y alguien lo debilitaría.
   */
  sellos: Record<EstadoSello, string>;
  /** E1 con residuos re-encontrados. */
  lineaBloqueadoResiduos: string;
  /** E1 porque la comprobación no llegó a correr. Mismo sello: la conducta pedida es la misma. */
  lineaBloqueadoSinComprobacion: string;
  /** E2: ninguna página tenía capa de texto. No hubo comprobación, no es que fuera parcial. */
  lineaSinComprobacion: (totalPaginas: number) => string;
  /**
   * E3 general. Dos cifras con significado exacto: cuántas páginas se RELEYERON (total menos las
   * que no tienen capa de texto) y en cuántas queda algo fuera del alcance. La redacción anterior
   * —«Comprobadas N de M»— dejaba de ser cierta en cuanto una página releída tenía además una
   * reserva: se había releído y se contaba como no comprobada.
   */
  lineaParcial: (releidas: number, total: number, conReserva: number) => string;
  /** E3 cuando la ÚNICA reserva son imágenes: el caso corriente (un logo en el membrete). */
  lineaParcialSoloImagenes: (total: number, paginasConImagen: number) => string;
  /** E3 cuando todas las páginas se releyeron y lo que falta es un objeto del archivo. */
  lineaParcialSoloObjetos: (total: number) => string;
  /**
   * Coletilla de E3 cuando ADEMÁS queda un objeto del archivo sin examinar. Nombraba solo los
   * marcadores, pero el inventario tiene ocho categorías y cualquiera de ellas puede quedar en
   * «no examinado»: con una imagen en la página (reserva) y, por ejemplo, una clave interna
   * superviviente, la línea del sello se callaba el objeto. El sello nombra su reserva.
   */
  clausulaObjetosSinExaminar: string;
  lineaSinTachados: (total: number) => string;
  lineaVerificado: (total: number, zonas: number) => string;

  encabezadoDatos: string;
  encabezadoComprobaciones: string;
  encabezadoCobertura: string;
  encabezadoObjetos: string;
  encabezadoAlcance: string;
  encabezadoVerificacion: string;

  filaArchivo: string;
  /** Marcador que sustituye a un dato encontrado DENTRO del nombre del archivo. El informe
   *  imprimia `data.fileName` tal cual: con `nomina-12345678Z-julio.pdf`, el DNI quedaba
   *  dentro del entregable, y sellado en verde. */
  nombreOculto: string;
  avisoNombreOculto: string;
  filaFecha: string;
  filaReferencia: string;
  filaHuella: string;

  /** Filas de cobertura. Cada una lleva su cifra SIEMPRE, también cuando es cero: un «Ninguna»
   *  no distingue «no había» de «no miramos», y sin denominador no hay alcance. */
  filaPaginasTotal: string;
  filaPaginasReleidas: string;
  filaPaginasSinTexto: string;
  filaPaginasImagenCompleta: string;
  filaPaginasConImagen: string;
  filaZonasTachadas: string;
  filaTachadosSinConfirmar: string;
  /** Páginas que DIBUJAN texto que la herramienta no puede releer. */
  filaPaginasTextoNoLegible: string;
  conPaginas: (cifra: number, paginas: string) => string;
  zonasEnPaginas: (zonas: number, paginas: number) => string;

  objetoInfo: string;
  objetoXmp: string;
  objetoAnotaciones: string;
  objetoFormularios: string;
  objetoAdjuntos: string;
  objetoMarcadores: string;
  objetoAlternativos: string;
  objetoOcultos: string;
  estadoEliminado: string;
  estadoNoHabia: string;
  estadoNoExaminado: string;

  subPatrones: string;
  subZonas: string;
  subSinCapaDeTexto: string;
  subImagenCompleta: string;
  // `unverifiableManualPages` se calculaba y se tiraba: el informe podia estampar VERIFICADO
  // sobre un documento cuyos tachados manuales NUNCA fueron verificables (una caja sobre una
  // pagina sin texto no deja nada que releer). El peor fallo posible es un falso verde.
  subNoVerificables: string;
  subTextoNoLegible: string;
  /** La CIFRA es la mitad del dato: «4 caracteres» y «180 caracteres» piden conductas distintas. */
  paginaTextoNoLegible: (pagina: number, caracteres: number) => string;
  noVerificablePagina: (pagina: number) => string;
  paginaSinCapaDeTexto: (pagina: number) => string;
  /** Página CON texto tapada por una imagen grande. Antes se imprimía con la frase de «sin capa
   *  de texto», que para estas páginas era literalmente falso. */
  paginaImagenCompleta: (pagina: number) => string;
  patronLimpio: (etiqueta: string) => string;
  patronSucio: (etiqueta: string, ocurrencias: number, paginas: string) => string;
  zonasPagina: (pagina: number, cuenta: number) => string;

  /** Cuatro párrafos: qué se comprobó · qué NO se buscó · qué rastro deja · qué no dice. */
  alcanceParrafos: string[];
  /** Cómo lo comprueba un tercero: huella, declaración de revisión visual. */
  verificacionParrafos: string[];
  lineaHerramienta: (version: string, fecha: string) => string;

  lineaGratis: string;
  marcaAgua: string;
  pie: string;
  numeroPagina: (indice: number, total: number) => string;
  etiquetas: EtiquetasPatron;
}

/** Textos del comprobador (el diagnóstico gratuito). */
export interface CopiaComprobador {
  etiquetas: EtiquetasPatron;
  /** Alcance del COMPROBADOR, que solo lee: no tacha nada. Antes reutilizaba el texto de ámbito
   *  del informe, que habla de «los píxeles de las zonas marcadas» — aquí no se marca ninguna. */
  alcance: string;
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
