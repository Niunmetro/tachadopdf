import { buildReport, computeSha256 } from '../report/report';
import type { CopiaInforme } from '../content/tipos';
import { detect } from '../detect/patterns';
import type { BoxRect, PageMark, PatternKind, ReportData, VerifyResult } from '../types';
import { addBox } from '../ui/boxes';
import { loadPdf, type PdfDoc } from './engine';
import { extractMetadataStrings, stripMetadata } from './metadata';
import { verifyRedaction } from './verify';

// Los SIETE tipos que detect() reconoce. Faltaba 'catastro': el informe declaraba menos
// patrones buscados de los que de verdad se buscan y se verifican.
export const ALL_PATTERNS: PatternKind[] = [
  'dni',
  'nie',
  'iban',
  'nuss',
  'telefono',
  'email',
  'catastro',
];

export interface ProcessInput {
  bytes: Uint8Array;
  fileName: string;
  freeVersion: boolean;
  manual: PageMark[];
  /** Textos del informe. Obligatorio: un idioma sin cablear debe romper la compilación, no
   *  entregarle al comprador un informe en un idioma que no es el suyo. */
  copia: CopiaInforme;
  selectedAutomatic?: boolean[];
  password?: string;
}

export interface ProcessResult {
  fileName: string;
  cleanedBytes: Uint8Array;
  reportBytes: Uint8Array;
  verify: VerifyResult;
  scannedPages: number[];
  visualReviewPages: number[];
  boxesPerPage: { page: number; count: number }[];
  unverifiableManualPages: number[];
  /**
   * Los MISMOS datos con los que se dibujo el informe. Se exponen para que la interfaz pueda
   * enseñar el veredicto que acaba de emitirse sin recalcularlo: el sello de cinco estados no
   * aparecia en ningun sitio de la pantalla, solo dentro de un PDF que hay que abrir en otro
   * programa, asi que un comprador que espera verde se enteraba del ambar fuera del producto.
   * Devolver el dato en vez de una segunda redaccion es lo que impide que las dos superficies
   * deriven.
   */
  reportData: ReportData;
}

/**
 * Cajas de detección automática (kind/valor) en orden estable página a página,
 * saltando las páginas que necesitan revisión visual (A7): en esas páginas no
 * hay detección de texto fiable. Se expone además de `processDocument` para
 * que el visor (main.ts) pueda construir la selección exacta que luego se le
 * pasa de vuelta como `selectedAutomatic`, con el mismo orden e índices.
 */
export function detectAutomaticBoxes(
  doc: PdfDoc,
  visualReviewPages: number[],
): { page: number; rect: BoxRect; kind: PatternKind; value: string }[] {
  const reviewSet = new Set(visualReviewPages);
  const total = doc.pageCount();
  const boxes: { page: number; rect: BoxRect; kind: PatternKind; value: string }[] = [];
  for (let page = 0; page < total; page++) {
    if (reviewSet.has(page)) continue;
    const text = doc.extractText(page);
    for (const hit of detect(text)) {
      for (const rect of doc.searchText(page, hit.value)) {
        boxes.push({ page, rect, kind: hit.kind, value: hit.value });
      }
    }
  }
  return boxes;
}

function mergeMarks(...markLists: PageMark[][]): PageMark[] {
  let result: PageMark[] = [];
  for (const list of markLists) {
    for (const mark of list) {
      for (const rect of mark.rects) {
        result = addBox(result, mark.page, rect);
      }
    }
  }
  return result;
}

