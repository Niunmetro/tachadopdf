// Tachado de IMÁGENES en el navegador. Mismo principio que el PDF: no se tapa, se BORRA.
// Sobre <canvas> los píxeles de la zona marcada se sustituyen por negro sólido y la imagen se
// reexporta desde cero (canvas.toBlob), así que ni queda capa oculta debajo ni pasan los metadatos
// del original (incluida la ubicación GPS de una foto). La imagen nunca sale del navegador.
import { contenidoDe, localeDelDocumento } from '../content/index';
import { escalar, recortar, regionDesdePuntos, type Region } from './redact';

const COPIA = contenidoDe(localeDelDocumento(document)).imagen;

interface Elementos {
  dropzone: HTMLElement;
  file: HTMLInputElement;
  stage: HTMLElement;
  canvas: HTMLCanvasElement;
  count: HTMLElement;
  download: HTMLButtonElement;
  clear: HTMLButtonElement;
  error: HTMLElement;
}

/** El lienzo de PANTALLA se limita a este ancho; el borrado y el export van a resolución natural. */
const ANCHO_MAX_CANVAS = 900;

let imagen: HTMLImageElement | null = null;
let nombreOriginal = 'imagen';
let tipoOriginal = 'image/png';
const regiones: Region[] = []; // en coordenadas de IMAGEN natural
let arrastrando = false;
let inicioCanvas = { x: 0, y: 0 };
let previaCanvas: Region | null = null; // rectángulo en curso, en coordenadas de canvas

function localizar(): Elementos | null {
  const dropzone = document.getElementById('img-dropzone');
  const file = document.getElementById('img-file');
  const stage = document.getElementById('img-stage');
  const canvas = document.getElementById('img-canvas');
  const count = document.getElementById('img-count');
  const download = document.getElementById('img-download');
  const clear = document.getElementById('img-clear');
  const error = document.getElementById('img-error');
  if (
    !(dropzone instanceof HTMLElement) ||
    !(file instanceof HTMLInputElement) ||
    !(stage instanceof HTMLElement) ||
    !(canvas instanceof HTMLCanvasElement) ||
    !(count instanceof HTMLElement) ||
    !(download instanceof HTMLButtonElement) ||
    !(clear instanceof HTMLButtonElement) ||
    !(error instanceof HTMLElement)
  ) {
    return null;
  }
  return { dropzone, file, stage, canvas, count, download, clear, error };
}

/** Cuántos píxeles de IMAGEN por cada píxel de CANVAS de pantalla. */
function factorImgPorCanvas(canvas: HTMLCanvasElement): number {
  if (imagen === null || canvas.width === 0) return 1;
  return imagen.naturalWidth / canvas.width;
}

function ajustarLienzo(canvas: HTMLCanvasElement): void {
  if (imagen === null) return;
  const escala = Math.min(1, ANCHO_MAX_CANVAS / imagen.naturalWidth);
  canvas.width = Math.max(1, Math.round(imagen.naturalWidth * escala));
  canvas.height = Math.max(1, Math.round(imagen.naturalHeight * escala));
}

function redibujar(el: Elementos): void {
  const { canvas } = el;
  const ctx = canvas.getContext('2d');
  if (ctx === null || imagen === null) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(imagen, 0, 0, canvas.width, canvas.height);
  const f = factorImgPorCanvas(canvas);
  ctx.fillStyle = '#0b1420';
  for (const r of regiones) {
    ctx.fillRect(r.x / f, r.y / f, r.ancho / f, r.alto / f);
  }
  if (previaCanvas !== null) {
    ctx.fillStyle = 'rgba(11,20,32,0.55)';
    ctx.fillRect(previaCanvas.x, previaCanvas.y, previaCanvas.ancho, previaCanvas.alto);
  }
  const n = regiones.length;
  el.count.textContent = n === 0 ? '' : `${n} ${n === 1 ? COPIA.contadorUna : COPIA.contadorVarias}`;
  el.download.disabled = n === 0;
}

function puntoCanvas(canvas: HTMLCanvasElement, ev: PointerEvent): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect();
  const escalaCss = rect.width === 0 ? 1 : canvas.width / rect.width;
  return { x: (ev.clientX - rect.left) * escalaCss, y: (ev.clientY - rect.top) * escalaCss };
}

