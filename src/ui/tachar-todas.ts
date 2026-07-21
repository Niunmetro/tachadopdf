import type { PageMark } from '../types';

/**
 * Fusiona las marcas de ocurrencias `occ` dentro de `manual`, por página, sin duplicar un rect
 * {x,y,w,h} ya presente en esa página. Pura: no muta `manual` ni `occ`.
 */
export function mergeOccurrenceMarks(manual: PageMark[], occ: PageMark[]): PageMark[] {
  const result: PageMark[] = manual.map((mark) => ({ page: mark.page, rects: [...mark.rects] }));

  for (const mark of occ) {
    let entry = result.find((m) => m.page === mark.page);
    if (!entry) {
      entry = { page: mark.page, rects: [] };
      result.push(entry);
    }
    for (const rect of mark.rects) {
      const yaExiste = entry.rects.some(
        (r) => r.x === rect.x && r.y === rect.y && r.w === rect.w && r.h === rect.h,
      );
      if (!yaExiste) {
        entry.rects.push(rect);
      }
    }
  }

  return result;
}
