import './estilo.css';
import {
  canBatch,
  canDownloadBatch,
  canProcess,
  performBatchDownload,
  reportFileName,
  withinFreePageLimit,
  type AppState,
} from './app';
import { PRO_URL } from './config';
import { contenidoDe, localeDelDocumento, type Contenido } from './content/index';
import { FREE_MAX_PAGES, getQuota, recordUse } from './freemium/quota';
import { verifyLicense } from './license/gumroad';
import { detect } from './detect/patterns';
import { patternsForPreset, type DocumentPreset } from './detect/presets';
import { PdfPasswordError, loadPdf, type PdfDoc } from './pdf/engine';
import { findAllOccurrenceMarks } from './pdf/occurrences';
import { detectAutomaticBoxes, processDocument } from './pdf/pipeline';
import type { BoxRect, PageMark, ReportData, VerifyResult } from './types';
import { selectAll, type SelectionState, type Viewport } from './ui/boxes';
import { buildPresetSelector } from './ui/preset-selector';
import { mergeOccurrenceMarks } from './ui/tachar-todas';
import { panelDeEntrega } from './ui/entrega';
import { attachManualBoxDrawing, mountCanvas, renderHitOverlay, renderManualBoxes } from './ui/viewer';

const RENDER_DPI = 96;

// loadPng se usa fuera de initApp y solo produce un mensaje de diagnostico interno que la
// interfaz vuelve a envolver en copia.errorProcesado; se resuelve una vez con el idioma del
// documento en lugar de arrastrar la copia por toda la cadena.
const ERROR_RENDER = contenidoDe(localeDelDocumento(document)).app.errorRender;

interface ProcessedFile {
  fileName: string;
  scannedPages: number[];
  boxesPerPage: { page: number; count: number }[];
  cleanedBytes: Uint8Array;
  reportBytes: Uint8Array;
  reportData: ReportData;
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
  quota: { usedThisMonth: 0, limit: 5, allowed: true },
};

let fileWorks: FileWork[] = [];
let currentPreset: DocumentPreset = 'generico';

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

/**
 * Escribe un rótulo marcando cuál de sus caracteres es el DATO (un DNI, un IBAN, un teléfono).
 * NO cambia el texto: los mismos caracteres en el mismo orden — `textContent` sigue siendo la
 * cadena entera. Lo único que cambia es que el identificador se pinta en la familia de datos,
 * que es donde el 0 y la O no se parecen. En los nueve botones de «tachar todas las apariciones»
 * los 33 primeros caracteres son idénticos y lo único que los distingue es ese valor: merece
 * ser lo que se lee primero.
 */
