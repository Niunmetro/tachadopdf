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

export function canDownloadReport(s: AppState): boolean {
  return s.verify !== null && s.verify.clean && s.checkboxConfirmed;
}

export function canBatch(s: AppState): boolean {
  return s.license.pro;
}
