import { PDFArray, PDFDict, PDFDocument, PDFName } from 'pdf-lib';

const INFO_LABELS = ['Title', 'Author', 'Subject', 'Keywords', 'Producer', 'Creator'] as const;

export async function stripMetadata(
  bytes: Uint8Array,
): Promise<{ bytes: Uint8Array; removed: string[] }> {
  const doc = await PDFDocument.load(bytes.slice(), { updateMetadata: false });
  const removed: string[] = [];

  const infoDict = doc.context.lookupMaybe(doc.context.trailerInfo.Info, PDFDict);
  if (infoDict) {
    for (const label of INFO_LABELS) {
      const name = PDFName.of(label);
      if (infoDict.has(name)) {
        infoDict.delete(name);
        removed.push(label);
      }
    }
  }

  const catalog = doc.catalog;

  const metadataName = PDFName.of('Metadata');
  if (catalog.has(metadataName)) {
    catalog.delete(metadataName);
    removed.push('XMP');
  }

  const annotsName = PDFName.of('Annots');
  let anyAnnotations = false;
  for (const page of doc.getPages()) {
    if (page.node.has(annotsName)) {
      page.node.delete(annotsName);
      anyAnnotations = true;
    }
  }
  if (anyAnnotations) removed.push('annotations');

  const namesName = PDFName.of('Names');
  const embeddedFilesName = PDFName.of('EmbeddedFiles');
  const namesDict = catalog.lookupMaybe(namesName, PDFDict);
  if (namesDict?.has(embeddedFilesName)) {
    namesDict.delete(embeddedFilesName);
    removed.push('attachments');
    if (namesDict.keys().length === 0) {
      catalog.delete(namesName);
    }
  }

  const acroFormName = PDFName.of('AcroForm');
  const acroForm = catalog.lookupMaybe(acroFormName, PDFDict);
  if (acroForm) {
    const fields = acroForm.lookupMaybe(PDFName.of('Fields'), PDFArray);
    if (fields && fields.size() > 0) {
      removed.push('formFields');
    }
    catalog.delete(acroFormName);
  }

  const cleaned = await doc.save({ updateFieldAppearances: false });
  return { bytes: cleaned, removed };
}
