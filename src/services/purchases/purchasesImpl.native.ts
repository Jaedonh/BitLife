import type { CustomerInfo } from 'react-native-purchases';

import { PREMIUM_ENTITLEMENT, PREMIUM_PRODUCT_ID, revenueCatApiKey } from '@/config/monetization';
import type { PremiumOffer, PurchaseOutcome, PurchasesService } from './types';

/**
 * RevenueCat-backed purchases. Lazily required so Expo Go and builds without
 * an API key degrade to "unavailable" instead of crashing.
 */
type RC = typeof import('react-native-purchases');

let rc: RC | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  rc = require('react-native-purchases') as RC;
} catch {
  rc = null;
}

let configured = false;

function Purchases() {
  return rc ? rc.default : null;
}

async function init(): Promise<void> {
  const P = Purchases();
  if (!P || configured || !revenueCatApiKey) return;
  try {
    P.configure({ apiKey: revenueCatApiKey });
    configured = true;
  } catch {
    configured = false;
  }
}

function hasPremium(info: CustomerInfo): boolean {
  return info.entitlements.active[PREMIUM_ENTITLEMENT] != null;
}

/**
 * `null` when the store cannot answer (no SDK, not configured, lookup failed)
 * so the caller keeps its cached flag; `false` only when the SDK answered and
 * the entitlement is not active (never bought, refunded, revoked).
 */
async function isPremium(): Promise<boolean | null> {
  const P = Purchases();
  if (!P || !configured) return null;
  try {
    const info = await P.getCustomerInfo();
    return hasPremium(info);
  } catch {
    return null;
  }
}

function onPremiumChange(listener: (premium: boolean) => void): () => void {
  const P = Purchases();
  if (!P || !configured) return () => {};
  const rcListener = (info: CustomerInfo) => listener(hasPremium(info));
  try {
    P.addCustomerInfoUpdateListener(rcListener);
  } catch {
    return () => {};
  }
  return () => {
    try {
      P.removeCustomerInfoUpdateListener(rcListener);
    } catch {
      // ignore
    }
  };
}

async function findPremiumPackage() {
  const P = Purchases();
  if (!P || !configured) return null;
  const offerings = await P.getOfferings();
  const current = offerings.current;
  const all = Object.values(offerings.all);
  const candidates = current ? [current, ...all] : all;
  for (const offering of candidates) {
    if (offering.lifetime) return offering.lifetime;
    const pkg = offering.availablePackages.find((p) => p.product.identifier === PREMIUM_PRODUCT_ID);
    if (pkg) return pkg;
    if (offering.availablePackages[0]) return offering.availablePackages[0];
  }
  return null;
}

async function getPremiumOffer(): Promise<PremiumOffer | null> {
  try {
    const pkg = await findPremiumPackage();
    if (!pkg) return null;
    return {
      title: pkg.product.title,
      description: pkg.product.description,
      priceString: pkg.product.priceString,
    };
  } catch {
    return null;
  }
}

async function purchasePremium(): Promise<PurchaseOutcome> {
  const P = Purchases();
  if (!P || !configured) return 'unavailable';
  try {
    const pkg = await findPremiumPackage();
    if (!pkg) return 'unavailable';
    const result = await P.purchasePackage(pkg);
    return hasPremium(result.customerInfo) ? 'purchased' : 'error';
  } catch (e: unknown) {
    const err = e as { userCancelled?: boolean; code?: string | number };
    if (err?.userCancelled || String(err?.code) === String(rc?.PURCHASES_ERROR_CODE?.PURCHASE_CANCELLED_ERROR)) {
      return 'cancelled';
    }
    return 'error';
  }
}

async function restore(): Promise<boolean> {
  const P = Purchases();
  if (!P || !configured) return false;
  try {
    const info = await P.restorePurchases();
    return hasPremium(info);
  } catch {
    return false;
  }
}

export const purchases: PurchasesService = {
  init,
  isSupported: () => rc != null && !!revenueCatApiKey,
  isPremium,
  onPremiumChange,
  getPremiumOffer,
  purchasePremium,
  restore,
};
