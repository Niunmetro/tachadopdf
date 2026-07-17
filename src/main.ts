import './estilo.css';
import { CHECKBOX_LABEL, canBatch, canProcess, performBatchDownload, type AppState } from './app';
import { PRECIO_PRO, PRO_URL } from './config';
import { getQuota, recordUse } from './freemium/quota';
import { verifyLicense } from './license/gumroad';
import { renderLegalFooter } from './legal/render';
import {
  AVISO_PRINCIPAL,
  LANDING_CASOS_USO_TEXTO,
  LANDING_SUBTITULO,
  LANDING_TITULAR,
} from './legal/textos';
import { PdfPasswordError, loadPdf, type PdfDoc } from './pdf/engine';
import { detectAutomaticBoxes, processDocument } from './pdf/pipeline';
import type { BoxRect, PageMark, VerifyResult } from './types';
import { selectAll, type SelectionState, type Viewport } from './ui/boxes';
import { attachManualBoxDrawing, mountCanvas, renderHitOverlay } from './ui/viewer';

const RENDER_DPI = 96;

interface ProcessedFile {
  fileName: string;
  scannedPages: number[];
  boxesPerPage: { page: number; count: number }[];
  cleanedBytes: Uint8Array;
  reportBytes: Uint8Array;
  verify: VerifyResult;
}

interface FileWork {
  fileName: string;
  bytes: Uint8Array;
  manual: PageMark[];
  selected: boolean[];
}

const state: AppState = {
  checkboxConfirmed: false,
  verify: null,
  scannedPages: [],
  license: { pro: false, reason: 'absent' },
  quota: { usedThisMonth: 0, limit: 3, allowed: true },
};

let fileWorks: FileWork[] = [];

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, string> = {},
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    node.setAttribute(key, value);
  }
  return node;
}

function unionSorted(a: number[], b: number[]): number[] {
  return Array.from(new Set([...a, ...b])).sort((x, y) => x - y);
}

function loadPng(bytes: Uint8Array): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const blob = new Blob([bytes as BlobPart], { type: 'image/png' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('No se pudo renderizar la página'));
    };
    img.src = url;
  });
}

async function loadWithPassword(bytes: Uint8Array, promptPassword: () => string | null): Promise<PdfDoc> {
  try {
    return await loadPdf(bytes);
  } catch (err) {
    if (!(err instanceof PdfPasswordError)) throw err;
    const password = promptPassword();
    if (password === null) throw err;
    return loadPdf(bytes, password);
  }
}

/**
 * Monta el visor real de un fichero: una página por cada página que NO
 * necesita revisión visual (A7), con overlay de hits automáticos
 * marcables/desmarcables (selectAll/toggleHit) y dibujo de cajas manuales
 * (attachManualBoxDrawing). Todo lo que el usuario marca se acumula en
 * `fileWork.selected` / `fileWork.manual`, que es lo que luego se le pasa a
 * processDocument en el momento de la descarga.
 */
async function renderFileVisor(container: HTMLElement, doc: PdfDoc, fileWork: FileWork): Promise<void> {
  const visualReviewPages = doc.pagesNeedingVisualReview();
  const automaticBoxes = detectAutomaticBoxes(doc, visualReviewPages);
  fileWork.selected = automaticBoxes.map(() => true);

  const title = el('p');
  title.textContent = fileWork.fileName;
  container.appendChild(title);

  if (visualReviewPages.length > 0) {
    const notice = el('p');
    notice.textContent =
      `Páginas que requieren revisión visual (sin capa de texto o con imagen a página completa): ` +
      `${visualReviewPages.map((p) => p + 1).join(', ')}.`;
    container.appendChild(notice);
  }

  const total = doc.pageCount();
  let cursor = 0;
  for (let page = 0; page < total; page++) {
    if (visualReviewPages.includes(page)) continue;

    const start = cursor;
    while (cursor < automaticBoxes.length && automaticBoxes[cursor]?.page === page) cursor++;
    const end = cursor;
    const hitRects: BoxRect[] = automaticBoxes.slice(start, end).map((b) => b.rect);

    const png = doc.renderToPng(page, RENDER_DPI);
    const img = await loadPng(png);
    const scale = RENDER_DPI / 72;
    const viewport: Viewport = {
      scale,
      pageW: img.naturalWidth / scale,
      pageH: img.naturalHeight / scale,
    };

    const pageContainer = el('div', { class: 'page-visor' });
    pageContainer.style.position = 'relative';
    pageContainer.style.display = 'inline-block';
    img.style.display = 'block';
    pageContainer.appendChild(img);

    const canvas = mountCanvas(pageContainer, viewport);
    canvas.style.position = 'absolute';
    canvas.style.left = '0';
    canvas.style.top = '0';

    const getState = (): SelectionState => ({
      hits: [],
      selected: fileWork.selected.slice(start, end),
      manual: fileWork.manual,
    });
    const setState = (s: SelectionState): void => {
      for (let i = start; i < end; i++) fileWork.selected[i] = s.selected[i - start] ?? false;
      fileWork.manual = s.manual;
      renderHitOverlay({ container: pageContainer, hitRects, viewport, getState, setState });
    };

    renderHitOverlay({ container: pageContainer, hitRects, viewport, getState, setState });
    attachManualBoxDrawing({ canvas, viewport, page, getState, setState });

    if (hitRects.length > 0) {
      const selectAllButton = el('button', { type: 'button' });
      selectAllButton.textContent = `Página ${page + 1}: seleccionar todos los hits`;
      selectAllButton.addEventListener('click', () => setState(selectAll(getState())));
      pageContainer.appendChild(selectAllButton);
    }

    container.appendChild(pageContainer);
  }
}

