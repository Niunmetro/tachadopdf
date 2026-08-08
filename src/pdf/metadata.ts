import * as mupdf from 'mupdf';
import type { EstadoObjeto, InventarioObjetos } from '../types';

const INFO_LABELS = ['Title', 'Author', 'Subject', 'Keywords', 'Producer', 'Creator'] as const;

/**
 * `eliminado` si lo habia y ya no esta · `noHabia` si nunca estuvo · `noExaminado` si lo habia
 * y SIGUE ahi. El tercer caso no es un adorno: si un objeto sobrevive al limpiado, el informe
 * tiene que degradarse solo en vez de callarlo.
 */
function estadoTras(habia: boolean, sigue: boolean): EstadoObjeto {
  if (!habia) return 'noHabia';
  return sigue ? 'noExaminado' : 'eliminado';
}

function pagesOf(doc: mupdf.PDFDocument): mupdf.PDFObject[] {
  const pages: mupdf.PDFObject[] = [];
  const total = doc.countPages();
  for (let i = 0; i < total; i++) pages.push(doc.findPage(i));
  return pages;
}

/**
 * Titulos de TODOS los marcadores del documento (el indice lateral), recorriendo el arbol
 * `/Outlines` entero, no solo el primer nivel.
 *
 * Word y LibreOffice construyen los marcadores solos con los titulos del documento, asi que un
 * «Nomina de Fulanito - 12345678Z» acaba ahi sin que nadie lo escriba. Ese texto NO aparece en
 * `extractAllText()`, asi que ni el detector lo veia ni la guarda podia reencontrarlo.
 *
 * El recorrido va con tope de nodos y con memoria de los objetos indirectos ya vistos: un PDF
 * con `/Next` circular es un bucle infinito, y aqui entran ficheros de desconocidos.
 */
function outlineTitles(doc: mupdf.PDFDocument): string[] {
  const raiz = doc.getTrailer().get('Root').get('Outlines');
  if (raiz.isNull()) return [];

  const titulos: string[] = [];
  const vistos = new Set<number>();
  const pendientes: mupdf.PDFObject[] = [raiz.get('First')];
  let nodos = 0;

  while (pendientes.length > 0 && nodos < 5000) {
    const nodo = pendientes.pop();
    if (nodo === undefined || nodo.isNull()) continue;
    nodos++;
    if (nodo.isIndirect()) {
      const numero = nodo.asIndirect();
      if (vistos.has(numero)) continue;
      vistos.add(numero);
    }
    const titulo = nodo.get('Title');
    if (titulo.isString()) titulos.push(titulo.asString());
    pendientes.push(nodo.get('First'));
    pendientes.push(nodo.get('Next'));
  }
  return titulos;
}

/**
 * Claves que llevan datos y que ningun lector muestra: se borran esten donde esten.
 *
 *  - `Metadata`: XMP. `stripMetadata` solo miraba `/Root` y cada `/Page`, asi que un paquete XMP
 *    colgado de un XObject sobrevivia entero.
 *  - `Thumb`: la miniatura de la pagina es un retrato de la pagina SIN tachar.
 *  - `PieceInfo`: datos privados de la aplicacion que genero el PDF.
 *  - `AF`: ficheros asociados. **Esta mantenia vivo el adjunto entero.** `deleteEmbeddedFile`
 *    quita la entrada del arbol `/Names`, y `getEmbeddedFiles()` devolvia una lista vacia, asi
 *    que el inventario declaraba «Ficheros adjuntos: eliminado del archivo» — pero el `/AF` del
 *    catalogo seguia apuntando al Filespec, el recolector no podia tirarlo, y el CONTENIDO del
 *    adjunto seguia dentro del fichero entregado. Medido: `'contenido adjunto'` presente en los
 *    bytes descomprimidos. Lo destapo la relectura de todas las cadenas, no una sospecha.
 *  - `AA`: acciones adicionales (JavaScript al abrir la pagina o el documento).
 */
const CLAVES_OCULTAS = ['Metadata', 'Thumb', 'PieceInfo', 'AF', 'AA'] as const;

/**
 * Texto de accesibilidad del arbol de estructura: es donde Word deja el «texto alternativo».
 * `/T` es el TITULO del elemento de estructura y estaba al lado de los otros tres, sin mirar:
 * un «Nomina de 12345678Z» ahi sobrevivia entero y se firmaba en verde.
 */
const CLAVES_TEXTO_ESTRUCTURA = ['Alt', 'ActualText', 'E', 'T'] as const;

