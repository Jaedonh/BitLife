/**
 * Legal and support contact points. Shown in Settings and entered in App Store
 * Connect / Play Console, so both are public: keep them free of third-party
 * trademarks and fill them in before submission (docs/RELEASE_CHECKLIST.md §1).
 *
 * Set EXPO_PUBLIC_PRIVACY_URL and EXPO_PUBLIC_SUPPORT_EMAIL for store builds: a
 * production build refuses to start while either is unset or still the placeholder
 * below, and an EAS production build also runs `npm run check:privacy`, which fails
 * until PRIVACY_URL serves the published policy.
 */
export const PLACEHOLDER_PRIVACY_URL = 'https://jaedonh.github.io/lifeloop-privacy/';
export const PLACEHOLDER_SUPPORT_EMAIL = 'support@lifeloop.app';

export const PRIVACY_URL = process.env.EXPO_PUBLIC_PRIVACY_URL || PLACEHOLDER_PRIVACY_URL;
export const SUPPORT_EMAIL = process.env.EXPO_PUBLIC_SUPPORT_EMAIL || PLACEHOLDER_SUPPORT_EMAIL;
