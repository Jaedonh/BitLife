import { ads } from './ads';
import { track } from './analytics';
import { purchases } from './purchases';
import { useSettingsStore } from '@/store/settingsStore';

let booted = false;
let adsStarted = false;
/** Bumped by a successful purchase or restore, so a stale boot answer cannot undo it. */
let grantEpoch = 0;

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
  } finally {
    // Publish readiness through the store so screens drawn during startup re-render
    // and show their rewarded buttons once the SDK is up.
    useSettingsStore.getState().setAdsReady(ads.isReady());
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
      // Listen first, so an update the store pushes while the first query is in flight is not missed.
      purchases.onPremiumChange((now) => {
        applyPremium(now);
        if (!now) void startAdsForFreeUser();
      });
      const epoch = grantEpoch;
      const premium = await purchases.isPremium();
      // A definitive answer wins over the cache, so a refunded or revoked purchase
      // loses premium; `null` (store unreachable) keeps the cached flag. A `false`
      // that was requested before a purchase or restore finished is stale: ignore it.
      const stale = premium === false && grantEpoch !== epoch;
      if (premium !== null && !stale) applyPremium(premium);
    }
  } catch {
    // ignore
  }
  await startAdsForFreeUser();
}

export async function buyPremium(): Promise<'purchased' | 'cancelled' | 'error' | 'unavailable'> {
  const result = await purchases.purchasePremium();
  if (result === 'purchased') {
    grantEpoch++;
    useSettingsStore.getState().setPremium(true);
    track({ name: 'premium_purchased' });
  }
  return result;
}

export async function restorePremium(): Promise<boolean> {
  const ok = await purchases.restore();
  if (ok) {
    grantEpoch++;
    useSettingsStore.getState().setPremium(true);
    track({ name: 'premium_restored' });
  }
  return ok;
}
