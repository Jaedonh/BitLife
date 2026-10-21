/**
 * Consent and tracking order for the AdMob adapter (jest-expo runs as iOS):
 * UMP message first, then the ATT prompt, then the request configuration, then initialize().
 * Players outside GDPR regions get personalized ads unless they refuse tracking; players who
 * refused GDPR purpose 1 are not asked again through ATT.
 */
const mockAdsConsent = {
  gatherConsent: jest.fn(),
  getConsentInfo: jest.fn(),
  getGdprApplies: jest.fn(),
  getPurposeConsents: jest.fn(),
  getUserChoices: jest.fn(),
  showPrivacyOptionsForm: jest.fn(),
};
const mockMobileAds = {
  setRequestConfiguration: jest.fn(async () => {}),
  initialize: jest.fn(async () => []),
};
const mockFullscreenAd = () => ({ addAdEventListener: jest.fn(() => () => {}), load: jest.fn(), show: jest.fn(async () => {}) });
const mockCreateInterstitial = jest.fn((_unitId: string, _options: { requestNonPersonalizedAdsOnly: boolean }) => mockFullscreenAd());
const mockCreateRewarded = jest.fn((_unitId: string, _options: { requestNonPersonalizedAdsOnly: boolean }) => mockFullscreenAd());
const mockRequestTracking = jest.fn();

jest.mock('react-native-google-mobile-ads', () => ({
  __esModule: true,
  default: () => mockMobileAds,
  AdsConsent: mockAdsConsent,
  AdsConsentPrivacyOptionsRequirementStatus: { REQUIRED: 'REQUIRED', NOT_REQUIRED: 'NOT_REQUIRED' },
  AdsConsentDebugGeography: { DISABLED: 0, EEA: 1, NOT_EEA: 2, REGULATED_US_STATE: 3, OTHER: 4 },
  MaxAdContentRating: { T: 'T' },
  InterstitialAd: { createForAdRequest: (unitId: string, options: { requestNonPersonalizedAdsOnly: boolean }) => mockCreateInterstitial(unitId, options) },
  RewardedAd: { createForAdRequest: (unitId: string, options: { requestNonPersonalizedAdsOnly: boolean }) => mockCreateRewarded(unitId, options) },
  AdEventType: { LOADED: 'loaded', ERROR: 'error', CLOSED: 'closed' },
  RewardedAdEventType: { LOADED: 'rewarded_loaded', EARNED_REWARD: 'rewarded_earned_reward' },
  BannerAd: () => null,
  BannerAdSize: { LARGE_ANCHORED_ADAPTIVE_BANNER: 'LARGE_ANCHORED_ADAPTIVE_BANNER' },
}));
jest.mock('expo-tracking-transparency', () => ({
  isAvailable: () => true,
  requestTrackingPermissionsAsync: () => mockRequestTracking(),
}));

type AdsService = typeof import('../ads/adsImpl.native').ads;

/** A fresh copy of the adapter: its consent state lives at module scope. */
function loadAds(): AdsService {
  let ads!: AdsService;
  jest.isolateModules(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    ads = (require('../ads/adsImpl.native') as typeof import('../ads/adsImpl.native')).ads;
  });
  return ads;
}

function consent(opts: { canRequestAds: boolean; gdprApplies: boolean; purposeConsents?: string; personalised?: boolean; att?: 'granted' | 'denied' }) {
  mockAdsConsent.gatherConsent.mockResolvedValue({ canRequestAds: opts.canRequestAds, privacyOptionsRequirementStatus: opts.gdprApplies ? 'REQUIRED' : 'NOT_REQUIRED' });
  mockAdsConsent.getGdprApplies.mockResolvedValue(opts.gdprApplies);
  mockAdsConsent.getPurposeConsents.mockResolvedValue(opts.purposeConsents ?? '');
  // Outside GDPR regions there is no TC string, and the library reports every purpose as refused.
  mockAdsConsent.getUserChoices.mockResolvedValue({ selectPersonalisedAds: opts.personalised ?? false });
  mockRequestTracking.mockResolvedValue({ status: opts.att ?? 'granted' });
}

const lastRequest = () => mockCreateInterstitial.mock.calls.at(-1)?.[1];

const DEBUG_ENV = ['EXPO_PUBLIC_ADS_DEBUG_GEOGRAPHY', 'EXPO_PUBLIC_ADS_TEST_DEVICE_IDS', 'EXPO_PUBLIC_ADMOB_IOS_BANNER', 'EXPO_PUBLIC_ADMOB_IOS_INTERSTITIAL'] as const;
const savedEnv: Partial<Record<(typeof DEBUG_ENV)[number], string>> = {};

beforeEach(() => {
  jest.clearAllMocks();
  for (const k of DEBUG_ENV) {
    savedEnv[k] = process.env[k];
    delete process.env[k];
  }
});

