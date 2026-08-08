// Contenido publicable en español. FUENTE ÚNICA: de aquí salen a la vez el HTML estático que
// se indexa (scripts/gen-pages.ts) y lo que pinta la aplicación en el navegador. Duplicar un
// texto entre el HTML y el código es exactamente lo que pudrió el FAQ («marches» en textos.ts
// frente a «marques» en el JSON-LD): no se vuelve a hacer.
//
// Los textos legales y de landing siguen viviendo en src/legal/textos.ts (ruta sensible,
// APROBADO-ANGEL): aquí se importan, no se copian.

import { CHECKBOX_LABEL } from '../app';
import { PRECIO_PRO } from '../config';
import { FREE_MAX_PAGES, FREE_MONTHLY_LIMIT } from '../freemium/quota';
import {
  AVISO_PRINCIPAL,
  FAQ,
  LANDING_CASOS_USO_TEXTO,
  LANDING_DOLOR,
  LANDING_PUBLICIDAD_GENERICA,
  LANDING_SUBTITULO,
  LANDING_TITULAR,
} from '../legal/textos';
import { legalSections } from '../legal/render';
import type {
  ContenidoGuia,
  CopiaApp,
  CopiaComprobador,
  CopiaInforme,
  EntradaFaq,
  EtiquetasPatron,
} from './tipos';

// Etiquetas de los tipos de dato detectados. Son texto de cara al usuario, no claves internas:
// las claves (`dni`, `iban`, ...) no se traducen nunca.
const ETIQUETAS_PATRON: EtiquetasPatron = {
  dni: 'DNI',
  nie: 'NIE',
  iban: 'IBAN',
  nuss: 'Número de la Seguridad Social',
  telefono: 'Teléfono',
  email: 'Correo electrónico',
  catastro: 'Referencia catastral',
};

const APP_ES: CopiaApp = {
  licenciaPlaceholder: 'Clave de licencia Pro (Gumroad)',
  verificarLicencia: 'Verificar licencia',
  licenciaValida: 'Licencia Pro verificada.',
  licenciaNoActiva: (motivo) => `Licencia no activa (${motivo}). Modo gratuito.`,
  botonEjemplo: 'Probar con un documento de ejemplo',
  pistaEjemplo:
    '¿No tienes un PDF a mano, o prefieres no subir todavía un documento real? Carga un acta de comunidad de ejemplo (datos ficticios) y comprueba en cinco segundos cómo detecta y tacha.',
  ejemploFallido: 'No se pudo cargar el documento de ejemplo. Prueba a subir tu propio PDF.',
  tipoDocumento: 'Tipo de documento',
  presets: {
    generico: 'Generico',
    acta: 'Acta de comunidad',
    nomina: 'Nomina/expediente',
  },
  checkboxRevisado: CHECKBOX_LABEL,
  botonDescargar: 'Descargar documentos e informes',
  sufijoInforme: 'informe',
  comprarPro: `Comprar Pro — ${PRECIO_PRO} (pago único)`,
  comprarProCuotaAgotada: (limite) =>
    `Has agotado los ${limite} documentos gratis de este mes · Comprar Pro — ${PRECIO_PRO} (pago único)`,
  cuotaPro: 'Licencia Pro activa: documentos ilimitados, procesado en lote.',
  cuotaGratis: (usados, limite, maxPaginas) =>
    `Modo gratuito: ${usados}/${limite} documentos este mes · hasta ${maxPaginas} páginas por documento.`,
  cuotaAgotada: 'Cuota gratuita agotada este mes. Consigue una licencia Pro para continuar.',
  loteRequierePro: 'El procesado en lote requiere licencia Pro.',
  limitePaginas: (fichero, paginas, maxPaginas) =>
    `"${fichero}" tiene ${paginas} páginas. La versión gratuita tacha documentos de hasta ${maxPaginas} páginas; para archivos más largos, consigue la licencia Pro (${PRECIO_PRO}, pago único).`,
  noSePudoAbrir: (fichero) =>
    `No se pudo abrir "${fichero}". ¿Es un PDF válido? Si tiene contraseña, vuelve a intentarlo e introdúcela.`,
  passwordPrompt: 'Contraseña del PDF',
  errorRender: 'No se pudo renderizar la página',
  errorProcesado: (detalle) =>
    `Error al procesar el documento en tu navegador. Recarga la página y prueba de nuevo; si persiste, el archivo puede no ser compatible. (Detalle técnico: ${detalle})`,
  residuosEnLote:
    'Se han detectado residuos en algún documento del lote: no se ha descargado ningún fichero.',
  avisoEscaneadas: (paginas) =>
    `Atención: páginas sin capa de texto (probablemente escaneadas), revísalas manualmente: ${paginas}.`,
  comoTachar:
    'Los datos detectados aparecen marcados: haz clic para elegir cuáles tachar. Para tachar cualquier otra cosa (un nombre, una firma, una foto), arrastra el ratón sobre ella dibujando un recuadro. Cada recuadro negro tiene una «×» por si quieres quitarlo.',
  revisionVisual: (paginas) =>
    `Páginas que requieren revisión visual (sin capa de texto o con imagen a página completa): ${paginas}.`,
  paginaEscaneada: (numero) =>
    `Página ${numero}: sin capa de texto (escaneada). No hay detección automática — tacha a mano las zonas con datos.`,
  tacharTodas: (valor, ocurrencias) =>
    `Tachar todas las apariciones de «${valor}» (${ocurrencias})`,
  seleccionarHits: (pagina) => `Página ${pagina}: seleccionar todos los hits`,
  quitarTachado: 'Quitar este tachado',
};

