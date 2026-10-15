import type { ComponentType } from 'react';

export type RewardedResult = 'earned' | 'dismissed' | 'unavailable' | 'error';

export interface AdsService {
  /** Gathers consent (UMP / ATT) and initialises the SDK. Safe to call repeatedly. */
  init(): Promise<void>;
  /** True when the SDK is initialised and ads may be requested. */
  isReady(): boolean;
  /** True on platforms where the ads SDK exists (never on web / Expo Go). */
  isSupported(): boolean;
  /** Preloads an interstitial and a rewarded ad. */
  preload(): void;
  /** Shows the loaded interstitial. Resolves when it closes; false if nothing was shown. */
  showInterstitial(): Promise<boolean>;
  /** Shows the loaded rewarded ad and reports whether the reward was earned. */
  showRewarded(): Promise<RewardedResult>;
  /** Whether a rewarded ad is loaded right now (UI can grey out the button). */
  isRewardedLoaded(): boolean;
  /** Privacy options form (GDPR). */
  isPrivacyOptionsRequired(): boolean;
  showPrivacyOptions(): Promise<void>;
  /** Banner component, or null where banners are unsupported. */
  Banner: ComponentType<{ onHeight?: (h: number) => void }> | null;
}