/**
 * Claves del CATALOGO que llevan texto y que ningun lector necesita para enseñar la pagina.
 * Cada una es un escondite reproducido:
 *
 *  - `PageLabels`: el prefijo de numeracion de pagina («Nomina 12345678Z»).
 *  - `Threads`: hilos de articulo, con su `/Title`.
 *  - `Collection`: el esquema de un portafolio, con los nombres de sus columnas.
 *  - `OpenAction`: accion al abrir, incluido JavaScript con el dato dentro. (`/AA`, las acciones
 *    adicionales, se quitan en el barrido por objeto: tambien las llevan las paginas.)
 *  - `Dests`: destinos con nombre. Se van sin coste: las anotaciones —y con ellas los enlaces
 *    que apuntarian a esos destinos— ya se eliminan enteras unas lineas mas arriba.
 */
const CLAVES_RAIZ_CON_TEXTO = ['PageLabels', 'Threads', 'Collection', 'OpenAction', 'Dests'] as const;

/** Sub-arboles de `/Names` que llevan cadenas escritas por el usuario o por su aplicacion. */
const CLAVES_NAMES_CON_TEXTO = ['Dests', 'JavaScript', 'JS'] as const;

/**
 * Claves ESTANDAR del diccionario de pagina (PDF 32000-1, tabla 30). Cualquier otra es privada
 * del programa que genero el fichero: ningun lector conforme la usa para enseñar la pagina, y
 * puede llevar dentro lo que su autor quiera. Lista blanca aqui SI vale, porque el conjunto lo
 * fija la norma y no la imaginacion de quien esconde el dato.
 */
const CLAVES_PAGINA_ESTANDAR: ReadonlySet<string> = new Set([
  'Type', 'Parent', 'LastModified', 'Resources', 'MediaBox', 'CropBox', 'BleedBox', 'TrimBox',
  'ArtBox', 'BoxColorInfo', 'Contents', 'Rotate', 'Group', 'Thumb', 'B', 'Dur', 'Trans', 'Annots',
  'AA', 'Metadata', 'PieceInfo', 'StructParents', 'ID', 'PZ', 'SeparationInfo', 'Tabs',
  'TemplateInstantiated', 'PresSteps', 'UserUnit', 'VP', 'AF', 'OutputIntents', 'DPart',
]);

/** Etiqueta neutra con la que se sustituye el nombre de una capa opcional. */
const NOMBRE_DE_CAPA = 'Capa';

/**
 * Barrido por NUMERO DE OBJETO, no por el arbol de paginas: el punto ciego era justamente que
 * se recorrian dos sitios concretos y el dato estaba en un tercero. Devuelve si habia algo.
 */
function barrerClavesOcultas(doc: mupdf.PDFDocument): boolean {
  let habia = false;
  const total = doc.countObjects();
  let capas = 0;
  for (let num = 1; num < total; num++) {
    const obj = doc.newIndirect(num).resolve();
    if (!obj.isDictionary()) continue;
    for (const clave of CLAVES_OCULTAS) {
      if (obj.get(clave).isNull()) continue;
      obj.delete(clave);
      habia = true;
    }
    const tipo = obj.get('Type').asName();
    // La pagina: fuera todo lo que no este en la norma. Ahi cabia una clave propia con el dato.
    if (tipo === 'Page') {
      const privadas: string[] = [];
      obj.forEach((_valor, clave) => {
        if (typeof clave === 'string' && !CLAVES_PAGINA_ESTANDAR.has(clave)) privadas.push(clave);
      });
      for (const clave of privadas) {
        obj.delete(clave);
        habia = true;
      }
    }
    // El nombre de una capa opcional lo enseña el panel de capas, asi que no se puede borrar sin
    // dejar el panel mudo: se sustituye por una etiqueta neutra. El nombre lo escribe una persona
    // («Capa 12345678Z») y por eso es un escondite.
    if (tipo === 'OCG' && obj.get('Name').isString()) {
      capas++;
      obj.put('Name', doc.newString(`${NOMBRE_DE_CAPA} ${capas}`));
      habia = true;
    }
  }
  return habia;
}

/**
 * Claves del catalogo y de `/Names` con texto. Se hace aparte del barrido por numero de objeto
 * porque estas claves solo significan lo que significan colgando de la raiz: `/T` o `/Dests` en
 * otro sitio son otra cosa.
 */
