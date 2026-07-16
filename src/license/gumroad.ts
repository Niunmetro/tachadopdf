import type { LicenseStatus } from '../types';
import { GUMROAD_PRODUCT_ID, GUMROAD_PRODUCT_PERMALINK } from '../config';

export const GUMROAD_VERIFY_URL = 'https://api.gumroad.com/v2/licenses/verify';

interface GumroadPurchase {
  refunded?: boolean;
  chargebacked?: boolean;
  subscription_cancelled_at?: string | null;
  subscription_failed_at?: string | null;
  subscription_ended_at?: string | null;
}

interface GumroadVerifyResponse {
  success: boolean;
  purchase?: GumroadPurchase;
}

function isSubscriptionActive(purchase: GumroadPurchase | undefined): boolean {
  if (!purchase) {
    return true;
  }
  if (purchase.refunded || purchase.chargebacked) {
    return false;
  }
  if (purchase.subscription_cancelled_at || purchase.subscription_failed_at || purchase.subscription_ended_at) {
    return false;
  }
  return true;
}

export async function verifyLicense(licenseKey: string, fetchImpl?: typeof fetch): Promise<LicenseStatus> {
  if (!licenseKey) {
    return { pro: false, reason: 'absent' };
  }

  const doFetch = fetchImpl ?? fetch;
  const body = new URLSearchParams();
  body.set('product_id', GUMROAD_PRODUCT_ID);
  body.set('product_permalink', GUMROAD_PRODUCT_PERMALINK);
  body.set('license_key', licenseKey);

  try {
    const response = await doFetch(GUMROAD_VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
    const data = (await response.json()) as GumroadVerifyResponse;
    if (data.success && isSubscriptionActive(data.purchase)) {
      return { pro: true, reason: 'valid' };
    }
    return { pro: false, reason: 'invalid' };
  } catch {
    return { pro: false, reason: 'offline' };
  }
}
