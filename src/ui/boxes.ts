import type { BoxRect, Hit, PageMark } from '../types';

export interface Viewport {
  scale: number;
  pageW: number;
  pageH: number;
}

export interface SelectionState {
  hits: Hit[];
  selected: boolean[];
  manual: PageMark[];
}

function clampToPage(box: BoxRect, pageW: number, pageH: number): BoxRect {
  const x0 = Math.max(0, Math.min(box.x, pageW));
  const y0 = Math.max(0, Math.min(box.y, pageH));
  const x1 = Math.max(x0, Math.min(box.x + box.w, pageW));
  const y1 = Math.max(y0, Math.min(box.y + box.h, pageH));
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

export function canvasToPage(box: BoxRect, vp: Viewport): BoxRect {
  const page: BoxRect = {
    x: box.x / vp.scale,
    y: box.y / vp.scale,
    w: box.w / vp.scale,
    h: box.h / vp.scale,
  };
  return clampToPage(page, vp.pageW, vp.pageH);
}

export function pageToCanvas(box: BoxRect, vp: Viewport): BoxRect {
  return {
    x: box.x * vp.scale,
    y: box.y * vp.scale,
    w: box.w * vp.scale,
    h: box.h * vp.scale,
  };
}

export function toggleHit(s: SelectionState, index: number): SelectionState {
  if (index < 0 || index >= s.selected.length) {
    return s;
  }
  const selected = s.selected.map((value, i) => (i === index ? !value : value));
  return { ...s, selected };
}

export function selectAll(s: SelectionState): SelectionState {
  return { ...s, selected: s.selected.map(() => true) };
}

export function clearAll(s: SelectionState): SelectionState {
  return { ...s, selected: s.selected.map(() => false) };
}

export function addBox(marks: PageMark[], page: number, rect: BoxRect): PageMark[] {
  const idx = marks.findIndex((mark) => mark.page === page);
  if (idx === -1) {
    return [...marks, { page, rects: [rect] }];
  }
  return marks.map((mark, i) => (i === idx ? { page: mark.page, rects: [...mark.rects, rect] } : mark));
}

export function renderBoxes(container: HTMLElement, marks: PageMark[]): void {
  container.innerHTML = '';
  for (const mark of marks) {
    const item = document.createElement('p');
    item.textContent = `Página ${mark.page + 1}: ${mark.rects.length} zona(s) tachada(s).`;
    container.appendChild(item);
  }
}

export function addManualBox(s: SelectionState, page: number, rect: BoxRect): SelectionState {
  const idx = s.manual.findIndex((mark) => mark.page === page);
  if (idx === -1) {
    return { ...s, manual: [...s.manual, { page, rects: [rect] }] };
  }
  const manual = s.manual.map((mark, i) =>
    i === idx ? { page: mark.page, rects: [...mark.rects, rect] } : mark,
  );
  return { ...s, manual };
}