function barrerClavesDeLaRaiz(root: mupdf.PDFObject): boolean {
  let habia = false;
  for (const clave of CLAVES_RAIZ_CON_TEXTO) {
    if (root.get(clave).isNull()) continue;
    root.delete(clave);
    habia = true;
  }
  const names = root.get('Names');
  if (!names.isNull()) {
    for (const clave of CLAVES_NAMES_CON_TEXTO) {
      if (names.get(clave).isNull()) continue;
      names.delete(clave);
      habia = true;
    }
  }
  return habia;
}

/**
 * TODA cadena de texto de un objeto, bajando por los diccionarios y arrays DIRECTOS. Las
 * referencias indirectas no se siguen: cada objeto indirecto lo visita el bucle de fuera, asi que
 * seguirlas seria recorrer el fichero n veces y arriesgarse a un ciclo.
 *
 * Esto es la mitad que faltaba. El barrido borraba tres claves de una lista blanca, asi que
 * cualquier cadena en cualquier OTRA clave sobrevivia Y no se releia: nueve escondites distintos
 * (etiquetas de pagina, nombres de capa, destinos con nombre, JavaScript, hilos de articulo,
 * claves propias de la pagina, titulos del arbol de estructura, portafolios) salian «TACHADO
 * VERIFICADO» con el dato dentro. Contra un escondite no hay lista blanca que valga: lo que
 * cierra la familia entera es RELEER todas las cadenas, de modo que lo que no se sepa borrar al
 * menos bloquee el informe en vez de firmarlo.
 */
function cadenasDelObjeto(obj: mupdf.PDFObject, salida: string[], profundidad = 0): void {
  if (profundidad > 8) return;
  if (obj.isString()) {
    salida.push(obj.asString());
    return;
  }
  if (obj.isArray() || obj.isDictionary()) {
    obj.forEach((valor) => {
      if (valor.isIndirect()) return;
      cadenasDelObjeto(valor, salida, profundidad + 1);
    });
  }
}

/**
 * Recorre el arbol de estructura (`/StructTreeRoot`). `leer` devuelve los textos alternativos;
 * `borrar` los quita. Se recorre el arbol de verdad, y no todos los objetos, para no tocar
 * claves homonimas de otras estructuras: `/E` y `/T` significan otra cosa fuera de aqui.
 *
 * El tope de nodos y la memoria de indirectos ya vistos no son adorno: un `/K` circular es un
 * bucle infinito, y aqui entran ficheros de desconocidos.
 */
function recorrerArbolDeEstructura(
  doc: mupdf.PDFDocument,
  accion: 'leer' | 'borrar',
): string[] {
  const raiz = doc.getTrailer().get('Root').get('StructTreeRoot');
  if (raiz.isNull()) return [];

  const textos: string[] = [];
  const vistos = new Set<number>();
  const pendientes: mupdf.PDFObject[] = [raiz];
  let nodos = 0;

  while (pendientes.length > 0 && nodos < 20000) {
    const nodo = pendientes.pop();
    if (nodo === undefined || nodo.isNull()) continue;
    nodos++;
    if (nodo.isIndirect()) {
      const numero = nodo.asIndirect();
      if (vistos.has(numero)) continue;
      vistos.add(numero);
    }
    if (nodo.isArray()) {
      nodo.forEach((hijo) => pendientes.push(hijo));
      continue;
    }
    if (!nodo.isDictionary()) continue;

    for (const clave of CLAVES_TEXTO_ESTRUCTURA) {
      const valor = nodo.get(clave);
      if (valor.isNull()) continue;
      if (valor.isString()) textos.push(valor.asString());
      if (accion === 'borrar') nodo.delete(clave);
    }
    pendientes.push(nodo.get('K'));
  }
  return textos;
}

/**
 * Segunda pasada del guardado: reabre los bytes y compacta con `garbage: 4` SIN tocar ni un
 * objeto. No es una manía: `garbage >= 2` renumera, y hacerlo en la MISMA pasada en la que se han
 * resuelto todos los objetos (que es justo lo que hace `barrerClavesOcultas`) le hace perder a
 * mupdf el flujo de la imagen redactada. Medido en la matriz completa sobre una nómina escaneada:
 *
 *   garbage:1 · objetos resueltos   ->  16.238 bytes, 2.402 píxeles de tinta   (bien)
 *   garbage:2 · objetos resueltos   ->   3.711 bytes, 1.776 píxeles de tinta   (solo la barra)
 *   garbage:4 · SIN resolver        ->  16.108 bytes, 2.402 píxeles de tinta   (bien)
 *
 * Es decir: el escaneo del cliente desaparecía del archivo entregado. En dos pasadas se conservan
 * las dos propiedades — el barrido de claves ocultas Y la recolección completa de huérfanos.
 */