const INFORME_ES: CopiaInforme = {
  titulo: 'Informe de comprobación técnica',
  // Nombra lo que ES. «Comprobación de datos personales en PDF» encuadraba TODOS los datos
  // personales como el objeto de la comprobación, cuando el alcance real son siete formatos.
  subtituloBanda: 'Registro técnico del tachado y de su comprobación posterior',
  referencia: (ref, fecha) => `Referencia ${ref}   ·   Emitido el ${fecha}`,
  sellos: {
    E1: 'TACHADO NO SUPERADO',
    E2: 'SIN COMPROBACIÓN AUTOMÁTICA',
    E3: 'COMPROBACIÓN PARCIAL',
    E4: 'SIN TACHADOS',
    E5: 'TACHADO VERIFICADO',
  },
  lineaBloqueadoResiduos:
    'Se han vuelto a encontrar datos de los patrones buscados en el archivo resultante. No entregues este archivo: repite el tachado.',
  lineaBloqueadoSinComprobacion:
    'La comprobación posterior al tachado no ha podido ejecutarse sobre este archivo. Nada de lo que sigue está confirmado.',
  lineaSinComprobacion: (totalPaginas) =>
    `Ninguna de las ${totalPaginas} páginas tiene capa de texto: no queda nada que releer, así que la comprobación automática no se ha podido aplicar a este documento. Los píxeles de las zonas que marcaste sí se han borrado. Revísalo visualmente, página a página.`,
  lineaParcial: (comprobadas, total, restantes) =>
    `Comprobadas ${comprobadas} de ${total} páginas; en las otras ${restantes} no hay texto que releer o el tachado no se ha podido confirmar. En lo comprobado no queda ningún dato de los patrones buscados. Detalle en «Cobertura».`,
  lineaParcialSoloObjetos: (total) =>
    `Se han releído las ${total} páginas del archivo y sus metadatos, y no queda en ellas ningún dato de los patrones buscados. Pero este documento contiene objetos que la comprobación no examina: constan en «Objetos del archivo».`,
  clausulaMarcadores: 'Los marcadores del documento no se examinan.',
  lineaSinTachados: (total) =>
    `No se ha eliminado ningún dato de este documento: no se marcó ninguna zona. Se han releído sus ${total} páginas y sus metadatos, y no aparece ningún dato de los patrones buscados. Este informe no registra ningún borrado.`,
  lineaVerificado: (total, zonas) =>
    `Se han releído las ${total} páginas del archivo entregado y sus metadatos: no queda ningún dato de los patrones buscados, ni el texto que había en las ${zonas} zonas que tachaste. Alcance y límites, abajo.`,
  encabezadoDatos: 'Datos del documento',
  encabezadoComprobaciones: 'Comprobaciones realizadas',
  encabezadoCobertura: 'Cobertura de esta comprobación',
  encabezadoObjetos: 'Objetos del archivo',
  encabezadoAlcance: 'Alcance y límites',
  encabezadoVerificacion: 'Cómo comprobar este informe',
  filaArchivo: 'Archivo comprobado',
  nombreOculto: '[dato oculto]',
  avisoNombreOculto:
    'El nombre del archivo contenía un dato de los patrones buscados y se ha ocultado aquí. El nombre del fichero que entregas lo eliges tú y esta herramienta no lo cambia: revísalo antes de enviarlo.',
  filaFecha: 'Fecha de emisión',
  filaReferencia: 'Referencia del informe',
  filaHuella: 'Huella SHA-256 del documento entregado',
  filaPaginasTotal: 'Páginas del documento',
  filaPaginasReleidas: 'Páginas releídas tras el tachado',
  filaPaginasSinTexto: 'Páginas sin capa de texto (no comprobables)',
  filaPaginasImagenCompleta: 'Páginas con imagen a página completa',
  filaPaginasConImagen: 'Páginas con imágenes (su contenido visual no se ha comprobado)',
  filaZonasTachadas: 'Zonas tachadas',
  filaTachadosSinConfirmar: 'Tachados sin confirmación posterior',
  conPaginas: (cifra, paginas) => `${cifra}   ·   páginas ${paginas}`,
  zonasEnPaginas: (zonas, paginas) => `${zonas} en ${paginas} página(s)`,
  objetoInfo: 'Metadatos Info (Título, Autor, Asunto, Palabras clave, Productor, Creador)',
  objetoXmp: 'Metadatos XMP (documento y páginas)',
  objetoAnotaciones: 'Anotaciones y comentarios',
  objetoFormularios: 'Campos de formulario',
  objetoAdjuntos: 'Ficheros adjuntos',
  objetoMarcadores: 'Marcadores del documento (índice)',
  objetoAlternativos: 'Textos alternativos y etiquetas de accesibilidad',
  objetoOcultos: 'Miniaturas de página, XMP anidado y datos privados de aplicación',
  estadoEliminado: 'eliminado del archivo',
  estadoNoHabia: 'no había',
  estadoNoExaminado: 'NO EXAMINADO',
  subPatrones: 'Patrones de datos buscados en el texto',
  subZonas: 'Zonas tachadas por página',
  subSinCapaDeTexto: 'Páginas sin capa de texto',
  subImagenCompleta: 'Páginas con imagen a página completa',
  subNoVerificables: 'Tachados que no se han podido verificar',
  noVerificablePagina: (pagina) =>
    `Página ${pagina}: la zona tachada no contenía texto extraíble, así que el borrado no se ha podido confirmar releyendo el archivo. Revísala visualmente.`,
  paginaSinCapaDeTexto: (pagina) =>
    `Página ${pagina}: sin capa de texto, no hay nada que releer. No comprobada automáticamente.`,
  paginaImagenCompleta: (pagina) =>
    `Página ${pagina}: una imagen cubre la página. Su texto sí se ha comprobado; el contenido de la imagen, no.`,
  patronLimpio: (etiqueta) => `${etiqueta}: 0 ocurrencias en el texto extraíble`,
  patronSucio: (etiqueta, ocurrencias, paginas) =>
    `${etiqueta}: ${ocurrencias} ocurrencia(s) en el texto extraíble (páginas: ${paginas})`,
  zonasPagina: (pagina, cuenta) => `Página ${pagina}: ${cuenta} zona(s)`,
  // Cuatro párrafos, y cada enunciado negativo va PEGADO al positivo que acota. Un bloque de
  // descargos suelto no acota nada: solo asusta. Las listas son cerradas y contables a
  // propósito — «y cualquier otra cosa» no es un límite, es una excusa.
  alcanceParrafos: [
    'Qué se ha comprobado. Después de aplicar el tachado, TachadoPDF ha vuelto a abrir el archivo que se te entrega y ha releído el texto de sus páginas y sus campos de metadatos, buscando siete formatos: DNI, NIE, IBAN español, número de la Seguridad Social, teléfono español, referencia catastral y correo electrónico. Salvo el correo, todos son formatos españoles y llevan dígito de control: no reconocen documentos de otros países. También se ha comprobado que no reaparece el texto que había dentro de las zonas que marcaste a mano.',
    'Qué NO se ha buscado. La detección automática por patrones no reconoce nombres ni apellidos, direcciones postales, firmas, fotografías, matrículas ni cuentas extranjeras: eso lo marcas tú. Tampoco se ha leído el contenido visual de las imágenes que no marcaste: las páginas que llevan imágenes constan en «Cobertura». Las páginas sin capa de texto no se pueden comprobar automáticamente: en ellas se borran los píxeles de las zonas marcadas, pero no queda texto que releer, así que el borrado no se confirma. Las páginas afectadas constan una a una en «Cobertura», y los objetos del archivo que no se examinan, en «Objetos del archivo».',
    'Qué rastro deja el tachado. El texto se elimina del archivo, no se tapa. Lo que permanece es el hueco que ocupaba: su anchura sigue indicando cuánto texto había ahí, y con ella se puede acotar qué cabía en él. Si eso importa en un documento concreto, conviértelo a imagen antes de entregarlo.',
    'Qué no dice este informe. No dice que el documento esté libre de datos personales, ni valora si lo que había que tachar era esto o era otra cosa: eso lo decide quien firma el envío. Es el registro técnico de lo que la herramienta eliminó y de lo que volvió a comprobar después, con la huella del archivo para que cualquiera pueda contrastarlo. No sustituye a la revisión humana.',
  ],
  verificacionParrafos: [
    'Comprobación por un tercero. El archivo que acompaña a este informe debe tener exactamente la huella SHA-256 indicada arriba. En Windows: certutil -hashfile archivo.pdf SHA256. En macOS o Linux: shasum -a 256 archivo.pdf. Si no coincide, el archivo no es el que se comprobó.',
    'Revisión humana. Descargar este informe exige marcar antes la casilla de haber revisado visualmente el documento final página a página. Es una declaración de quien usó la herramienta, no una comprobación de la herramienta.',
  ],
  lineaHerramienta: (version, fecha) =>
    `Herramienta: TachadoPDF v${version} · motor mupdf · emitido el ${fecha}`,
  lineaGratis: 'Generado con TachadoPDF (versión gratuita)',
  // «no válido como evidencia» afirmaba por contraste que el informe de pago SÍ lo es: la
  // promesa más cara del producto, escondida en la marca de agua, y contraria al propio FAQ.
  marcaAgua: 'DEMO — versión gratuita',
  pie: 'Documento generado automáticamente por TachadoPDF · tachadopdf.com',
  numeroPagina: (indice, total) => `Página ${indice} de ${total}`,
  etiquetas: ETIQUETAS_PATRON,
};

