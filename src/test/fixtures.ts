import * as mupdf from 'mupdf';
import { PDFDocument, PDFName, PDFString, StandardFonts, rgb } from 'pdf-lib';

const PAGE_SIZE: [number, number] = [595, 842];

/**
 * Una NOMINA ESCANEADA de verdad: se dibuja una pagina de texto, se rasteriza, se comprime en
 * JPEG y se incrusta como imagen a pagina completa. Es el caso de uso numero uno del comprador y
 * el unico que produce en el archivo un flujo de imagen grande — que es donde aparecio el
 * defecto que `escaneo-conservado.test.ts` vigila.
 */
export async function pdfEscaneadoJpeg(lineas: string[]): Promise<Uint8Array> {
  const origen = await PDFDocument.create();
  const paginaOrigen = origen.addPage(PAGE_SIZE);
  const fuente = await origen.embedFont(StandardFonts.Helvetica);
  lineas.forEach((linea, i) => {
    paginaOrigen.drawText(linea, { x: 60, y: 760 - i * 50, size: 20, font: fuente });
  });
  const doc = new mupdf.PDFDocument(await origen.save());
  const pixmap = doc.loadPage(0).toPixmap(mupdf.Matrix.identity, mupdf.ColorSpace.DeviceRGB, false);
  const jpeg = pixmap.asJPEG(85, false);
  doc.destroy();

  const salida = await PDFDocument.create();
  const pagina = salida.addPage(PAGE_SIZE);
  pagina.drawImage(await salida.embedJpg(jpeg), {
    x: 0,
    y: 0,
    width: PAGE_SIZE[0],
    height: PAGE_SIZE[1],
  });
  return salida.save();
}

/**
 * Pixeles oscuros de una franja de la pagina. Contar bloques de imagen no vale: un `onImageBlock`
 * sigue apareciendo aunque la imagen ya no se pueda decodificar. Lo que hay que mirar es si en el
 * papel queda algo dibujado.
 */
export function tintaEnFranja(
  bytes: Uint8Array,
  pagina: number,
  desdeY: number,
  hastaY: number,
): number {
  const doc = new mupdf.PDFDocument(bytes.slice());
  try {
    const pixmap = doc
      .loadPage(pagina)
      .toPixmap(mupdf.Matrix.identity, mupdf.ColorSpace.DeviceRGB, false);
    const ancho = pixmap.getWidth();
    const pixeles = pixmap.getPixels();
    let oscuros = 0;
    for (let y = Math.max(0, desdeY); y < Math.min(pixmap.getHeight(), hastaY); y++) {
      for (let x = 0; x < ancho; x++) {
        if ((pixeles[(y * ancho + x) * 3] ?? 255) < 200) oscuros++;
      }
    }
    return oscuros;
  } finally {
    doc.destroy();
  }
}

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

/**
 * PDF con los escondites que el mapa de falsos verdes confirmo alcanzables: XMP colgado de un
 * XObject (no del documento ni de la pagina), miniatura de pagina, datos privados de aplicacion
 * y texto alternativo del arbol de estructura. Word y LibreOffice generan los tres ultimos solos.
 * El mismo dato se planta en los cuatro para poder comprobar los cuatro de una pasada.
 */
export async function pdfConEscondites(dato: string): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const page = doc.addPage(PAGE_SIZE);
  page.drawText('Documento con escondites.', { x: 50, y: 780, size: 14, font });

  const xmp = doc.context.stream(
    `<?xpacket begin=""?><x:xmpmeta xmlns:x="adobe:ns:meta/">${dato}</x:xmpmeta><?xpacket end="w"?>`,
    { Type: 'Metadata', Subtype: 'XML' },
  );
  const xmpRef = doc.context.register(xmp);
  const form = doc.context.stream('', {
    Type: 'XObject',
    Subtype: 'Form',
    BBox: [0, 0, 10, 10],
  });
  form.dict.set(PDFName.of('Metadata'), xmpRef);
  page.node.setXObject(PDFName.of('Oculto'), doc.context.register(form));

  const thumb = doc.context.stream(`miniatura ${dato}`, {
    Type: 'XObject',
    Subtype: 'Image',
    Width: 1,
    Height: 1,
    ColorSpace: 'DeviceGray',
    BitsPerComponent: 8,
  });
  page.node.set(PDFName.of('Thumb'), doc.context.register(thumb));

  page.node.set(
    PDFName.of('PieceInfo'),
    doc.context.obj({
      MiAplicacion: { LastModified: PDFString.of('D:20260101000000Z'), Private: PDFString.of(dato) },
    }),
  );

  const elemRef = doc.context.nextRef();
  const structRef = doc.context.nextRef();
  doc.context.assign(
    elemRef,
    doc.context.obj({ Type: 'StructElem', S: 'Figure', P: structRef, Alt: PDFString.of(dato) }),
  );
  doc.context.assign(
    structRef,
    doc.context.obj({ Type: 'StructTreeRoot', K: elemRef }),
  );
  doc.catalog.set(PDFName.of('StructTreeRoot'), structRef);
  doc.catalog.set(PDFName.of('MarkInfo'), doc.context.obj({ Marked: true }));

  return doc.save();
}

/**
 * Un DNI partido por un salto de linea, como lo parte una celda estrecha de tabla. El detector no
 * lo ve, y `searchText` TAMPOCO lo encuentra: no se puede ofrecer una caja automatica para el.
 * Devuelve tambien el rectangulo que cubre los dos fragmentos, para poder tacharlo a mano.
 */
export async function pdfDniEnDosLineas(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const page = doc.addPage(PAGE_SIZE);
  page.drawText('DNI del titular:', { x: 50, y: 780, size: 11, font });
  page.drawText('1234', { x: 50, y: 764, size: 11, font });
  page.drawText('5678Z', { x: 50, y: 750, size: 11, font });
  return doc.save();
}

/** Tabla de importes en dos lineas: juntarlas fabrica nueve digitos seguidos. Es el caso que
 *  obliga a NO meter el telefono en el barrido de saltos de linea. */
export async function pdfImportesEnDosLineas(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const page = doc.addPage(PAGE_SIZE);
  page.drawText('7500', { x: 50, y: 780, size: 11, font });
  page.drawText('43210', { x: 50, y: 764, size: 11, font });
  return doc.save();
}

// PNG de 1x1 gris, valido y minimo. Se escala para ocupar la fraccion de pagina que pida el test.
const PNG_1X1 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

/**
 * Pagina CON capa de texto y una imagen que cubre `fraccion` del area. Por debajo de
 * IMAGE_COVERAGE_THRESHOLD (0,6) el informe no decia absolutamente nada: una foto de un DNI
 * pegada en un acta pasaba muda.
 */
export async function pdfConImagen(fraccion: number): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const page = doc.addPage(PAGE_SIZE);
  page.drawText('Acta de la junta ordinaria.', { x: 50, y: 800, size: 12, font });
  const imagen = await doc.embedPng(PNG_1X1);
  const lado = Math.sqrt(fraccion * PAGE_SIZE[0] * PAGE_SIZE[1]);
  page.drawImage(imagen, { x: 40, y: 100, width: lado, height: lado });
  return doc.save();
}
