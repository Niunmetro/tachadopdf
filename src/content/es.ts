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
    'Los datos detectados aparecen marcados: haz clic para elegir cuáles tachar. Para tachar cualquier otra cosa (un nombre, una firma, una foto), arrastra sobre ella dibujando un recuadro. Cada recuadro negro tiene una «×» por si quieres quitarlo.',
  revisionVisual: (paginas) =>
    `Páginas que requieren revisión visual (sin capa de texto o con imagen a página completa): ${paginas}.`,
  paginaEscaneada: (numero) =>
    `Página ${numero}: sin capa de texto (escaneada). No hay detección automática — tacha a mano las zonas con datos.`,
  tacharTodas: (valor, ocurrencias) =>
    `Tachar todas las apariciones de «${valor}» (${ocurrencias})`,
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

  // --- Landings de cola larga sectorial (generadas, ver registro.ts y docs/SEO-EXPERIMENTO.md) ---
  // Cada una responde a UNA consulta distinta, con su sector, sus datos y su propio motivo de por
  // qué el recuadro negro no basta AHÍ. El vocabulario del producto se mantiene: «borrado real de
  // datos» y «detección automática por patrones», nunca las palabras vetadas por el comité.
  {
    id: 'guia-curriculum',
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
