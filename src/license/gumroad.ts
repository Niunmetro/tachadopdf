import type { LicenseStatus } from '../types';

export async function checkLicense(_key: string): Promise<LicenseStatus> {
  throw new Error('no implementado');
}
