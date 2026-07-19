import { describe, expect, it, vi } from 'vitest';
import {
  CHECKBOX_LABEL,
  canBatch,
  canDownloadBatch,
  canDownloadReport,
  canProcess,
  performBatchDownload,
  withinFreePageLimit,
  type AppState,
  type DownloadableFile,
} from './app';
import { FREE_MAX_PAGES } from './freemium/quota';
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

describe('withinFreePageLimit', () => {
  it('Pro no tiene tope de páginas (aunque el documento sea enorme)', () => {
    expect(withinFreePageLimit(baseState({ license: licensePro }), FREE_MAX_PAGES + 100)).toBe(true);
  });

  it('gratis: permite exactamente hasta FREE_MAX_PAGES páginas', () => {
    expect(withinFreePageLimit(baseState({ license: licenseFree }), FREE_MAX_PAGES)).toBe(true);
  });

  it('gratis: bloquea un documento con más de FREE_MAX_PAGES páginas', () => {
    expect(withinFreePageLimit(baseState({ license: licenseFree }), FREE_MAX_PAGES + 1)).toBe(false);
  });

  it('gratis: un documento de 1 página siempre pasa', () => {
    expect(withinFreePageLimit(baseState({ license: licenseFree }), 1)).toBe(true);
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

const fileSucio: DownloadableFile = {
  fileName: 'sucio.pdf',
  cleanedBytes: new Uint8Array([1]),
  reportBytes: new Uint8Array([2]),
  verify: verifyDirty,
};

const fileLimpio: DownloadableFile = {
  fileName: 'limpio.pdf',
  cleanedBytes: new Uint8Array([3]),
  reportBytes: new Uint8Array([4]),
  verify: verifyClean,
};

describe('canDownloadBatch', () => {
  it('false si hay algún fichero sucio en el lote', () => {
    expect(canDownloadBatch([fileSucio, fileLimpio], true)).toBe(false);
  });

  it('true si el único fichero está limpio y el checkbox está marcado', () => {
    expect(canDownloadBatch([fileLimpio], true)).toBe(true);
  });

  it('false si el único fichero está sucio', () => {
    expect(canDownloadBatch([fileSucio], true)).toBe(false);
  });

  it('false si la lista está vacía', () => {
    expect(canDownloadBatch([], true)).toBe(false);
  });
});

describe('performBatchDownload', () => {
  it('no invoca download para ningún fichero si el lote tiene uno sucio, aunque el checkbox esté marcado', () => {
    const download = vi.fn();
    performBatchDownload([fileSucio, fileLimpio], true, download);
    expect(download).not.toHaveBeenCalledWith(fileSucio.cleanedBytes, expect.anything());
    expect(download).not.toHaveBeenCalled();
  });
});