function compactar(bytes: Uint8Array): Uint8Array {
  const doc = new mupdf.PDFDocument(bytes.slice());
  try {
    return doc.saveToBuffer({ garbage: 4, compress: true }).asUint8Array().slice();
  } finally {
    doc.destroy();
  }
}

/** Igual que el barrido, pero sin tocar nada: se usa para comprobar que el borrado se aplico. */
function tieneClavesOcultas(doc: mupdf.PDFDocument): boolean {
  const root = doc.getTrailer().get('Root');
  for (const clave of CLAVES_RAIZ_CON_TEXTO) {
    if (!root.get(clave).isNull()) return true;
  }
  const names = root.get('Names');
  if (!names.isNull()) {
    for (const clave of CLAVES_NAMES_CON_TEXTO) {
      if (!names.get(clave).isNull()) return true;
    }
  }
  const total = doc.countObjects();
  for (let num = 1; num < total; num++) {
    const obj = doc.newIndirect(num).resolve();
    if (!obj.isDictionary()) continue;
    for (const clave of CLAVES_OCULTAS) {
      if (!obj.get(clave).isNull()) return true;
    }
    const tipo = obj.get('Type').asName();
    if (tipo === 'Page') {
      let privada = false;
      obj.forEach((_valor, clave) => {
        if (typeof clave === 'string' && !CLAVES_PAGINA_ESTANDAR.has(clave)) privada = true;
      });
      if (privada) return true;
    }
    // El nombre de la capa no se borra, se sustituye: lo que se comprueba es que el que quedo
    // sea el neutro. Un `/Name` que no empiece por la etiqueta es el original, sin tocar.
    if (tipo === 'OCG') {
      const nombre = obj.get('Name');
      if (nombre.isString() && !nombre.asString().startsWith(`${NOMBRE_DE_CAPA} `)) return true;
    }
  }
  return false;
}

/**
 * ¿Queda algun adjunto DE VERDAD? `getEmbeddedFiles()` solo mira el arbol `/Names`, y por eso el
 * inventario declaraba «eliminado del archivo» mientras el fichero adjunto seguia entero dentro,
 * sujeto por el `/AF` del catalogo. Se comprueba tambien que no sobreviva ningun Filespec con su
 * flujo `/EF`, que es donde vive el contenido.
 */
function quedanAdjuntos(doc: mupdf.PDFDocument): boolean {
  if (Object.keys(doc.getEmbeddedFiles()).length > 0) return true;
  const total = doc.countObjects();
  for (let num = 1; num < total; num++) {
    const obj = doc.newIndirect(num).resolve();
    if (!obj.isDictionary()) continue;
    if (obj.get('Type').asName() !== 'Filespec') continue;
    if (!obj.get('EF').isNull()) return true;
  }
  return false;
}

function documentHasXmp(doc: mupdf.PDFDocument): boolean {
  const root = doc.getTrailer().get('Root');
  if (!root.get('Metadata').isNull()) return true;
  return pagesOf(doc).some((page) => !page.get('Metadata').isNull());
}

/**
 * Elimina Info, XMP (documento y página), adjuntos, anotaciones y AcroForm,
 * y reserializa con garbage collection real de mupdf para que los objetos
 * huérfanos no queden recuperables en los bytes finales. `removed` se deriva
 * de releer el binario ya guardado, nunca de la intención de borrado.
 */
