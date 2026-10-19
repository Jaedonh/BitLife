/**
 * Boot-time premium re-validation. A refunded / revoked purchase must lose
 * premium on the next launch; an unreachable store must keep the cached flag.
 */
jest.mock('@react-native-async-storage/async-storage', () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('@/services/ads', () => ({
  ads: { init: jest.fn(async () => {}), preload: jest.fn(), isReady: jest.fn(() => true) },
}));
jest.mock('@/services/purchases', () => ({
  purchases: {
    init: jest.fn(async () => {}),
    isSupported: jest.fn(() => true),
    isPremium: jest.fn(async () => null),
    onPremiumChange: jest.fn(() => () => {}),
    getPremiumOffer: jest.fn(async () => null),
    purchasePremium: jest.fn(async () => 'unavailable'),
    restore: jest.fn(async () => false),
  },
}));

const flush = () => new Promise((r) => setTimeout(r, 50));

type Mods = {
  AsyncStorage: typeof import('@react-native-async-storage/async-storage').default;
  storage: typeof import('@/services/storage');
  settingsStore: typeof import('@/store/settingsStore');
  purchasesModule: typeof import('@/services/purchases');
  adsModule: typeof import('@/services/ads');
  monetization: typeof import('@/services/monetization');
};

/** Fresh module registry per test so bootMonetization's one-shot guard resets. */
function loadModules(): Mods {
  let mods!: Mods;
  jest.isolateModules(() => {
    /* eslint-disable @typescript-eslint/no-require-imports */
    // The jest mock is a plain CommonJS object; app code reaches it via Babel's default interop.
    const asyncStorage = require('@react-native-async-storage/async-storage');
    mods = {
      AsyncStorage: asyncStorage.default ?? asyncStorage,
      storage: require('@/services/storage'),
      settingsStore: require('@/store/settingsStore'),
      purchasesModule: require('@/services/purchases'),
      adsModule: require('@/services/ads'),
      monetization: require('@/services/monetization'),
    };
    /* eslint-enable @typescript-eslint/no-require-imports */
  });
  return mods;
}

async function load(opts: { cachedPremium: boolean; storeAnswer: boolean | null; supported?: boolean }) {
  const { AsyncStorage, storage, settingsStore, purchasesModule, adsModule, monetization } = loadModules();
  const { StorageKeys } = storage;
  const { useSettingsStore } = settingsStore;
  const { purchases } = purchasesModule;
  const { ads } = adsModule;
  const { bootMonetization } = monetization;

  await AsyncStorage.setItem(StorageKeys.premium, JSON.stringify({ premium: opts.cachedPremium }));
  await useSettingsStore.getState().hydrate();
  expect(useSettingsStore.getState().premium).toBe(opts.cachedPremium);

  jest.mocked(purchases.isSupported).mockReturnValue(opts.supported ?? true);
  jest.mocked(purchases.isPremium).mockResolvedValue(opts.storeAnswer);

  const storedPremium = async () => {
    const raw = await AsyncStorage.getItem(StorageKeys.premium);
    return raw == null ? null : (JSON.parse(raw) as { premium: boolean }).premium;
  };
  return { useSettingsStore, purchases, ads, bootMonetization, buyPremium: monetization.buyPremium, restorePremium: monetization.restorePremium, restoreMessage: monetization.restoreMessage, storedPremium };
}

describe('bootMonetization premium re-validation', () => {
  it('revokes a cached premium flag when the store says the entitlement is inactive', async () => {
    const t = await load({ cachedPremium: true, storeAnswer: false });
    await t.bootMonetization();
    await flush();
    expect(t.purchases.isPremium).toHaveBeenCalledTimes(1);
    expect(t.useSettingsStore.getState().premium).toBe(false);
    expect(await t.storedPremium()).toBe(false);
    // A downgraded user is a free user: ads start on this launch.
    expect(t.ads.init).toHaveBeenCalledTimes(1);
    expect(t.ads.preload).toHaveBeenCalledTimes(1);
    // Readiness is published to the store so open screens re-render.
    expect(t.useSettingsStore.getState().adsReady).toBe(true);
  });

  it('publishes adsReady=false when the SDK did not start (consent blocked or init failed)', async () => {
    const t = await load({ cachedPremium: false, storeAnswer: false });
    jest.mocked(t.ads.init).mockRejectedValueOnce(new Error('consent blocked'));
    jest.mocked(t.ads.isReady).mockReturnValue(false);
    await t.bootMonetization();
    await flush();
    expect(t.useSettingsStore.getState().adsReady).toBe(false);
  });

  it('keeps the cached flag when the store cannot answer', async () => {
    const t = await load({ cachedPremium: true, storeAnswer: null });
    await t.bootMonetization();
    await flush();
    expect(t.useSettingsStore.getState().premium).toBe(true);
    expect(await t.storedPremium()).toBe(true);
    expect(t.ads.init).not.toHaveBeenCalled();
    expect(t.useSettingsStore.getState().adsReady).toBe(false);
  });

  it('upgrades a stale cache when the store says premium', async () => {
    const t = await load({ cachedPremium: false, storeAnswer: true });
    await t.bootMonetization();
    await flush();
    expect(t.useSettingsStore.getState().premium).toBe(true);
    expect(await t.storedPremium()).toBe(true);
    expect(t.ads.init).not.toHaveBeenCalled();
  });

  it('applies entitlement changes pushed by the store while the app is open', async () => {
    const t = await load({ cachedPremium: true, storeAnswer: true });
    await t.bootMonetization();
    expect(t.purchases.onPremiumChange).toHaveBeenCalledTimes(1);
    const listener = jest.mocked(t.purchases.onPremiumChange).mock.calls[0]![0];

    listener(false); // refund / revocation
    await flush();
    expect(t.useSettingsStore.getState().premium).toBe(false);
    expect(await t.storedPremium()).toBe(false);
    expect(t.ads.init).toHaveBeenCalledTimes(1);

    listener(true); // restored on another device
    await flush();
    expect(t.useSettingsStore.getState().premium).toBe(true);
    expect(await t.storedPremium()).toBe(true);
    // Ads SDK is only started once per process.
    expect(t.ads.init).toHaveBeenCalledTimes(1);
  });

  it('a purchase that completes while the first entitlement query is pending is not undone by its stale answer', async () => {
    const t = await load({ cachedPremium: false, storeAnswer: false });
    let release!: (v: boolean | null) => void;
    jest.mocked(t.purchases.isPremium).mockImplementationOnce(() => new Promise((r) => (release = r)));
    jest.mocked(t.purchases.purchasePremium).mockResolvedValueOnce('purchased');
    const boot = t.bootMonetization();
    await flush();
    // The listener is registered before the query, so pushed updates are never missed.
    expect(t.purchases.onPremiumChange).toHaveBeenCalledTimes(1);
    expect(await t.buyPremium()).toBe('purchased');
    release(false); // the pre-purchase answer arrives late
    await boot;
    await flush();
    expect(t.useSettingsStore.getState().premium).toBe(true);
    expect(t.ads.init).not.toHaveBeenCalled();
  });

  it('leaves the cache alone when no store exists on this build', async () => {
    const t = await load({ cachedPremium: true, storeAnswer: false, supported: false });
    await t.bootMonetization();
    await flush();
    expect(t.purchases.isPremium).not.toHaveBeenCalled();
    expect(t.purchases.onPremiumChange).not.toHaveBeenCalled();
    expect(t.useSettingsStore.getState().premium).toBe(true);
    expect(t.ads.init).not.toHaveBeenCalled();
  });
});

describe('restorePremium', () => {
  it('says purchases are unavailable, without asking a store, when none exists (web)', async () => {
    const t = await load({ cachedPremium: false, storeAnswer: null, supported: false });
    expect(await t.restorePremium()).toBe('unavailable');
    expect(t.purchases.restore).not.toHaveBeenCalled();
    expect(t.restoreMessage('unavailable')).toMatch(/^Purchases are not available in this version\./);
    expect(t.restoreMessage('unavailable')).not.toMatch(/No previous purchase/);
  });

  it('reports a restored purchase or none found when the store answers', async () => {
    const t = await load({ cachedPremium: false, storeAnswer: false });
    jest.mocked(t.purchases.restore).mockResolvedValueOnce(false);
    expect(await t.restorePremium()).toBe('notFound');
    expect(t.restoreMessage('notFound')).toBe('No previous purchase found for this store account.');
    jest.mocked(t.purchases.restore).mockResolvedValueOnce(true);
    expect(await t.restorePremium()).toBe('restored');
    expect(t.useSettingsStore.getState().premium).toBe(true);
    expect(t.restoreMessage('restored')).toBe('Premium restored. Thank you!');
  });
});
