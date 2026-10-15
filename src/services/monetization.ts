import { ads } from './ads';
import { purchases } from './purchases';
import { useSettingsStore } from '@/store/settingsStore';

let booted = false;

/**
 * App-launch bootstrap: configure purchases, re-validate the premium
 * entitlement, then (for free users) gather consent and start the ads SDK.
 * Never throws; every failure degrades to "no ads / not premium".
 */
export async function bootMonetization(): Promise<void> {
  if (booted) return;
  booted = true;
  try {
    await purchases.init();
    if (purchases.isSupported()) {
      const premium = await purchases.isPremium();
      // Only downgrade when the store answers definitively; keep the cached flag if offline.
      if (premium) useSettingsStore.getState().setPremium(true);
    }
  } catch {
    // ignore
  }
  if (!useSettingsStore.getState().premium) {
    try {
      await ads.init();
      ads.preload();
    } catch {
      // ignore
    }
  }
}

export async function buyPremium(): Promise<'purchased' | 'cancelled' | 'error' | 'unavailable'> {
  const result = await purchases.purchasePremium();
  if (result === 'purchased') useSettingsStore.getState().setPremium(true);
  return result;
}

export async function restorePremium(): Promise<boolean> {
  const ok = await purchases.restore();
  if (ok) useSettingsStore.getState().setPremium(true);
  return ok;
}
