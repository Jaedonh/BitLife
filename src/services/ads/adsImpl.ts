import type { AdsService } from './types';

/** Web + TypeScript default: no ads, every call is a no-op. Metro picks adsImpl.native.tsx on iOS/Android. */
export const ads: AdsService = {
  init: async () => {},
  isReady: () => false,
  isSupported: () => false,
  preload: () => {},
  showInterstitial: async () => false,
  showRewarded: async () => 'unavailable',
  isRewardedLoaded: () => false,
  isPrivacyOptionsRequired: () => false,
  showPrivacyOptions: async () => {},
  Banner: null,
};