export async function processDocument(input: ProcessInput): Promise<ProcessResult> {
  const doc = await loadPdf(input.bytes, input.password);

  const totalPaginas = doc.pageCount();
  const scannedPages = doc.scannedPages();
  const visualReviewPages = doc.pagesNeedingVisualReview();
  // Dos hechos distintos, con dos frases distintas y dos gravedades distintas. El informe
  // recibia `visualReviewPages` en el campo de «paginas sin capa de texto» y afirmaba de una
  // pagina CON texto tapada por una imagen que no tenia texto: falso, literalmente.
  const paginasImagenCompleta = visualReviewPages.filter((p) => !scannedPages.includes(p));
  const paginasConImagen = doc.pagesWithImages();
  // Texto que se DIBUJA y no se puede releer: lo ve quien abre el documento y no lo ve la
  // comprobacion. Se mide sobre el documento de partida, igual que las paginas escaneadas y las
  // que llevan imagenes: el tachado no cambia lo que una fuente declara de sus propios glifos.
  const paginasTextoNoLegible = doc.pagesWithUnreadableText();

  const automaticBoxes = detectAutomaticBoxes(doc, visualReviewPages);
  const selectedAutomatic = input.selectedAutomatic ?? automaticBoxes.map(() => true);
  let automaticMarks: PageMark[] = [];
  // «Ofrecidos» = todo valor que la herramienta detectó y presentó como caja. «Seleccionados» =
  // los que el usuario dejó marcados. Su diferencia —ofrecido pero NO seleccionado— es lo que el
  // usuario decidió DEJAR sin tachar teniendo la opción de tacharlo: eso, y solo eso, puede seguir
  // en el documento sin bloquear la entrega. Si un valor está seleccionado aunque sea en una sola
  // caja, su supervivencia se trata como fallo (falla cerrado), no como decisión.
  const offeredValues = new Set<string>();
  const selectedValues = new Set<string>();
  automaticBoxes.forEach((box, i) => {
    offeredValues.add(box.value);
    if (selectedAutomatic[i]) {
      automaticMarks = addBox(automaticMarks, box.page, box.rect);
      selectedValues.add(box.value);
    }
  });
  const declinedValues = new Set<string>(
    [...offeredValues].filter((value) => !selectedValues.has(value)),
  );

  // A3.4: el texto de cada caja manual se captura ANTES de redactar (después
  // de aplicar la redacción ya no queda nada que leer), y solo cuenta como
  // "capturable" si al menos una caja de esa página aporta texto no vacío.
  const manualStrings: string[] = [];
  const pageHasText = new Map<number, boolean>();
  for (const mark of input.manual) {
    if (!pageHasText.has(mark.page)) pageHasText.set(mark.page, false);
    for (const rect of mark.rects) {
      const text = doc.extractTextInRect(mark.page, rect);
      if (text.trim() !== '') {
        manualStrings.push(text);
        pageHasText.set(mark.page, true);
      }
    }
  }
  const unverifiableManualPages = [...pageHasText.entries()]
    .filter(([, hasText]) => !hasText)
    .map(([page]) => page)
    .sort((a, b) => a - b);

  const allMarks = mergeMarks(automaticMarks, input.manual);
  doc.applyRedactions(allMarks);
  const redactedBytes = doc.save();
  doc.close();

  const boxesPerPage = allMarks
    .map((m) => ({ page: m.page, count: m.rects.length }))
    .sort((a, b) => a.page - b.page);

  const { bytes: cleanedBytes, objetos } = await stripMetadata(redactedBytes);
  const metadataTexts = await extractMetadataStrings(cleanedBytes);

  const finalDoc = await loadPdf(cleanedBytes);
  const pageTexts = finalDoc.extractAllText();
  finalDoc.close();

  const verify = verifyRedaction(pageTexts, manualStrings, metadataTexts, declinedValues);

  const reportData: ReportData = {
    fileName: input.fileName,
    sha256: await computeSha256(cleanedBytes),
    date: new Date().toISOString().slice(0, 10),
    patternsSearched: ALL_PATTERNS,
    totalPaginas,
    boxesPerPage,
    objetos,
    paginasSinCapaDeTexto: scannedPages,
    paginasImagenCompleta,
    paginasConImagen,
    unverifiableManualPages,
    paginasTextoNoLegible,
    freeVersion: input.freeVersion,
    verify,
  };
  const reportBytes = await buildReport(reportData, input.copia);

  return {
    fileName: input.fileName,
    cleanedBytes,
    reportBytes,
    reportData,
    verify,
    scannedPages,
    visualReviewPages,
    boxesPerPage,
    unverifiableManualPages,
  };
}
