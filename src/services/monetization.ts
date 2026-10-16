import { ads } from './ads';
import { track } from './analytics';
import { purchases } from './purchases';
import { useSettingsStore } from '@/store/settingsStore';

let booted = false;
let adsStarted = false;

/** Mirrors a definitive store answer into the cached flag (both directions). */
function applyPremium(premium: boolean): void {
  const store = useSettingsStore.getState();
  if (store.premium !== premium) store.setPremium(premium);
}

/** Gathers consent and starts the ads SDK once, and only for free users. */
async function startAdsForFreeUser(): Promise<void> {
  if (adsStarted || useSettingsStore.getState().premium) return;
  adsStarted = true;
  try {
    await ads.init();
    ads.preload();
  } catch {
    // ignore
  }
}

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
      // A definitive answer wins over the cache, so a refunded or revoked purchase
      // loses premium; `null` (store unreachable) keeps the cached flag.
      if (premium !== null) applyPremium(premium);
      // Honour revocations pushed by the store while the app is open.
      purchases.onPremiumChange((now) => {
        applyPremium(now);
        if (!now) void startAdsForFreeUser();
      });
    }
  } catch {
    // ignore
  }
  await startAdsForFreeUser();
}

export async function buyPremium(): Promise<'purchased' | 'cancelled' | 'error' | 'unavailable'> {
  const result = await purchases.purchasePremium();
  if (result === 'purchased') {
    useSettingsStore.getState().setPremium(true);
    track({ name: 'premium_purchased' });
  }
  return result;
}

export async function restorePremium(): Promise<boolean> {
  const ok = await purchases.restore();
  if (ok) {
    useSettingsStore.getState().setPremium(true);
    track({ name: 'premium_restored' });
  }
  return ok;
}