const COMPROBADOR_ES: CopiaComprobador = {
  etiquetas: ETIQUETAS_PATRON,
  alcance:
    'Este diagnóstico solo LEE el archivo: no tacha nada y no modifica tu documento. Busca siete formatos españoles (DNI, NIE, IBAN, número de la Seguridad Social, teléfono, referencia catastral) y direcciones de correo en el texto que se puede extraer. No reconoce nombres, direcciones postales, firmas ni fotografías, y no lee el contenido visual de las imágenes ni de las páginas sin capa de texto. No sustituye a la revisión humana.',
  analizando: 'Analizando el PDF en tu navegador…',
  noEsPdf: 'El fichero no parece un PDF. Selecciona un archivo .pdf válido.',
  passwordRequerida:
    'Este PDF está protegido con contraseña. Escríbela en el campo de contraseña y vuelve a seleccionar el archivo.',
  errorGenerico:
    'No se ha podido analizar el PDF. Comprueba que el archivo no esté dañado e inténtalo de nuevo.',
  avisoEscaneadas:
    'Esta página no contiene texto extraíble (probablemente escaneada). La detección automática no puede leerla: revísala visualmente.',
  pagina: (numero) => `Página ${numero}`,
  cta: `Táchalos ahora (gratis, ${FREE_MONTHLY_LIMIT} documentos al mes)`,
  veredictoNada: 'No se han encontrado datos personales en el texto de este PDF.',
  veredictoDatos: (total) => `Este PDF contiene ${total} datos personales detectables`,
  veredictoDatosYEscaneos: (total, escaneadas) =>
    `Este PDF contiene ${total} datos personales detectables, y ${escaneadas} página(s) que no se han podido leer.`,
  veredictoSoloEscaneos: (escaneadas) =>
    `${escaneadas} página(s) de este PDF no tienen texto legible, así que no se han podido comprobar. En el resto no se ha encontrado nada detectable.`,
};

