import type { QuotaStatus } from '../types';

export function getQuotaStatus(): QuotaStatus {
  throw new Error('no implementado');
}

export function registerUsage(): QuotaStatus {
  throw new Error('no implementado');
}
