import { describe, expect, it } from 'vitest';
import type {
  BoxRect,
  Hit,
  LicenseStatus,
  PageMark,
  PatternKind,
  QuotaStatus,
  ReportData,
  VerifyResidue,
  VerifyResult,
} from './types';

describe('src/types.ts', () => {
  it('expone las formas del contrato', () => {
    const kind: PatternKind = 'dni';
    const hit: Hit = { kind, value: '12345678Z', start: 0, end: 9 };
    const rect: BoxRect = { x: 0, y: 0, w: 10, h: 10 };
    const mark: PageMark = { page: 1, rects: [rect] };
    const residue: VerifyResidue = { kind: 'manual', value: 'x', page: null };
    const verify: VerifyResult = { clean: true, residues: [residue] };
    const report: ReportData = {
      fileName: 'a.pdf',
      sha256: 'abc',
      date: '2026-07-16',
      patternsSearched: [kind],
      boxesPerPage: [{ page: 1, count: 1 }],
      metadataRemoved: [],
      scannedPages: [],
      freeVersion: true,
    };
    const license: LicenseStatus = { pro: false, reason: 'absent' };
    const quota: QuotaStatus = { usedThisMonth: 0, limit: 3, allowed: true };

    expect(hit.kind).toBe('dni');
    expect(mark.rects).toHaveLength(1);
    expect(verify.residues).toHaveLength(1);
    expect(report.patternsSearched).toContain('dni');
    expect(license.reason).toBe('absent');
    expect(quota.allowed).toBe(true);
  });
});

describe('stubs importables', () => {
  it('src/detect/patterns.ts no rompe al importar', async () => {
    await expect(import('./detect/patterns')).resolves.toBeDefined();
  });

  it('src/pdf/engine.ts no rompe al importar', async () => {
    await expect(import('./pdf/engine')).resolves.toBeDefined();
  });

  it('src/pdf/metadata.ts no rompe al importar', async () => {
    await expect(import('./pdf/metadata')).resolves.toBeDefined();
  });

  it('src/pdf/verify.ts no rompe al importar', async () => {
    await expect(import('./pdf/verify')).resolves.toBeDefined();
  });

  it('src/report/report.ts no rompe al importar', async () => {
    await expect(import('./report/report')).resolves.toBeDefined();
  });

  it('src/license/gumroad.ts no rompe al importar', async () => {
    await expect(import('./license/gumroad')).resolves.toBeDefined();
  });

  it('src/freemium/quota.ts no rompe al importar', async () => {
    await expect(import('./freemium/quota')).resolves.toBeDefined();
  });

  it('src/ui/boxes.ts no rompe al importar', async () => {
    await expect(import('./ui/boxes')).resolves.toBeDefined();
  });

  it('src/app.ts no rompe al importar', async () => {
    await expect(import('./app')).resolves.toBeDefined();
  });

  it('src/config.ts expone los placeholders de Gumroad', async () => {
    const config = await import('./config');
    expect(typeof config.GUMROAD_PRODUCT_PERMALINK).toBe('string');
    expect(typeof config.GUMROAD_PRODUCT_ID).toBe('string');
  });
});
