import { CHECKBOX_LABEL, canBatch, canDownloadReport, canProcess, type AppState } from './app';
import { detect } from './detect/patterns';
import { getQuota, recordUse } from './freemium/quota';
import { verifyLicense } from './license/gumroad';
import { PdfPasswordError, loadPdf, type PdfDoc } from './pdf/engine';
import { stripMetadata } from './pdf/metadata';
import { verifyRedaction } from './pdf/verify';
import { buildReport, computeSha256 } from './report/report';
import type { BoxRect, PageMark, PatternKind, ReportData } from './types';
import { addBox, renderBoxes } from './ui/boxes';

const ALL_PATTERNS: PatternKind[] = ['dni', 'nie', 'iban', 'nuss', 'telefono', 'email'];

interface ProcessedFile {
  fileName: string;
  scannedPages: number[];
  boxesPerPage: { page: number; count: number }[];
  cleanedBytes: Uint8Array;
  reportBytes: Uint8Array;
}

const state: AppState = {
  checkboxConfirmed: false,
  verify: null,
  scannedPages: [],
  license: { pro: false, reason: 'absent' },
  quota: { usedThisMonth: 0, limit: 3, allowed: true },
};

let processedFiles: ProcessedFile[] = [];

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

async function markAutomaticHits(doc: PdfDoc): Promise<{ marks: PageMark[]; scannedPages: number[] }> {
  const scannedPages = doc.scannedPages();
  const total = doc.pageCount();
  let marks: PageMark[] = [];

  for (let page = 0; page < total; page++) {
    if (scannedPages.includes(page)) continue;
    const text = doc.extractText(page);
    for (const hit of detect(text)) {
      const rects: BoxRect[] = doc.searchText(page, hit.value);
      for (const rect of rects) {
        marks = addBox(marks, page, rect);
      }
    }
  }

  return { marks, scannedPages };
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

async function processOneFile(
  file: File,
  freeVersion: boolean,
  promptPassword: () => string | null,
): Promise<ProcessedFile> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const doc = await loadWithPassword(bytes, promptPassword);

  const { marks, scannedPages } = await markAutomaticHits(doc);
  doc.applyRedactions(marks);
  const redactedBytes = doc.save();
  doc.close();

  const { bytes: cleanedBytes, removed } = await stripMetadata(redactedBytes);

  const finalDoc = await loadPdf(cleanedBytes);
  const pageTexts = finalDoc.extractAllText();
  finalDoc.close();

  const verify = verifyRedaction(pageTexts, []);
  const boxesPerPage = marks.map((m) => ({ page: m.page, count: m.rects.length }));

  const reportData: ReportData = {
    fileName: file.name,
    sha256: await computeSha256(cleanedBytes),
    date: new Date().toISOString().slice(0, 10),
    patternsSearched: ALL_PATTERNS,
    boxesPerPage,
    metadataRemoved: removed,
    scannedPages,
    freeVersion,
  };
  const reportBytes = await buildReport(reportData);

  state.verify = verify;
  state.scannedPages = scannedPages;

  return { fileName: file.name, scannedPages, boxesPerPage, cleanedBytes, reportBytes };
}

function downloadBytes(bytes: Uint8Array, fileName: string): void {
  const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = el('a', { href: url, download: fileName });
  link.click();
  URL.revokeObjectURL(url);
}

export function initApp(root: HTMLElement): void {
  root.innerHTML = '';

  const licenseInput = el('input', { type: 'text', placeholder: 'Clave de licencia Pro (Gumroad)' });
  const licenseButton = el('button', { type: 'button' });
  licenseButton.textContent = 'Verificar licencia';
  const licenseStatus = el('p');

  const fileInput = el('input', { type: 'file', accept: 'application/pdf' });
  const quotaStatus = el('p');
  const boxesContainer = el('div', { id: 'boxes' });
  const scannedWarning = el('p');
  scannedWarning.style.color = '#b00020';

  const checkbox = el('input', { type: 'checkbox', id: 'checkbox-confirmado' });
  const checkboxLabel = el('label', { for: 'checkbox-confirmado' });
  checkboxLabel.textContent = CHECKBOX_LABEL;

  const downloadButton = el('button', { type: 'button' });
  downloadButton.textContent = 'Descargar documentos e informes';
  downloadButton.setAttribute('disabled', 'true');

  const scopeNotice = el('p');
  scopeNotice.textContent =
    'TachadoPDF elimina del archivo el texto seleccionado y los píxeles de las zonas marcadas. ' +
    'No garantiza que el documento quede libre de datos personales ni sustituye la revisión humana.';

  root.append(
    scopeNotice,
    licenseInput,
    licenseButton,
    licenseStatus,
    quotaStatus,
    fileInput,
    boxesContainer,
    scannedWarning,
    checkbox,
    checkboxLabel,
    downloadButton,
  );

  function refreshQuotaAndBatchUI(): void {
    if (canBatch(state)) {
      fileInput.setAttribute('multiple', 'true');
    } else {
      fileInput.removeAttribute('multiple');
    }
    quotaStatus.textContent = state.license.pro
      ? 'Licencia Pro activa: documentos ilimitados, procesado en lote.'
      : `Modo gratuito: ${state.quota.usedThisMonth}/${state.quota.limit} documentos usados este mes.`;
  }

  function refreshDownloadButton(): void {
    downloadButton.toggleAttribute('disabled', !canDownloadReport(state));
    scannedWarning.textContent =
      state.scannedPages.length > 0
        ? `Atención: páginas sin capa de texto (probablemente escaneadas), revísalas manualmente: ${state.scannedPages.join(', ')}.`
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

      processedFiles = [];
      checkbox.checked = false;
      state.checkboxConfirmed = false;

      for (const file of files) {
        const processed = await processOneFile(file, !state.license.pro, () => window.prompt('Contraseña del PDF'));
        processedFiles.push(processed);
        renderBoxes(boxesContainer, []);
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
    if (!canDownloadReport(state)) return;
    for (const processed of processedFiles) {
      downloadBytes(processed.cleanedBytes, processed.fileName);
      downloadBytes(processed.reportBytes, processed.fileName.replace(/\.pdf$/i, '') + '-informe.pdf');
    }
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
