import { describe, expect, it } from 'vitest';
import type { BoxRect, Hit } from '../types';
import {
  addManualBox,
  canvasToPage,
  clearAll,
  pageToCanvas,
  selectAll,
  toggleHit,
  type SelectionState,
  type Viewport,
} from './boxes';

describe('canvasToPage / pageToCanvas (inversas sobre el mismo espacio mupdf)', () => {
  const vp: Viewport = { scale: 1.5, pageW: 595, pageH: 842 };

  it('canvasToPage(pageToCanvas(r)) ≈ r para un rect dentro de la página', () => {
    const r: BoxRect = { x: 50, y: 100, w: 120, h: 30 };
    const roundTripped = canvasToPage(pageToCanvas(r, vp), vp);
    expect(roundTripped.x).toBeCloseTo(r.x);
    expect(roundTripped.y).toBeCloseTo(r.y);
    expect(roundTripped.w).toBeCloseTo(r.w);
    expect(roundTripped.h).toBeCloseTo(r.h);
  });

  it('pageToCanvas escala multiplicando por scale', () => {
    const r: BoxRect = { x: 10, y: 20, w: 30, h: 40 };
    expect(pageToCanvas(r, vp)).toEqual({ x: 15, y: 30, w: 45, h: 60 });
  });

  it('canvasToPage escala dividiendo por scale', () => {
    const r: BoxRect = { x: 15, y: 30, w: 45, h: 60 };
    expect(canvasToPage(r, vp)).toEqual({ x: 10, y: 20, w: 30, h: 40 });
  });

  it('canvasToPage recorta a los límites de la página cuando el trazo se sale', () => {
    const fueraDeLaPagina: BoxRect = { x: -30, y: -30, w: 60, h: 60 };
    const clamped = canvasToPage(fueraDeLaPagina, vp);
    expect(clamped.x).toBe(0);
    expect(clamped.y).toBe(0);
  });
});

function ejemploHits(): Hit[] {
  return [
    { kind: 'dni', value: '12345678Z', start: 0, end: 9 },
    { kind: 'email', value: 'a@b.com', start: 20, end: 27 },
    { kind: 'iban', value: 'ES9121000418450200051332', start: 40, end: 65 },
  ];
}

function estadoInicial(): SelectionState {
  return { hits: ejemploHits(), selected: [false, false, false], manual: [] };
}

describe('toggleHit / selectAll / clearAll', () => {
  it('toggleHit marca solo el índice indicado sin mutar el estado original', () => {
    const s = estadoInicial();
    const s2 = toggleHit(s, 1);
    expect(s2.selected).toEqual([false, true, false]);
    expect(s.selected).toEqual([false, false, false]);
  });

  it('toggleHit vuelve a desmarcar si se llama dos veces sobre el mismo índice', () => {
    const s = estadoInicial();
    const s2 = toggleHit(toggleHit(s, 0), 0);
    expect(s2.selected).toEqual([false, false, false]);
  });

  it('toggleHit con índice fuera de rango deja el estado igual', () => {
    const s = estadoInicial();
    const s2 = toggleHit(s, 99);
    expect(s2.selected).toEqual(s.selected);
  });

  it('selectAll marca todos los hits', () => {
    const s = estadoInicial();
    expect(selectAll(s).selected).toEqual([true, true, true]);
  });

  it('clearAll desmarca todos los hits sin tocar las cajas manuales', () => {
    const s: SelectionState = {
      ...estadoInicial(),
      selected: [true, true, true],
      manual: [{ page: 0, rects: [{ x: 1, y: 2, w: 3, h: 4 }] }],
    };
    const s2 = clearAll(s);
    expect(s2.selected).toEqual([false, false, false]);
    expect(s2.manual).toEqual(s.manual);
  });
});

describe('addManualBox', () => {
  it('crea una nueva entrada de página cuando no existe', () => {
    const s = estadoInicial();
    const rect: BoxRect = { x: 5, y: 5, w: 10, h: 10 };
    const s2 = addManualBox(s, 2, rect);
    expect(s2.manual).toEqual([{ page: 2, rects: [rect] }]);
    expect(s.manual).toEqual([]);
  });

  it('añade el rect a la página existente sin duplicar la entrada', () => {
    const rect1: BoxRect = { x: 1, y: 1, w: 2, h: 2 };
    const rect2: BoxRect = { x: 3, y: 3, w: 4, h: 4 };
    const s0 = estadoInicial();
    const s1 = addManualBox(s0, 0, rect1);
    const s2 = addManualBox(s1, 0, rect2);
    expect(s2.manual).toEqual([{ page: 0, rects: [rect1, rect2] }]);
  });

  it('mantiene páginas separadas para páginas distintas', () => {
    const rectA: BoxRect = { x: 1, y: 1, w: 2, h: 2 };
    const rectB: BoxRect = { x: 3, y: 3, w: 4, h: 4 };
    const s0 = estadoInicial();
    const s1 = addManualBox(s0, 0, rectA);
    const s2 = addManualBox(s1, 1, rectB);
    expect(s2.manual).toEqual([
      { page: 0, rects: [rectA] },
      { page: 1, rects: [rectB] },
    ]);
  });
});
