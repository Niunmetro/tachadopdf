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
    generico: 'Genérico',
    acta: 'Acta de comunidad',
    nomina: 'Nómina/expediente',
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
    'Los datos detectados aparecen resaltados, SIN tachar todavía: haz clic en los que quieras tachar, o usa los botones de arriba para marcar o quitar de golpe todas las apariciones de un mismo valor. Para tachar cualquier otra cosa (un nombre, una firma, una foto), arrastra sobre ella dibujando un recuadro. Cada recuadro negro tiene una «×» por si quieres quitarlo.',
  revisionVisual: (paginas) =>
    `Páginas que requieren revisión visual (sin capa de texto o con imagen a página completa): ${paginas}.`,
  paginaEscaneada: (numero) =>
    `Página ${numero}: sin capa de texto (escaneada). No hay detección automática — tacha a mano las zonas con datos.`,
  tacharTodas: (valor, ocurrencias) =>
    `Tachar todas las apariciones de «${valor}» (${ocurrencias})`,
  destacharTodas: (valor, ocurrencias) =>
    `Quitar el tachado de «${valor}» (${ocurrencias})`,
  seleccionarHits: (pagina) => `Página ${pagina}: seleccionar todos los datos detectados`,
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
  lineaParcial: (releidas, total, conReserva) =>
    `Se han releído ${releidas} de ${total} páginas y no queda en ellas ningún dato de los patrones buscados. En ${conReserva} página(s) la comprobación automática no llega a todo el contenido: las páginas sin capa de texto, las que llevan imágenes, las que dibujan texto que no se puede releer y los tachados sin confirmar constan una a una en «Cobertura». Revísalas visualmente.`,
  lineaParcialSoloImagenes: (total, paginasConImagen) =>
    `Se han releído las ${total} páginas del archivo entregado y sus metadatos, y en el texto no queda ningún dato de los patrones buscados. Lo que queda fuera es el contenido de ${paginasConImagen} página(s) con imágenes: esta herramienta no lee lo que hay dentro de una imagen, así que un dato fotografiado o escaneado no se detecta. Revísalas visualmente; constan en «Cobertura».`,
  lineaParcialSoloObjetos: (total) =>
    `Se han releído las ${total} páginas del archivo y sus metadatos, y no queda en ellas ningún dato de los patrones buscados. Pero este documento contiene objetos que la comprobación no examina: constan en «Objetos del archivo».`,
  lineaParcialDatosSinTachar: (cuantos) =>
    `El texto que marcaste se ha eliminado y verificado. Pero quedan ${cuantos} dato(s) detectado(s) que NO marcaste para tachar y siguen en el documento entregado: constan en «Comprobaciones realizadas». Es correcto si era lo que querías; si no, vuelve a tacharlos.`,
  clausulaObjetosSinExaminar:
    'Además, este documento contiene objetos que la comprobación no examina: constan en «Objetos del archivo».',
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
  filaPaginasSinReserva: 'Páginas comprobadas del todo (sin nada fuera de alcance)',
  filaPaginasReleidas: 'Páginas releídas tras el tachado',
  filaPaginasSinTexto: 'Páginas sin capa de texto (no comprobables)',
  filaPaginasImagenCompleta: 'Páginas con imagen a página completa',
  filaPaginasConImagen: 'Páginas con imágenes (su contenido visual no se ha comprobado)',
  filaZonasTachadas: 'Zonas tachadas',
  filaTachadosSinConfirmar: 'Tachados sin confirmación posterior',
  filaPaginasTextoNoLegible: 'Páginas con texto dibujado que no se puede releer',
  conPaginas: (cifra, paginas) => `${cifra}   ·   páginas ${paginas}`,
  zonasEnPaginas: (zonas, paginas) => `${zonas} en ${paginas} página(s)`,
  objetoInfo: 'Metadatos Info (Título, Autor, Asunto, Palabras clave, Productor, Creador)',
  objetoXmp: 'Metadatos XMP (documento y páginas)',
  objetoAnotaciones: 'Anotaciones y comentarios',
  objetoFormularios: 'Campos de formulario',
  objetoAdjuntos: 'Ficheros adjuntos',
  objetoMarcadores: 'Marcadores del documento (índice)',
  objetoAlternativos: 'Textos alternativos y etiquetas de accesibilidad',
  objetoOcultos:
    'Objetos internos con texto que ningún lector enseña (miniaturas, XMP anidado, datos privados, etiquetas de página, nombres de capa, acciones y JavaScript)',
  estadoEliminado: 'eliminado del archivo',
  estadoNoHabia: 'no había',
  estadoNoExaminado: 'NO EXAMINADO',
  subPatrones: 'Patrones de datos buscados en el texto',
  subZonas: 'Zonas tachadas por página',
  subSinCapaDeTexto: 'Páginas sin capa de texto',
  subImagenCompleta: 'Páginas con imagen a página completa',
  subNoVerificables: 'Tachados que no se han podido verificar',
  subTextoNoLegible: 'Páginas con texto que la herramienta no puede releer',
  paginaTextoNoLegible: (pagina, caracteres) =>
    `Página ${pagina}: hay ${caracteres} caracteres dibujados en la página que la herramienta no puede releer (el archivo declara para ellos un código que no corresponde a lo que se ve). Se ven al abrir el documento, pero la detección automática no los alcanza: revísala visualmente.`,
  noVerificablePagina: (pagina) =>
    `Página ${pagina}: la zona tachada no contenía texto extraíble, así que el borrado no se ha podido confirmar releyendo el archivo. Revísala visualmente.`,
  paginaSinCapaDeTexto: (pagina) =>
    `Página ${pagina}: sin capa de texto, no hay nada que releer. No comprobada automáticamente.`,
  paginaImagenCompleta: (pagina) =>
    `Página ${pagina}: una imagen cubre la página. Su texto sí se ha comprobado; el contenido de la imagen, no.`,
  patronLimpio: (etiqueta) => `${etiqueta}: 0 ocurrencias en el texto extraíble`,
  patronSucio: (etiqueta, ocurrencias, paginas) =>
    `${etiqueta}: ${ocurrencias} ocurrencia(s) en el texto extraíble (páginas: ${paginas})`,
  patronSinTachar: (etiqueta, ocurrencias, paginas) =>
    `${etiqueta}: ${ocurrencias} sin tachar, siguen en el documento (páginas: ${paginas})`,
  zonasPagina: (pagina, cuenta) => `Página ${pagina}: ${cuenta} zona(s)`,
  // Cuatro párrafos, y cada enunciado negativo va PEGADO al positivo que acota. Un bloque de
  // descargos suelto no acota nada: solo asusta. Las listas son cerradas y contables a
  // propósito — «y cualquier otra cosa» no es un límite, es una excusa.
  alcanceParrafos: [
    'Qué se ha comprobado. Después de aplicar el tachado, TachadoPDF ha vuelto a abrir el archivo que se te entrega y ha releído el texto de sus páginas, sus campos de metadatos y las demás cadenas de texto que el archivo guarda por dentro, buscando siete formatos: DNI, NIE, IBAN español, número de la Seguridad Social, teléfono español, referencia catastral y correo electrónico. Salvo el correo, todos son formatos españoles y llevan dígito de control: no reconocen documentos de otros países. También se ha comprobado que no reaparece el texto que había dentro de las zonas que marcaste a mano.',
    'Qué NO se ha buscado. La detección automática por patrones no reconoce nombres ni apellidos, direcciones postales, firmas, fotografías, matrículas ni cuentas extranjeras: eso lo marcas tú. Tampoco se ha leído el contenido visual de las imágenes que no marcaste: las páginas que llevan imágenes constan en «Cobertura». Las páginas sin capa de texto no se pueden comprobar automáticamente: en ellas se borran los píxeles de las zonas marcadas, pero no queda texto que releer, así que el borrado no se confirma. Las páginas afectadas constan una a una en «Cobertura», y los objetos del archivo que no se examinan, en «Objetos del archivo».',
    'Qué rastro deja el tachado. El texto se elimina del archivo, no se tapa. Lo que permanece es el hueco que ocupaba, y su anchura se puede medir con exactitud porque el archivo conserva el desplazamiento del texto que venía detrás. Con esa medida se acota cuánto texto había ahí y, cuando los candidatos son pocos —un nombre dentro de una lista conocida—, puede bastar para distinguir cuál era: nombres distintos miden distinto. Si eso importa en un documento concreto, conviértelo a imagen antes de entregarlo.',
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
    'Este diagnóstico solo LEE el archivo: no tacha nada y no modifica tu documento. Busca seis formatos españoles (DNI, NIE, IBAN, número de la Seguridad Social, teléfono, referencia catastral) y direcciones de correo en el texto que se puede extraer. No reconoce nombres, direcciones postales, firmas ni fotografías, y no lee el contenido visual de las imágenes ni de las páginas sin capa de texto. No sustituye a la revisión humana.',
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

  // --- Landings de cola larga sectorial (generadas, ver registro.ts y docs/SEO-EXPERIMENTO.md) ---
  // Cada una responde a UNA consulta distinta, con su sector, sus datos y su propio motivo de por
  // qué el recuadro negro no basta AHÍ. El vocabulario del producto se mantiene: «borrado real de
  // datos» y «detección automática por patrones», nunca las palabras vetadas por el comité.
  {
    id: 'guia-curriculum',
    relacionadas: ['guia-tachar-dni', 'guia-copia-dni', 'guia-recuperar-tachado'],
    titulo: 'Cómo ocultar los datos personales de un currículum en PDF antes de enviarlo',
    tituloEnlace: 'Ocultar datos personales de un currículum en PDF',
    descripcion:
      'Antes de subir tu CV a un portal de empleo o mandárselo a una empresa, conviene dejar fuera el DNI, la dirección y hasta la foto. Por qué el recuadro negro no basta y cómo quitar esos datos del archivo, en tu navegador y sin subirlo.',
    enlaceComprobador: 'Comprueba gratis qué datos lleva tu currículum, sin subirlo',
    cuerpo: [
      {
        t: 'p',
        texto:
          'Un currículum pasa por muchas más manos de las que crees: portales de empleo, empresas de selección, personas de recursos humanos que no conoces y, a veces, bases de datos que se guardan durante meses. Todo dato que no haga falta para valorar tu candidatura es un dato de más viajando por ahí.',
      },
      { t: 'h2', texto: 'Qué datos suelen sobrar en un currículum' },
      {
        t: 'ul',
        items: [
          'El DNI o el NIE completo: casi nunca hace falta para una primera criba, y solo es imprescindible cuando ya te van a contratar.',
          'La dirección postal exacta: basta con la localidad si acaso.',
          'La fecha de nacimiento, el estado civil o el número de hijos.',
          'La fotografía, que es opcional y una fuente conocida de sesgo.',
          'Un teléfono o un correo personal, si prefieres reservar uno solo para la búsqueda de empleo.',
          'Los datos de terceros: el teléfono de una persona que te da referencias, por ejemplo.',
        ],
      },
      {
        t: 'p',
        texto:
          'Esto vale en las dos direcciones. Si buscas empleo, proteges tus propios datos. Y si trabajas en selección y reenvías el currículum de un candidato a tu cliente, eres tú quien responde de esos datos: dejar a la vista lo que no toca es una cesión que no deberías hacer.',
      },
      { t: 'h2', texto: 'Por qué tapar el dato con un recuadro no sirve' },
      {
        t: 'p',
        texto:
          'La forma rápida de esconder el DNI es dibujar un recuadro negro encima y exportar el PDF. El problema es que ese recuadro es solo una capa por delante: el texto sigue guardado en el archivo, debajo. Cualquiera lo selecciona con el ratón y lo copia, y muchos portales de empleo leen automáticamente el texto del PDF para rellenar sus fichas, así que recogen el dato que tú creías tapado. Conviene además recordar que algunos portales comparten datos con terceros.',
      },
      {
        t: 'nota',
        texto:
          'Compruébalo en tres segundos: abre tu CV ya tapado, selecciona con el ratón sobre el recuadro y pega en un bloc de notas. Si aparece el texto, no estaba borrado.',
      },
      { t: 'h2', texto: 'Cómo quitar esos datos de verdad' },
      {
        t: 'p',
        texto:
          'Para que un dato desaparezca hay que eliminarlo del contenido del archivo, no taparlo; y si está sobre una imagen escaneada, hay que borrar los píxeles de esa zona. TachadoPDF hace las dos cosas: detecta de forma automática por patrones el correo, el teléfono, el DNI, el NIE o el IBAN, y lo demás —tu nombre, la foto, la dirección— lo marcas tú arrastrando un recuadro. Después vuelve a abrir el PDF y lo busca otra vez para confirmar que el dato ya no está, y te entrega un informe de comprobación. Todo ocurre en tu navegador: el currículum no se sube a ningún servidor.',
      },
      {
        t: 'p',
        texto:
          'La regla, al final, es sencilla: envía solo lo imprescindible para que te llamen, y deja el resto fuera del archivo.',
      },
    ],
  },
  {
    id: 'guia-prueba-juicio',
    relacionadas: ['guia-recuperar-tachado', 'guia-rectangulo-negro', 'guia-tachar-dni'],
    titulo: 'Cómo ocultar los datos de terceros al aportar documentos como prueba en un PDF',
    tituloEnlace: 'Ocultar datos de terceros en la prueba documental',
    descripcion:
      'Aportar un documento a un procedimiento no autoriza a exponer de paso los datos de terceros ajenos al asunto. Qué conviene tachar, por qué el recuadro negro falla en un documento escaneado y cómo borrarlo sin que se pueda recuperar.',
    enlaceComprobador: 'Comprueba gratis qué datos personales contiene el documento',
    cuerpo: [
      {
        t: 'p',
        texto:
          'Al defender un asunto se aportan documentos —correos, extractos, contratos, informes, capturas de conversaciones— para probar un hecho. Y en esos documentos, además de lo que se quiere demostrar, suelen aparecer datos personales de terceros que no tienen nada que ver con el pleito.',
      },
      {
        t: 'p',
        texto:
          'El ejercicio del derecho de defensa permite aportar datos personales a un procedimiento sin el consentimiento de su titular cuando son necesarios para el caso. Eso no cubre lo que no aporta nada: el número de cuenta de un tercero que asoma en un extracto, el teléfono de una persona que no es parte, o datos de salud de otra persona que aparecen de refilón en un informe. Esa parte conviene dejarla fuera antes de presentar el documento.',
      },
      { t: 'h2', texto: 'Qué suele convenir dejar fuera' },
      {
        t: 'ul',
        items: [
          'Datos de personas ajenas al procedimiento que aparecen de paso.',
          'Categorías especialmente protegidas (salud, ideología, afiliación) que no sean el objeto de prueba.',
          'Números de cuenta, de tarjeta o identificadores fiscales que no se discuten en el asunto.',
          'Direcciones y teléfonos de terceros.',
          'Datos de menores.',
        ],
      },
      { t: 'h2', texto: 'El recuadro negro falla justo en la prueba escaneada' },
      {
        t: 'p',
        texto:
          'Buena parte de la prueba documental es un escaneo: un burofax, un contrato firmado, un justificante fotografiado. Poner un recuadro negro encima de un escaneo es apilar una imagen sobre otra: quien reciba el archivo puede quitarla, o ajustar el contraste, y el dato asoma. Y si el documento sí tiene capa de texto, el recuadro tampoco borra el texto que queda debajo. Ten en cuenta además que lo que se presenta por vía telemática queda incorporado al expediente: rectificar después no es sencillo.',
      },
      {
        t: 'nota',
        texto:
          'Antes de presentar, abre el PDF que vas a aportar, intenta seleccionar y copiar sobre las zonas tapadas y, si es un escaneo, prueba a subir el brillo. Si el dato reaparece, no estaba borrado.',
      },
      { t: 'h2', texto: 'Cómo tacharlo sin que se pueda recuperar' },
      {
        t: 'p',
        texto:
          'Para el texto, hay que eliminarlo del contenido del archivo; para el escaneo, borrar los píxeles de la zona. TachadoPDF detecta de forma automática por patrones los identificadores españoles (DNI, NIE, IBAN, número de la Seguridad Social, referencia catastral) y los correos y teléfonos, y el resto lo marcas tú. Luego relee el archivo para confirmar que no queda rastro y entrega un informe con la huella del documento. Y como todo corre en tu navegador, el expediente de tu cliente no sale de tu equipo.',
      },
    ],
  },
  {
    id: 'guia-publicar-internet',
    relacionadas: ['guia-recuperar-tachado', 'guia-info-oculta-pdf', 'guia-rectangulo-negro'],
    titulo: 'Cómo censurar un PDF antes de publicarlo en internet sin exponer datos de terceros',
    tituloEnlace: 'Censurar un PDF antes de publicarlo en internet',
    descripcion:
      'Publicar un documento en una web, un tablón digital o un boletín lo deja expuesto a todo internet y a los buscadores, y de forma indefinida. Qué borrar antes de colgar un PDF y cómo hacerlo para que el dato no se pueda recuperar ni copiar.',
    enlaceComprobador: 'Comprueba gratis qué datos quedarían expuestos al publicarlo',
    cuerpo: [
      {
        t: 'p',
        texto:
          'Ayuntamientos, universidades, asociaciones, clubes deportivos, comunidades y empresas publican documentos en PDF a diario: actas, listados de admitidos, resoluciones de subvenciones, resultados de un sorteo, adjudicaciones. Colgar un documento en la web no es lo mismo que repartirlo en mano: queda a la vista de cualquiera y no de un único destinatario.',
      },
      {
        t: 'p',
        texto:
          'Y no se deshace con un clic. Los buscadores rastrean e indexan lo que se publica y guardan copias en su caché, así que un dato personal expuesto puede seguir apareciendo en los resultados aunque después retires el PDF. Por eso, en lo que se va a publicar, el criterio tiene que ser más estricto que en lo que se envía a una sola persona.',
      },
      { t: 'h2', texto: 'Qué dejar fuera antes de publicar' },
      {
        t: 'ul',
        items: [
          'El DNI o el NIE completos: cuando la norma de transparencia obliga a publicar, suele bastar con una parte de los dígitos, no el número entero.',
          'Domicilios, teléfonos y correos personales.',
          'Datos de salud o datos de menores.',
          'Firmas manuscritas escaneadas.',
          'Importes y datos económicos que la norma no exija hacer públicos.',
        ],
      },
      { t: 'h2', texto: 'Por qué el recuadro negro es aún peor aquí' },
      {
        t: 'p',
        texto:
          'Un PDF colgado con recuadros negros lo descarga cualquiera, y extraer el texto de debajo es cuestión de segundos; si es un escaneo con un parche negro encima, se destapa ajustando la imagen. La diferencia con un envío privado es el alcance: aquí el fallo no lo ve un destinatario, lo ve —y lo puede guardar— todo el mundo, incluidos los buscadores.',
      },
      {
        t: 'nota',
        texto:
          'Haz la prueba con el propio PDF ya publicado: descárgalo, selecciona sobre la zona tapada y pega en un editor de texto. Si sale el dato, hay que retirarlo y volver a subir el documento bien tachado.',
      },
      { t: 'h2', texto: 'Cómo prepararlo para publicar' },
      {
        t: 'p',
        texto:
          'TachadoPDF elimina el texto del archivo y borra los píxeles de las zonas que marcas, y además limpia los metadatos —autor, programa, fechas— que también viajan dentro del archivo que se publica. Detecta de forma automática por patrones los identificadores y los datos de contacto, tú marcas los nombres y lo que quede, y al terminar te da un informe de comprobación con la huella del fichero para tu expediente. Se ejecuta entero en tu navegador: el documento no se sube a ningún servidor intermedio antes de publicarlo.',
      },
    ],
  },
  {
    id: 'guia-alumnos',
    relacionadas: ['guia-tachar-dni', 'guia-sanciones', 'guia-rectangulo-negro'],
    titulo: 'Cómo ocultar los datos de alumnos en un PDF antes de compartirlo',
    tituloEnlace: 'Ocultar los datos de alumnos en un PDF',
    descripcion:
      'Listas de notas, actas de evaluación, autorizaciones y orlas llevan datos de menores, con una protección reforzada. Qué tapar antes de compartir un PDF con las familias o subirlo a la plataforma, y cómo hacerlo sin que el dato se recupere.',
    enlaceComprobador: 'Comprueba gratis qué datos de alumnos contiene el PDF',
    cuerpo: [
      {
        t: 'p',
        texto:
          'Un centro educativo maneja cada día documentos llenos de datos de menores: listas de clase, calificaciones, actas de evaluación, partes de incidencias, autorizaciones de salidas, orlas. Los datos de menores tienen una protección reforzada, así que conviene compartir solo lo imprescindible y para quien de verdad lo necesita.',
      },
      {
        t: 'p',
        texto:
          'Los descuidos típicos son conocidos: enviar a una familia una lista con las notas de toda la clase, publicar unas calificaciones donde puedan verlas otras familias, subir a la plataforma un PDF con más datos de los necesarios, o pasar a otro docente un acta con datos que no le corresponden.',
      },
      { t: 'h2', texto: 'Qué conviene dejar fuera' },
      {
        t: 'ul',
        items: [
          'El DNI del alumno o de sus padres.',
          'Las notas asociadas a un nombre cuando el documento va a llegar a más de una familia.',
          'Datos de salud: alergias, informes, adaptaciones curriculares.',
          'Domicilios y teléfonos.',
          'Los datos de otros alumnos en un documento que es de uno solo.',
          'Las fotografías de menores.',
        ],
      },
      { t: 'h2', texto: 'La foto de un menor es una imagen: el recuadro no la borra' },
      {
        t: 'p',
        texto:
          'En una orla o en una autorización escaneada, el rostro del menor y el DNI son píxeles de una imagen; un recuadro negro por encima es otra capa que se quita o se hace transparente con cualquier editor. Y en una lista de notas con texto real, tapar la calificación con una barra negra no borra el número que sigue guardado debajo. En los dos casos el dato sigue en el archivo.',
      },
      {
        t: 'nota',
        texto:
          'Antes de compartir, abre el PDF, selecciona sobre lo tapado y pega; y en las imágenes, prueba a subir el brillo. Si el dato asoma, todavía está dentro.',
      },
      { t: 'h2', texto: 'Cómo hacerlo bien' },
      {
        t: 'p',
        texto:
          'TachadoPDF borra de verdad el texto del archivo y los píxeles de la zona marcada —la cara de una orla, el DNI de un escaneo—, detecta de forma automática por patrones el DNI, el NIE, los teléfonos y los correos, y tú marcas los nombres y las notas. Al terminar comprueba que no queda rastro y entrega un informe. Y como el documento no se sube a ningún servidor, los datos de los menores no salen del equipo del centro.',
      },
    ],
  },
  {
    id: 'guia-copia-dni',
    relacionadas: ['guia-tachar-dni', 'guia-curriculum', 'guia-rectangulo-negro'],
    titulo: 'Qué tapar en una copia del DNI antes de enviarla para un trámite',
    tituloEnlace: 'Qué tapar en una copia del DNI antes de enviarla',
    descripcion:
      'Una copia de tu DNI basta para que alguien te suplante. Antes de mandarla para un alquiler, un alta o un registro, conviene tapar lo que no haga falta y borrarlo de verdad, no con un recuadro que se quita en dos clics.',
    enlaceComprobador: 'Comprueba gratis qué datos lleva tu copia del DNI, sin subirla',
    cuerpo: [
      {
        t: 'p',
        texto:
          'Te piden una copia del DNI para alquilar un piso, dar de alta la luz, matricularte en un curso o registrarte en una plataforma. Conviene pararse un momento, porque una copia de tu documento es suficiente para que alguien intente suplantarte: la idea es dar solo lo imprescindible para ese trámite concreto.',
      },
      {
        t: 'p',
        texto:
          'Muchas veces no hace falta el documento entero. Pregúntate qué necesita ver de verdad quien te lo pide: a menudo basta con tu nombre y el número, y no la fotografía, ni la firma, ni el número de soporte.',
      },
      { t: 'h2', texto: 'Qué conviene tapar' },
      {
        t: 'ul',
        items: [
          'El número de soporte (el código del anverso y del reverso que se usa en algunas comprobaciones de validez).',
          'La firma.',
          'La fotografía, si no es imprescindible para el trámite.',
          'El lugar y la fecha de nacimiento.',
          'El nombre de los padres, que figura en el reverso.',
          'El dato de otra persona, si aparece en un documento compartido.',
        ],
      },
      {
        t: 'p',
        texto:
          'Una buena costumbre es escribir sobre la propia copia para qué la envías y a quién —por ejemplo, «copia para el trámite de alta, válida solo para esa gestión»— y mandarla por un canal seguro. Así, si el archivo acaba donde no debe, al menos consta para qué se entregó.',
      },
      { t: 'h2', texto: 'Por qué el recuadro del móvil o de Paint no borra nada' },
      {
        t: 'p',
        texto:
          'Depende del formato, y ninguno de los rápidos es fiable. Si tapas el número en un PDF que tiene texto, el número sigue debajo y se copia. Si pintas una barra en una app de fotos o en un visor, esa anotación se puede mover o quitar. Lo único que funciona es que el dato desaparezca del archivo, no que quede escondido detrás de algo.',
      },
      {
        t: 'nota',
        texto:
          'Prueba antes de enviar: intenta seleccionar y copiar sobre lo tapado y, si es una foto del documento, sube el brillo. Si el dato vuelve a verse, no estaba borrado.',
      },
      { t: 'h2', texto: 'Cómo dejar la copia lista' },
      {
        t: 'p',
        texto:
          'TachadoPDF borra los datos del propio archivo y los píxeles de la zona en un escaneo, detecta de forma automática por patrones el DNI y el NIE, y tú marcas la firma y la foto arrastrando un recuadro. Después comprueba que no queda rastro y te entrega un informe. Todo se hace en tu navegador: la copia de tu DNI no se sube a ningún sitio.',
      },
    ],
  },
  // PIEZA DE AUTORIDAD / AEO (2026-08-12). No es una landing de tarea sectorial como las cinco de
  // arriba: ataca la intención de CURIOSIDAD y de MIEDO —«¿se puede recuperar un texto tachado?»,
  // «el negro se quita», «copiar el texto de debajo»—, que el diagnóstico de keywords midió con
  // demanda real. La SERP la ocupan blogs de los gigantes que dan una respuesta binaria y
  // tranquilizadora; nadie publica el ESTUDIO por métodos. Ese es el hueco de AEO: ser la fuente
  // citable sobre los TIPOS de fallo. Los datos que la sostienen son propios y medidos (nuestro
  // banco de pruebas en src/pdf/*.test.ts) y públicos y con fecha (arXiv 2206.02285; Manafort,
  // 8-ene-2019). Y declara NUESTRA propia limitación (el hueco de glifos nos afecta también): la
  // honestidad es el argumento. Ver docs/SEO-EXPERIMENTO.md para su medición.
  {
    id: 'guia-recuperar-tachado',
    relacionadas: ['guia-rectangulo-negro', 'guia-info-oculta-pdf', 'guia-fincas'],
    titulo:
      '¿Se puede recuperar el texto tachado de un PDF? Por qué muchos tachados se pueden deshacer',
    tituloEnlace: '¿Se puede recuperar un texto tachado de un PDF?',
    descripcion:
      'Sí, en muchos casos: si el tachado solo tapa el dato con un recuadro, el texto sigue dentro del archivo y se copia en segundos. Repasamos, con casos reales y un banco de pruebas propio, los tipos de tachado que se pueden deshacer, cuáles aguantan y cómo comprobar el tuyo.',
    enlaceComprobador: 'Comprueba gratis, sin subir el archivo, si tu tachado deja rastro',
    cuerpo: [
      {
        t: 'p',
        texto:
          'Sí, muchos tachados de PDF se pueden deshacer, y en los casos más comunes ni siquiera hace falta una herramienta especial. Cuando el tachado solo pinta un recuadro negro encima, el texto sigue guardado dentro del archivo: se selecciona con el ratón y se pega en cualquier sitio, y aparece. Que no se vea en pantalla no significa que no esté. La pregunta útil no es «¿se ve?», sino «¿sigue el dato dentro del archivo?», y la respuesta depende por completo del método con el que se tapó.',
      },
      {
        t: 'p',
        texto:
          'Esta página repasa, por tipos, qué tachados se pueden recuperar y cuáles no, con casos reales y con las medidas de un banco de pruebas propio. Y algo que casi nadie dice: incluso un tachado hecho bien deja un rastro geométrico que conviene conocer, el nuestro incluido.',
      },
      { t: 'h2', texto: '¿Por qué el recuadro negro no borra nada?' },
      {
        t: 'p',
        texto:
          'Porque el recuadro es una capa dibujada por delante, no una goma de borrar. El texto vive en el contenido del PDF y el rectángulo se pone encima, como una pegatina opaca sobre una hoja escrita: quitas la pegatina, o copias por debajo, y la frase sigue ahí entera. La mayoría de los editores de PDF permiten dibujar esa forma en dos clics, y por eso es el error más repetido.',
      },
      {
        t: 'p',
        texto:
          'El caso más conocido lo protagonizó la defensa de Paul Manafort. El 8 de enero de 2019 presentó ante un tribunal un escrito con varios párrafos tapados en negro; los periodistas seleccionaron el texto, lo pegaron en un procesador de textos y leyeron en minutos lo que se pretendía ocultar. El tachado era solo una capa por encima. No fue un fallo informático raro: es exactamente lo que le pasa a cualquier PDF tapado con un recuadro.',
      },
      { t: 'h2', texto: 'Y si borro el texto de verdad, ¿ya está a salvo?' },
      {
        t: 'p',
        texto:
          'Casi, pero no del todo: cuando el texto se elimina de verdad, el hueco que ocupaba se queda. Al quitar una palabra, la de detrás no se desplaza a rellenar el espacio; queda un vacío cuya anchura es exactamente la del texto borrado. Y esa anchura habla. En nuestro banco de pruebas, un DNI español entre dos espacios en la tipografía Helvetica de 11 puntos deja un hueco de 61,765 puntos, siempre el mismo; y veinte nombres de pila frecuentes dejan veinte anchuras distintas. Con una lista corta de candidatos, medir el hueco puede bastar para deducir cuál era la palabra tachada.',
      },
      {
        t: 'p',
        texto:
          'No es una teoría nuestra. Un estudio académico publicado en 2022 —«Story Beyond the Eye: Glyph Positions Break PDF Text Redaction», arXiv 2206.02285— examinó once herramientas de tachado de uso común, Adobe Acrobat entre ellas, y consiguió recuperar el texto de cientos de documentos reales ya tachados aprovechando justo esa información de posición. Dos de las once ni siquiera llegaban a borrar el texto marcado; el resto lo borraban pero dejaban el rastro de las posiciones.',
      },
      {
        t: 'nota',
        texto:
          'Esto nos afecta también a nosotros, y lo decimos porque es la verdad: nuestro motor elimina el texto del archivo, pero no recompone la línea, así que el hueco de posición permanece. Por eso el informe lo declara con todas las letras y, cuando el dato es especialmente sensible, propone convertir esa página a imagen antes de entregarla. Ninguna herramienta que conserve la capa de texto está libre de este rastro.',
      },
      { t: 'h2', texto: 'Los seis sitios donde sobrevive un dato que creías tachado' },
      {
        t: 'p',
        texto:
          'Un PDF tiene muchos más rincones que la parte que se ve. Mantenemos un banco de pruebas con documentos de datos inventados, uno por escondite, y cada uno mide si el dato sigue siendo recuperable después de tacharlo. Estos son los seis tipos de fuga que aparecen una y otra vez:',
      },
      {
        t: 'ol',
        items: [
          'El recuadro superpuesto: el negro es una anotación por encima; el texto sigue en el contenido y se copia. Es el de Manafort y el más frecuente.',
          'El hueco de glifos: el texto se borró, pero la anchura del vacío que dejó identifica la palabra dentro de una lista corta.',
          'La página escaneada: un negro sobre una imagen es una imagen sobre otra; se puede levantar o subir el contraste, y como el escaneo no tiene capa de texto, una revisión que solo lea texto pasa de largo en silencio.',
          'El marcador o índice: un dato metido en el título de un marcador del documento no se ve en la página y sobrevive al tachado; un lector de texto corriente no lo mira.',
          'El adjunto y los metadatos: un archivo incrustado, la miniatura que el PDF guarda de cada página (un retrato de la página SIN tachar), el texto alternativo de una imagen o restos de la aplicación que creó el documento pueden conservar el dato aunque la página se vea limpia.',
          'La capa apagada: el dato dibujado dentro de una capa opcional que el documento declara oculta no aparece al abrirlo, pero está en el contenido de la página y se enciende con un clic en el panel de capas.',
        ],
      },
      {
        t: 'p',
        texto:
          'La lección no es «esta herramienta falla y esta no». Es que «tapar» y «borrar» son cosas distintas, y que un archivo puede parecer limpio en pantalla y llevar el dato en cualquiera de esos seis sitios a la vez.',
      },
      { t: 'h2', texto: '¿Cómo sé en treinta segundos si mi tachado se puede deshacer?' },
      {
        t: 'p',
        texto:
          'Haz la prueba del copiar y pegar: abre tu PDF ya tachado, selecciona con el ratón por encima del recuadro negro y pega en un bloc de notas. Si aparece el texto, no estaba borrado, estaba tapado. Si el documento es un escaneo o una foto, sube el brillo y el contraste sobre la zona negra a ver si asoma algo. Esta comprobación casera caza el fallo más común, el del recuadro superpuesto, pero no ve los otros cinco: el hueco de glifos, el marcador, el adjunto, los metadatos o la capa apagada no se detectan a ojo.',
      },
      {
        t: 'p',
        texto:
          'Para eso hicimos el comprobador de TachadoPDF: abre el PDF en tu propio navegador —no se sube a ningún servidor— y te dice qué datos de los patrones que reconoce siguen siendo recuperables y en qué páginas. Es gratis y sirve tanto para revisar un tachado que hiciste tú como uno que te ha llegado de otra persona.',
      },
      { t: 'h2', texto: '¿Qué hace falta para que un dato desaparezca de verdad?' },
      {
        t: 'p',
        texto:
          'Que el dato se elimine del contenido del archivo, no que se tape; que, si está sobre una imagen escaneada, se borren los píxeles de esa zona; y que después alguien vuelva a abrir el archivo y busque otra vez para confirmar que ya no está. Ese último paso es el que separa un tachado fiable de una promesa: TachadoPDF borra el texto y los píxeles, detecta de forma automática por patrones los datos habituales, y luego relee el archivo entregado —contenido, marcadores, adjuntos, metadatos y capas— para comprobar que no queda rastro. Lo que encuentra, lo dice; si algo no se puede comprobar, no lo firma en verde.',
      },
      {
        t: 'p',
        texto:
          'Y donde el propio método tiene un límite —el hueco de glifos, que ninguna herramienta que conserve el texto evita—, el informe lo declara en lugar de callarlo. La regla, al final, es sencilla: no te fíes de que un dato «no se vea»; comprueba que ya no está dentro del archivo.',
      },
    ],
    faqs: [
      {
        pregunta: '¿Se puede recuperar el texto tachado de un PDF?',
        respuesta:
          'Sí, en muchos casos. Si el tachado solo tapa el texto con un recuadro negro, el texto sigue guardado dentro del archivo y se recupera seleccionándolo con el ratón y pegándolo en otro sitio. Solo desaparece de verdad cuando se elimina del contenido del PDF, no cuando se cubre.',
      },
      {
        pregunta: '¿Por qué puedo copiar el texto que hay debajo de un recuadro negro?',
        respuesta:
          'Porque el recuadro es una capa dibujada por encima, no un borrado. El texto permanece en el contenido del PDF y el rectángulo solo lo oculta a la vista; al seleccionar y copiar sobre esa zona, se copia el texto que hay debajo. Le pasó a la defensa de Paul Manafort en un escrito judicial del 8 de enero de 2019.',
      },
      {
        pregunta: 'Si borro el texto de verdad, ¿queda algún rastro?',
        respuesta:
          'Sí, queda el hueco que ocupaba. Al eliminar el texto, la palabra siguiente no se mueve, así que el vacío tiene la anchura exacta de lo borrado, y esa anchura puede identificar la palabra dentro de una lista corta de candidatos. Es el ataque descrito en el estudio arXiv 2206.02285, y afecta a cualquier tachado que conserve la capa de texto, el de TachadoPDF incluido.',
      },
      {
        pregunta: '¿Cómo compruebo si mi tachado se puede deshacer?',
        respuesta:
          'Haz la prueba del copiar y pegar: selecciona sobre el recuadro negro y pega en un bloc de notas; si aparece el texto, no estaba borrado. Esa prueba caza el fallo más común, pero no ve los datos escondidos en marcadores, adjuntos, metadatos o capas ocultas. El comprobador de TachadoPDF los revisa en tu propio navegador, sin subir el archivo.',
      },
      {
        pregunta: '¿Un recuadro negro sobre un documento escaneado es seguro?',
        respuesta:
          'No. Sobre un escaneo, el recuadro negro es una imagen encima de otra imagen: se puede quitar o realzar el contraste hasta que asome lo de debajo. Además, como el escaneo no tiene capa de texto, una revisión que solo lea texto no detecta el dato. Para borrarlo hay que eliminar los píxeles de esa zona de la imagen.',
      },
    ],
  },
  {
    id: 'guia-info-oculta-pdf',
    relacionadas: ['guia-recuperar-tachado', 'guia-fincas', 'guia-rectangulo-negro'],
    titulo: '¿Qué información oculta lleva un PDF? Metadatos, autor y fechas',
    tituloEnlace: '¿Qué información oculta lleva un PDF?',
    descripcion:
      'Un PDF guarda por dentro más de lo que enseña: tu nombre como autor, el programa con que se hizo, las fechas, los marcadores, los adjuntos y hasta la ubicación de las fotos que contiene. Repasamos qué lleva escondido un PDF, por qué importa al compartirlo y cómo verlo y quitarlo sin subir el archivo a ningún sitio.',
    enlaceComprobador: 'Comprueba gratis, sin subir el archivo, qué datos contiene tu PDF',
    cuerpo: [
      {
        t: 'p',
        texto:
          'Cuando abres un PDF ves el texto y las imágenes de sus páginas. Pero el archivo guarda, por dentro, bastante más: quién figura como autor, con qué programa se creó, cuándo se hizo y se modificó por última vez, los títulos de los marcadores, las anotaciones, los ficheros que lleve incrustados e incluso, si contiene fotos de un móvil, la ubicación donde se tomaron. Nada de eso se ve al abrirlo, pero todo viaja con el archivo cuando lo envías.',
      },
      {
        t: 'p',
        texto:
          'Esta página repasa qué información oculta lleva un PDF, por qué conviene mirarla antes de compartir un documento con terceros, y cómo verla y quitarla sin que el archivo salga de tu ordenador.',
      },
      { t: 'h2', texto: 'El diccionario de información: tu nombre y tu programa, grabados en el archivo' },
      {
        t: 'p',
        texto:
          'Todo PDF puede llevar un pequeño diccionario de «información del documento»: el título, el autor, el asunto, las palabras clave, el programa que creó el documento original y el que lo convirtió a PDF, y las fechas de creación y de última modificación. Muchos programas rellenan el «autor» con tu nombre de usuario del sistema sin avisarte, así que un documento profesional puede acabar diciéndole a cualquiera que lo reciba quién lo redactó y con qué herramienta.',
      },
      { t: 'h2', texto: 'Los metadatos XMP y los rincones que ningún lector enseña' },
      {
        t: 'p',
        texto:
          'Además de ese diccionario, un PDF puede llevar un paquete de metadatos XMP (otra copia estructurada de esa información, y a veces más), los títulos de los marcadores del índice lateral, anotaciones y comentarios, las miniaturas que el archivo guarda de cada página, y ficheros adjuntos incrustados dentro del propio PDF. Un lector normal no enseña casi nada de esto, pero está ahí y se puede extraer con herramientas corrientes.',
      },
      { t: 'h2', texto: 'Las fotos dentro de un PDF llevan su propia ubicación' },
      {
        t: 'p',
        texto:
          'Si el PDF incluye fotografías hechas con un móvil, cada una puede arrastrar sus metadatos EXIF: el modelo del dispositivo, la fecha exacta y, si la ubicación estaba activada, las coordenadas del lugar donde se tomó. Un informe con la foto de un desperfecto hecha en un domicilio puede llevar, dentro del archivo, la dirección de ese domicilio, sin que aparezca escrita en ninguna parte.',
      },
      { t: 'h2', texto: '¿Por qué importa al compartir un documento?' },
      {
        t: 'p',
        texto:
          'Porque cuando entregas un PDF a un tercero —un cliente, la administración, otra empresa— le entregas también todo ese rastro. En el mejor caso revela quién y con qué lo hiciste; en el peor, filtra datos que creías que no estaban: la ubicación de una foto, el nombre de un fichero adjunto, un comentario que olvidaste borrar o el título de un marcador con un dato dentro. Para quien maneja documentación con datos personales, ese rastro es parte de lo que hay que revisar antes de enviar, no un detalle técnico.',
      },
      { t: 'h2', texto: '¿Cómo veo y quito lo que lleva escondido mi PDF?' },
      {
        t: 'p',
        texto:
          'Lo primero es verlo. El comprobador de TachadoPDF abre el PDF en tu propio navegador —no se sube a ningún servidor— y te dice qué datos de los patrones que reconoce contiene y en qué páginas. Y para los metadatos en concreto, la herramienta de metadatos de PDF te enseña el autor, el software y las fechas que lleva dentro, y te descarga una copia limpia.',
      },
      {
        t: 'p',
        texto:
          'Y cuando tachas un documento con TachadoPDF, la limpieza va incluida: al borrar los datos del texto, el motor elimina también el diccionario de información, el XMP, los marcadores, las anotaciones y los adjuntos, y después relee el archivo entregado para comprobar que no queda rastro. Lo que se ve en las páginas no se toca; lo que se va es el rastro de quién, con qué y cuándo se hizo.',
      },
    ],
    faqs: [
      {
        pregunta: '¿Qué información oculta lleva un PDF?',
        respuesta:
          'Además del texto y las imágenes visibles, un PDF puede guardar el autor, el programa con que se creó y el que lo convirtió a PDF, el título y las fechas de creación y modificación, un paquete de metadatos XMP, los títulos de los marcadores, anotaciones, miniaturas de las páginas y ficheros adjuntos. Si lleva fotos de un móvil, cada una puede arrastrar su ubicación.',
      },
      {
        pregunta: '¿Un PDF revela quién lo hizo?',
        respuesta:
          'A menudo sí. Muchos programas ponen tu nombre de usuario del sistema como «autor» del documento sin que lo notes, y graban también el software y las fechas. Cualquiera que reciba el archivo puede leer esos campos, aunque no aparezcan en la página.',
      },
      {
        pregunta: '¿Las fotos dentro de un PDF llevan su ubicación?',
        respuesta:
          'Pueden. Una foto hecha con el móvil, con la ubicación activada, guarda las coordenadas del lugar donde se tomó en sus metadatos EXIF, y esos metadatos pueden viajar dentro del PDF que la incluye. Una foto hecha en un domicilio puede llevar, así, la dirección de ese domicilio.',
      },
      {
        pregunta: '¿Se ven los metadatos al abrir el PDF?',
        respuesta:
          'No. El autor, el software, las fechas, el XMP, los adjuntos y los títulos de los marcadores no aparecen en las páginas: un lector normal no los enseña. Pero están dentro del archivo y se extraen con herramientas corrientes, así que viajan con el documento cuando lo compartes.',
      },
      {
        pregunta: '¿Cómo quito los metadatos de un PDF?',
        respuesta:
          'Con la herramienta de metadatos de PDF de TachadoPDF, que te enseña lo que lleva dentro y descarga una copia sin ello, en tu propio navegador. Al tachar un documento con TachadoPDF la limpieza va incluida: se elimina el diccionario de información, el XMP, los marcadores, las anotaciones y los adjuntos, y se relee el archivo para confirmar que no queda rastro.',
      },
    ],
  },

  // Página de CONFIANZA / cómo funciona (2026-09-08). No es una guía de tarea ni una landing
  // sectorial: explica el mecanismo del producto (procesamiento en el navegador, qué sale y qué no
  // a la red, verificación anti-falso-verde, código abierto, sin cuentas) para atacar la barrera de
  // conversión de una herramienta sin marca que pide dinero — la confianza ES el producto en una
  // app de privacidad. Vocabulario en su propio carril (WebAssembly, CSP, AGPL, licencia) para no
  // canibalizar ni rozar el dedup de las guías de tachado. `origen: 'generado'`, solo español.
  {
    id: 'guia-como-funciona',
    relacionadas: ['guia-sin-subir', 'guia-recuperar-tachado', 'guia-info-oculta-pdf'],
    titulo: 'Cómo funciona TachadoPDF y por qué tus datos no salen del navegador',
    tituloEnlace: 'Cómo funciona TachadoPDF',
    descripcion:
      'TachadoPDF procesa el PDF entero dentro de tu navegador: el documento no se sube a ningún servidor, no hay cuentas ni rastreo, y el borrado se comprueba antes de darte el archivo. Explicamos exactamente cómo funciona por dentro y cómo puedes verificarlo tú mismo.',
    enlaceComprobador: 'Compruébalo tú mismo: analiza un PDF gratis, sin subirlo',
    cuerpo: [
      {
        t: 'p',
        texto:
          'Confiar un documento con datos personales a una web desconocida es, casi siempre, un acto de fe: la subes y ya no sabes qué se hace con ella después. TachadoPDF está pensado para que no tengas que fiarte de nuestra palabra, sino para que puedas comprobar por ti mismo qué le pasa a tu archivo. Esta página cuenta cómo funciona por dentro.',
      },
      { t: 'h2', texto: 'El PDF se procesa en tu propio equipo' },
      {
        t: 'p',
        texto:
          'Cuando abres un archivo, el programa que lo lee, lo edita y lo vuelve a guardar se ejecuta dentro de la pestaña del navegador, en tu ordenador o en tu móvil. No hay ninguna subida: el archivo no viaja por la red hacia una máquina nuestra, porque no existe tal máquina de procesamiento. El motor que trabaja el documento está compilado a WebAssembly y llega junto con la página, como una imagen o una hoja de estilo más.',
      },
      {
        t: 'p',
        texto:
          'La prueba más sencilla puedes hacerla tú: abre la página, corta el WiFi o los datos móviles, y sigue tachando y descargando con normalidad. Si la herramienta trabajara enviando el archivo, sin conexión no podría hacer absolutamente nada.',
      },
      { t: 'h2', texto: 'Qué sale a internet y qué no' },
      {
        t: 'p',
        texto:
          'La regla es estricta: de tu documento no sale ni un byte. Lo único que la página pide a la red es lo imprescindible para mostrarse —su propio código y su tipografía, servidos desde este mismo sitio— y, si usas la versión de pago, una comprobación de tu clave de licencia contra la plataforma de pagos. Nada más: ni tu PDF, ni su texto, ni un resumen, ni una miniatura.',
      },
      {
        t: 'p',
        texto:
          'Y para que eso no dependa de nuestra buena voluntad, la página declara una política de seguridad de contenido que hace cumplir el propio navegador: le prohíbe conectarse a cualquier destino que no sea esa verificación de licencia. No hay redes de publicidad, ni tipografías traídas de fuera, ni librerías de terceros cargadas desde otro servidor.',
      },
      { t: 'h2', texto: 'No hay cuentas ni rastreo' },
      {
        t: 'p',
        texto:
          'No te pedimos registrarte, ni un correo, ni instalar nada. Tampoco llevamos analítica: no hay cookies de seguimiento ni contadores que vigilen lo que haces. Usas la herramienta y te vas, sin dejar detrás un rastro que luego haya que proteger.',
      },
      { t: 'h2', texto: 'El borrado se comprueba antes de entregártelo' },
      {
        t: 'p',
        texto:
          'Tachar de verdad es quitar el dato del contenido del archivo, no ponerle algo por encima. Cuando terminas, TachadoPDF vuelve a abrir el documento que acaba de generar y busca otra vez lo que debía haber desaparecido. Si encontrara cualquier resto, no da el trabajo por bueno y te avisa: el peor resultado imaginable sería devolverte un archivo que parece limpio y no lo está.',
      },
      {
        t: 'p',
        texto:
          'Las páginas que son una imagen escaneada, sin texto legible por debajo, se señalan aparte y en rojo: ahí la detección automática por patrones no puede leer nada, así que te pedimos que las revises con tus propios ojos. Preferimos avisarte de lo que no podemos cubrir antes que fingir que lo cubrimos.',
      },
      { t: 'h2', texto: 'El código es abierto' },
      {
        t: 'p',
        texto:
          'Todo el código de TachadoPDF es público y se publica bajo licencia AGPL-3.0. Cualquiera —tú, o alguien de tu confianza que sepa leerlo— puede revisar exactamente qué hace la herramienta con tu archivo, sin tener que creerse esta página. Una promesa de privacidad que no se puede inspeccionar vale poco; esta se puede.',
      },
      { t: 'h2', texto: 'Gratis, y una versión de pago sin suscripción' },
      {
        t: 'p',
        texto:
          'Puedes tachar documentos gratis cada mes, con un límite pensado para un uso normal. Si necesitas más, hay una versión Pro de pago único —no es una suscripción— que amplía ese límite. El cobro y los recibos los gestiona una plataforma de pagos externa; nosotros solo comprobamos que tu clave es válida. Ni siquiera para pagar sale tu documento del navegador.',
      },
    ],
    faqs: [
      {
        pregunta: '¿De verdad no se sube mi documento a ningún sitio?',
        respuesta:
          'No. El PDF se procesa dentro de tu navegador y no viaja a ninguna máquina nuestra. Puedes comprobarlo cortando la conexión a internet una vez cargada la página: la herramienta sigue tachando y descargando, porque todo el trabajo ocurre en tu equipo.',
      },
      {
        pregunta: '¿Cómo puedo verificar que es cierto?',
        respuesta:
          'De tres maneras: usa la herramienta sin conexión y verás que funciona igual; fíjate en que no te pide ninguna cuenta ni correo; y, si quieres ir más lejos, revisa el código, que es abierto (AGPL-3.0) y cualquiera puede inspeccionar.',
      },
      {
        pregunta: '¿Qué es lo único que sí sale a internet?',
        respuesta:
          'Solo dos cosas, y ninguna es tu documento: la propia página con su código y su tipografía, servidos desde este mismo sitio, y —si usas la versión Pro— una comprobación de tu clave de licencia. El navegador impide, por política de seguridad, cualquier otra conexión.',
      },
      {
        pregunta: '¿Guardáis algo de lo que hago, o analítica de uso?',
        respuesta:
          'No. No hay cuentas, ni cookies de seguimiento, ni analítica. No registramos qué archivos abres ni qué tachas: no queda constancia de tu sesión en ningún sitio.',
      },
    ],
  },

  // Pieza de AUTORIDAD/AEO del ángulo VERIFICACIÓN (2026-09-08). Cubre la consulta de intención alta
  // «cómo comprobar si un PDF está bien tachado» —que en inglés ya tiene su guía (check-pdf-redaction)
  // y en español faltaba— y funnela al COMPROBADOR (el tool gratis ES esa comprobación). Ataca el
  // cuello real (descubrimiento) por el único canal autónomo (SEO), en el tipo que el veredicto GSC
  // demostró que saca impresiones. Carril propio (el PROCEDIMIENTO de comprobar, el doc RECIBIDO), no
  // el «por qué se recupera» de recuperar-tachado ni el «por qué falla el recuadro» de rectangulo-negro
  // (se enlazan, no se reexplican) para no rozar el dedup. Generada, solo español.
  {
    id: 'guia-comprobar-tachado',
    relacionadas: ['guia-recuperar-tachado', 'guia-rectangulo-negro', 'guia-como-funciona'],
    titulo: 'Cómo comprobar si un PDF está bien tachado y si tus datos siguen ahí',
    tituloEnlace: 'Cómo comprobar si un PDF está bien tachado',
    descripcion:
      'Te han enviado, o vas a enviar, un PDF con datos tachados y quieres asegurarte de que están de verdad borrados y no solo tapados. Cuatro comprobaciones rápidas para saber si un tachado aguanta —y cómo verlo gratis, sin subir el archivo a ningún sitio.',
    enlaceComprobador: 'Comprueba tu PDF gratis, sin subirlo: te dice qué datos siguen siendo extraíbles',
    cuerpo: [
      {
        t: 'p',
        texto:
          'El aspecto de un tachado no dice nada: una barra negra puede haber borrado el dato de verdad o solo taparlo, y a simple vista se ven igual. Si te han enviado un documento con partes tachadas —o estás a punto de enviar uno— conviene no fiarte de cómo se ve, sino ponerlo a prueba. Aquí tienes cuatro comprobaciones, de la más rápida a la más completa.',
      },
      { t: 'h2', texto: '1. La prueba de copiar y pegar' },
      {
        t: 'p',
        texto:
          'Abre el PDF, pasa el ratón seleccionando justo por encima de la zona tachada y pega en un bloc de notas. Si aparece el texto que creías oculto, es que sigue dentro del archivo: la barra negra era solo una capa por delante. Es la prueba de treinta segundos y caza el error más frecuente. (Por qué ocurre esto lo cuenta la guía del recuadro negro que enlazamos al final.)',
      },
      { t: 'h2', texto: '2. Ábrelo con otro programa o conviértelo' },
      {
        t: 'p',
        texto:
          'A veces el visor con el que miras el PDF no deja seleccionar, pero otro sí. Ábrelo en un lector distinto, o pásalo a Word o a texto plano con cualquier conversor: si el dato reaparece al cambiar de programa, no estaba borrado, estaba escondido para un visor concreto.',
      },
      { t: 'h2', texto: '3. Mira lo que no está en las páginas' },
      {
        t: 'p',
        texto:
          'Aunque las páginas se vean limpias, un PDF guarda datos fuera de ellas: el nombre del autor, el software, las fechas, los títulos de los marcadores, las anotaciones y los ficheros adjuntos. Un dato personal puede sobrevivir ahí a un tachado impecable de las páginas. Revisa las propiedades del documento y, si tu lector lo permite, sus marcadores y adjuntos.',
      },
      { t: 'h2', texto: '4. Cuidado con las páginas escaneadas' },
      {
        t: 'p',
        texto:
          'Si el PDF es un escaneo, no hay texto por debajo: la prueba de copiar y pegar no encuentra nada aunque el dato esté a la vista, y una barra negra sobre el escaneo es una imagen encima de otra imagen, que se puede quitar o realzar hasta que asome lo de debajo. Esas páginas hay que revisarlas con los ojos, una a una.',
      },
      { t: 'h2', texto: 'Cómo comprobarlo todo de una vez, gratis' },
      {
        t: 'p',
        texto:
          'El comprobador de TachadoPDF hace por ti las comprobaciones 1 y 3: lee todo el texto que se puede extraer del archivo —el de las páginas y el de sus campos internos— y busca formatos de datos personales; además marca las páginas escaneadas para que las revises a mano. Solo LEE el archivo, no lo modifica, y todo ocurre en tu navegador: el documento no se sube a ningún servidor. Es la forma rápida de saber, antes de enviar o de aceptar un PDF, si un tachado aguanta.',
      },
      { t: 'h2', texto: 'Y si descubres que no está bien tachado' },
      {
        t: 'p',
        texto:
          'No lo reenvíes. Un tachado de verdad elimina el dato del contenido del archivo, no lo tapa; y sobre un escaneo, borra los píxeles de esa zona. Con TachadoPDF puedes rehacerlo en el navegador y, al terminar, la herramienta vuelve a leer el archivo para confirmar que el dato ya no es extraíble antes de dártelo.',
      },
    ],
    faqs: [
      {
        pregunta: '¿Cómo sé si un PDF que me han enviado está bien tachado?',
        respuesta:
          'Selecciona sobre las zonas tachadas y pégalas en un bloc de notas: si sale texto, no estaban borradas. Para estar seguro, pásalo por el comprobador, que lee todo el texto extraíble del archivo y marca las páginas escaneadas, sin subir el documento a ningún sitio.',
      },
      {
        pregunta: 'Si no puedo seleccionar el texto tachado, ¿ya está seguro?',
        respuesta:
          'Casi siempre, para el texto de las páginas. Pero conviene revisar además los metadatos, los marcadores y los adjuntos —donde un dato puede sobrevivir— y, si el PDF es un escaneo, comprobar la imagen a ojo: ahí no hay texto que seleccionar y el dato puede seguir a la vista.',
      },
      {
        pregunta: '¿El comprobador modifica mi archivo o lo sube a algún sitio?',
        respuesta:
          'Ni lo uno ni lo otro. Solo LEE el archivo para decirte qué datos siguen siendo extraíbles, no lo cambia, y todo ocurre en tu navegador: el documento no sale de tu equipo. Puedes comprobarlo cortando la conexión una vez cargada la página.',
      },
      {
        pregunta: '¿Sirve para un PDF escaneado?',
        respuesta:
          'En parte. Un escaneo no tiene texto que leer, así que la comprobación automática no puede analizar su contenido; lo que hace el comprobador es marcarte esas páginas para que las revises visualmente, que es la única forma fiable de comprobar un tachado sobre una imagen.',
      },
    ],
  },

  // SEO de intención alta (2026-09-12): consulta de ALTO VOLUMEN «tachar/ocultar datos de un extracto
  // bancario», que la gente pide para un alquiler, un préstamo, una ayuda o el gestor. Carril propio
  // (financiero: extracto, movimientos, IBAN, saldo, solvencia) para no rozar el dedup de las otras
  // guías. El tool encaja perfecto (detecta el IBAN solo). Funnela al comprobador. Generada, solo ES.
  {
    id: 'guia-extracto-bancario',
    relacionadas: ['guia-nominas', 'guia-comprobar-tachado', 'guia-como-funciona'],
    titulo: 'Cómo tachar los datos de un extracto bancario en PDF antes de enviarlo',
    tituloEnlace: 'Cómo tachar un extracto bancario en PDF',
    descripcion:
      'Para un alquiler, un préstamo, una ayuda o el gestor te piden el extracto bancario, pero no hace falta enseñar todos tus movimientos ni el número de cuenta completo. Cómo tachar de verdad lo que sobra de un extracto en PDF, gratis y sin subir el archivo a ningún sitio.',
    enlaceComprobador: 'Comprueba gratis qué datos lleva tu extracto, sin subir el archivo',
    cuerpo: [
      {
        t: 'p',
        texto:
          'Cuando alquilas un piso, pides un préstamo, solicitas una ayuda o se lo mandas a tu gestor, te piden el extracto bancario para demostrar unos ingresos o unos movimientos concretos. Pero un extracto lleva mucho más de lo que hace falta enseñar: cada compra, cada cargo y cada ingreso de meses enteros, además del número de cuenta completo. Entregarlo tal cual es dar una foto de tu vida privada a alguien que solo necesitaba ver una cosa.',
      },
      { t: 'h2', texto: 'Qué sobra en un extracto bancario' },
      {
        t: 'ul',
        items: [
          'El IBAN o número de cuenta completo, cuando muchas veces basta con los últimos dígitos.',
          'Los movimientos que no vienen al caso: si te piden ver tu nómina o el pago del alquiler, el resto de compras no es asunto de nadie.',
          'Gastos que revelan datos sensibles: una farmacia, una clínica, una casa de apuestas o la cuota de un sindicato o un partido dicen de ti cosas que quien lo recibe no tiene por qué saber.',
          'Los otros titulares de una cuenta compartida.',
          'El saldo, si lo que te piden es justificar un ingreso concreto y no tu patrimonio.',
        ],
      },
      {
        t: 'p',
        texto:
          'La regla es sencilla: enseña solo lo que justifica lo que te piden, y deja el resto fuera del archivo.',
      },
      { t: 'h2', texto: 'Tapar con un recuadro no lo borra' },
      {
        t: 'p',
        texto:
          'Dibujar un rectángulo negro encima de un movimiento en el visor de PDF no elimina el dato: el texto sigue dentro del archivo y se recupera. En un extracto eso es especialmente delicado, porque quien lo recibe —una inmobiliaria, un casero particular— puede recomponer tus movimientos sin ningún conocimiento técnico. Por qué pasa lo cuenta la guía del recuadro negro que enlazamos al final; aquí vamos a lo práctico: quitarlo de verdad.',
      },
      { t: 'h2', texto: 'Cómo tacharlo de verdad, gratis y sin subir el archivo' },
      {
        t: 'p',
        texto:
          'Con TachadoPDF el extracto se procesa dentro de tu navegador —no se sube a ningún servidor—. La herramienta detecta sola el IBAN y otros datos con formato; los movimientos, los importes, los nombres y el saldo los marcas tú arrastrando el ratón sobre cada zona. Al aplicar el tachado, el texto de esas zonas se ELIMINA del contenido del archivo (no se tapa), y después la herramienta vuelve a abrir el PDF para confirmar que el dato ya no es extraíble antes de dártelo, con un informe de comprobación.',
      },
      { t: 'h2', texto: 'Antes de enviarlo, compruébalo' },
      {
        t: 'p',
        texto:
          'Un extracto pasa a manos ajenas, así que conviene no fiarse de cómo se ve. Pásalo por el comprobador —solo lee el archivo, sin subirlo— y te dirá qué datos siguen siendo extraíbles. Y si tu extracto es una foto o un PDF escaneado, revisa esas páginas con tus propios ojos: sobre una imagen no hay texto que analizar y hay que borrar los píxeles de la zona, no ponerles un parche encima.',
      },
    ],
    faqs: [
      {
        pregunta: '¿Puedo tachar unos movimientos del extracto y dejar otros?',
        respuesta:
          'Sí. Marcas a mano las líneas que sobran y el resto queda intacto. Y el dato marcado se borra del contenido del archivo, no se tapa: quien reciba el extracto no puede seleccionarlo ni recomponerlo.',
      },
      {
        pregunta: 'Me piden el extracto para un alquiler, ¿qué dejo y qué quito?',
        respuesta:
          'Suele bastar con demostrar ingresos (la nómina o la pensión que entra) y, si acaso, el pago puntual del alquiler; el resto de movimientos y el saldo puedes tacharlos. Esto es orientativo, no asesoramiento: decide según lo que exactamente te hayan pedido.',
      },
      {
        pregunta: '¿Se sube mi extracto a algún servidor?',
        respuesta:
          'No. Todo el proceso ocurre dentro de tu navegador y el archivo no se transmite a ningún sitio. Puedes comprobarlo cortando la conexión a internet una vez cargada la página: la herramienta sigue tachando y descargando.',
      },
      {
        pregunta: '¿Y si el extracto es una foto o un escaneo?',
        respuesta:
          'Sobre una imagen hay que borrar los píxeles de la zona, no taparlos con un recuadro (que se puede quitar). TachadoPDF lo hace, pero como una comprobación automática no puede leer el contenido de una imagen, revisa esas páginas a ojo antes de enviar el extracto.',
      },
    ],
  },

  // SEO orientado a CONVERSIÓN (2026-09-12): apunta al COMPRADOR de Pro —la gestoría/asesoría— que
  // maneja muchos PDF de clientes al día y agota el límite gratis. Carril propio (el ENCARGO del
  // tratamiento, la cesión indebida, el volumen, el informe como diligencia). El pitch de Pro (pago
  // único, sin límite) sale natural del volumen, sin prometer nada. Funnel al comprobador. Solo ES.
  {
    id: 'guia-gestoria',
    relacionadas: ['guia-nominas', 'guia-fincas', 'guia-sanciones'],
    titulo: 'Protección de datos en una gestoría: cómo tachar los PDF de tus clientes',
    tituloEnlace: 'Protección de datos en una gestoría',
    descripcion:
      'Una gestoría mueve al día decenas de PDF con datos de clientes —nóminas, contratos, modelos, DNIs— que reenvía y archiva. Cómo tachar de verdad lo que no toca antes de compartirlos, en tu navegador y sin subir nada, para no responder de una cesión indebida.',
    enlaceComprobador: 'Comprueba gratis qué datos lleva un PDF de cliente antes de reenviarlo',
    cuerpo: [
      {
        t: 'p',
        texto:
          'Una gestoría o una asesoría maneja datos de otras personas todo el día: nóminas de los empleados de sus clientes, contratos, modelos fiscales, escrituras, copias de DNI. Cada vez que reenvías uno de esos PDF —a la Administración, a otro cliente, a un tercero— eres tú quien responde de los datos que van dentro. Y muchas veces van más de los que hacían falta.',
      },
      { t: 'h2', texto: 'Tu riesgo específico: la cesión indebida' },
      {
        t: 'p',
        texto:
          'En un despacho eres encargado del tratamiento de los datos de tus clientes, y a menudo de los datos de terceros que aparecen en sus documentos (empleados, proveedores, contrapartes). Dejar a la vista el DNI, el número de la Seguridad Social o el IBAN de alguien que no tenía por qué salir en ese envío es una cesión de datos que no deberías hacer, y la responsabilidad es del despacho, no del cliente. No es un descuido menor: es justo el tipo de fallo que acaba en una reclamación.',
      },
      { t: 'h2', texto: 'Los PDF que pasan por tus manos con datos de más' },
      {
        t: 'ul',
        items: [
          'Nóminas y finiquitos con el DNI y el número de la Seguridad Social del trabajador.',
          'Contratos y modelos fiscales con datos de terceros que no vienen al caso del destinatario.',
          'Copias de DNI para un trámite, donde casi siempre sobra la mitad del documento.',
          'Escrituras y extractos con IBAN, importes y otros intervinientes.',
        ],
      },
      { t: 'h2', texto: 'Por qué el recuadro negro te expone a ti' },
      {
        t: 'p',
        texto:
          'Tapar el dato con un rectángulo negro en el visor de PDF no lo borra: el texto sigue dentro del archivo y quien lo recibe lo recupera seleccionándolo. En un despacho eso es doblemente peligroso, porque el fallo lleva tu firma profesional. Por qué pasa lo cuenta la guía del recuadro negro que enlazamos al final; lo que importa aquí es quitarlo de verdad, y hacerlo rápido cuando son muchos documentos.',
      },
      { t: 'h2', texto: 'Cómo tacharlo a volumen y sin subir nada' },
      {
        t: 'p',
        texto:
          'Con TachadoPDF el documento se procesa dentro de tu navegador: no se sube a ningún servidor. Para un despacho eso importa el doble, porque significa que NO metes un intermediario más en la cadena de datos de tus clientes. La herramienta detecta sola el DNI, el NIE, el IBAN, el número de la Seguridad Social, el teléfono y el correo; lo demás lo marcas tú. Al aplicar el tachado, el dato se elimina del contenido del archivo (no se tapa) y la herramienta vuelve a leer el PDF para confirmar que ya no es extraíble.',
      },
      { t: 'h2', texto: 'El informe de comprobación: constancia de lo que hiciste' },
      {
        t: 'p',
        texto:
          'Cada documento tachado sale con un informe que documenta qué formatos se buscaron y qué se quitó. No sustituye a un dictamen legal, pero sí deja constancia técnica de que revisaste el archivo antes de entregarlo — útil en un despacho que necesita poder enseñar diligencia. La versión gratuita cubre unos pocos documentos al mes; si tachas a volumen, la versión Pro es un pago único (no una suscripción) que quita ese límite y el distintivo de la versión gratuita del informe.',
      },
    ],
    faqs: [
      {
        pregunta: '¿Reenviar un PDF con el DNI de un tercero es una cesión de datos?',
        respuesta:
          'Si esa persona no tenía por qué aparecer en ese envío, sí: estás comunicando sus datos a alguien sin base para ello, y como despacho respondes tú. Por eso conviene tachar de verdad lo que no viene al caso antes de reenviar, no solo taparlo.',
      },
      {
        pregunta: '¿El documento de mi cliente se sube a algún servidor?',
        respuesta:
          'No. Todo ocurre dentro de tu navegador y el archivo no se transmite a ningún sitio; para un despacho eso significa que no añades otro encargado del tratamiento a la cadena. Puedes comprobarlo cortando la conexión una vez cargada la página: la herramienta sigue funcionando.',
      },
      {
        pregunta: '¿El informe sirve como prueba legal?',
        respuesta:
          'Es una comprobación técnica, no un dictamen legal. Documenta qué se buscó y qué se quitó, y que el archivo se releyó para confirmar que el dato ya no es extraíble; sirve para dejar constancia interna de tu diligencia, no para sustituir el criterio de un profesional.',
      },
      {
        pregunta: '¿Cuántos documentos puedo tachar gratis?',
        respuesta:
          'La versión gratuita cubre unos pocos documentos al mes. Un despacho que tacha a diario agota ese límite enseguida; para ese uso está la versión Pro, un pago único (no una suscripción) que quita el límite. Ni siquiera para verificar la licencia sale tu documento del navegador.',
      },
    ],
  },

  // SEO orientado a CONVERSIÓN (2026-09-12): otro COMPRADOR de Pro, la inmobiliaria, que acumula
  // expedientes de solvencia (DNI + nómina + extracto) de CADA candidato a un alquiler. Carril propio
  // (el expediente del inquilino, el sobre-compartir al propietario, los datos de quien NO se queda el
  // piso) para no rozar el dedup de gestoría/extracto. Funnela al comprobador. Generada, solo ES.
  {
    id: 'guia-inmobiliaria',
    relacionadas: ['guia-extracto-bancario', 'guia-nominas', 'guia-gestoria'],
    titulo: 'Protección de datos en una inmobiliaria: los expedientes de solvencia de inquilinos',
    tituloEnlace: 'Protección de datos en una inmobiliaria',
    descripcion:
      'Una inmobiliaria recibe de cada candidato a un alquiler su DNI, sus nóminas y su extracto bancario. Cómo tachar de verdad lo que no toca antes de pasar un expediente al propietario —y qué hacer con los datos de quien no se queda el piso—, en tu navegador y sin subir nada.',
    enlaceComprobador: 'Comprueba gratis qué datos lleva un expediente antes de pasarlo al propietario',
    cuerpo: [
      {
        t: 'p',
        texto:
          'Para alquilar un solo piso, una inmobiliaria puede recibir el expediente de solvencia de diez candidatos: el DNI, las últimas nóminas, el contrato de trabajo y el extracto bancario de cada uno. Es una montaña de datos muy sensibles de mucha gente, y la mayoría son de personas que al final no van a ser tus clientes. Gestionar eso sin cuidado es uno de los riesgos de protección de datos más habituales del sector.',
      },
      { t: 'h2', texto: 'Dos momentos en los que te la juegas' },
      {
        t: 'p',
        texto:
          'El primero es cuando pasas el expediente del candidato elegido al propietario: casi siempre le mandas de más. El dueño necesita saber que el inquilino es solvente, no ver todos sus movimientos bancarios ni el número de cuenta completo. El segundo es qué haces con los expedientes de los candidatos que NO se quedan el piso: guardarlos «por si acaso» es conservar datos personales sin ninguna base para hacerlo.',
      },
      { t: 'h2', texto: 'Qué tachar antes de pasar un expediente al propietario' },
      {
        t: 'ul',
        items: [
          'Del extracto bancario: los movimientos que no demuestran solvencia y el número de cuenta completo; basta con dejar la entrada de la nómina.',
          'De la nómina: el número de la Seguridad Social y otros datos que no vienen al caso del alquiler.',
          'El DNI, salvo lo imprescindible para identificar al futuro inquilino.',
          'Cualquier dato de terceros (una cuenta compartida, un avalista) que el propietario no necesite.',
        ],
      },
      { t: 'h2', texto: 'Por qué el recuadro negro no te cubre' },
      {
        t: 'p',
        texto:
          'Tapar un movimiento o un número con un rectángulo negro en el visor de PDF no lo borra: el texto sigue dentro del archivo y el propietario —o cualquiera a quien él se lo reenvíe— lo recupera seleccionándolo. Como el expediente lleva tu marca de agencia, ese fallo es tuyo. Por qué pasa lo explica la guía del recuadro negro que enlazamos al final; aquí vamos a quitarlo de verdad.',
      },
      { t: 'h2', texto: 'Cómo hacerlo a volumen y sin subir nada' },
      {
        t: 'p',
        texto:
          'Con TachadoPDF cada documento se procesa dentro de tu navegador: no se sube a ningún servidor, así que no metes un intermediario más en la cadena de datos del candidato. La herramienta detecta sola el DNI, el IBAN, el número de la Seguridad Social y el resto de formatos; los movimientos y lo demás lo marcas tú. El dato se elimina del contenido del archivo (no se tapa) y la herramienta vuelve a leerlo para confirmar que ya no es extraíble. La versión gratuita cubre unos pocos documentos al mes; una agencia que prepara expedientes a diario tiene la versión Pro, de pago único, para quitar ese límite.',
      },
      { t: 'h2', texto: 'Y con los expedientes de quien no se queda el piso' },
      {
        t: 'p',
        texto:
          'Lo más limpio es no guardarlos: cuando el proceso termina, los expedientes de los candidatos descartados no tienen por qué seguir en tu correo ni en tu ordenador. Si por lo que sea necesitas conservar algo un tiempo, consérvalo ya tachado, con solo lo que justifique tu decisión. Menos datos guardados es menos que proteger y menos que explicar si alguien pregunta.',
      },
    ],
    faqs: [
      {
        pregunta: '¿Puedo pasarle al propietario el extracto bancario entero del inquilino?',
        respuesta:
          'No hace falta y es mejor no hacerlo. El propietario necesita comprobar la solvencia, no conocer cada gasto de la persona. Deja a la vista la entrada de la nómina o el ingreso recurrente y tacha el resto de movimientos y el número de cuenta completo antes de enviárselo.',
      },
      {
        pregunta: '¿Qué hago con los expedientes de los candidatos que no se quedan el piso?',
        respuesta:
          'Lo más seguro es no conservarlos una vez cerrado el alquiler: son datos sensibles de personas que no van a ser tus clientes. Si necesitas guardar algo puntualmente, guárdalo ya tachado, con lo mínimo. Esto es orientativo; para tus plazos y obligaciones concretas, consulta con quien lleve tu protección de datos.',
      },
      {
        pregunta: '¿El expediente del inquilino se sube a algún servidor?',
        respuesta:
          'No. Todo ocurre dentro de tu navegador y el archivo no se transmite a ningún sitio, así que no añades otro tratamiento a los datos del candidato. Puedes comprobarlo cortando la conexión una vez cargada la página: la herramienta sigue tachando y descargando.',
      },
      {
        pregunta: '¿Sirve si el candidato me manda una foto o un escaneo de la nómina?',
        respuesta:
          'Sí, pero sobre una imagen hay que borrar los píxeles de la zona, no taparlos con un recuadro (que se puede quitar). TachadoPDF lo hace; como una comprobación automática no puede leer el contenido de una imagen, revisa esas páginas a ojo antes de pasar el expediente.',
      },
    ],
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
    metaTitulo: 'Tachar un PDF de verdad: el rectángulo negro no borra',
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
    otrasHerramientas: 'Otras herramientas gratuitas',
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
    enlaceImagen: 'Tacha una imagen o captura de pantalla',
    enlaceMetadatos: 'Ve los metadatos ocultos de una foto',
    enlaceMetadatosPdf: 'Ve los metadatos ocultos de un PDF',
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

  imagen: {
    metaTitulo: 'Tachar una imagen o captura: borra los datos, no los tapa',
    metaDescripcion:
      'Tacha datos de una foto o captura de pantalla: no la difumina, sustituye los píxeles de la zona por negro sólido, y al exportar elimina los metadatos (incluida la ubicación). 100% en tu navegador; la imagen no se sube a ningún servidor.',
    ogTitulo: 'Tachar una imagen o captura de pantalla · TachadoPDF',
    ogDescripcion:
      'Borra datos de una imagen o captura sustituyendo los píxeles por negro sólido (no difuminado) y quita los metadatos, 100% en tu navegador.',
    jsonLdNombre: 'Tachar imágenes · TachadoPDF',
    titular: 'Tacha una imagen o captura de pantalla',
    intro:
      'Arrastra un recuadro sobre lo que quieras ocultar —una cara, un DNI, un correo, un saldo— y descarga la imagen con esas zonas borradas. No difuminamos ni pixelamos: los píxeles de la zona se sustituyen por negro sólido, así que debajo no queda nada que recomponer.',
    introLocal:
      'La imagen nunca sale de tu equipo: todo ocurre en tu navegador. Al descargar, la imagen se vuelve a codificar desde cero, así que los metadatos que llevara (incluida la ubicación GPS de una foto) no pasan al archivo final.',
    dropzone: 'Arrastra una imagen aquí o haz clic para seleccionarla',
    formatos: 'JPG, PNG o WebP',
    instrucciones: 'Arrastra sobre la imagen para marcar cada zona a borrar. Arrastra otra vez para añadir más.',
    contadorUna: 'zona marcada',
    contadorVarias: 'zonas marcadas',
    botonDescargar: 'Descargar imagen tachada',
    botonDeshacer: 'Deshacer la última',
    botonLimpiar: 'Quitar todas las marcas',
    sinRegiones: 'Marca al menos una zona antes de descargar.',
    aviso:
      'Lo que descargas es una imagen plana: las zonas marcadas son negro sólido, sin ninguna capa oculta debajo, y los metadatos se han quedado fuera al reexportar. Un difuminado se puede revertir; un relleno sólido no deja nada que revertir.',
    noEsImagen: 'Eso no parece una imagen. Usa un archivo JPG, PNG o WebP.',
    errorGenerico: 'No se pudo procesar la imagen.',
    sufijoDescarga: '-tachada',
    faqs: [
      {
        pregunta: '¿Se puede recuperar una imagen difuminada o pixelada?',
        respuesta:
          'A menudo sí: el difuminado y el pixelado son transformaciones que en muchos casos se pueden revertir, sobre todo sobre texto. Por eso aquí no difuminamos: rellenamos la zona con negro sólido, y un relleno sólido no deja nada debajo que reconstruir.',
      },
      {
        pregunta: '¿Una foto o una captura guarda mi ubicación?',
        respuesta:
          'Las fotos suelen llevar metadatos ocultos, incluida la ubicación GPS donde se tomaron y a veces el modelo del dispositivo. Al descargar, la imagen se vuelve a codificar desde cero, así que esos metadatos no pasan al archivo final.',
      },
      {
        pregunta: '¿Los datos se borran de verdad o solo se tapan?',
        respuesta:
          'Se borran: los píxeles de la zona marcada se sustituyen por negro sólido sobre la propia imagen, y lo que descargas es un mapa de bits plano, sin una capa por encima que se pueda quitar. No es un recuadro superpuesto.',
      },
      {
        pregunta: '¿La imagen se sube a algún servidor?',
        respuesta:
          'No. Todo ocurre dentro de tu navegador y la imagen no se transmite. Puedes comprobarlo: desconéctate de internet y la herramienta sigue tachando y descargando.',
      },
      {
        pregunta: '¿Qué formatos de imagen acepta?',
        respuesta:
          'JPG, PNG y WebP, incluidas las capturas de pantalla. La descarga sale en PNG, o en JPG si la imagen original ya era JPG.',
      },
    ],
  },

  metadatos: {
    metaTitulo: 'Ver y borrar los metadatos ocultos de una foto (EXIF, GPS)',
    metaDescripcion:
      'Descubre qué datos ocultos lleva una foto —ubicación GPS, modelo de cámara, fecha— y descarga una copia limpia sin metadatos. 100% en tu navegador; la imagen no se sube a ningún servidor.',
    ogTitulo: 'Ver y borrar los metadatos ocultos de una foto · TachadoPDF',
    ogDescripcion:
      'Mira qué lleva escondido tu foto (ubicación GPS, cámara, fecha) y descárgala limpia, 100% en tu navegador.',
    jsonLdNombre: 'Limpiador de metadatos · TachadoPDF',
    titular: 'Ve y borra los metadatos ocultos de una foto',
    intro:
      'Una foto no es solo la imagen: por dentro puede llevar dónde se tomó (ubicación GPS), con qué cámara o móvil, la fecha exacta y el software que la tocó. Arrastra una imagen y te digo qué lleva; después descargas una copia sin nada de eso.',
    introLocal:
      'La imagen nunca sale de tu equipo: todo se analiza en tu navegador. La copia limpia se genera recodificando la imagen desde cero, así que los metadatos no pasan al archivo final.',
    dropzone: 'Arrastra una imagen aquí o haz clic para seleccionarla',
    formatos: 'JPG o PNG',
    analizando: 'Analizando…',
    sinMetadatos:
      'Esta imagen no lleva metadatos ocultos de los que buscamos. Aun así, la copia limpia se recodifica desde cero.',
    conMetadatos: 'Esta imagen lleva escondido:',
    etiquetas: {
      ubicacion: 'Ubicación GPS (dónde se tomó)',
      camara: 'Cámara o dispositivo',
      fecha: 'Fecha y hora',
      software: 'Software de edición',
      autor: 'Autor o copyright',
      otros: 'Otros metadatos EXIF',
    },
    botonDescargar: 'Descargar copia sin metadatos',
    aviso:
      'La copia que descargas se ha recodificado desde cero: no lleva los metadatos del original. Es la imagen, sin el rastro de dónde, cuándo y con qué se hizo.',
    noEsImagen: 'Eso no parece una imagen. Usa un archivo JPG o PNG.',
    errorGenerico: 'No se pudo procesar la imagen.',
    sufijoDescarga: '-sin-metadatos',
    faqs: [
      {
        pregunta: '¿Qué son los metadatos de una foto?',
        respuesta:
          'Son datos que la cámara o el móvil guardan DENTRO del archivo, además de la imagen: la ubicación GPS donde se tomó, el modelo del dispositivo, la fecha y hora exactas, el software... No se ven al abrir la foto, pero viajan con ella cuando la compartes.',
      },
      {
        pregunta: '¿Una foto puede revelar dónde vivo?',
        respuesta:
          'Puede. Si el móvil tenía la ubicación activada, la foto guarda las coordenadas GPS del lugar donde se tomó. Una foto hecha en casa lleva, dentro del archivo, dónde está tu casa. Esta herramienta te avisa si tu imagen lleva ubicación y te da una copia sin ella.',
      },
      {
        pregunta: '¿Al recortar o pasar la foto por otra app se borran los metadatos?',
        respuesta:
          'No siempre. Muchas apps conservan los metadatos al editar, y algunas redes sociales los quitan pero otras no. La única forma segura es recodificar la imagen sin copiar esos campos, que es justo lo que hace esta herramienta.',
      },
      {
        pregunta: '¿La imagen se sube a algún servidor?',
        respuesta:
          'No. Todo ocurre dentro de tu navegador y la imagen no se transmite. Puedes comprobarlo: desconéctate de internet y la herramienta sigue analizando y descargando.',
      },
      {
        pregunta: '¿Se pierde calidad al limpiar los metadatos?',
        respuesta:
          'La copia se recodifica: para PNG es sin pérdida (idéntica); para JPG se guarda a alta calidad. Lo que se quita son los datos ocultos, no el contenido visible de la foto.',
      },
    ],
  },

  metadatosPdf: {
    metaTitulo: 'Ver y borrar los metadatos ocultos de un PDF',
    metaDescripcion:
      'Descubre qué revela tu PDF —autor, software con que se creó, fechas, marcadores, adjuntos— y descarga una copia limpia. 100% en tu navegador; el archivo no se sube a ningún servidor.',
    ogTitulo: 'Ver y borrar los metadatos ocultos de un PDF · TachadoPDF',
    ogDescripcion:
      'Mira qué revela tu PDF (autor, software, fechas) y descárgalo limpio, 100% en tu navegador.',
    jsonLdNombre: 'Limpiador de metadatos de PDF · TachadoPDF',
    titular: 'Ve y borra los metadatos ocultos de un PDF',
    intro:
      'Un PDF guarda por dentro más de lo que enseña: tu nombre como autor, el programa con que se hizo, cuándo se creó y se modificó, marcadores, anotaciones y hasta ficheros adjuntos. Arrastra un PDF y te digo qué revela; después descargas una copia sin ese rastro.',
    introLocal:
      'El PDF nunca sale de tu equipo: todo se analiza y se limpia en tu navegador. La copia se reserializa quitando esos campos, y se relee para comprobar que se fueron.',
    dropzone: 'Arrastra un PDF aquí o haz clic para seleccionarlo',
    formatos: 'Solo PDF',
    conMetadatos: 'Este PDF revela:',
    sinMetadatos:
      'Este PDF no lleva metadatos de los que buscamos. Aun así, la copia se reserializa limpia.',
    procesando: 'Limpiando…',
    botonDescargar: 'Descargar PDF sin metadatos',
    etiquetas: {
      Author: 'Autor',
      Creator: 'Creado con',
      Producer: 'Generado por',
      Title: 'Título',
      Subject: 'Asunto',
      Keywords: 'Palabras clave',
      CreationDate: 'Fecha de creación',
      ModDate: 'Última modificación',
      xmp: 'Metadatos XMP (paquete de datos incrustado)',
      adjuntos: 'Ficheros adjuntos dentro del PDF',
      marcadores: 'Marcadores del índice, con sus títulos',
      anotaciones: 'Anotaciones o comentarios',
    },
    aviso:
      'La copia que descargas se ha reserializado sin esos metadatos, y la herramienta la relee para confirmar que no quedan. El contenido visible del documento no se toca; lo que se va es el rastro de quién, con qué y cuándo se hizo.',
    noEsPdf: 'Eso no parece un PDF. Usa un archivo .pdf.',
    errorGenerico: 'No se pudo procesar el PDF.',
    sufijoDescarga: '-sin-metadatos',
    faqs: [
      {
        pregunta: '¿Qué metadatos guarda un PDF?',
        respuesta:
          'Además del texto y las imágenes, un PDF guarda un diccionario de información: el autor, el programa con que se creó (por ejemplo Word) y el que lo convirtió a PDF, el título, y las fechas de creación y modificación. Puede llevar también marcadores con sus títulos, anotaciones, un paquete de metadatos XMP y hasta ficheros adjuntos incrustados.',
      },
      {
        pregunta: '¿Un PDF revela quién lo hizo?',
        respuesta:
          'A menudo sí. Muchos programas ponen tu nombre de usuario como «autor» del documento sin que lo notes. Esta herramienta te lo enseña antes de compartir el archivo y te da una copia sin ese campo.',
      },
      {
        pregunta: '¿Se puede saber cuándo y con qué programa se creó un PDF?',
        respuesta:
          'Sí: las fechas de creación y modificación y el software quedan grabados en los metadatos. Es útil para ti, pero también le dice a cualquiera que reciba el archivo cómo y cuándo lo hiciste. La copia limpia no los lleva.',
      },
      {
        pregunta: '¿El PDF se sube a algún servidor?',
        respuesta:
          'No. Todo ocurre dentro de tu navegador y el archivo no se transmite. Puedes comprobarlo: desconéctate de internet y la herramienta sigue analizando y limpiando.',
      },
      {
        pregunta: '¿Se modifica el contenido del documento al limpiar los metadatos?',
        respuesta:
          'No. Se quitan los campos de información, el XMP, los marcadores, las anotaciones y los adjuntos, y el archivo se vuelve a serializar. El texto y las imágenes que se ven en las páginas no se tocan. Esta herramienta limpia metadatos: para eliminar datos del contenido visible, usa el tachado de PDF.',
      },
    ],
  },

  app: APP_ES,
  informe: INFORME_ES,
  comprobadorUi: COMPROBADOR_ES,
};

/** El español es el MOLDE: `en` (y cualquier idioma futuro) se declara con este tipo, así que
 *  olvidar una traducción rompe `tsc --noEmit`, que ya está en la cadena de verificación. */
export type Contenido = typeof es;
