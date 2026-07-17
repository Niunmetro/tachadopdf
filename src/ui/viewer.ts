import type { BoxRect } from '../types';
import { addManualBox, canvasToPage, pageToCanvas, toggleHit, type SelectionState, type Viewport } from './boxes';

export function mountCanvas(container: HTMLElement, viewport: Viewport): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(viewport.pageW * viewport.scale);
  canvas.height = Math.round(viewport.pageH * viewport.scale);
  container.appendChild(canvas);
  return canvas;
}

export interface ManualDrawOptions {
  canvas: HTMLCanvasElement;
  viewport: Viewport;
  page: number;
  getState: () => SelectionState;
  setState: (state: SelectionState) => void;
}

export function attachManualBoxDrawing(options: ManualDrawOptions): () => void {
  const { canvas, viewport, page, getState, setState } = options;
  let start: { x: number; y: number } | null = null;

  function pointFromEvent(event: MouseEvent): { x: number; y: number } {
    const rect = canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function onMouseDown(event: MouseEvent): void {
    start = pointFromEvent(event);
  }

  function onMouseUp(event: MouseEvent): void {
    if (!start) {
      return;
    }
    const from = start;
    start = null;
    const to = pointFromEvent(event);
    const canvasBox: BoxRect = {
      x: Math.min(from.x, to.x),
      y: Math.min(from.y, to.y),
      w: Math.abs(to.x - from.x),
      h: Math.abs(to.y - from.y),
    };
    if (canvasBox.w < 2 || canvasBox.h < 2) {
      return;
    }
    const pageBox = canvasToPage(canvasBox, viewport);
    setState(addManualBox(getState(), page, pageBox));
  }

  canvas.addEventListener('mousedown', onMouseDown);
  canvas.addEventListener('mouseup', onMouseUp);

  return () => {
    canvas.removeEventListener('mousedown', onMouseDown);
    canvas.removeEventListener('mouseup', onMouseUp);
  };
}

export interface HitOverlayOptions {
  container: HTMLElement;
  hitRects: BoxRect[];
  viewport: Viewport;
  getState: () => SelectionState;
  setState: (state: SelectionState) => void;
}

export function renderHitOverlay(options: HitOverlayOptions): void {
  const { container, hitRects, viewport, getState, setState } = options;
  // Borrar SOLO las cajas de hits previas, NUNCA `container.innerHTML = ''`: el contenedor lleva
  // la <img> de la página renderizada y el <canvas> de tachado manual; vaciarlo entero los
  // destruía y dejaba el canvas fuera del DOM -> el usuario no podía tachar nada (bug real
  // cazado por Codex el 2026-07-17: era el motivo de "la web no funciona").
  for (const previa of Array.from(container.querySelectorAll('.hit-box'))) {
    previa.remove();
  }
  const state = getState();
  hitRects.forEach((pageRect, index) => {
    const canvasRect = pageToCanvas(pageRect, viewport);
    const box = document.createElement('button');
    box.type = 'button';
    box.className = state.selected[index] ? 'hit-box hit-box--selected' : 'hit-box';
    box.style.position = 'absolute';
    box.style.left = `${canvasRect.x}px`;
    box.style.top = `${canvasRect.y}px`;
    box.style.width = `${canvasRect.w}px`;
    box.style.height = `${canvasRect.h}px`;
    box.addEventListener('click', () => {
      setState(toggleHit(getState(), index));
    });
    container.appendChild(box);
  });
}