const GUIAS_ES: ContenidoGuia[] = [
  {
    id: 'guia-tachar-dni',
    titulo: 'Cómo tachar un DNI de un PDF sin que se pueda recuperar',
    tituloEnlace: 'Cómo tachar un DNI de un PDF sin que se pueda recuperar',
    descripcion: '',
    cuerpo: [],
  },
  {
    id: 'guia-rectangulo-negro',
    titulo: 'Por qué el rectángulo negro no borra el dato',
    tituloEnlace: 'Por qué el rectángulo negro no borra el dato',
    descripcion: '',
    cuerpo: [],
  },
  {
    id: 'guia-fincas',
    titulo: 'Datos personales en actas y documentos de comunidades',
    tituloEnlace: 'Datos personales en actas y documentos de comunidades',
    descripcion: '',
    cuerpo: [],
  },
  {
    id: 'guia-sin-subir',
    titulo: 'Cómo tachar datos de un PDF sin subirlo a internet',
    tituloEnlace: 'Cómo tachar datos de un PDF sin subirlo a internet',
    descripcion: '',
    cuerpo: [],
  },
  {
    id: 'guia-sanciones',
    titulo: 'Sanciones de la AEPD a comunidades de propietarios',
    tituloEnlace: 'Sanciones de la AEPD a comunidades de propietarios',
    descripcion: '',
    cuerpo: [],
  },
  {
    id: 'guia-nominas',
    titulo: 'Enviar nóminas en PDF sin exponer datos personales',
    tituloEnlace: 'Enviar nóminas en PDF sin exponer datos personales',
    descripcion: '',
    cuerpo: [],
  },
];

