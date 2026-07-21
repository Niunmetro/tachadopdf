import type { PageMark } from '../types';
import type { PdfDoc } from './engine';

export function findAllOccurrenceMarks(doc: PdfDoc, value: string, reviewPages: number[]): PageMark[] {
  if (value === '') return [];
  const reviewSet = new Set(reviewPages);
  const total = doc.pageCount();
  const marks: PageMark[] = [];
  for (let page = 0; page < total; page++) {
    if (reviewSet.has(page)) continue;
    const rects = doc.searchText(page, value);
    if (rects.length > 0) {
      marks.push({ page, rects });
    }
  }
  return marks;
}
