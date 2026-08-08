import { PDFDocument, PDFName, PDFString, StandardFonts, rgb } from 'pdf-lib';

const PAGE_SIZE: [number, number] = [595, 842];

export async function pdfConTexto(texto: string): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage(PAGE_SIZE);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  page.drawText(texto, { x: 50, y: 780, size: 14, font });
  return doc.save();
}

export async function pdfDniFragmentado(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage(PAGE_SIZE);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const size = 14;

  const dibujarFragmentado = (fragmentos: string[], x0: number, y: number): void => {
    let x = x0;
    for (const fragmento of fragmentos) {
      page.drawText(fragmento, { x, y, size, font });
      x += font.widthOfTextAtSize(fragmento, size);
    }
  };

  dibujarFragmentado(['D', 'N', 'I', ' ', '123', '45', '678', 'Z'], 50, 780);
  dibujarFragmentado(['12.', '345.', '678-', 'Z'], 50, 750);

  return doc.save();
}

/**
 * PDF con marcadores (el indice lateral). Word y LibreOffice los generan solos a partir de los
 * titulos del documento, asi que un titulo del tipo «Nomina de Fulanito - 12345678Z» acaba ahi
 * sin que nadie lo escriba a mano. El texto de la pagina y el del marcador se dan por separado
 * para poder tachar uno y comprobar que el otro tambien desaparece.
 */
export async function pdfConMarcadores(
  titulos: string[],
  textoPagina = 'Documento de prueba.',
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const page = doc.addPage(PAGE_SIZE);
  page.drawText(textoPagina, { x: 50, y: 780, size: 14, font });

  const outlinesRef = doc.context.nextRef();
  const refs = titulos.map(() => doc.context.nextRef());
  titulos.forEach((titulo, i) => {
    const item = doc.context.obj({
      Title: PDFString.of(titulo),
      Parent: outlinesRef,
      Dest: [page.ref, PDFName.of('Fit')],
    });
    const anterior = refs[i - 1];
    const siguiente = refs[i + 1];
    if (anterior !== undefined) item.set(PDFName.of('Prev'), anterior);
    if (siguiente !== undefined) item.set(PDFName.of('Next'), siguiente);
    const ref = refs[i];
    if (ref !== undefined) doc.context.assign(ref, item);
  });
  doc.context.assign(
    outlinesRef,
    doc.context.obj({
      Type: 'Outlines',
      First: refs[0],
      Last: refs[refs.length - 1],
      Count: titulos.length,
    }),
  );
  doc.catalog.set(PDFName.of('Outlines'), outlinesRef);
  return doc.save();
}

export async function pdfConMetadatos(meta: {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string;
  producer?: string;
  creator?: string;
}): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.addPage(PAGE_SIZE);
  if (meta.title !== undefined) doc.setTitle(meta.title);
  if (meta.author !== undefined) doc.setAuthor(meta.author);
  if (meta.subject !== undefined) doc.setSubject(meta.subject);
  if (meta.keywords !== undefined) doc.setKeywords([meta.keywords]);
  if (meta.producer !== undefined) doc.setProducer(meta.producer);
  if (meta.creator !== undefined) doc.setCreator(meta.creator);
  return doc.save();
}

export async function pdfSoloImagen(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage(PAGE_SIZE);
  page.drawRectangle({
    x: 40,
    y: 700,
    width: 500,
    height: 100,
    color: rgb(0.2, 0.2, 0.2),
  });
  return doc.save();
}

export async function pdfMultiPagina(textos: string[]): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (const texto of textos) {
    const page = doc.addPage(PAGE_SIZE);
    page.drawText(texto, { x: 50, y: 780, size: 14, font });
  }
  return doc.save();
}

export async function inyectarResiduo(base: Uint8Array, residuo: string): Promise<Uint8Array> {
  const doc = await PDFDocument.load(base);
  const paginas = doc.getPages();
  const page = paginas[paginas.length - 1] ?? doc.addPage(PAGE_SIZE);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  page.drawText(residuo, { x: 50, y: 20, size: 10, font });
  return doc.save();
}