export async function stripMetadata(
  bytes: Uint8Array,
): Promise<{ bytes: Uint8Array; removed: string[]; objetos: InventarioObjetos }> {
  const doc = new mupdf.PDFDocument(bytes.slice());
  let cleaned: Uint8Array;
  let infoKeys: string[];
  let hadXmp: boolean;
  let hadAnnotations = false;
  let hadFormFields = false;
  let hadAttachments = false;
  let hadOutlines = false;
  let hadStructText = false;
  let hadHiddenKeys = false;

  try {
    const trailer = doc.getTrailer();
    const root = trailer.get('Root');

    const info = trailer.get('Info');
    infoKeys = [];
    if (!info.isNull()) {
      info.forEach((_value, key) => {
        if (typeof key === 'string') infoKeys.push(key);
      });
      // mupdf reconstruye la entrada /Info del trailer al guardar a partir de su
      // info_obj interno, así que borrar la referencia en el trailer no basta:
      // hay que vaciar las claves del propio diccionario Info.
      for (const key of infoKeys) info.delete(key);
    }

    hadXmp = documentHasXmp(doc);
    if (!root.get('Metadata').isNull()) root.delete('Metadata');
    for (const page of pagesOf(doc)) {
      if (!page.get('Metadata').isNull()) page.delete('Metadata');
    }

    for (const page of pagesOf(doc)) {
      if (!page.get('Annots').isNull()) {
        page.delete('Annots');
        hadAnnotations = true;
      }
    }

    const acroForm = root.get('AcroForm');
    if (!acroForm.isNull()) {
      const fields = acroForm.get('Fields');
      if (!fields.isNull() && fields.length > 0) hadFormFields = true;
      root.delete('AcroForm');
    }

    const attachmentNames = Object.keys(doc.getEmbeddedFiles());
    if (attachmentNames.length > 0) {
      hadAttachments = true;
      for (const name of attachmentNames) doc.deleteEmbeddedFile(name);
    }
    const names = root.get('Names');
    if (!names.isNull()) {
      if (!names.get('EmbeddedFiles').isNull()) names.delete('EmbeddedFiles');
      let hasOtherKeys = false;
      names.forEach(() => {
        hasOtherKeys = true;
      });
      if (!hasOtherKeys) root.delete('Names');
    }

    // Marcadores del documento (el indice lateral). Sobrevivian al tachado enteros: el texto de
    // un marcador no sale en `extractAllText()`, asi que ni se detectaba ni se reencontraba, y
    // el informe lo firmaba en verde. Se van con el resto de los metadatos.
    hadOutlines = !root.get('Outlines').isNull();
    if (hadOutlines) {
      root.delete('Outlines');
      // Sin marcadores, un visor que abra el panel del indice por `/PageMode /UseOutlines`
      // enseñaria un panel vacio. Se quita el modo, no el documento.
      if (root.get('PageMode').asName() === 'UseOutlines') root.delete('PageMode');
    }

    // Texto alternativo del arbol de estructura. Se pierde la descripcion de accesibilidad de
    // las imagenes, y eso es un coste real; pero es el sitio donde Word deja el «texto
    // alternativo» que el usuario escribio, y ahi es donde acaba el pie de una imagen escaneada.
    // Un texto que ningun lector enseña y que la guarda no releia es un escondite, no una
    // funcionalidad. Consta como categoria propia en el informe.
    hadStructText = recorrerArbolDeEstructura(doc, 'borrar').length > 0;

    const habiaEnLaRaiz = barrerClavesDeLaRaiz(root);
    hadHiddenKeys = barrerClavesOcultas(doc) || habiaEnLaRaiz;

    // Ver `compactar`: la recoleccion completa va en una SEGUNDA pasada, sobre un documento en el
    // que nadie ha resuelto objetos. Guardar aqui con `garbage: 4` borraba el escaneo del cliente.
    cleaned = doc.saveToBuffer({ garbage: 1, compress: true }).asUint8Array().slice();
  } finally {
    doc.destroy();
  }
  cleaned = compactar(cleaned);

  const removed: string[] = [];
  let objetos: InventarioObjetos;
  const finalDoc = new mupdf.PDFDocument(cleaned.slice());
  try {
    const finalTrailer = finalDoc.getTrailer();
    const finalInfo = finalTrailer.get('Info');
    for (const label of INFO_LABELS) {
      if (!infoKeys.includes(label)) continue;
      const stillPresent = !finalInfo.isNull() && !finalInfo.get(label).isNull();
      if (!stillPresent) removed.push(label);
    }

    if (hadXmp && !documentHasXmp(finalDoc)) {
      removed.push('XMP');
    }

    if (hadAnnotations) {
      const stillHasAnnots = pagesOf(finalDoc).some((page) => !page.get('Annots').isNull());
      if (!stillHasAnnots) removed.push('annotations');
    }

    if (hadAttachments) {
      const stillHasAttachments = quedanAdjuntos(finalDoc);
      if (!stillHasAttachments) removed.push('attachments');
    }

    if (hadFormFields) {
      const stillHasAcroForm = !finalTrailer.get('Root').get('AcroForm').isNull();
      if (!stillHasAcroForm) removed.push('formFields');
    }

    if (hadOutlines && finalTrailer.get('Root').get('Outlines').isNull()) {
      removed.push('outlines');
    }

    // Inventario para el informe. `removed` solo sabe de SEIS etiquetas de Info, asi que un PDF
    // con una clave propia (`/Cliente`) se borraba y el informe declaraba «Metadatos eliminados:
    // Ninguno»: infra-declaraba lo que habia hecho. El inventario mira si quedo alguna clave.
    let quedanClavesInfo = false;
    if (!finalInfo.isNull()) {
      finalInfo.forEach(() => {
        quedanClavesInfo = true;
      });
    }
    objetos = {
      info: estadoTras(infoKeys.length > 0, quedanClavesInfo),
      xmp: estadoTras(hadXmp, documentHasXmp(finalDoc)),
      anotaciones: estadoTras(
        hadAnnotations,
        pagesOf(finalDoc).some((page) => !page.get('Annots').isNull()),
      ),
      formularios: estadoTras(hadFormFields, !finalTrailer.get('Root').get('AcroForm').isNull()),
      adjuntos: estadoTras(hadAttachments, quedanAdjuntos(finalDoc)),
      // Se mira el ARBOL, no los titulos: un indice que sobreviva sin `/Title` legible sigue
      // siendo un objeto no examinado, y tiene que degradar el sello igual.
      marcadores: estadoTras(
        hadOutlines,
        !finalTrailer.get('Root').get('Outlines').isNull(),
      ),
      alternativos: estadoTras(
        hadStructText,
        recorrerArbolDeEstructura(finalDoc, 'leer').length > 0,
      ),
      ocultos: estadoTras(hadHiddenKeys, tieneClavesOcultas(finalDoc)),
    };
  } finally {
    finalDoc.destroy();
  }

  return { bytes: cleaned, removed, objetos };
}

