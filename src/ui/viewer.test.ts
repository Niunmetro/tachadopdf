// @vitest-environment happy-dom
// Regresión del bug que hacía "la web no funciona" (cazado por Codex, 2026-07-17):
// renderHitOverlay hacía `container.innerHTML = ''` y borraba la <img> y el <canvas> del visor,
// dejando el canvas de tachado manual FUERA del DOM -> el usuario no podía tachar nada.
import { beforeEach, describe, expect, it } from 'vitest';
import type { BoxRect } from '../types';
import type { SelectionState, Viewport } from './boxes';
import { renderHitOverlay } from './viewer';

const viewport: Viewport = { scale: 1, pageW: 595, pageH: 842 };

function contenedorConVisor(): { container: HTMLElement; img: HTMLElement; canvas: HTMLElement } {
  const container = document.createElement('div');
  const img = document.createElement('img'); // la página renderizada
  const canvas = document.createElement('canvas'); // el lienzo de tachado manual
  container.append(img, canvas);
  document.body.appendChild(container);
  return { container, img, canvas };
}

describe('renderHitOverlay no destruye el visor', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('conserva la imagen y el canvas al pintar los hits', () => {
    const { container, img, canvas } = contenedorConVisor();
    const hitRects: BoxRect[] = [{ x: 10, y: 10, w: 50, h: 20 }];
    const state: SelectionState = { hits: [], selected: [false], manual: [] };

    renderHitOverlay({
      container, hitRects, viewport,
      getState: () => state, setState: () => {},
    });

    // La imagen y el canvas SIGUEN en el contenedor (antes se borraban -> "no funciona").
    expect(container.contains(img)).toBe(true);
    expect(container.contains(canvas)).toBe(true);
    // Y se pintó exactamente una caja de hit.
    expect(container.querySelectorAll('.hit-box')).toHaveLength(1);
  });

  it('al re-pintar no acumula cajas ni pierde el visor', () => {
    const { container, img, canvas } = contenedorConVisor();
    const hitRects: BoxRect[] = [{ x: 10, y: 10, w: 50, h: 20 }];
    const state: SelectionState = { hits: [], selected: [false], manual: [] };
    const opts = { container, hitRects, viewport, getState: () => state, setState: () => {} };

    renderHitOverlay(opts);
    renderHitOverlay(opts); // cada interacción del usuario re-pinta: no debe duplicar ni romper

    expect(container.querySelectorAll('.hit-box')).toHaveLength(1);
    expect(container.contains(img)).toBe(true);
    expect(container.contains(canvas)).toBe(true);
  });
});
