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

    cleaned = doc.saveToBuffer({ garbage: 4, compress: true }).asUint8Array().slice();
  } finally {
    doc.destroy();
  }

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
      const stillHasAttachments = Object.keys(finalDoc.getEmbeddedFiles()).length > 0;
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
      adjuntos: estadoTras(hadAttachments, Object.keys(finalDoc.getEmbeddedFiles()).length > 0),
      // Se mira el ARBOL, no los titulos: un indice que sobreviva sin `/Title` legible sigue
      // siendo un objeto no examinado, y tiene que degradar el sello igual.
      marcadores: estadoTras(
        hadOutlines,
        !finalTrailer.get('Root').get('Outlines').isNull(),
      ),
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

    return strings;
  } finally {
    doc.destroy();
  }
}
