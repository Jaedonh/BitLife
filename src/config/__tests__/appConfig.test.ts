/**
 * Release gate: a production build must refuse to evaluate app.config.ts until
 * every monetization variable in docs/RELEASE_CHECKLIST.md §1 is set, instead of
 * silently shipping Google's sample AdMob app IDs, test ad units and a paywall
 * that cannot sell anything.
 */
import type { ExpoConfig } from 'expo/config';

type ConfigFactory = (ctx: { config: Partial<ExpoConfig> }) => ExpoConfig;

/** Kept in sync by hand with REQUIRED_PRODUCTION_ENV in app.config.ts: removing one there must fail here. */
const REQUIRED = [
  'ADMOB_ANDROID_APP_ID',
  'ADMOB_IOS_APP_ID',
  'EXPO_PUBLIC_ADMOB_ANDROID_BANNER',
  'EXPO_PUBLIC_ADMOB_ANDROID_INTERSTITIAL',
  'EXPO_PUBLIC_ADMOB_ANDROID_REWARDED',
  'EXPO_PUBLIC_ADMOB_IOS_BANNER',
  'EXPO_PUBLIC_ADMOB_IOS_INTERSTITIAL',
  'EXPO_PUBLIC_ADMOB_IOS_REWARDED',
  'EXPO_PUBLIC_RC_IOS_KEY',
  'EXPO_PUBLIC_RC_ANDROID_KEY',
  'EXPO_PUBLIC_PRIVACY_URL',
  'EXPO_PUBLIC_SUPPORT_EMAIL',
] as const;

const REAL: Record<(typeof REQUIRED)[number], string> = {
  ADMOB_ANDROID_APP_ID: 'ca-app-pub-1111111111111111~1111111111',
  ADMOB_IOS_APP_ID: 'ca-app-pub-1111111111111111~2222222222',
  EXPO_PUBLIC_ADMOB_ANDROID_BANNER: 'ca-app-pub-1111111111111111/1',
  EXPO_PUBLIC_ADMOB_ANDROID_INTERSTITIAL: 'ca-app-pub-1111111111111111/2',
  EXPO_PUBLIC_ADMOB_ANDROID_REWARDED: 'ca-app-pub-1111111111111111/3',
  EXPO_PUBLIC_ADMOB_IOS_BANNER: 'ca-app-pub-1111111111111111/4',
  EXPO_PUBLIC_ADMOB_IOS_INTERSTITIAL: 'ca-app-pub-1111111111111111/5',
  EXPO_PUBLIC_ADMOB_IOS_REWARDED: 'ca-app-pub-1111111111111111/6',
  EXPO_PUBLIC_RC_IOS_KEY: 'appl_test',
  EXPO_PUBLIC_RC_ANDROID_KEY: 'goog_test',
  EXPO_PUBLIC_PRIVACY_URL: 'https://studio.example.org/privacy/',
  EXPO_PUBLIC_SUPPORT_EMAIL: 'help@studio.example.org',
};

const MANAGED = [...REQUIRED, 'APP_VARIANT'] as const;
const saved: Partial<Record<(typeof MANAGED)[number], string>> = {};

beforeEach(() => {
  for (const k of MANAGED) {
    saved[k] = process.env[k];
    delete process.env[k];
  }
});

afterEach(() => {
  for (const k of MANAGED) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
});

/** Evaluates app.config.ts fresh (it throws at module scope) with exactly this environment. */
function loadConfig(env: Record<string, string>): ExpoConfig {
  Object.assign(process.env, env);
  let config: ExpoConfig | undefined;
  jest.isolateModules(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('../../../app.config') as { default: ConfigFactory };
    config = mod.default({ config: {} });
  });
  return config!;
}

function adMobPlugin(config: ExpoConfig): { androidAppId: string; iosAppId: string } {
  const entry = (config.plugins ?? []).find((p) => Array.isArray(p) && p[0] === 'react-native-google-mobile-ads');
  if (!entry || !Array.isArray(entry)) throw new Error('AdMob plugin missing');
  return entry[1] as { androidAppId: string; iosAppId: string };
}

