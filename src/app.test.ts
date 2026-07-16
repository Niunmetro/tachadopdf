import { describe, expect, it } from 'vitest';
import { CHECKBOX_LABEL, canBatch, canDownloadReport, canProcess, type AppState } from './app';
import type { LicenseStatus, QuotaStatus, VerifyResult } from './types';

const licensePro: LicenseStatus = { pro: true, reason: 'valid' };
const licenseFree: LicenseStatus = { pro: false, reason: 'absent' };

const quotaAllowed: QuotaStatus = { usedThisMonth: 0, limit: 3, allowed: true };
const quotaExhausted: QuotaStatus = { usedThisMonth: 3, limit: 3, allowed: false };

const verifyClean: VerifyResult = { clean: true, residues: [] };
const verifyDirty: VerifyResult = {
  clean: false,
  residues: [{ kind: 'dni', value: '12345678Z', page: 0 }],
};

function baseState(overrides: Partial<AppState> = {}): AppState {
  return {
    checkboxConfirmed: false,
    verify: null,
    scannedPages: [],
    license: licenseFree,
    quota: quotaAllowed,
    ...overrides,
  };
}

describe('CHECKBOX_LABEL', () => {
  it('es exactamente el texto legal exigido', () => {
    expect(CHECKBOX_LABEL).toBe('He revisado visualmente el documento final página a página');
  });
});

describe('canProcess', () => {
  it('true si Pro, aunque la cuota gratuita esté agotada', () => {
    expect(canProcess(baseState({ license: licensePro, quota: quotaExhausted }))).toBe(true);
  });

  it('true si gratis y la cuota permite', () => {
    expect(canProcess(baseState({ license: licenseFree, quota: quotaAllowed }))).toBe(true);
  });

  it('false si gratis y la cuota está agotada', () => {
    expect(canProcess(baseState({ license: licenseFree, quota: quotaExhausted }))).toBe(false);
  });

  it('true si Pro y además la cuota permite (caso trivial)', () => {
    expect(canProcess(baseState({ license: licensePro, quota: quotaAllowed }))).toBe(true);
  });
});

describe('canDownloadReport', () => {
  it('false si verify es null, aunque el resto esté en orden', () => {
    expect(
      canDownloadReport(baseState({ verify: null, checkboxConfirmed: true })),
    ).toBe(false);
  });

  it('false si verify.clean es false', () => {
    expect(
      canDownloadReport(baseState({ verify: verifyDirty, checkboxConfirmed: true })),
    ).toBe(false);
  });

  it('false si el checkbox no está marcado, aunque verify esté limpio', () => {
    expect(
      canDownloadReport(baseState({ verify: verifyClean, checkboxConfirmed: false })),
    ).toBe(false);
  });

  it('true si verify limpio y checkbox marcado', () => {
    expect(
      canDownloadReport(baseState({ verify: verifyClean, checkboxConfirmed: true })),
    ).toBe(true);
  });

  it('páginas escaneadas no bloquean la descarga si el resto está en orden', () => {
    expect(
      canDownloadReport(
        baseState({ verify: verifyClean, checkboxConfirmed: true, scannedPages: [2, 5] }),
      ),
    ).toBe(true);
  });
});

describe('canBatch', () => {
  it('true si license.pro es true', () => {
    expect(canBatch(baseState({ license: licensePro }))).toBe(true);
  });

  it('false si license.pro es false', () => {
    expect(canBatch(baseState({ license: licenseFree }))).toBe(false);
  });
});