function etiquetarConDato(nodo: HTMLElement, rotulo: string, dato: string): void {
  const i = dato.length === 0 ? -1 : rotulo.indexOf(dato);
  if (i < 0) {
    nodo.textContent = rotulo;
    return;
  }
  nodo.textContent = '';
  const marca = el('span', { class: 'dato' });
  marca.textContent = dato;
  nodo.append(rotulo.slice(0, i), marca, rotulo.slice(i + dato.length));
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
      reject(new Error(ERROR_RENDER));
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
async function renderFileVisor(
  container: HTMLElement,
  doc: PdfDoc,
  fileWork: FileWork,
  preset: DocumentPreset,
  copia: Contenido['app'],
): Promise<void> {
  const visualReviewPages = doc.pagesNeedingVisualReview();
  const automaticBoxes = detectAutomaticBoxes(doc, visualReviewPages);
  const kindsPremarcados = new Set(patternsForPreset(preset));
  fileWork.selected = automaticBoxes.map((box) => kindsPremarcados.has(box.kind));

  const title = el('p');
  title.textContent = fileWork.fileName;
  container.appendChild(title);

  // Instrucción visible del tachado manual. Sin ella, nadie sabía que se podía tachar a mano
  // arrastrando el ratón (la queja "no deja tachar" del 2026-07-17).
  const comoTachar = el('p', { class: 'como-tachar' });
  comoTachar.textContent = copia.comoTachar;
  container.appendChild(comoTachar);

  if (visualReviewPages.length > 0) {
    const notice = el('p');
    notice.textContent = copia.revisionVisual(visualReviewPages.map((p) => p + 1).join(', '));
    container.appendChild(notice);
  }

  const total = doc.pageCount();

  // Botón "tachar todas las apariciones": por cada VALOR único detectado en el documento
  // (no por caja) precalculamos, con el doc todavía abierto, las marcas de TODAS sus apariciones
  // (incluida la propia). Al pulsar se fusionan en fileWork.manual (dedupe por rect exacto) y se
  // repinta; como fileWork.manual lo procesa processDocument igual que cualquier otro tachado
  // manual, el borrado es el mismo pipeline real + re-verificación, sin vía nueva.
  const valoresUnicos: string[] = [];
  const vistos = new Set<string>();
  for (let page = 0; page < total; page++) {
    if (visualReviewPages.includes(page)) continue;
    for (const hit of detect(doc.extractText(page))) {
      if (!vistos.has(hit.value)) {
        vistos.add(hit.value);
        valoresUnicos.push(hit.value);
      }
    }
  }

  const pageEntries: {
    page: number;
    container: HTMLElement;
    viewport: Viewport;
    getState: () => SelectionState;
    setState: (s: SelectionState) => void;
  }[] = [];

  if (valoresUnicos.length > 0) {
    const occContainer = el('div', { class: 'tachar-todas' });
    for (const valor of valoresUnicos) {
      const occ = findAllOccurrenceMarks(doc, valor, visualReviewPages);
      const n = occ.reduce((acc, m) => acc + m.rects.length, 0);
      if (n === 0) continue;
      const boton = el('button', { type: 'button' });
      etiquetarConDato(boton, copia.tacharTodas(valor, n), valor);
      boton.addEventListener('click', () => {
        fileWork.manual = mergeOccurrenceMarks(fileWork.manual, occ);
        for (const entry of pageEntries) {
          renderManualBoxes({
            container: entry.container,
            viewport: entry.viewport,
            page: entry.page,
            getState: entry.getState,
            setState: entry.setState,
            etiquetaQuitar: copia.quitarTachado,
          });
        }
      });
      occContainer.appendChild(boton);
    }
    container.appendChild(occContainer);
  }

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
      rotulo.textContent = copia.paginaEscaneada(page + 1);
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
      renderManualBoxes({
        container: pageContainer,
        viewport,
        page,
        getState,
        setState,
        etiquetaQuitar: copia.quitarTachado,
      });
    };

    renderHitOverlay({ container: pageContainer, hitRects, viewport, getState, setState });
    renderManualBoxes({
        container: pageContainer,
        viewport,
        page,
        getState,
        setState,
        etiquetaQuitar: copia.quitarTachado,
      });
    attachManualBoxDrawing({ canvas, viewport, page, getState, setState });
    pageEntries.push({ page, container: pageContainer, viewport, getState, setState });

    if (hitRects.length > 0) {
      const selectAllButton = el('button', { type: 'button' });
      selectAllButton.textContent = copia.seleccionarHits(page + 1);
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

/**
 * Localiza un hueco del HTML estático. El texto de la página (hero, FAQ, guías, legales) YA VIENE
 * en el HTML que emite src/content/generar.ts: la aplicación solo monta aquí dentro los controles
 * interactivos. Si el hueco no existiera —solo posible sirviendo un HTML que no salga del
 * generador— se crea, para que la herramienta siga funcionando aunque la página esté mal.
 */
function hueco(root: HTMLElement, id: string): HTMLElement {
  const encontrado = root.querySelector(`#${id}`);
  if (encontrado instanceof HTMLElement) return encontrado;
  const creado = el('section', { class: 'panel', id });
  root.appendChild(creado);
  return creado;
}

export function initApp(root: HTMLElement, contenido: Contenido): void {
  const copia = contenido.app;
  // Tres huecos dentro del panel de la herramienta, no uno. El orden de la primera pantalla lo
  // fija el HTML —zona de carga, «el archivo nunca sale de tu equipo», documento de ejemplo,
  // aviso de alcance—, y esas dos frases son texto INDEXABLE que tiene que seguir viniendo en el
  // HTML. Con un solo hueco al final, los controles caían detrás de los dos párrafos y el orden
  // se invertía.
  const panelCarga = hueco(root, 'carga');
  const panelGancho = hueco(root, 'gancho');
  const panelTrabajo = hueco(root, 'trabajo');
  const panelPro = hueco(root, 'licencia');

  const licenseInput = el('input', { type: 'text', placeholder: copia.licenciaPlaceholder });
  const licenseButton = el('button', { type: 'button' });
  licenseButton.textContent = copia.verificarLicencia;
  const licenseStatus = el('p', { class: 'estado-licencia' });

  const fileInput = el('input', { type: 'file', accept: 'application/pdf' });
  const ejemploBtn = el('button', { type: 'button', class: 'ejemplo' });
  ejemploBtn.textContent = copia.botonEjemplo;
  const pistaEjemplo = el('p', { class: 'pista-ejemplo' });
  pistaEjemplo.textContent = copia.pistaEjemplo;
  const quotaStatus = el('p', { class: 'estado-cuota' });
  const filesContainer = el('div', { id: 'files' });
  const scannedWarning = el('p', { class: 'aviso-rojo' });
  const resultStatus = el('p', { class: 'aviso-rojo' });
  const entregaContainer = el('div', { id: 'entrega' });

  const checkbox = el('input', { type: 'checkbox', id: 'checkbox-confirmado' });
  const checkboxLabel = el('label', { for: 'checkbox-confirmado' });
  checkboxLabel.textContent = copia.checkboxRevisado;

  // El ÚNICO relleno macizo del panel de trabajo: descargar es el final del trabajo.
  const downloadButton = el('button', { type: 'button', class: 'principal' });
  downloadButton.textContent = copia.botonDescargar;
  downloadButton.setAttribute('disabled', 'true');

  // Selector de tipo de documento: solo cambia qué categorías vienen premarcadas al montar el
  // visor de un fichero (T2). No altera la detección.
  // Medido a 390 px: era el control MÁS PEQUEÑO de la página (137×19 px) y estaba justo encima
  // de la zona de carga, con su rótulo al lado robándole el ancho. Pasa a campo de ancho
  // completo con el rótulo ENCIMA y 44 px de alto, que es la diana táctil de la casa.
  const presetLabel = el('label', { for: 'preset-tipo-documento' });
  presetLabel.textContent = copia.tipoDocumento;
  const presetSelector = buildPresetSelector(
    document,
    (preset) => {
      currentPreset = preset;
    },
    copia.presets,
  );
  const filaPreset = el('div', { class: 'campo' });
  filaPreset.append(presetLabel, presetSelector);

  // Enlace de compra: sin esto, quien agota la cuota gratuita no sabe dónde comprar Pro.
  // Se muestra solo cuando NO hay Pro activo (a un cliente que ya pagó no se le vende nada).
  const proLink = el('a', {
    href: PRO_URL, target: '_blank', rel: 'noopener noreferrer',
    id: 'comprar-pro', class: 'comprar',
  });
  proLink.textContent = copia.comprarPro;

  // Panel 1: el trabajo (subir el PDF y tacharlo). El título, la frase del procesado local y el
  // aviso de alcance ya vienen en el HTML estático; aquí solo se cuelgan los controles, en los
  // tres huecos que fijan el orden de la primera pantalla.
  const confirmacion = el('div', { class: 'confirmacion' });
  confirmacion.append(checkbox, checkboxLabel);
  panelCarga.append(filaPreset, fileInput);
  panelGancho.append(ejemploBtn, pistaEjemplo, quotaStatus);
  panelTrabajo.append(
    filesContainer, scannedWarning, confirmacion, downloadButton, resultStatus, entregaContainer,
  );

  // Panel 2: licencia y compra (separado del trabajo: no estorba a quien solo prueba).
  const filaLicencia = el('div', { class: 'fila' });
  filaLicencia.append(licenseInput, licenseButton);
  panelPro.append(filaLicencia, licenseStatus, proLink);

  function refreshQuotaAndBatchUI(): void {
    if (canBatch(state)) {
      fileInput.setAttribute('multiple', 'true');
    } else {
      fileInput.removeAttribute('multiple');
    }
    quotaStatus.textContent = state.license.pro
      ? copia.cuotaPro
      : copia.cuotaGratis(state.quota.usedThisMonth, state.quota.limit, FREE_MAX_PAGES);
    // A quien ya pagó no se le enseña el enlace de compra; a quien agotó la cuota, más visible.
    proLink.hidden = state.license.pro;
    proLink.textContent = state.quota.allowed
      ? copia.comprarPro
      : copia.comprarProCuotaAgotada(state.quota.limit);
  }

  function refreshDownloadButton(): void {
    // La casilla y el boton NO existen hasta que hay documento cargado. Ofrecer la declaracion
    // legal mas cargada del producto —afirmar que has revisado el documento— cuando todavia no hay
    // nada que revisar enseña a marcarla por inercia; y un boton deshabilitado era el elemento de
    // mas peso visual de la pantalla inicial mientras la accion real (cargar un PDF) era el
    // control menos diseñado de la pagina.
    const hayDocumento = fileWorks.length > 0;
    confirmacion.hidden = !hayDocumento;
    downloadButton.hidden = !hayDocumento;
    downloadButton.toggleAttribute('disabled', !(hayDocumento && state.checkboxConfirmed));
    scannedWarning.textContent =
      state.scannedPages.length > 0
        ? copia.avisoEscaneadas(state.scannedPages.map((p) => p + 1).join(', '))
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
          ? copia.licenciaValida
          : copia.licenciaNoActiva(state.license.reason);
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
    entregaContainer.innerHTML = '';
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
          doc = await loadWithPassword(entrada.bytes, () => window.prompt(copia.passwordPrompt));
        } catch {
          resultStatus.textContent = copia.noSePudoAbrir(entrada.nombre);
          continue;
        }

        // Muro de la versión gratuita: documentos de más de FREE_MAX_PAGES páginas requieren Pro.
        // Se comprueba con el PDF ya cargado (pageCount real) y ANTES de gastar cuota o montar el
        // visor. El trabajo profesional (actas, listados) cae aquí; el test honesto (1-3 págs) pasa.
        const pageCount = doc.pageCount();
        if (!withinFreePageLimit(state, pageCount)) {
          doc.close();
          resultStatus.textContent = copia.limitePaginas(entrada.nombre, pageCount, FREE_MAX_PAGES);
          continue;
        }

        const fileWork: FileWork = { fileName: entrada.nombre, bytes: entrada.bytes, manual: [], selected: [] };
        const fileContainer = el('div', { class: 'file-visor' });
        try {
          await renderFileVisor(fileContainer, doc, fileWork, currentPreset, copia);
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
      resultStatus.textContent = copia.errorProcesado(
        err instanceof Error ? err.message : String(err),
      );
    }

    refreshQuotaAndBatchUI();
    refreshDownloadButton();

    // El documento cargado, sus detecciones, la casilla y el botón nacen en `#trabajo`, que en la
    // portada larga (hero primero) vive muy por debajo de la zona de carga: al elegir el archivo la
    // vista no se movía y el usuario trabajaba a ciegas —«no aparece ninguna marca de que se ha
    // subido»—. Se lleva la vista al trabajo (o al mensaje de error, que también sale ahí) para que
    // el resultado esté donde el usuario mira. `scrollIntoView` no existe en jsdom: se protege.
    if (fileWorks.length > 0 || resultStatus.textContent !== '') {
      try {
        panelTrabajo.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } catch {
        /* entorno sin layout (tests): no hay nada que desplazar */
      }
    }
  }

  fileInput.addEventListener('change', () => {
    void (async () => {
      const files = fileInput.files ? Array.from(fileInput.files) : [];
      if (files.length === 0) return;

      if (!canProcess(state)) {
        quotaStatus.textContent = copia.cuotaAgotada;
        return;
      }
      if (files.length > 1 && !canBatch(state)) {
        quotaStatus.textContent = copia.loteRequierePro;
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
        // URL relativa AL DOCUMENTO, calculada por el generador y publicada en `data-ejemplo`:
        // sirve igual en el dominio propio (/), en la ruta de GitHub Pages (/tachadopdf/) y en
        // la portada de otro idioma (/en/), donde una ruta fija habría dado 404.
        const ejemploUrl = root.dataset['ejemplo'] ?? 'ejemplo-acta-comunidad.pdf';
        const resp = await fetch(ejemploUrl);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const bytes = new Uint8Array(await resp.arrayBuffer());
        await cargarEntradas([{ bytes, nombre: 'acta-de-ejemplo.pdf' }], false);
      } catch {
        resultStatus.textContent = copia.ejemploFallido;
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
          copia: contenido.informe,
        });
        processedFiles.push({
          fileName: result.fileName,
          scannedPages: result.scannedPages,
          boxesPerPage: result.boxesPerPage,
          cleanedBytes: result.cleanedBytes,
          reportBytes: result.reportBytes,
          reportData: result.reportData,
          verify: result.verify,
        });
        scannedUnion = unionSorted(scannedUnion, result.scannedPages);
      }

      state.scannedPages = scannedUnion;
      resultStatus.textContent = processedFiles.every((f) => f.verify.clean)
        ? ''
        : copia.residuosEnLote;
      refreshDownloadButton();

      const entregado = canDownloadBatch(processedFiles, state.checkboxConfirmed);
      performBatchDownload(processedFiles, state.checkboxConfirmed, downloadBytes, copia.sufijoInforme);
      entregaContainer.innerHTML = '';
      if (entregado) {
        for (const f of processedFiles) {
          entregaContainer.appendChild(
            panelDeEntrega(f, contenido.informe, reportFileName(f.fileName, copia.sufijoInforme)),
          );
        }
      }
    })();
  });

  void (async () => {
    state.quota = await getQuota();
    refreshQuotaAndBatchUI();
    refreshDownloadButton();
  })();
}

// El idioma sale de la RUTA (el HTML generado fija <html lang> segun donde vive la pagina),
// nunca de `navigator.language`.
const appRoot = document.getElementById('app');
if (appRoot) {
  initApp(appRoot, contenidoDe(localeDelDocumento(document)));
}