function cargarImagen(fichero: File, el: Elementos): void {
  el.error.textContent = '';
  if (!fichero.type.startsWith('image/')) {
    el.error.textContent = COPIA.noEsImagen;
    return;
  }
  const url = URL.createObjectURL(fichero);
  const img = new Image();
  img.onload = () => {
    imagen = img;
    nombreOriginal = fichero.name.replace(/\.[^.]+$/, '') || 'imagen';
    tipoOriginal = fichero.type === 'image/jpeg' ? 'image/jpeg' : 'image/png';
    regiones.length = 0;
    previaCanvas = null;
    ajustarLienzo(el.canvas);
    el.dropzone.hidden = true;
    el.stage.hidden = false;
    redibujar(el);
    URL.revokeObjectURL(url);
  };
  img.onerror = () => {
    el.error.textContent = COPIA.errorGenerico;
    URL.revokeObjectURL(url);
  };
  img.src = url;
}

function descargar(el: Elementos): void {
  if (imagen === null || regiones.length === 0) return;
  const lienzo = document.createElement('canvas');
  lienzo.width = imagen.naturalWidth;
  lienzo.height = imagen.naturalHeight;
  const ctx = lienzo.getContext('2d');
  if (ctx === null) {
    el.error.textContent = COPIA.errorGenerico;
    return;
  }
  // Reexporta desde cero: los metadatos del fichero original no pasan al lienzo.
  ctx.drawImage(imagen, 0, 0);
  ctx.fillStyle = '#000000';
  for (const r of regiones) {
    ctx.fillRect(Math.round(r.x), Math.round(r.y), Math.round(r.ancho), Math.round(r.alto));
  }
  const calidad = tipoOriginal === 'image/jpeg' ? 0.92 : undefined;
  lienzo.toBlob(
    (blob) => {
      if (blob === null) {
        el.error.textContent = COPIA.errorGenerico;
        return;
      }
      const ext = tipoOriginal === 'image/jpeg' ? 'jpg' : 'png';
      const enlace = document.createElement('a');
      const href = URL.createObjectURL(blob);
      enlace.href = href;
      enlace.download = `${nombreOriginal}${COPIA.sufijoDescarga}.${ext}`;
      document.body.appendChild(enlace);
      enlace.click();
      enlace.remove();
      window.setTimeout(() => URL.revokeObjectURL(href), 1000);
    },
    tipoOriginal,
    calidad,
  );
}

export function inicializar(): void {
  const el = localizar();
  if (el === null) return;

  el.file.addEventListener('change', () => {
    const f = el.file.files?.[0];
    if (f) cargarImagen(f, el);
  });
  el.dropzone.addEventListener('dragover', (e) => e.preventDefault());
  el.dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    const f = e.dataTransfer?.files?.[0];
    if (f) cargarImagen(f, el);
  });

  const { canvas } = el;
  canvas.addEventListener('pointerdown', (e) => {
    if (imagen === null) return;
    arrastrando = true;
    inicioCanvas = puntoCanvas(canvas, e);
    previaCanvas = { x: inicioCanvas.x, y: inicioCanvas.y, ancho: 0, alto: 0 };
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!arrastrando) return;
    const p = puntoCanvas(canvas, e);
    previaCanvas = regionDesdePuntos(inicioCanvas.x, inicioCanvas.y, p.x, p.y);
    redibujar(el);
  });
  const soltar = (e: PointerEvent): void => {
    if (!arrastrando) return;
    arrastrando = false;
    const p = puntoCanvas(canvas, e);
    const enCanvas = regionDesdePuntos(inicioCanvas.x, inicioCanvas.y, p.x, p.y);
    previaCanvas = null;
    const enImagen = recortar(
      escalar(enCanvas, factorImgPorCanvas(canvas)),
      imagen?.naturalWidth ?? 0,
      imagen?.naturalHeight ?? 0,
    );
    if (enImagen !== null) regiones.push(enImagen);
    redibujar(el);
  };
  canvas.addEventListener('pointerup', soltar);
  canvas.addEventListener('pointercancel', soltar);

  el.clear.addEventListener('click', () => {
    regiones.length = 0;
    previaCanvas = null;
    redibujar(el);
  });
  el.download.addEventListener('click', () => descargar(el));
}

inicializar();
