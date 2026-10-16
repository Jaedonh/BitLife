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
  /**
   * Current entitlement state from the store (cached by the SDK).
   * `true` / `false` are definitive answers (a refunded or revoked purchase is
   * `false`). `null` means the store could not answer (SDK missing or not
   * configured, lookup failed) so callers must keep whatever they had cached.
   */
  isPremium(): Promise<boolean | null>;
  /**
   * Subscribes to entitlement changes pushed by the store while the app is
   * open (refunds, revocations, restores). Returns an unsubscribe function.
   */
  onPremiumChange(listener: (premium: boolean) => void): () => void;
  /** Fetches the premium offer (price localized by the store). */
  getPremiumOffer(): Promise<PremiumOffer | null>;
  purchasePremium(): Promise<PurchaseOutcome>;
  /** Restores purchases; resolves to the premium state afterwards. */
  restore(): Promise<boolean>;
}
