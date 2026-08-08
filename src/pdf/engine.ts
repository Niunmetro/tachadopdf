import * as mupdf from 'mupdf';
import type { BoxRect, PageMark } from '../types';

export class PdfPasswordError extends Error {
  constructor(message = 'Contraseña de PDF incorrecta o ausente') {
    super(message);
    this.name = 'PdfPasswordError';
  }
}

function quadToBoxRect(quad: mupdf.Quad): BoxRect {
  const xs = [quad[0], quad[2], quad[4], quad[6]];
  const ys = [quad[1], quad[3], quad[5], quad[7]];
  const x0 = Math.min(...xs);
  const y0 = Math.min(...ys);
  const x1 = Math.max(...xs);
  const y1 = Math.max(...ys);
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

function rectFromBounds([x0, y0, x1, y1]: mupdf.Rect): BoxRect {
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

function rectsIntersect(a: BoxRect, b: BoxRect): boolean {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
}

function rectArea(rect: BoxRect): number {
  return Math.max(0, rect.w) * Math.max(0, rect.h);
}

/**
 * Fracción del área de la página que una imagen debe cubrir para que la página
 * se marque como "necesita revisión visual" (A7). Una foto o escaneo incrustado
 * como imagen a página completa puede ocultar datos que el detector de texto no
 * ve nunca, así que se avisa aunque la página sí tenga capa de texto.
 */
export const IMAGE_COVERAGE_THRESHOLD = 0.6;

/**
 * Glifos SEGUIDOS que hacen falta para que un texto ilegible cuente. No es una cifra al gusto:
 * el dato mas corto que busca esta herramienta son seis caracteres (`a@b.co`), asi que en una
 * racha mas corta no cabe ninguno de los formatos declarados. Cuatro deja margen.
 */
export const MIN_RACHA_ILEGIBLE = 4;

/**
 * Un glifo dibujado del que no se puede recuperar el caracter: sin unicode, sustituido, o en una
 * zona de uso privado (que es donde acaba un `/ToUnicode` que miente, y una fuente subconjunto
 * mal generada).
 */
function esIlegible(unicode: number): boolean {
  if (unicode <= 0 || unicode === 0xfffd) return true;
  if (unicode >= 0xe000 && unicode <= 0xf8ff) return true;
  return unicode >= 0xf0000;
}

export class PdfDoc {
  private readonly doc: mupdf.PDFDocument;
  private closed = false;

  constructor(doc: mupdf.PDFDocument) {
    this.doc = doc;
  }

  /**
   * Enciende TODAS las capas opcionales del documento antes de leerlo, y devuelve cuantas
   * estaban apagadas.
   *
   * Una capa apagada (`/OCProperties /D /OFF`) es contenido que esta DIBUJADO en la pagina y que
   * `extractText` no devuelve: ni el detector ofrecia caja para el, ni la guarda podia
   * reencontrarlo, y en Acrobat se ve con un clic en el panel de capas. Era un falso verde con el
   * dato en el contenido de la pagina, no en un metadato oscuro.
   *
   * Encenderlas aqui arregla las tres mitades de una vez: se detecta, se tacha y se relee.
   *
   * Y NO cambia el archivo que se entrega: comprobado que `setLayerVisible` es estado de lectura
   * de mupdf y que el `/OFF` sigue en los bytes guardados, asi que el documento se sigue viendo
   * como su autor lo dejo. Lo unico que cambia es la vista previa del editor, que ahora enseña lo
   * que el fichero lleva dentro — que es justo lo que hay que poder tachar.
   */
  revealHiddenLayers(): number {
    const total = this.doc.countLayers();
    let ocultas = 0;
    for (let i = 0; i < total; i++) {
      if (this.doc.isLayerVisible(i)) continue;
      ocultas++;
      this.doc.setLayerVisible(i, true);
    }
    return ocultas;
  }

  private page(index: number): mupdf.PDFPage {
    return this.doc.loadPage(index);
  }

  pageCount(): number {
    return this.doc.countPages();
  }

  extractText(page: number): string {
    return this.page(page).toStructuredText().asText();
  }

  extractAllText(): string[] {
    const total = this.pageCount();
    const result: string[] = [];
    for (let i = 0; i < total; i++) {
      result.push(this.extractText(i));
    }
    return result;
  }

  searchText(page: number, needle: string): BoxRect[] {
    const matches = this.page(page).search(needle);
    const boxes: BoxRect[] = [];
    for (const match of matches) {
      for (const quad of match) {
        boxes.push(quadToBoxRect(quad));
      }
    }
    return boxes;
  }

  pageHasTextLayer(page: number): boolean {
    return this.extractText(page).trim().length > 0;
  }

  scannedPages(): number[] {
    const total = this.pageCount();
    const result: number[] = [];
    for (let i = 0; i < total; i++) {
      if (!this.pageHasTextLayer(i)) {
        result.push(i);
      }
    }
    return result;
  }

  extractTextInRect(page: number, rect: BoxRect): string {
    if (rect.w <= 0 || rect.h <= 0) {
      return '';
    }
    const structured = this.page(page).toStructuredText();
    let text = '';
    structured.walk({
      onChar(c, _origin, _font, _size, quad) {
        if (rectsIntersect(rect, quadToBoxRect(quad))) {
          text += c;
        }
      },
    });
    return text;
  }

  /**
   * Páginas que necesitan revisión visual humana antes de dar el informe por
   * bueno: (a) sin capa de texto (igual que scannedPages, sin regresión) o
   * (b) con una o varias imágenes que cubren una fracción alta del área de la
   * página (>= IMAGE_COVERAGE_THRESHOLD), aunque sí tengan texto detectable.
   */
  pagesNeedingVisualReview(): number[] {
    const total = this.pageCount();
    const result: number[] = [];
    for (let i = 0; i < total; i++) {
      if (!this.pageHasTextLayer(i)) {
        result.push(i);
        continue;
      }
      const page = this.page(i);
      const pageArea = rectArea(rectFromBounds(page.getBounds()));
      if (pageArea <= 0) {
        continue;
      }
      const structured = page.toStructuredText('preserve-images');
      let imageArea = 0;
      structured.walk({
        onImageBlock(bbox) {
          imageArea += rectArea(rectFromBounds(bbox));
        },
      });
      if (imageArea / pageArea >= IMAGE_COVERAGE_THRESHOLD) {
        result.push(i);
      }
    }
    return result;
  }

  /**
   * Paginas que contienen al menos una imagen, SIN umbral.
   *
   * `pagesNeedingVisualReview` solo avisa a partir de IMAGE_COVERAGE_THRESHOLD, asi que una foto
   * al 59 % del area no producia ningun aviso: una foto de un DNI pegada en un acta pasaba muda.
   * Aqui no hay umbral a proposito — cualquier cifra seria igual de arbitraria —: el informe
   * enumera las paginas con imagenes y dice que su contenido visual no se comprueba.
   */
  pagesWithImages(): number[] {
    const total = this.pageCount();
    const result: number[] = [];
    for (let i = 0; i < total; i++) {
      let tieneImagen = false;
      this.page(i)
        .toStructuredText('preserve-images')
        .walk({
          onImageBlock() {
            tieneImagen = true;
          },
        });
      if (tieneImagen) result.push(i);
    }
    return result;
  }

  /**
   * Paginas en las que se DIBUJA texto que la herramienta no puede releer, con cuantos caracteres
   * son. Devuelve la cuenta por pagina, no una lista de paginas, porque en el informe la cifra es
   * la mitad del dato: «3 caracteres» y «180 caracteres» piden conductas distintas.
   *
   * El caso real: un PDF puede dibujar `12345678Z` y declarar a la vez, en su `/ToUnicode`, que
   * esos codigos significan otra cosa. Es el defecto mas comun del mundo PDF — el «copio de un
   * PDF y sale basura» — y no hace falta mala fe para producirlo. El humano lee lo que se dibuja;
   * el detector y la guarda leen lo que dice el `/ToUnicode`, asi que ese DNI no se detectaba, no
   * se tachaba, no se reencontraba, y el informe firmaba «TACHADO VERIFICADO» con el dato a
   * tamaño de titular en el archivo entregado.
   *
   * Medido sobre 2.125 paginas de PDF reales del disco: 13 dibujan texto y no extraen nada, y 11
   * pasan del 10 % de caracteres no mapeables. No es un caso de laboratorio.
   *
   * Se cuentan RACHAS de al menos `MIN_RACHA_ILEGIBLE` glifos seguidos, no glifos sueltos, y el
   * numero no es arbitrario: el dato mas corto que esta herramienta busca son seis caracteres
   * (`a@b.co`), asi que en una racha mas corta no cabe ninguno de los formatos declarados. Un
   * simbolo suelto de una fuente rara —una viñeta, una ligadura— no puede esconder nada y no
   * tiene por que degradar el sello de nadie. Medido: contando glifos sueltos se marcarian 27 de
   * 665 paginas reales; contando rachas de cuatro, 9.
   */
  pagesWithUnreadableText(): { page: number; caracteres: number }[] {
    const total = this.pageCount();
    const resultado: { page: number; caracteres: number }[] = [];
    for (let i = 0; i < total; i++) {
      let racha = 0;
      let ilegibles = 0;
      const contar = (text: mupdf.Text): void => {
        text.walk({
          showGlyph(_font, _trm, _gid, unicode) {
            if (!esIlegible(unicode)) {
              racha = 0;
              return;
            }
            racha++;
            // La racha se cuenta entera en cuanto alcanza el minimo, y luego glifo a glifo.
            if (racha === MIN_RACHA_ILEGIBLE) ilegibles += MIN_RACHA_ILEGIBLE;
            else if (racha > MIN_RACHA_ILEGIBLE) ilegibles++;
          },
        });
      };
      const dispositivo = new mupdf.Device({
        fillText: contar,
        strokeText: contar,
        clipText: contar,
        clipStrokeText: contar,
        // El texto invisible (modo 3) es justo donde vive la capa de OCR de un escaneo.
        ignoreText: contar,
      } as unknown as ConstructorParameters<typeof mupdf.Device>[0]);
      try {
        this.page(i).run(dispositivo, mupdf.Matrix.identity);
      } catch {
        // Una pagina que ni siquiera se puede recorrer no se puede declarar comprobada: cuenta
        // como texto no legible en vez de desaparecer del informe.
        ilegibles = Math.max(ilegibles, MIN_RACHA_ILEGIBLE);
      }
      dispositivo.close();
      if (ilegibles > 0) resultado.push({ page: i, caracteres: ilegibles });
    }
    return resultado;
  }

  applyRedactions(marks: PageMark[]): void {
    for (const mark of marks) {
      const page = this.page(mark.page);
      for (const rect of mark.rects) {
        const annot = page.createAnnotation('Redact');
        annot.setRect([rect.x, rect.y, rect.x + rect.w, rect.y + rect.h]);
      }
      // REMOVE_IF_COVERED (en vez de REMOVE_IF_TOUCHED): una caja de redacción
      // que solo TOCA un trazo vectorial (línea, borde de tabla) no debe borrar
      // ese trazo entero; sólo se elimina el arte vectorial que la caja cubre
      // por completo. Evita destruir maquetación que no contiene el dato a tachar.
      page.applyRedactions(
        true,
        mupdf.PDFPage.REDACT_IMAGE_PIXELS,
        mupdf.PDFPage.REDACT_LINE_ART_REMOVE_IF_COVERED,
        mupdf.PDFPage.REDACT_TEXT_REMOVE,
      );
    }
  }

  renderToPng(page: number, dpi: number): Uint8Array {
    const zoom = dpi / 72;
    const matrix = mupdf.Matrix.scale(zoom, zoom);
    const pixmap = this.page(page).toPixmap(matrix, mupdf.ColorSpace.DeviceRGB, false);
    return pixmap.asPNG();
  }

  save(): Uint8Array {
    return this.doc.saveToBuffer().asUint8Array();
  }

  close(): void {
    if (!this.closed) {
      this.doc.destroy();
      this.closed = true;
    }
  }
}

export async function loadPdf(bytes: Uint8Array, password?: string): Promise<PdfDoc> {
  const doc = new mupdf.PDFDocument(bytes);
  if (doc.needsPassword()) {
    if (password === undefined || !doc.authenticatePassword(password)) {
      throw new PdfPasswordError();
    }
  }
  const abierto = new PdfDoc(doc);
  // Todo el que abre un PDF en este producto lo abre para LEERLO ENTERO: el detector, la
  // verificacion posterior y el diagnostico gratuito. Una capa apagada es contenido dibujado que
  // no se extrae, asi que encenderla es parte de abrir, no una opcion.
  abierto.revealHiddenLayers();
  return abierto;
}