afterEach(() => {
  for (const k of DEBUG_ENV) {
    if (savedEnv[k] === undefined) delete process.env[k];
    else process.env[k] = savedEnv[k];
  }
});

describe('ads consent flow', () => {
  it('outside GDPR regions: asks ATT after the UMP step, then configures and starts the SDK with personalized ads', async () => {
    consent({ canRequestAds: true, gdprApplies: false, att: 'granted' });
    const ads = loadAds();
    await ads.init();

    expect(ads.isReady()).toBe(true);
    expect(mockRequestTracking).toHaveBeenCalledTimes(1);
    const order = (fn: jest.Mock) => fn.mock.invocationCallOrder[0] ?? Infinity;
    expect(order(mockAdsConsent.gatherConsent)).toBeLessThan(order(mockRequestTracking));
    expect(order(mockRequestTracking)).toBeLessThan(order(mockMobileAds.setRequestConfiguration));
    expect(order(mockMobileAds.setRequestConfiguration)).toBeLessThan(order(mockMobileAds.initialize));
    expect(mockMobileAds.setRequestConfiguration).toHaveBeenCalledWith(expect.objectContaining({ maxAdContentRating: 'T', tagForChildDirectedTreatment: false }));
    expect(lastRequest()).toEqual({ requestNonPersonalizedAdsOnly: false });
    expect(mockCreateRewarded.mock.calls.at(-1)?.[1]).toEqual({ requestNonPersonalizedAdsOnly: false });
  });

  it('outside GDPR regions: a refused ATT prompt means non-personalized ads', async () => {
    consent({ canRequestAds: true, gdprApplies: false, att: 'denied' });
    const ads = loadAds();
    await ads.init();
    expect(ads.isReady()).toBe(true);
    expect(lastRequest()).toEqual({ requestNonPersonalizedAdsOnly: true });
  });

  it('GDPR region, purpose 1 refused: no ATT prompt, non-personalized ads', async () => {
    consent({ canRequestAds: true, gdprApplies: true, purposeConsents: '0000000000', personalised: false });
    const ads = loadAds();
    await ads.init();
    expect(mockRequestTracking).not.toHaveBeenCalled();
    expect(ads.isReady()).toBe(true);
    expect(lastRequest()).toEqual({ requestNonPersonalizedAdsOnly: true });
    expect(ads.isPrivacyOptionsRequired()).toBe(true);
  });

  it('GDPR region with consent: asks ATT and honors both answers', async () => {
    consent({ canRequestAds: true, gdprApplies: true, purposeConsents: '1111111111', personalised: true, att: 'granted' });
    const ads = loadAds();
    await ads.init();
    expect(mockRequestTracking).toHaveBeenCalledTimes(1);
    expect(lastRequest()).toEqual({ requestNonPersonalizedAdsOnly: false });
  });

  it('asks UMP for the real region by default', async () => {
    consent({ canRequestAds: true, gdprApplies: false });
    await loadAds().init();
    expect(mockAdsConsent.gatherConsent).toHaveBeenCalledWith({});
  });

  it('test-ad builds can fake a consent region for testing the EEA and US-state messages', async () => {
    process.env.EXPO_PUBLIC_ADS_DEBUG_GEOGRAPHY = 'regulated_us_state';
    process.env.EXPO_PUBLIC_ADS_TEST_DEVICE_IDS = ' ABC123 , DEF456 ';
    consent({ canRequestAds: true, gdprApplies: false });
    await loadAds().init();
    expect(mockAdsConsent.gatherConsent).toHaveBeenCalledWith({ debugGeography: 3, testDeviceIdentifiers: ['ABC123', 'DEF456'] });
  });

  it('a build with real ad units ignores the debug region', async () => {
    process.env.EXPO_PUBLIC_ADS_DEBUG_GEOGRAPHY = 'EEA';
    process.env.EXPO_PUBLIC_ADMOB_IOS_BANNER = 'ca-app-pub-1111111111111111/4';
    process.env.EXPO_PUBLIC_ADMOB_IOS_INTERSTITIAL = 'ca-app-pub-1111111111111111/5';
    consent({ canRequestAds: true, gdprApplies: false });
    await loadAds().init();
    expect(mockAdsConsent.gatherConsent).toHaveBeenCalledWith({});
  });

  it('when ads may not be requested: no ATT prompt and the SDK is never started', async () => {
    consent({ canRequestAds: false, gdprApplies: true });
    const ads = loadAds();
    await ads.init();
    expect(ads.isReady()).toBe(false);
    expect(mockRequestTracking).not.toHaveBeenCalled();
    expect(mockMobileAds.initialize).not.toHaveBeenCalled();
  });
});
