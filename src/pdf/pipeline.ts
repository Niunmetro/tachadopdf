import { buildReport, computeSha256 } from '../report/report';
import { detect } from '../detect/patterns';
import type { BoxRect, PageMark, PatternKind, ReportData, VerifyResult } from '../types';
import { addBox } from '../ui/boxes';
import { loadPdf, type PdfDoc } from './engine';
import { extractMetadataStrings, stripMetadata } from './metadata';
import { verifyRedaction } from './verify';

const ALL_PATTERNS: PatternKind[] = ['dni', 'nie', 'iban', 'nuss', 'telefono', 'email'];

export interface ProcessInput {
  bytes: Uint8Array;
  fileName: string;
  freeVersion: boolean;
  manual: PageMark[];
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
): { page: number; rect: BoxRect; kind: PatternKind }[] {
  const reviewSet = new Set(visualReviewPages);
  const total = doc.pageCount();
  const boxes: { page: number; rect: BoxRect; kind: PatternKind }[] = [];
  for (let page = 0; page < total; page++) {
    if (reviewSet.has(page)) continue;
    const text = doc.extractText(page);
    for (const hit of detect(text)) {
      for (const rect of doc.searchText(page, hit.value)) {
        boxes.push({ page, rect, kind: hit.kind });
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

  const scannedPages = doc.scannedPages();
  const visualReviewPages = doc.pagesNeedingVisualReview();

  const automaticBoxes = detectAutomaticBoxes(doc, visualReviewPages);
  const selectedAutomatic = input.selectedAutomatic ?? automaticBoxes.map(() => true);
  let automaticMarks: PageMark[] = [];
  automaticBoxes.forEach((box, i) => {
    if (selectedAutomatic[i]) {
      automaticMarks = addBox(automaticMarks, box.page, box.rect);
    }
  });

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

  const { bytes: cleanedBytes, removed } = await stripMetadata(redactedBytes);
  const metadataTexts = await extractMetadataStrings(cleanedBytes);

  const finalDoc = await loadPdf(cleanedBytes);
  const pageTexts = finalDoc.extractAllText();
  finalDoc.close();

  const verify = verifyRedaction(pageTexts, manualStrings, metadataTexts);

  const reportData: ReportData = {
    fileName: input.fileName,
    sha256: await computeSha256(cleanedBytes),
    date: new Date().toISOString().slice(0, 10),
    patternsSearched: ALL_PATTERNS,
    boxesPerPage,
    metadataRemoved: removed,
    scannedPages: visualReviewPages,
    freeVersion: input.freeVersion,
    verify,
  };
  const reportBytes = await buildReport(reportData);

  return {
    fileName: input.fileName,
    cleanedBytes,
    reportBytes,
    verify,
    scannedPages,
    visualReviewPages,
    boxesPerPage,
    unverifiableManualPages,
  };
}
