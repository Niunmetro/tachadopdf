import * as mupdf from 'mupdf';

const INFO_LABELS = ['Title', 'Author', 'Subject', 'Keywords', 'Producer', 'Creator'] as const;

function pagesOf(doc: mupdf.PDFDocument): mupdf.PDFObject[] {
  const pages: mupdf.PDFObject[] = [];
  const total = doc.countPages();
  for (let i = 0; i < total; i++) pages.push(doc.findPage(i));
  return pages;
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
): Promise<{ bytes: Uint8Array; removed: string[] }> {
  const doc = new mupdf.PDFDocument(bytes.slice());
  let cleaned: Uint8Array;
  let infoKeys: string[];
  let hadXmp: boolean;
  let hadAnnotations = false;
  let hadFormFields = false;
  let hadAttachments = false;

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

    cleaned = doc.saveToBuffer({ garbage: 4, compress: true }).asUint8Array().slice();
  } finally {
    doc.destroy();
  }

  const removed: string[] = [];
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
  } finally {
    finalDoc.destroy();
  }

  return { bytes: cleaned, removed };
}

/**
 * Devuelve, releyendo el PDF final, todas las cadenas de metadatos
 * rastreables: cada clave del Info dict (también las no estándar), el
 * texto XMP de documento y de página, y los nombres de los adjuntos.
 * Se usa para la verificación ampliada anti-falso-verde.
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

    return strings;
  } finally {
    doc.destroy();
  }
}