/**
 * Devuelve, releyendo el PDF final, todas las cadenas de metadatos
 * rastreables: cada clave del Info dict (también las no estándar), el
 * texto XMP de documento y de página, los nombres de los adjuntos y los
 * títulos de los marcadores.
 * Se usa para la verificación ampliada anti-falso-verde.
 *
 * Los marcadores están AQUÍ además de borrarse en `stripMetadata` a propósito: el borrado es la
 * acción y esto es la red. Si un día el borrado falla, o un PDF trae un índice que mupdf no
 * reescribe como esperamos, el dato reaparece en esta lista y el informe sale bloqueado en vez
 * de en verde. Una acción sin su comprobación es exactamente lo que produce un falso verde.
 */
export async function extractMetadataStrings(bytes: Uint8Array): Promise<string[]> {
  const doc = new mupdf.PDFDocument(bytes.slice());
  try {
    const strings: string[] = [];

    const info = doc.getTrailer().get('Info');
    if (!info.isNull()) {
      info.forEach((value) => {
        if (value.isString()) strings.push(value.asString());
      });
    }

    const root = doc.getTrailer().get('Root');
    const docMeta = root.get('Metadata');
    if (!docMeta.isNull() && docMeta.isStream()) {
      strings.push(docMeta.readStream().asString());
    }

    for (const page of pagesOf(doc)) {
      const pageMeta = page.get('Metadata');
      if (!pageMeta.isNull() && pageMeta.isStream()) {
        strings.push(pageMeta.readStream().asString());
      }
    }

    for (const name of Object.keys(doc.getEmbeddedFiles())) {
      strings.push(name);
    }

    strings.push(...outlineTitles(doc));
    strings.push(...recorrerArbolDeEstructura(doc, 'leer'));

    // XMP alla donde este, no solo en `/Root` y en las paginas: el paquete colgado de un
    // XObject era invisible para las dos lecturas de arriba.
    //
    // Y, sobre todo, TODA cadena de todo objeto. Lo de arriba son lecturas dirigidas a sitios
    // concretos, que es exactamente como se fabrica un escondite: basta con elegir el sitio
    // numero once. Esta pasada no elige sitio. Si un dato sobrevive en cualquier clave de
    // cualquier objeto, `verifyRedaction` lo reencuentra y el informe sale BLOQUEADO en vez de
    // firmado en verde — que es la unica conducta correcta cuando el dato sigue en el fichero.
    const total = doc.countObjects();
    for (let num = 1; num < total; num++) {
      const obj = doc.newIndirect(num).resolve();
      if (!obj.isDictionary()) continue;
      const meta = obj.get('Metadata');
      if (!meta.isNull() && meta.isStream()) strings.push(meta.readStream().asString());
      cadenasDelObjeto(obj, strings);
    }

    return strings;
  } finally {
    doc.destroy();
  }
}
