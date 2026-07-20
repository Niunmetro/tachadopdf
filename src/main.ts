import './estilo.css';
import {
  CHECKBOX_LABEL,
  canBatch,
  canProcess,
  performBatchDownload,
  withinFreePageLimit,
  type AppState,
} from './app';
import { PRECIO_PRO, PRO_URL } from './config';
import { FREE_MAX_PAGES, getQuota, recordUse } from './freemium/quota';
import { verifyLicense } from './license/gumroad';
import { renderGuias, renderLegalFooter } from './legal/render';
import {
  AVISO_PRINCIPAL,
  FAQ,
  LANDING_CASOS_USO_TEXTO,
  LANDING_DOLOR,
  LANDING_SUBTITULO,
  LANDING_TITULAR,
} from './legal/textos';
import { PdfPasswordError, loadPdf, type PdfDoc } from './pdf/engine';
import { detectAutomaticBoxes, processDocument } from './pdf/pipeline';
import type { BoxRect, PageMark, VerifyResult } from './types';
import { selectAll, type SelectionState, type Viewport } from './ui/boxes';
import { attachManualBoxDrawing, mountCanvas, renderHitOverlay, renderManualBoxes } from './ui/viewer';

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

  // Instrucción visible del tachado manual. Sin ella, nadie sabía que se podía tachar a mano
  // arrastrando el ratón (la queja "no deja tachar" del 2026-07-17).
  const comoTachar = el('p', { class: 'como-tachar' });
  comoTachar.textContent =
    'Los datos detectados aparecen marcados: haz clic para elegir cuáles tachar. Para tachar ' +
    'cualquier otra cosa (un nombre, una firma, una foto), arrastra el ratón sobre ella dibujando ' +
    'un recuadro. Cada recuadro negro tiene una «×» por si quieres quitarlo.';
  container.appendChild(comoTachar);

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
    // Las páginas escaneadas (sin capa de texto) NO se saltan: se renderizan igual para que el
    // usuario pueda TACHARLAS A MANO — son el caso más común en gestorías/administradores de
    // fincas. Antes se hacía `continue` y esas páginas no aparecían en el visor: imposible
    // tacharlas (bug cazado por Codex el 2026-07-17). No tienen hits automáticos (no hay texto).
    const necesitaRevisionVisual = visualReviewPages.includes(page);

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

    // El rótulo va FUERA del pageContainer: dentro empujaría la <img> hacia abajo mientras el
    // <canvas> (position:absolute; top:0) se queda arriba, desalineando el tachado manual en las
    // páginas escaneadas (bug cazado por Codex el 2026-07-17). El pageContainer solo lleva la
    // img y el canvas, perfectamente superpuestos.
    if (necesitaRevisionVisual) {
      const rotulo = el('p', { class: 'aviso-rojo' });
      rotulo.textContent = `Página ${page + 1}: sin capa de texto (escaneada). No hay detección automática — tacha a mano las zonas con datos.`;
      container.appendChild(rotulo);
    }

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
      renderManualBoxes({ container: pageContainer, viewport, page, getState, setState });
    };

    renderHitOverlay({ container: pageContainer, hitRects, viewport, getState, setState });
    renderManualBoxes({ container: pageContainer, viewport, page, getState, setState });
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

  // El dolor ANTES que la solución: quien no sabe que esto es sancionable no siente
  // urgencia. Cifras reales de la AEPD (verificadas), nada de miedo inventado.
  const dolor = el('p', { class: 'hero__dolor' });
  dolor.textContent = LANDING_DOLOR;

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

  hero.append(marca, titular, dolor, sub, bullets, nicho);
  root.appendChild(hero);
}

/** Preguntas frecuentes: responden las objeciones que frenan la compra (Acrobat, seguridad, si de
 *  verdad borra). Se renderiza como <details> para no ocupar pantalla; el contenido está en el DOM
 *  desde el inicio (bueno para SEO) y a un clic para el usuario. */
function renderFaq(root: HTMLElement): void {
  const doc = root.ownerDocument;
  const section = doc.createElement('section');
  section.className = 'panel faq';
  section.setAttribute('aria-label', 'Preguntas frecuentes');
  const titulo = doc.createElement('h2');
  titulo.className = 'panel__titulo';
  titulo.textContent = 'Preguntas frecuentes';
  section.appendChild(titulo);
  for (const item of FAQ) {
    const details = doc.createElement('details');
    details.className = 'faq__item';
    const summary = doc.createElement('summary');
    summary.textContent = item.pregunta;
    const respuesta = doc.createElement('p');
    respuesta.textContent = item.respuesta;
    details.append(summary, respuesta);
    section.appendChild(details);
  }
  root.appendChild(section);
}

