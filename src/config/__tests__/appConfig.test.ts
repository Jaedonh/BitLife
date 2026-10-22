/**
 * Release gate: a production build must refuse to evaluate app.config.ts until
 * every monetization variable in docs/RELEASE_CHECKLIST.md §1 is set, instead of
 * silently shipping Google's sample AdMob app IDs, test ad units and a paywall
 * that cannot sell anything.
 */
import type { ExpoConfig } from 'expo/config';

import { PLACEHOLDER_PRIVACY_URL, PLACEHOLDER_SUPPORT_EMAIL } from '@/config/legal';

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

/** Any UUID: `eas init` prints the real one. */
const PROJECT_ID = '0b5c8a8e-1d2f-4c3b-9a7e-6f5d4c3b2a19';

const MANAGED = [...REQUIRED, 'APP_VARIANT', 'EAS_PROJECT_ID'] as const;
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
  for (const k of MANAGED) delete process.env[k];
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
    // The fallbacks in src/config/legal.ts, so PLACEHOLDER_VALUES in app.config.ts cannot drift from them.
    expect(() => loadConfig({ APP_VARIANT: 'production', ...REAL, EXPO_PUBLIC_PRIVACY_URL: PLACEHOLDER_PRIVACY_URL })).toThrow(/EXPO_PUBLIC_PRIVACY_URL/);
    expect(() => loadConfig({ APP_VARIANT: 'production', ...REAL, EXPO_PUBLIC_SUPPORT_EMAIL: PLACEHOLDER_SUPPORT_EMAIL })).toThrow(/EXPO_PUBLIC_SUPPORT_EMAIL/);
    // The address store/site/README.md tells the owner to set is accepted.
    expect(() => loadConfig({ APP_VARIANT: 'production', ...REAL, EAS_PROJECT_ID: PROJECT_ID, EXPO_PUBLIC_PRIVACY_URL: 'https://jaedonh.github.io/yearborn-site/privacy.html' })).not.toThrow();
  });

  it('refuses a store build while the EAS project ID is still the placeholder', () => {
    expect(() => loadConfig({ APP_VARIANT: 'production', ...REAL })).toThrow(/EAS project ID is "REPLACE_WITH_EAS_PROJECT_ID"/);
    expect(() => loadConfig({ APP_VARIANT: 'production', ...REAL, EAS_PROJECT_ID: 'my-project' })).toThrow(/not a UUID/);
    // Development builds keep working without one.
    expect(loadConfig({}).extra?.eas?.projectId).toBe('REPLACE_WITH_EAS_PROJECT_ID');
  });

  it('builds the store config with the real AdMob app IDs once everything is set', () => {
    const config = loadConfig({ APP_VARIANT: 'production', ...REAL, EAS_PROJECT_ID: PROJECT_ID });
    expect(config.extra?.eas?.projectId).toBe(PROJECT_ID);
    expect(config.name).toBe('Yearborn');
    expect(config.ios?.bundleIdentifier).toBe('com.jaedonh.yearborn');
    expect(config.android?.package).toBe('com.jaedonh.yearborn');
    expect(adMobPlugin(config)).toMatchObject({ androidAppId: REAL.ADMOB_ANDROID_APP_ID, iosAppId: REAL.ADMOB_IOS_APP_ID });
  });

  it('leaves build numbers to EAS remote versioning', () => {
    const config = loadConfig({ APP_VARIANT: 'production', ...REAL, EAS_PROJECT_ID: PROJECT_ID });
    // eas.json sets appVersionSource "remote": values here would be ignored and only mislead.
    expect(config.ios?.buildNumber).toBeUndefined();
    expect(config.android?.versionCode).toBeUndefined();
    expect(config.version).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('declares the iOS privacy manifest the App Privacy answers describe', () => {
    const manifest = loadConfig({ APP_VARIANT: 'production', ...REAL, EAS_PROJECT_ID: PROJECT_ID }).ios?.privacyManifests;
    const types = new Map((manifest?.NSPrivacyCollectedDataTypes ?? []).map((t) => [t.NSPrivacyCollectedDataType, t]));
    expect(manifest?.NSPrivacyTracking).toBe(true);
    // AdMob: the advertising identifier is used for tracking (only after ATT allows it).
    expect(types.get('NSPrivacyCollectedDataTypeDeviceID')).toMatchObject({ NSPrivacyCollectedDataTypeTracking: true });
    expect(types.has('NSPrivacyCollectedDataTypeCoarseLocation')).toBe(true);
    // RevenueCat runs on an anonymous app user ID: purchase history is not linked to the person,
    // and there is no account, so no User ID.
    expect(types.get('NSPrivacyCollectedDataTypePurchaseHistory')).toMatchObject({ NSPrivacyCollectedDataTypeLinked: false, NSPrivacyCollectedDataTypeTracking: false });
    expect(types.has('NSPrivacyCollectedDataTypeUserID')).toBe(false);
  });

  it('declares exactly the App Privacy answers in docs/RELEASE_CHECKLIST.md §3, row for row', () => {
    const manifest = loadConfig({ APP_VARIANT: 'production', ...REAL, EAS_PROJECT_ID: PROJECT_ID }).ios?.privacyManifests;
    const declared = (manifest?.NSPrivacyCollectedDataTypes ?? []).map((t) => ({
      type: t.NSPrivacyCollectedDataType.replace('NSPrivacyCollectedDataType', ''),
      linked: t.NSPrivacyCollectedDataTypeLinked,
      tracking: t.NSPrivacyCollectedDataTypeTracking,
      purposes: [...t.NSPrivacyCollectedDataTypePurposes].map((x) => x.replace('NSPrivacyCollectedDataTypePurpose', '')).sort(),
    }));
    // The "Apple App Privacy" table: | Category → Data type | Linked | Tracking | Purposes | Collected by |
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('fs') as { readFileSync(path: string, encoding: 'utf8'): string };
    // Jest runs from the project root (package.json "jest").
    const doc = fs.readFileSync(`${process.cwd()}/docs/RELEASE_CHECKLIST.md`, 'utf8');
    const section = doc.slice(doc.indexOf('### Apple App Privacy'), doc.indexOf('### App Store Connect, other fields'));
    const yes = (cell: string) => /^\**yes\**$/i.test(cell.trim());
    const key = (name: string) => name.replace(/\b\w/g, (c) => c.toUpperCase()).replace(/\s+/g, '').replace('DeviceId', 'DeviceID');
    const PURPOSE: Record<string, string> = { 'third-party advertising': 'ThirdPartyAdvertising', analytics: 'Analytics', 'app functionality': 'AppFunctionality' };
    const documented = section
      .split('\n')
      .filter((line: string) => /^\| [A-Z][a-z]+(?: data)? → /.test(line))
      .map((line: string) => {
        const [type, linked, tracking, purposes] = line.split('|').slice(1, 5).map((c: string) => c.trim());
        return {
          type: key(type!.split('→')[1]!.trim()),
          linked: yes(linked!),
          tracking: yes(tracking!),
          purposes: purposes!.split(',').map((p: string) => PURPOSE[p.trim().toLowerCase()] ?? `unknown purpose "${p.trim()}"`).sort(),
        };
      });
    expect(documented.length).toBeGreaterThan(0);
    const byType = (a: { type: string }, b: { type: string }) => a.type.localeCompare(b.type);
    expect([...declared].sort(byType)).toEqual([...documented].sort(byType));
  });

  it('removes Android permissions the game never uses from store builds', () => {
    const prod = loadConfig({ APP_VARIANT: 'production', ...REAL, EAS_PROJECT_ID: PROJECT_ID }).android?.blockedPermissions ?? [];
    expect(prod).toEqual(expect.arrayContaining(['android.permission.READ_EXTERNAL_STORAGE', 'android.permission.WRITE_EXTERNAL_STORAGE', 'android.permission.SYSTEM_ALERT_WINDOW']));
    // Development builds keep the overlay permission React Native's dev tools may use.
    expect(loadConfig({}).android?.blockedPermissions).not.toContain('android.permission.SYSTEM_ALERT_WINDOW');
  });

  it('keeps development and preview builds on the sample IDs without any variables', () => {
    const dev = loadConfig({});
    expect(dev.name).toBe('Yearborn (development)');
    expect(adMobPlugin(dev)).toEqual(expect.objectContaining({ androidAppId: expect.stringMatching(/^ca-app-pub-3940256099942544~/), iosAppId: expect.stringMatching(/^ca-app-pub-3940256099942544~/) }));

    const preview = loadConfig({ APP_VARIANT: 'preview' });
    expect(preview.name).toBe('Yearborn (preview)');
    expect(preview.ios?.bundleIdentifier).toBe('com.jaedonh.yearborn.preview');
  });
});
