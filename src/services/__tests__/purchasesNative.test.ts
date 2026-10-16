/**
 * RevenueCat adapter: `isPremium()` must tell "not entitled" (false) apart from
 * "could not ask the store" (null) so the caller can downgrade safely.
 */
import Purchases, { type CustomerInfo } from 'react-native-purchases';

import { purchases } from '../purchases/purchasesImpl.native';

jest.mock('react-native-purchases', () => ({
  __esModule: true,
  default: {
    configure: jest.fn(),
    getCustomerInfo: jest.fn(),
    addCustomerInfoUpdateListener: jest.fn(),
    removeCustomerInfoUpdateListener: jest.fn(() => true),
  },
  PURCHASES_ERROR_CODE: { PURCHASE_CANCELLED_ERROR: '1' },
}));
jest.mock('@/config/monetization', () => ({
  ...jest.requireActual('@/config/monetization'),
  revenueCatApiKey: 'test_key',
}));

const entitled = { entitlements: { active: { premium: { isActive: true } } } } as unknown as CustomerInfo;
const notEntitled = { entitlements: { active: {} } } as unknown as CustomerInfo;

describe('purchases (RevenueCat adapter)', () => {
  it('cannot answer before the SDK is configured', async () => {
    expect(purchases.isSupported()).toBe(true);
    expect(await purchases.isPremium()).toBeNull();
    const off = purchases.onPremiumChange(() => {});
    expect(typeof off).toBe('function');
    expect(Purchases.addCustomerInfoUpdateListener).not.toHaveBeenCalled();
    expect(Purchases.getCustomerInfo).not.toHaveBeenCalled();
  });

  it('distinguishes "not entitled" from "could not reach the store"', async () => {
    await purchases.init();
    expect(Purchases.configure).toHaveBeenCalledWith({ apiKey: 'test_key' });

    jest.mocked(Purchases.getCustomerInfo).mockResolvedValueOnce(notEntitled);
    expect(await purchases.isPremium()).toBe(false);

    jest.mocked(Purchases.getCustomerInfo).mockResolvedValueOnce(entitled);
    expect(await purchases.isPremium()).toBe(true);

    jest.mocked(Purchases.getCustomerInfo).mockRejectedValueOnce(new Error('network down'));
    expect(await purchases.isPremium()).toBeNull();
  });

  it('relays entitlement updates pushed by the SDK and can unsubscribe', async () => {
    await purchases.init();
    const seen: boolean[] = [];
    const off = purchases.onPremiumChange((p) => seen.push(p));
    expect(Purchases.addCustomerInfoUpdateListener).toHaveBeenCalledTimes(1);
    const rcListener = jest.mocked(Purchases.addCustomerInfoUpdateListener).mock.calls[0]![0];

    rcListener(notEntitled);
    rcListener(entitled);
    expect(seen).toEqual([false, true]);

    off();
    expect(Purchases.removeCustomerInfoUpdateListener).toHaveBeenCalledWith(rcListener);
  });
});
