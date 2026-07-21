import { describe, expect, it } from 'vitest';
import type { PageMark } from '../types';
import { mergeOccurrenceMarks } from './tachar-todas';

describe('mergeOccurrenceMarks', () => {
  it('añade una página nueva que no existía en manual', () => {
    const manual: PageMark[] = [{ page: 0, rects: [{ x: 1, y: 1, w: 2, h: 2 }] }];
    const occ: PageMark[] = [{ page: 1, rects: [{ x: 5, y: 5, w: 3, h: 3 }] }];

    const result = mergeOccurrenceMarks(manual, occ);

    expect(result).toEqual([
      { page: 0, rects: [{ x: 1, y: 1, w: 2, h: 2 }] },
      { page: 1, rects: [{ x: 5, y: 5, w: 3, h: 3 }] },
    ]);
  });

  it('añade rects nuevos a una página ya existente en manual', () => {
    const manual: PageMark[] = [{ page: 0, rects: [{ x: 1, y: 1, w: 2, h: 2 }] }];
    const occ: PageMark[] = [{ page: 0, rects: [{ x: 9, y: 9, w: 4, h: 4 }] }];

    const result = mergeOccurrenceMarks(manual, occ);

    expect(result).toEqual([
      {
        page: 0,
        rects: [
          { x: 1, y: 1, w: 2, h: 2 },
          { x: 9, y: 9, w: 4, h: 4 },
        ],
      },
    ]);
  });

  it('omite un rect idéntico (mismo x,y,w,h) ya presente en esa página', () => {
    const manual: PageMark[] = [{ page: 0, rects: [{ x: 1, y: 1, w: 2, h: 2 }] }];
    const occ: PageMark[] = [{ page: 0, rects: [{ x: 1, y: 1, w: 2, h: 2 }] }];

    const result = mergeOccurrenceMarks(manual, occ);

    expect(result).toEqual([{ page: 0, rects: [{ x: 1, y: 1, w: 2, h: 2 }] }]);
  });

  it('un rect con coordenadas distintas en la misma página no se considera duplicado', () => {
    const manual: PageMark[] = [{ page: 0, rects: [{ x: 1, y: 1, w: 2, h: 2 }] }];
    const occ: PageMark[] = [{ page: 0, rects: [{ x: 1, y: 1, w: 2, h: 3 }] }];

    const result = mergeOccurrenceMarks(manual, occ);

    expect(result[0]?.rects).toHaveLength(2);
  });

  it('no muta manual ni occ', () => {
    const manual: PageMark[] = [{ page: 0, rects: [{ x: 1, y: 1, w: 2, h: 2 }] }];
    const occ: PageMark[] = [{ page: 0, rects: [{ x: 9, y: 9, w: 4, h: 4 }] }];
    const manualCopy = JSON.parse(JSON.stringify(manual));
    const occCopy = JSON.parse(JSON.stringify(occ));

    mergeOccurrenceMarks(manual, occ);

    expect(manual).toEqual(manualCopy);
    expect(occ).toEqual(occCopy);
  });

  it('devuelve manual sin cambios si occ está vacío', () => {
    const manual: PageMark[] = [{ page: 0, rects: [{ x: 1, y: 1, w: 2, h: 2 }] }];

    const result = mergeOccurrenceMarks(manual, []);

    expect(result).toEqual(manual);
  });
});
