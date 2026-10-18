import { COUNTRIES, getCountry } from '@/data/countries';
import { scaleMoney } from '../events/text';
import { createLife } from '../systems/character';
import { formatMoney, formatMoneyFull, money } from '../util';

describe('display currency (UI-22)', () => {
  it('gives every country a positive display rate, with the US at 1', () => {
    for (const c of COUNTRIES) expect([c.code, Number.isFinite(c.fxRate) && c.fxRate > 0]).toEqual([c.code, true]);
    expect(getCountry('US').fxRate).toBe(1);
  });

  it('converts game amounts to local currency only when formatting', () => {
    expect(formatMoneyFull(30, 'US')).toBe('$30');
    expect(formatMoneyFull(30, 'IN')).toBe('₹2,490');
    expect(formatMoneyFull(1_000, 'JP')).toBe('¥150,000');
    expect(formatMoneyFull(1_000, 'GB')).toBe('£790');
    expect(formatMoneyFull(-200, 'NG')).toBe('-₦300,000');
    expect(formatMoney(18_000, 'IN')).toBe('₹1.5M');
    expect(formatMoney(7_500, 'JP')).toBe('¥1.1M');
    expect(formatMoney(40_000, 'NG')).toBe('₦60M');
  });

  it('keeps the engine in base units: scaling ignores the display rate', () => {
    const india = createLife({ countryCode: 'IN' }, 4);
    expect(scaleMoney(india, 1_000)).toBe(150);
    expect(money(india, 150)).toBe('₹12,450');
  });

  it('abbreviates without odd boundaries', () => {
    expect(formatMoney(99_999, 'US')).toBe('$99,999');
    expect(formatMoney(450_000, 'US')).toBe('$450K');
    expect(formatMoney(999_600, 'US')).toBe('$1.0M');
    expect(formatMoney(12_400_000, 'US')).toBe('$12M');
    expect(formatMoney(2_000_000_000, 'NG')).toBe('₦3.0T');
    expect(formatMoney(-0.4, 'US')).toBe('$0');
  });
});
