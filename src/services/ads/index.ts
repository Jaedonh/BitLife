// Metro resolves adsImpl.native.tsx on iOS/Android and adsImpl.ts elsewhere (web, TypeScript).
// Jest (jest-expo preset, ios platform) resolves the native file; the SDK
// require is wrapped in try/catch so tests never need the native module.
export { ads } from './adsImpl';
export type { AdsService, RewardedResult } from './types';
export * from './policy';
