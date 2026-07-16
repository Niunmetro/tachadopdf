import { PDFDict, PDFDocument, PDFName } from 'pdf-lib';
import { describe, expect, it } from 'vitest';
import { pdfConMetadatos, pdfConTexto } from '../test/fixtures';
import { stripMetadata } from './metadata';

async function pdfConAnotacionYAdjuntoYFormulario(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595, 842]);

  const annotDict = doc.context.obj({
    Type: 'Annot',
    Subtype: 'Text',
    Rect: [0, 0, 10, 10],
    Contents: 'nota residual',
  });
  const annotRef = doc.context.register(annotDict);
  page.node.addAnnot(annotRef);

  const xmpXml =
    '<?xpacket begin="" id="W5M0MpCehiHzreSzNTczkc9d"?>' +
    '<x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" /></x:xmpmeta>' +
    '<?xpacket end="w"?>';
  const metadataStream = doc.context.stream(xmpXml, {
    Type: 'Metadata',
    Subtype: 'XML',
  });
  const metadataRef = doc.context.register(metadataStream);
  doc.catalog.set(PDFName.of('Metadata'), metadataRef);

  await doc.attach(new TextEncoder().encode('contenido adjunto'), 'nota.txt', {
    mimeType: 'text/plain',
  });

  const form = doc.getForm();
  const field = form.createTextField('nombre');
  field.addToPage(page);

  return doc.save();
}

describe('stripMetadata', () => {
  it('elimina Title, Author, Subject, Keywords, Producer y Creator, y los lista en removed', async () => {
    const original = await pdfConMetadatos({
      title: 'Contrato confidencial',
      author: 'Ángel',
      subject: 'RRHH',
      keywords: 'nomina',
      producer: 'ProductorX',
      creator: 'CreadorY',
    });

    const { bytes, removed } = await stripMetadata(original);
    const doc = await PDFDocument.load(bytes, { updateMetadata: false });

    expect(doc.getTitle()).toBeUndefined();
    expect(doc.getAuthor()).toBeUndefined();
    expect(doc.getSubject()).toBeUndefined();
    expect(doc.getKeywords()).toBeUndefined();
    expect(doc.getProducer()).toBeUndefined();
    expect(doc.getCreator()).toBeUndefined();

    for (const etiqueta of ['Title', 'Author', 'Subject', 'Keywords', 'Producer', 'Creator']) {
      expect(removed).toContain(etiqueta);
    }
  });

  it('no lista categorías de metadatos que no existían en el original', async () => {
    const original = await pdfConTexto('sin metadatos');
    const { removed } = await stripMetadata(original);

    for (const etiqueta of ['Title', 'Author', 'Subject', 'Keywords']) {
      expect(removed).not.toContain(etiqueta);
    }
  });

  it('elimina anotaciones, XMP, adjuntos y campos de formulario, y los lista en removed', async () => {
    const original = await pdfConAnotacionYAdjuntoYFormulario();
    const { bytes, removed } = await stripMetadata(original);

    expect(removed).toContain('annotations');
    expect(removed).toContain('XMP');
    expect(removed).toContain('attachments');
    expect(removed).toContain('formFields');

    const doc = await PDFDocument.load(bytes, { updateMetadata: false });
    const page = doc.getPage(0);
    expect(page.node.has(PDFName.of('Annots'))).toBe(false);
    expect(doc.catalog.has(PDFName.of('Metadata'))).toBe(false);
    expect(doc.catalog.has(PDFName.of('AcroForm'))).toBe(false);

    const names = doc.catalog.lookupMaybe(PDFName.of('Names'), PDFDict);
    if (names) {
      expect(names.has(PDFName.of('EmbeddedFiles'))).toBe(false);
    }
  });

  it('es pura: no muta el Uint8Array de entrada', async () => {
    const original = await pdfConMetadatos({ title: 'Título original' });
    const copia = original.slice();

    await stripMetadata(original);

    expect(original).toEqual(copia);
  });

  it('devuelve unos bytes distintos que siguen siendo un PDF válido cargable', async () => {
    const original = await pdfConTexto('contenido de prueba');
    const { bytes } = await stripMetadata(original);

    const doc = await PDFDocument.load(bytes, { updateMetadata: false });
    expect(doc.getPageCount()).toBe(1);
  });
});
