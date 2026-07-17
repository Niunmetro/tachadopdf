import type { BoxRect } from '../types';
import {
  addManualBox,
  canvasToPage,
  manualRectsForPage,
  pageToCanvas,
  removeManualBox,
  toggleHit,
  type SelectionState,
  type Viewport,
} from './boxes';

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
  // El canvas invita a dibujar: cursor de cruz. Sin esto no había NINGUNA pista de que se
  // podía tachar a mano, y como las cajas tampoco se pintaban, parecía que "no dejaba tachar".
  canvas.style.cursor = 'crosshair';

  // Rectángulo de PREVISUALIZACIÓN mientras se arrastra (feedback inmediato). Vive en el
  // contenedor del canvas para superponerse sobre la página.
  const preview = document.createElement('div');
  preview.className = 'manual-preview';
  preview.style.position = 'absolute';
  preview.style.pointerEvents = 'none';
  preview.style.background = 'rgba(15,23,42,0.35)';
  preview.style.border = '1px solid #0f172a';
  preview.style.display = 'none';
  canvas.parentElement?.appendChild(preview);

  function pointFromEvent(event: MouseEvent): { x: number; y: number } {
    const rect = canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function boxFrom(from: { x: number; y: number }, to: { x: number; y: number }): BoxRect {
    return {
      x: Math.min(from.x, to.x),
      y: Math.min(from.y, to.y),
      w: Math.abs(to.x - from.x),
      h: Math.abs(to.y - from.y),
    };
  }

  function onMouseDown(event: MouseEvent): void {
    start = pointFromEvent(event);
  }

  function onMouseMove(event: MouseEvent): void {
    if (!start) return;
    const b = boxFrom(start, pointFromEvent(event));
    preview.style.left = `${b.x}px`;
    preview.style.top = `${b.y}px`;
    preview.style.width = `${b.w}px`;
    preview.style.height = `${b.h}px`;
    preview.style.display = 'block';
  }

  function onMouseUp(event: MouseEvent): void {
    preview.style.display = 'none';
    if (!start) {
      return;
    }
    const from = start;
    start = null;
    const canvasBox = boxFrom(from, pointFromEvent(event));
    if (canvasBox.w < 2 || canvasBox.h < 2) {
      return;
    }
    const pageBox = canvasToPage(canvasBox, viewport);
    setState(addManualBox(getState(), page, pageBox));
  }

  canvas.addEventListener('mousedown', onMouseDown);
  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('mouseup', onMouseUp);

  return () => {
    canvas.removeEventListener('mousedown', onMouseDown);
    canvas.removeEventListener('mousemove', onMouseMove);
    canvas.removeEventListener('mouseup', onMouseUp);
    preview.remove();
  };
}

export interface ManualBoxesOptions {
  container: HTMLElement;
  viewport: Viewport;
  page: number;
  getState: () => SelectionState;
  setState: (state: SelectionState) => void;
}

/**
 * Pinta las cajas MANUALES de la página como rectángulos negros visibles, cada uno con una «×»
 * para deshacerlo. Sin esto, el usuario dibujaba una caja y no veía nada -> "no deja tachar".
 * Igual que renderHitOverlay, borra solo sus propios nodos (.manual-box), nunca el contenedor.
 */
export function renderManualBoxes(options: ManualBoxesOptions): void {
  const { container, viewport, page, getState, setState } = options;
  for (const previa of Array.from(container.querySelectorAll(':scope > .manual-box'))) {
    previa.remove();
  }
  const rects = manualRectsForPage(getState(), page);
  rects.forEach((pageRect, index) => {
    const canvasRect = pageToCanvas(pageRect, viewport);
    const box = document.createElement('div');
    box.className = 'manual-box';
    box.style.position = 'absolute';
    box.style.left = `${canvasRect.x}px`;
    box.style.top = `${canvasRect.y}px`;
    box.style.width = `${canvasRect.w}px`;
    box.style.height = `${canvasRect.h}px`;
    box.style.background = '#0f172a';
    box.style.border = '1px solid #0f172a';

    const quitar = document.createElement('button');
    quitar.type = 'button';
    quitar.className = 'manual-box__remove';
    quitar.textContent = '×';
    quitar.setAttribute('aria-label', 'Quitar este tachado');
    quitar.style.position = 'absolute';
    quitar.style.top = '-10px';
    quitar.style.right = '-10px';
    quitar.addEventListener('click', (e) => {
      e.stopPropagation();
      setState(removeManualBox(getState(), page, index));
    });
    box.appendChild(quitar);
    container.appendChild(box);
  });
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
  for (const previa of Array.from(container.querySelectorAll(':scope > .hit-box'))) {
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