describe('app.config.ts production guard', () => {
  it('fails a production build that has no monetization variables, naming every one of them', () => {
    expect(() => loadConfig({ APP_VARIANT: 'production' })).toThrow(/APP_VARIANT=production/);
    try {
      loadConfig({ APP_VARIANT: 'production' });
    } catch (e) {
      const msg = (e as Error).message;
      for (const name of REQUIRED) expect(msg).toContain(name);
      expect(msg).toMatch(/RELEASE_CHECKLIST/);
    }
  });

  it('names only the variable that is missing', () => {
    const { EXPO_PUBLIC_RC_ANDROID_KEY: _omit, ...allButOne } = REAL;
    expect(() => loadConfig({ APP_VARIANT: 'production', ...allButOne })).toThrow(/EXPO_PUBLIC_RC_ANDROID_KEY is unset/);
    try {
      loadConfig({ APP_VARIANT: 'production', ...allButOne });
    } catch (e) {
      expect((e as Error).message).not.toContain('ADMOB_ANDROID_APP_ID');
    }
  });

  it("rejects Google's sample publisher even when a variable is set, and blank values", () => {
    expect(() => loadConfig({ APP_VARIANT: 'production', ...REAL, ADMOB_ANDROID_APP_ID: 'ca-app-pub-3940256099942544~3347511713' })).toThrow(/ADMOB_ANDROID_APP_ID is unset or still a sample or placeholder value/);
    expect(() => loadConfig({ APP_VARIANT: 'production', ...REAL, EXPO_PUBLIC_ADMOB_IOS_BANNER: 'ca-app-pub-3940256099942544/2934735716' })).toThrow(/EXPO_PUBLIC_ADMOB_IOS_BANNER/);
    expect(() => loadConfig({ APP_VARIANT: 'production', ...REAL, EXPO_PUBLIC_RC_IOS_KEY: '   ' })).toThrow(/EXPO_PUBLIC_RC_IOS_KEY/);
  });

  it('rejects the placeholder privacy URL and support email that development builds use', () => {
    expect(() => loadConfig({ APP_VARIANT: 'production', ...REAL, EXPO_PUBLIC_PRIVACY_URL: 'https://jaedonh.github.io/lifeloop-privacy/' })).toThrow(/EXPO_PUBLIC_PRIVACY_URL/);
    expect(() => loadConfig({ APP_VARIANT: 'production', ...REAL, EXPO_PUBLIC_SUPPORT_EMAIL: 'support@lifeloop.app' })).toThrow(/EXPO_PUBLIC_SUPPORT_EMAIL/);
  });

  it('builds the store config with the real AdMob app IDs once everything is set', () => {
    const config = loadConfig({ APP_VARIANT: 'production', ...REAL });
    expect(config.name).toBe('LifeLoop');
    expect(config.ios?.bundleIdentifier).toBe('com.jaedonh.lifeloop');
    expect(config.android?.package).toBe('com.jaedonh.lifeloop');
    expect(adMobPlugin(config)).toMatchObject({ androidAppId: REAL.ADMOB_ANDROID_APP_ID, iosAppId: REAL.ADMOB_IOS_APP_ID });
  });

  it('keeps development and preview builds on the sample IDs without any variables', () => {
    const dev = loadConfig({});
    expect(dev.name).toBe('LifeLoop (development)');
    expect(adMobPlugin(dev)).toEqual(expect.objectContaining({ androidAppId: expect.stringMatching(/^ca-app-pub-3940256099942544~/), iosAppId: expect.stringMatching(/^ca-app-pub-3940256099942544~/) }));

    const preview = loadConfig({ APP_VARIANT: 'preview' });
    expect(preview.name).toBe('LifeLoop (preview)');
    expect(preview.ios?.bundleIdentifier).toBe('com.jaedonh.lifeloop.preview');
  });
});