function downloadBytes(bytes: Uint8Array, fileName: string): void {
  const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = el('a', { href: url, download: fileName });
  link.click();
  URL.revokeObjectURL(url);
}

/** El hero: lo primero que ve un desconocido. Sin esto la app era HTML crudo que no explicaba
 *  qué es ni por qué pagar — y este comprador compra CONFIANZA antes que funciones. Los textos
 *  vienen de legal/textos.ts (fuente única, ya filtrada de vocabulario prohibido). */
function renderHero(root: HTMLElement): void {
  const hero = el('header', { class: 'hero' });

  const marca = el('p', { class: 'hero__marca' });
  marca.textContent = 'TachadoPDF';

  const titular = el('h1', { class: 'hero__titular' });
  titular.textContent = LANDING_TITULAR;

  const sub = el('p', { class: 'hero__sub' });
  sub.textContent = LANDING_SUBTITULO;

  const bullets = el('ul', { class: 'hero__bullets' });
  for (const t of [
    'El texto se elimina del archivo, no se tapa con un rectángulo negro.',
    'Todo ocurre en tu navegador: el documento no se sube a ningún servidor.',
    'Detección automática por patrones de DNI, NIE, IBAN, Nº de la Seguridad Social, teléfonos y emails.',
    'Informe de comprobación técnica descargable para tu expediente.',
  ]) {
    const li = el('li');
    li.textContent = t;
    bullets.appendChild(li);
  }

  const nicho = el('p', { class: 'hero__nicho' });
  nicho.textContent = LANDING_CASOS_USO_TEXTO;

  hero.append(marca, titular, sub, bullets, nicho);
  root.appendChild(hero);
}