export function initApp(root: HTMLElement): void {
  root.innerHTML = '';
  renderHero(root);

  const licenseInput = el('input', { type: 'text', placeholder: 'Clave de licencia Pro (Gumroad)' });
  const licenseButton = el('button', { type: 'button' });
  licenseButton.textContent = 'Verificar licencia';
  const licenseStatus = el('p', { class: 'estado-licencia' });

  const fileInput = el('input', { type: 'file', accept: 'application/pdf' });
  const ejemploBtn = el('button', { type: 'button', class: 'ejemplo' });
  ejemploBtn.textContent = 'Probar con un documento de ejemplo';
  const pistaEjemplo = el('p', { class: 'pista-ejemplo' });
  pistaEjemplo.textContent =
    '¿No tienes un PDF a mano, o prefieres no subir todavía un documento real? Carga un acta de ' +
    'comunidad de ejemplo (datos ficticios) y comprueba en cinco segundos cómo detecta y tacha.';
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
  filaArchivo.append(fileInput, ejemploBtn);
  const confirmacion = el('div', { class: 'confirmacion' });
  confirmacion.append(checkbox, checkboxLabel);
  panelTrabajo.append(
    tituloTrabajo, scopeNotice, filaArchivo, pistaEjemplo, quotaStatus,
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
  renderFaq(root);
  renderGuias(root);
  renderLegalFooter(root);

  function refreshQuotaAndBatchUI(): void {
    if (canBatch(state)) {
      fileInput.setAttribute('multiple', 'true');
    } else {
      fileInput.removeAttribute('multiple');
    }
    quotaStatus.textContent = state.license.pro
      ? 'Licencia Pro activa: documentos ilimitados, procesado en lote.'
      : `Modo gratuito: ${state.quota.usedThisMonth}/${state.quota.limit} documentos este mes · hasta ${FREE_MAX_PAGES} páginas por documento.`;
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

  /** Carga uno o varios PDF en el visor. Lo comparten la subida del usuario y el documento de
   *  ejemplo; `contarCuota` es lo único que cambia (el ejemplo no gasta cuota). */
  async function cargarEntradas(
    entradas: { bytes: Uint8Array; nombre: string }[],
    contarCuota: boolean,
  ): Promise<void> {
    fileWorks = [];
    filesContainer.innerHTML = '';
    resultStatus.textContent = '';
    state.scannedPages = [];
    checkbox.checked = false;
    state.checkboxConfirmed = false;

    // try/catch VISIBLE: sin esto, cualquier error de mupdf/render dejaba la pantalla muerta
    // (visor vacío, botón deshabilitado) sin decir nada — el usuario cree que "no funciona"
    // y no sabe por qué. Un fallo del procesado DEBE verse (doctrina 49: el silencio no vale).
    try {
      for (const entrada of entradas) {
        let doc: PdfDoc;
        try {
          doc = await loadWithPassword(entrada.bytes, () => window.prompt('Contraseña del PDF'));
        } catch {
          resultStatus.textContent = `No se pudo abrir "${entrada.nombre}". ¿Es un PDF válido? Si tiene contraseña, vuelve a intentarlo e introdúcela.`;
          continue;
        }

        // Muro de la versión gratuita: documentos de más de FREE_MAX_PAGES páginas requieren Pro.
        // Se comprueba con el PDF ya cargado (pageCount real) y ANTES de gastar cuota o montar el
        // visor. El trabajo profesional (actas, listados) cae aquí; el test honesto (1-3 págs) pasa.
        const pageCount = doc.pageCount();
        if (!withinFreePageLimit(state, pageCount)) {
          doc.close();
          resultStatus.textContent =
            `"${entrada.nombre}" tiene ${pageCount} páginas. La versión gratuita tacha documentos de ` +
            `hasta ${FREE_MAX_PAGES} páginas; para archivos más largos, consigue la licencia Pro (${PRECIO_PRO}, pago único).`;
          continue;
        }

        const fileWork: FileWork = { fileName: entrada.nombre, bytes: entrada.bytes, manual: [], selected: [] };
        const fileContainer = el('div', { class: 'file-visor' });
        try {
          await renderFileVisor(fileContainer, doc, fileWork);
        } finally {
          doc.close();
        }

        filesContainer.appendChild(fileContainer);
        fileWorks.push(fileWork);

        if (contarCuota && !state.license.pro) {
          await recordUse();
          state.quota = await getQuota();
        }
      }
    } catch (err) {
      resultStatus.textContent =
        'Error al procesar el documento en tu navegador. Recarga la página y prueba de nuevo; ' +
        'si persiste, el archivo puede no ser compatible. (Detalle técnico: ' +
        `${err instanceof Error ? err.message : String(err)})`;
    }

    refreshQuotaAndBatchUI();
    refreshDownloadButton();
  }

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

      const entradas: { bytes: Uint8Array; nombre: string }[] = [];
      for (const file of files) {
        entradas.push({ bytes: new Uint8Array(await file.arrayBuffer()), nombre: file.name });
      }
      await cargarEntradas(entradas, true);

      // Resetear el input: si no, volver a elegir el MISMO archivo (p.ej. tras contraseña mal o
      // un error) no dispara 'change' y parece que la app se ignora (Codex, 2026-07-17).
      fileInput.value = '';
    })();
  });

  // Gancho de activación: quien llega de un anuncio muchas veces no tiene un PDF a mano, y casi
  // nadie sube el acta REAL de su comunidad en el primer minuto — se va sin ver nada. Con un acta
  // ficticia ve la detección automática funcionando al instante. No gasta cuota: el documento es
  // nuestro y no le sirve para trabajar, así que regalarlo no abre ningún agujero.
  ejemploBtn.addEventListener('click', () => {
    void (async () => {
      ejemploBtn.setAttribute('disabled', 'true');
      try {
        // URL relativa al documento: sirve igual en el dominio propio (/) que en la ruta de
        // GitHub Pages (/tachadopdf/), sin depender de import.meta.env.
        const resp = await fetch('ejemplo-acta-comunidad.pdf');
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const bytes = new Uint8Array(await resp.arrayBuffer());
        await cargarEntradas([{ bytes, nombre: 'acta-de-ejemplo.pdf' }], false);
      } catch {
        resultStatus.textContent =
          'No se pudo cargar el documento de ejemplo. Prueba a subir tu propio PDF.';
      } finally {
        ejemploBtn.removeAttribute('disabled');
      }
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
