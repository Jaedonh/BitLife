import type { PurchasesService } from './types';

/** Web + TypeScript default: purchases unavailable. Metro picks purchasesImpl.native.ts on iOS/Android. */
export const purchases: PurchasesService = {
  init: async () => {},
  isSupported: () => false,
  isPremium: async () => null,
  onPremiumChange: () => () => {},
  getPremiumOffer: async () => null,
  purchasePremium: async () => 'unavailable',
  restore: async () => false,
};
