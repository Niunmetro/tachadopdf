import { FREE_MAX_PAGES } from './freemium/quota';
import type { LicenseStatus, QuotaStatus, VerifyResult } from './types';

export interface AppState {
  checkboxConfirmed: boolean;
  verify: VerifyResult | null;
  scannedPages: number[];
  license: LicenseStatus;
  quota: QuotaStatus;
}

export const CHECKBOX_LABEL = 'He revisado visualmente el documento final página a página';

export function canProcess(s: AppState): boolean {
  return s.license.pro || s.quota.allowed;
}

// Muro de páginas de la versión gratuita: Pro no tiene tope; en gratis, hasta FREE_MAX_PAGES.
// Es el gate robusto (no depende del contador reseteable) que empuja el trabajo real hacia Pro.
export function withinFreePageLimit(s: AppState, pageCount: number): boolean {
  return s.license.pro || pageCount <= FREE_MAX_PAGES;
}

export function canDownloadReport(s: AppState): boolean {
  return s.verify !== null && s.verify.clean && s.checkboxConfirmed;
}

export function canBatch(s: AppState): boolean {
  return s.license.pro;
}

export interface DownloadableFile {
  fileName: string;
  cleanedBytes: Uint8Array;
  reportBytes: Uint8Array;
  verify: VerifyResult;
}

export function canDownloadBatch(files: DownloadableFile[], checkboxConfirmed: boolean): boolean {
  return files.length > 0 && files.every((f) => f.verify.clean) && checkboxConfirmed;
}

export function performBatchDownload(
  files: DownloadableFile[],
  checkboxConfirmed: boolean,
  download: (bytes: Uint8Array, name: string) => void,
): void {
  if (!canDownloadBatch(files, checkboxConfirmed)) return;
  for (const f of files) {
    download(f.cleanedBytes, f.fileName);
    download(f.reportBytes, f.fileName);
  }
}
