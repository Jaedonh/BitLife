export type PurchaseOutcome = 'purchased' | 'cancelled' | 'error' | 'unavailable';

export interface PremiumOffer {
  title: string;
  description: string;
  priceString: string;
}

export interface PurchasesService {
  /** Configures the SDK. Safe to call repeatedly. */
  init(): Promise<void>;
  /** True when a store-backed purchase flow exists on this platform/build. */
  isSupported(): boolean;
  /** Current entitlement state from the store (cached by the SDK). */
  isPremium(): Promise<boolean>;
  /** Fetches the premium offer (price localized by the store). */
  getPremiumOffer(): Promise<PremiumOffer | null>;
  purchasePremium(): Promise<PurchaseOutcome>;
  /** Restores purchases; resolves to the premium state afterwards. */
  restore(): Promise<boolean>;
}
