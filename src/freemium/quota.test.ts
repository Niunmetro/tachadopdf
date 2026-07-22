import { beforeEach, describe, expect, it } from 'vitest';
import 'fake-indexeddb/auto';
import { FREE_MONTHLY_LIMIT, getQuota, recordUse } from './quota';

describe('freemium/quota', () => {
  beforeEach(() => {
    indexedDB = new IDBFactory();
  });

  it('empieza en 0 usos y permite otro documento', async () => {
    const status = await getQuota(new Date('2026-07-16T10:00:00Z'));
    expect(status.usedThisMonth).toBe(0);
    expect(status.limit).toBe(FREE_MONTHLY_LIMIT);
    expect(status.allowed).toBe(true);
  });

  it('al agotar el límite mensual deja de permitir otro documento', async () => {
    const now = new Date('2026-07-16T10:00:00Z');
    // Consumir EXACTAMENTE el límite (sea cual sea): robusto ante cambios del valor.
    for (let i = 0; i < FREE_MONTHLY_LIMIT; i++) await recordUse(now);

    const status = await getQuota(now);
    expect(status.usedThisMonth).toBe(FREE_MONTHLY_LIMIT);
    expect(status.limit).toBe(FREE_MONTHLY_LIMIT);
    expect(status.allowed).toBe(false);
  });

  it('permite documentos mientras no se alcance el límite', async () => {
    const now = new Date('2026-07-16T10:00:00Z');
    await recordUse(now); // 1 usado, con el límite >= 2 debe seguir permitiendo
    const status = await getQuota(now);
    expect(status.allowed).toBe(FREE_MONTHLY_LIMIT > 1);
  });

  it('reinicia el contador al cambiar de mes', async () => {
    const julio = new Date('2026-07-16T10:00:00Z');
    const agosto = new Date('2026-08-01T00:00:00Z');

    for (let i = 0; i < FREE_MONTHLY_LIMIT; i++) await recordUse(julio);

    const estadoJulio = await getQuota(julio);
    expect(estadoJulio.allowed).toBe(false);

    const estadoAgosto = await getQuota(agosto);
    expect(estadoAgosto.usedThisMonth).toBe(0);
    expect(estadoAgosto.allowed).toBe(true);
  });

  it('getQuota devuelve limit === 5', async () => {
    const status = await getQuota(new Date('2026-07-16T10:00:00Z'));
    expect(status.limit).toBe(5);
  });

  it('reinicio por mes: recordUse en un mes y getQuota en otro mes distinto', async () => {
    const mesUno = new Date('2026-07-16T10:00:00Z');
    const mesDos = new Date('2026-08-15T10:00:00Z');

    await recordUse(mesUno);
    const estadoMesUno = await getQuota(mesUno);
    expect(estadoMesUno.usedThisMonth).toBe(1);

    const estadoMesDos = await getQuota(mesDos);
    expect(estadoMesDos.usedThisMonth).toBe(0);
    expect(estadoMesDos.allowed).toBe(true);
  });
});