const FAQ_ES: EntradaFaq[] = FAQ.map((item) => ({ ...item }));

export const es = {
  htmlLang: 'es',
  ogLocale: 'es_ES',
  /** Rótulo del idioma en el selector, escrito SIEMPRE en su propio idioma (nunca banderas:
   *  una bandera es un país, no un idioma). */
  nombreIdioma: 'Español',
  marca: 'TachadoPDF',

  // «la AEPD ya ha sancionado actas y listados con datos expuestos» (metas de abajo) se apoya en
  // DOS expedientes comprobados el 2026-08-08 contra el texto íntegro de la resolución:
  //  - acta: PS/00378/2019, multa de 15.000 € (art. 5.1.f RGPD), acta de junta expuesta en los
  //    ascensores. https://www.aepd.es/documento/ps-00378-2019.pdf
  //  - listado: PS/00143/2020, sanción de apercibimiento (art. 5.1.f RGPD), convocatoria en el
  //    tablón con el nombre de un vecino y su deuda. https://www.aepd.es/documento/ps-00143-2020.pdf
  // Nota: un apercibimiento ES una sanción (art. 58.2.b RGPD), pero NO es una multa: si algún día
  // esta frase pasa de «sancionado» a «multado», el caso del listado deja de sostenerla.
  home: {
    metaTitulo: 'TachadoPDF · El rectángulo negro no borra: tacha de verdad los datos de un PDF',
    metaDescripcion:
      'El DNI que tapas con un rectángulo negro sigue dentro del PDF y se copia en dos clics — la AEPD ya ha sancionado actas y listados con datos expuestos. TachadoPDF elimina el dato del archivo, 100% en tu navegador, con informe de comprobación. Para gestorías, administradores de fincas y RRHH.',
    ogTitulo: 'TachadoPDF · El rectángulo negro no borra: tacha de verdad',
    ogDescripcion:
      'El dato tapado con un recuadro sigue en el PDF y se copia en dos clics; la AEPD ya ha sancionado actas con datos expuestos. Elimínalo de verdad, en tu navegador.',
    twitterDescripcion:
      'El dato tapado con un recuadro sigue en el PDF y se copia en dos clics. Elimínalo de verdad, en tu navegador, con informe de comprobación.',
    jsonLdDescripcion:
      'Tacha datos personales de un PDF eliminándolos del archivo, 100% en el navegador, con informe de comprobación técnica.',
    sistemaOperativo: 'Navegador web',
    ofertaGratis: `Gratuito (${FREE_MONTHLY_LIMIT} documentos/mes, hasta ${FREE_MAX_PAGES} páginas)`,
    ofertaPro: 'Pro (pago único, documentos ilimitados)',
  },

  landing: {
    titular: LANDING_TITULAR,
    dolor: LANDING_DOLOR,
    subtitulo: LANDING_SUBTITULO,
    bullets: [
      'El texto se elimina del archivo, no se tapa con un rectángulo negro.',
      'Todo ocurre en tu navegador: el documento no se sube a ningún servidor.',
      'Detección automática por patrones de DNI, NIE, IBAN, Nº de la Seguridad Social, referencias catastrales, teléfonos y emails.',
      'Informe de comprobación técnica descargable para tu expediente.',
    ],
    notaDeteccion:
      'Qué se detecta automáticamente: correos electrónicos, y los identificadores españoles DNI, NIE, IBAN español, número de la Seguridad Social, referencia catastral y teléfonos en formato español. Todo lo demás —nombres, direcciones, firmas, fotografías, importes— lo marcas tú arrastrando un recuadro; lo que se borra y lo que se comprueba después es exactamente igual en los dos casos.',
    nicho: LANDING_CASOS_USO_TEXTO,
    procesadoLocal: LANDING_PUBLICIDAD_GENERICA,
    avisoPrincipal: AVISO_PRINCIPAL,
  },

  secciones: {
    trabajo: 'Tacha tu documento',
    pro: 'Versión Pro',
    faq: 'Preguntas frecuentes',
    guias: 'Guías',
    legal: 'Información legal',
    idiomas: 'Idioma',
  },

  /** Llamada a la acción al pie de cada guía generada. */
  guiaCta: 'Tacha tu PDF ahora, gratis y sin subirlo a ningún servidor',

  pro: {
    argumento: `Pro es un pago único de ${PRECIO_PRO} y no es una suscripción: no se renueva ni genera cobros periódicos. Incluye documentos ilimitados, sin tope de páginas, procesado por lotes de varios ficheros a la vez e informe de comprobación sin marca de agua.`,
    gratis: `El modo gratuito tacha ${FREE_MONTHLY_LIMIT} documentos al mes, de hasta ${FREE_MAX_PAGES} páginas cada uno, con el mismo borrado real que Pro.`,
  },

  faq: FAQ_ES,

  guias: GUIAS_ES,

  legal: {
    secciones: legalSections().map((s) => ({ id: s.id, titulo: s.titulo, cuerpo: s.cuerpo })),
    pie: 'TachadoPDF funciona enteramente en tu navegador. Código abierto (AGPL-3.0). La licencia Pro la vende Gumroad.',
    enlaceActas: 'Para administradores de fincas',
    enlaceNominas: 'Para gestorías y RRHH',
    enlaceComprobador: 'Comprueba gratis qué datos contiene tu PDF',
  },

  comprobador: {
    metaTitulo: 'Comprobador: qué datos personales contiene tu PDF',
    metaDescripcion:
      'Sube un PDF y descubre qué datos personales contiene (DNI, IBAN, teléfonos, direcciones...) antes de compartirlo. Gratis, 100% en tu navegador: el archivo nunca sale de tu equipo. Esta comprobación no tacha nada.',
    ogTitulo: 'Comprobador: qué datos personales contiene tu PDF',
    ogDescripcion:
      'Descubre qué datos personales contiene tu PDF antes de compartirlo. Gratis, 100% en tu navegador: el archivo nunca sale de tu equipo.',
    jsonLdNombre: 'Comprobador TachadoPDF',
    titular: 'Comprobador: ¿qué datos personales contiene tu PDF?',
    intro:
      'Esta herramienta analiza tu PDF y te dice qué datos personales contiene (DNI, NIE, IBAN, teléfonos, direcciones, correos...) mediante detección automática por patrones. Es un diagnóstico: no tacha ni modifica el archivo.',
    introLocal:
      'El PDF nunca sale de tu equipo: todo el análisis ocurre 100% en tu navegador, de forma verificable. No se sube ningún documento a ningún servidor.',
    dropzone: 'Arrastra tu PDF aquí o haz clic para seleccionarlo',
    passwordPlaceholder: 'Contraseña del PDF (si tiene)',
    avisoAlcance:
      'Aviso de alcance: la comprobación se limita al texto extraíble del PDF. Las páginas escaneadas (imágenes sin capa de texto) se señalan aparte y requieren revisión humana; esta herramienta no sustituye esa revisión.',
    cta: COMPROBADOR_ES.cta,
  },

  app: APP_ES,
  informe: INFORME_ES,
  comprobadorUi: COMPROBADOR_ES,
};

/** El español es el MOLDE: `en` (y cualquier idioma futuro) se declara con este tipo, así que
 *  olvidar una traducción rompe `tsc --noEmit`, que ya está en la cadena de verificación. */
export type Contenido = typeof es;
