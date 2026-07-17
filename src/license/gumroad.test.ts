import { describe, expect, it, vi } from 'vitest';
import { GUMROAD_PRODUCT_ID } from '../config';
import { GUMROAD_VERIFY_URL, verifyLicense } from './gumroad';

function jsonResponse(body: unknown, ok = true): Response {
  return {
    ok,
    json: async () => body,
  } as Response;
}

describe('verifyLicense', () => {
  it('clave vacía → {pro:false, reason:"absent"} sin llamar a la red', async () => {
    const fetchImpl = vi.fn();

    const resultado = await verifyLicense('', fetchImpl);

    expect(resultado).toEqual({ pro: false, reason: 'absent' });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('clave ausente (undefined) → {pro:false, reason:"absent"} sin llamar a la red', async () => {
    const fetchImpl = vi.fn();

    const resultado = await verifyLicense(undefined as unknown as string, fetchImpl);

    expect(resultado).toEqual({ pro: false, reason: 'absent' });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('éxito y suscripción activa → {pro:true, reason:"valid"}', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse({
        success: true,
        purchase: {
          refunded: false,
          chargebacked: false,
          subscription_cancelled_at: null,
          subscription_failed_at: null,
          subscription_ended_at: null,
        },
      }),
    );

    const resultado = await verifyLicense('CLAVE-VALIDA', fetchImpl);

    expect(resultado).toEqual({ pro: true, reason: 'valid' });
  });

  it('éxito pero suscripción cancelada → {pro:false, reason:"invalid"}', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse({
        success: true,
        purchase: {
          subscription_cancelled_at: '2026-01-01T00:00:00Z',
        },
      }),
    );

    const resultado = await verifyLicense('CLAVE-CANCELADA', fetchImpl);

    expect(resultado).toEqual({ pro: false, reason: 'invalid' });
  });

  it('respuesta de clave inválida → {pro:false, reason:"invalid"}', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse({ success: false, message: 'This license does not exist for the provided product.' }),
    );

    const resultado = await verifyLicense('CLAVE-INVALIDA', fetchImpl);

    expect(resultado).toEqual({ pro: false, reason: 'invalid' });
  });

  it('fallo de red → {pro:false, reason:"offline"}', async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error('network error'));

    const resultado = await verifyLicense('CUALQUIER-CLAVE', fetchImpl);

    expect(resultado).toEqual({ pro: false, reason: 'offline' });
  });

  it('respuesta con JSON inválido → {pro:false, reason:"offline"}', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => {
        throw new Error('invalid json');
      },
    } as unknown as Response);

    const resultado = await verifyLicense('CUALQUIER-CLAVE', fetchImpl);

    expect(resultado).toEqual({ pro: false, reason: 'offline' });
  });

  it('respuesta ok con success:true pero sin purchase → {pro:false} (fail-closed)', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ success: true }));

    const resultado = await verifyLicense('CLAVE-SIN-PURCHASE', fetchImpl);

    expect(resultado.pro).toBe(false);
  });

  it('respuesta HTTP no-ok (404) aunque el json diga success:true → {pro:false, reason:"invalid"}', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse(
        {
          success: true,
          purchase: {
            refunded: false,
            chargebacked: false,
            subscription_cancelled_at: null,
            subscription_failed_at: null,
            subscription_ended_at: null,
          },
        },
        false,
      ),
    );

    const resultado = await verifyLicense('CLAVE-404', fetchImpl);

    expect(resultado).toEqual({ pro: false, reason: 'invalid' });
  });

  // La pertenencia al producto la garantiza la API server-side, NO el cliente. Verificado
  // empíricamente contra api.gumroad.com el 2026-07-17: enviando nuestro product_id, una clave
  // ajena responde {"success":false,"message":"That license does not exist for the provided
  // product."} — o sea, `success:true` YA implica que la licencia es de NUESTRO producto.
  // Por eso no re-comparamos el product_id devuelto: si Gumroad lo formatea distinto del que
  // se usa para verificar, rechazaríamos compras legítimas (falso negativo que cuesta dinero).
  // Este test fija esa decisión: la envoltura de la respuesta no puede vetar una compra válida.
  it('success:true con compra activa → pro:true (el matching de producto es server-side)', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse({
        success: true,
        purchase: {
          refunded: false,
          chargebacked: false,
          subscription_cancelled_at: null,
          subscription_failed_at: null,
          subscription_ended_at: null,
        },
      }),
    );

    const resultado = await verifyLicense('CLAVE-VALIDA', fetchImpl);

    expect(resultado).toEqual({ pro: true, reason: 'valid' });
    // y se envió NUESTRO product_id, que es lo que hace válido el filtro server-side:
    const llamada = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(String(llamada[1].body)).toContain('product_id=');
  });

  it('purchase activa del producto correcto (product_id coincide) → {pro:true, reason:"valid"}', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse({
        success: true,
        purchase: {
          refunded: false,
          chargebacked: false,
          subscription_cancelled_at: null,
          subscription_failed_at: null,
          subscription_ended_at: null,
        },
        product_id: GUMROAD_PRODUCT_ID,
      }),
    );

    const resultado = await verifyLicense('CLAVE-PRODUCTO-CORRECTO', fetchImpl);

    expect(resultado).toEqual({ pro: true, reason: 'valid' });
  });

  it('la URL de destino es exactamente api.gumroad.com', async () => {
    expect(GUMROAD_VERIFY_URL).toBe('https://api.gumroad.com/v2/licenses/verify');
    expect(new URL(GUMROAD_VERIFY_URL).hostname).toBe('api.gumroad.com');

    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ success: false }));

    await verifyLicense('CLAVE-CUALQUIERA', fetchImpl);

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const urlLlamada = fetchImpl.mock.calls[0]?.[0];
    expect(urlLlamada).toBe(GUMROAD_VERIFY_URL);
    expect(new URL(String(urlLlamada)).hostname).toBe('api.gumroad.com');
  });

  it('no hace ninguna otra petición de red aparte de la verificación', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ success: true, purchase: {} }));

    await verifyLicense('CLAVE-VALIDA', fetchImpl);

    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
});
