export type PatternKind = 'dni' | 'nie' | 'iban' | 'nuss' | 'telefono' | 'email';

export interface Hit {
  kind: PatternKind;
  value: string;
  start: number;
  end: number;
}

export interface BoxRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface PageMark {
  page: number;
  rects: BoxRect[];
}

export interface VerifyResidue {
  kind: PatternKind | 'manual';
  value: string;
  page: number | null;
}

export interface VerifyResult {
  clean: boolean;
  residues: VerifyResidue[];
}

export interface ReportData {
  fileName: string;
  sha256: string;
  date: string;
  patternsSearched: PatternKind[];
  boxesPerPage: { page: number; count: number }[];
  metadataRemoved: string[];
  scannedPages: number[];
  freeVersion: boolean;
  verify?: VerifyResult;
}

export interface LicenseStatus {
  pro: boolean;
  reason: 'valid' | 'invalid' | 'absent' | 'offline';
}

export interface QuotaStatus {
  usedThisMonth: number;
  limit: number;
  allowed: boolean;
}