export function initApp(root: HTMLElement): void {
  root.innerHTML = '';
  renderHero(root);

  const licenseInput = el('input', { type: 'text', placeholder: 'Clave de licencia Pro (Gumroad)' });
  const licenseButton = el('button', { type: 'button' });
  licenseButton.textContent = 'Verificar licencia';
  const licenseStatus = el('p', { class: 'estado-licencia' });

  const fileInput = el('input', { type: 'file', accept: 'application/pdf' });
  const quotaStatus = el('p', { class: 'estado-cuota' });
  const filesContainer = el('div', { id: 'files' });
  const scannedWarning = el('p', { class: 'aviso-rojo' });
  const resultStatus = el('p', { class: 'aviso-rojo' });

  const checkbox = el('input', { type: 'checkbox', id: 'checkbox-confirmado' });
  const checkboxLabel = el('label', { for: 'checkbox-confirmado' });
  checkboxLabel.textContent = CHECKBOX_LABEL;

  const downloadButton = el('button', { type: 'button' });
  downloadButton.textContent = 'Descargar documentos e informes';
  downloadButton.setAttribute('disabled', 'true');

  const scopeNotice = el('p', { class: 'aviso-principal' });
  scopeNotice.textContent = AVISO_PRINCIPAL;

  // Enlace de compra: sin esto, quien agota la cuota gratuita no sabe dónde comprar Pro.
  // Se muestra solo cuando NO hay Pro activo (a un cliente que ya pagó no se le vende nada).
  const proLink = el('a', {
    href: PRO_URL, target: '_blank', rel: 'noopener noreferrer',
    id: 'comprar-pro', class: 'comprar',
  });
  proLink.textContent = `Comprar Pro — ${PRECIO_PRO} (pago único)`;

  // Panel 1: el trabajo (subir el PDF y tacharlo).
  const panelTrabajo = el('section', { class: 'panel' });
  const tituloTrabajo = el('h2', { class: 'panel__titulo' });
  tituloTrabajo.textContent = 'Tacha tu documento';
  const filaArchivo = el('div', { class: 'fila' });
  filaArchivo.append(fileInput);
  const confirmacion = el('div', { class: 'confirmacion' });
  confirmacion.append(checkbox, checkboxLabel);
  panelTrabajo.append(
    tituloTrabajo, scopeNotice, filaArchivo, quotaStatus,
    filesContainer, scannedWarning, confirmacion, downloadButton, resultStatus,
  );

  // Panel 2: licencia y compra (separado del trabajo: no estorba a quien solo prueba).
  const panelPro = el('section', { class: 'panel' });
  const tituloPro = el('h2', { class: 'panel__titulo' });
  tituloPro.textContent = 'Versión Pro';
  const filaLicencia = el('div', { class: 'fila' });
  filaLicencia.append(licenseInput, licenseButton);
  panelPro.append(tituloPro, filaLicencia, licenseStatus, proLink);

  root.append(panelTrabajo, panelPro);
  renderLegalFooter(root);

  function refreshQuotaAndBatchUI(): void {
    if (canBatch(state)) {
      fileInput.setAttribute('multiple', 'true');
    } else {
      fileInput.removeAttribute('multiple');
    }
    quotaStatus.textContent = state.license.pro
      ? 'Licencia Pro activa: documentos ilimitados, procesado en lote.'
      : `Modo gratuito: ${state.quota.usedThisMonth}/${state.quota.limit} documentos usados este mes.`;
    // A quien ya pagó no se le enseña el enlace de compra; a quien agotó la cuota, más visible.
    proLink.hidden = state.license.pro;
    proLink.textContent = state.quota.allowed
      ? `Comprar Pro — ${PRECIO_PRO} (pago único)`
      : `Has agotado los ${state.quota.limit} documentos gratis de este mes · Comprar Pro — ${PRECIO_PRO} (pago único)`;
  }

  function refreshDownloadButton(): void {
    downloadButton.toggleAttribute('disabled', !(fileWorks.length > 0 && state.checkboxConfirmed));
    scannedWarning.textContent =
      state.scannedPages.length > 0
        ? `Atención: páginas sin capa de texto (probablemente escaneadas), revísalas manualmente: ${state.scannedPages
            .map((p) => p + 1)
            .join(', ')}.`
        : '';
  }

  checkbox.addEventListener('change', () => {
    state.checkboxConfirmed = checkbox.checked;
    refreshDownloadButton();
  });

  licenseButton.addEventListener('click', () => {
    void (async () => {
      state.license = await verifyLicense(licenseInput.value.trim());
      licenseStatus.textContent =
        state.license.reason === 'valid'
          ? 'Licencia Pro verificada.'
          : `Licencia no activa (${state.license.reason}). Modo gratuito.`;
      refreshQuotaAndBatchUI();
      refreshDownloadButton();
    })();
  });

  fileInput.addEventListener('change', () => {
    void (async () => {
      const files = fileInput.files ? Array.from(fileInput.files) : [];
      if (files.length === 0) return;

      if (!canProcess(state)) {
        quotaStatus.textContent = 'Cuota gratuita agotada este mes. Consigue una licencia Pro para continuar.';
        return;
      }
      if (files.length > 1 && !canBatch(state)) {
        quotaStatus.textContent = 'El procesado en lote requiere licencia Pro.';
        return;
      }

      fileWorks = [];
      filesContainer.innerHTML = '';
      resultStatus.textContent = '';
      state.scannedPages = [];
      checkbox.checked = false;
      state.checkboxConfirmed = false;

      for (const file of files) {
        const bytes = new Uint8Array(await file.arrayBuffer());
        const doc = await loadWithPassword(bytes, () => window.prompt('Contraseña del PDF'));

        const fileWork: FileWork = { fileName: file.name, bytes, manual: [], selected: [] };
        const fileContainer = el('div', { class: 'file-visor' });
        await renderFileVisor(fileContainer, doc, fileWork);
        doc.close();

        filesContainer.appendChild(fileContainer);
        fileWorks.push(fileWork);

        if (!state.license.pro) {
          await recordUse();
          state.quota = await getQuota();
        }
      }

      refreshQuotaAndBatchUI();
      refreshDownloadButton();
    })();
  });

  downloadButton.addEventListener('click', () => {
    void (async () => {
      if (fileWorks.length === 0 || !state.checkboxConfirmed) return;

      const processedFiles: ProcessedFile[] = [];
      let scannedUnion: number[] = [];
      for (const fw of fileWorks) {
        const result = await processDocument({
          bytes: fw.bytes,
          fileName: fw.fileName,
          freeVersion: !state.license.pro,
          manual: fw.manual,
          selectedAutomatic: fw.selected,
        });
        processedFiles.push({
          fileName: result.fileName,
          scannedPages: result.scannedPages,
          boxesPerPage: result.boxesPerPage,
          cleanedBytes: result.cleanedBytes,
          reportBytes: result.reportBytes,
          verify: result.verify,
        });
        scannedUnion = unionSorted(scannedUnion, result.scannedPages);
      }

      state.scannedPages = scannedUnion;
      resultStatus.textContent = processedFiles.every((f) => f.verify.clean)
        ? ''
        : 'Se han detectado residuos en algún documento del lote: no se ha descargado ningún fichero.';
      refreshDownloadButton();

      performBatchDownload(processedFiles, state.checkboxConfirmed, downloadBytes);
    })();
  });

  void (async () => {
    state.quota = await getQuota();
    refreshQuotaAndBatchUI();
    refreshDownloadButton();
  })();
}

const appRoot = document.getElementById('app');
if (appRoot) {
  initApp(appRoot);
}
