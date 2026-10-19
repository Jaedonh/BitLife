/**
 * Playable birth countries. `salaryMultiplier` and `costOfLiving` scale the
 * (USD-denominated) base tables in jobs/assets; `currency`, `currencySymbol` and
 * `fxRate` only affect display (formatMoney converts at `fxRate`).
 * `namePool` picks the name tables used for the character and all NPCs.
 */
/** Winters: snow most years, cool and wet, or none to speak of. Season-specific cards gate on it. */
export type Climate = 'snowy' | 'mild' | 'hot';

export type NamePool = 'anglo' | 'hispanic' | 'french' | 'german' | 'italian' | 'japanese' | 'indian' | 'nigerian' | 'brazilian';

export interface CountryDef {
  code: string;
  name: string;
  demonym: string;
  flag: string;
  currency: string;
  currencySymbol: string;
  /**
   * Local currency units per US dollar, for display only. Game amounts stay in
   * USD-based units (already scaled by `salaryMultiplier`); formatMoney multiplies
   * by this so a bicycle in India reads as about ₹2,500 rather than ₹30.
   */
  fxRate: number;
  /** Multiply base USD salaries/prices. */
  salaryMultiplier: number;
  costOfLiving: number;
  namePool: NamePool;
  climate: Climate;
  /** Southern hemisphere: December holidays fall in summer. */
  southern?: boolean;
  cities: string[];
  schoolStartAge: number;
  highSchoolEndAge: number;
  drinkingAge: number;
  publicHealthcare: boolean;
  gamblingLegal: boolean;
  /** Average life expectancy, feeds mortality. */
  lifeExpectancy: number;
  /** Flat-ish effective income tax rate used by the finance system. */
  taxRate: number;
  /**
   * The currency the euro replaced (EURO_SINCE), shown before it: "1,800 lire", "18 marks". `fxRate` is in the same
   * terms as the country's own (old units per US dollar), at the euro's fixed conversion rate, so an amount reads the
   * same on either side of the switch. Game amounts never change; only the display does.
   */
  preEuro?: { one: string; many: string; fxRate: number };
}

export const COUNTRIES: readonly CountryDef[] = [
  { code: 'US', name: 'United States', demonym: 'American', flag: '🇺🇸', currency: 'USD', currencySymbol: '$', fxRate: 1, salaryMultiplier: 1, costOfLiving: 1, namePool: 'anglo', climate: 'snowy', cities: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Austin', 'Seattle', 'Denver', 'Miami', 'Atlanta', 'Boston', 'Nashville'], schoolStartAge: 6, highSchoolEndAge: 18, drinkingAge: 21, publicHealthcare: false, gamblingLegal: true, lifeExpectancy: 78, taxRate: 0.24 },
  { code: 'GB', name: 'United Kingdom', demonym: 'British', flag: '🇬🇧', currency: 'GBP', currencySymbol: '£', fxRate: 0.79, salaryMultiplier: 0.8, costOfLiving: 0.95, namePool: 'anglo', climate: 'mild', cities: ['London', 'Manchester', 'Birmingham', 'Glasgow', 'Edinburgh', 'Liverpool', 'Bristol', 'Leeds', 'Cardiff', 'Belfast'], schoolStartAge: 5, highSchoolEndAge: 18, drinkingAge: 18, publicHealthcare: true, gamblingLegal: true, lifeExpectancy: 81, taxRate: 0.27 },
  { code: 'CA', name: 'Canada', demonym: 'Canadian', flag: '🇨🇦', currency: 'CAD', currencySymbol: '$', fxRate: 1.36, salaryMultiplier: 0.9, costOfLiving: 0.95, namePool: 'anglo', climate: 'snowy', cities: ['Toronto', 'Vancouver', 'Montreal', 'Calgary', 'Ottawa', 'Edmonton', 'Winnipeg', 'Halifax'], schoolStartAge: 6, highSchoolEndAge: 18, drinkingAge: 19, publicHealthcare: true, gamblingLegal: true, lifeExpectancy: 82, taxRate: 0.26 },
  { code: 'AU', name: 'Australia', demonym: 'Australian', flag: '🇦🇺', currency: 'AUD', currencySymbol: '$', fxRate: 1.52, salaryMultiplier: 0.95, costOfLiving: 1.05, namePool: 'anglo', climate: 'mild', southern: true, cities: ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Canberra', 'Hobart', 'Darwin'], schoolStartAge: 6, highSchoolEndAge: 18, drinkingAge: 18, publicHealthcare: true, gamblingLegal: true, lifeExpectancy: 83, taxRate: 0.28 },
  { code: 'DE', name: 'Germany', demonym: 'German', flag: '🇩🇪', currency: 'EUR', currencySymbol: '€', fxRate: 0.92, salaryMultiplier: 0.85, costOfLiving: 0.9, namePool: 'german', climate: 'snowy', cities: ['Berlin', 'Munich', 'Hamburg', 'Frankfurt', 'Cologne', 'Stuttgart', 'Düsseldorf', 'Leipzig'], schoolStartAge: 6, highSchoolEndAge: 18, drinkingAge: 16, publicHealthcare: true, gamblingLegal: true, lifeExpectancy: 81, taxRate: 0.35, preEuro: { one: 'mark', many: 'marks', fxRate: 1.8 } },
  { code: 'FR', name: 'France', demonym: 'French', flag: '🇫🇷', currency: 'EUR', currencySymbol: '€', fxRate: 0.92, salaryMultiplier: 0.8, costOfLiving: 0.9, namePool: 'french', climate: 'mild', cities: ['Paris', 'Lyon', 'Marseille', 'Toulouse', 'Nice', 'Bordeaux', 'Lille', 'Nantes'], schoolStartAge: 6, highSchoolEndAge: 18, drinkingAge: 18, publicHealthcare: true, gamblingLegal: true, lifeExpectancy: 82, taxRate: 0.33, preEuro: { one: 'franc', many: 'francs', fxRate: 6.03 } },
  { code: 'ES', name: 'Spain', demonym: 'Spanish', flag: '🇪🇸', currency: 'EUR', currencySymbol: '€', fxRate: 0.92, salaryMultiplier: 0.6, costOfLiving: 0.7, namePool: 'hispanic', climate: 'mild', cities: ['Madrid', 'Barcelona', 'Valencia', 'Seville', 'Bilbao', 'Málaga', 'Zaragoza'], schoolStartAge: 6, highSchoolEndAge: 18, drinkingAge: 18, publicHealthcare: true, gamblingLegal: true, lifeExpectancy: 83, taxRate: 0.3, preEuro: { one: 'peseta', many: 'pesetas', fxRate: 153 } },
  { code: 'IT', name: 'Italy', demonym: 'Italian', flag: '🇮🇹', currency: 'EUR', currencySymbol: '€', fxRate: 0.92, salaryMultiplier: 0.65, costOfLiving: 0.75, namePool: 'italian', climate: 'mild', cities: ['Rome', 'Milan', 'Naples', 'Turin', 'Florence', 'Bologna', 'Venice', 'Palermo'], schoolStartAge: 6, highSchoolEndAge: 19, drinkingAge: 18, publicHealthcare: true, gamblingLegal: true, lifeExpectancy: 83, taxRate: 0.33, preEuro: { one: 'lira', many: 'lire', fxRate: 1781 } },
  { code: 'MX', name: 'Mexico', demonym: 'Mexican', flag: '🇲🇽', currency: 'MXN', currencySymbol: '$', fxRate: 17, salaryMultiplier: 0.3, costOfLiving: 0.4, namePool: 'hispanic', climate: 'hot', cities: ['Mexico City', 'Guadalajara', 'Monterrey', 'Puebla', 'Tijuana', 'Cancún', 'Mérida'], schoolStartAge: 6, highSchoolEndAge: 18, drinkingAge: 18, publicHealthcare: true, gamblingLegal: true, lifeExpectancy: 75, taxRate: 0.2 },
  { code: 'BR', name: 'Brazil', demonym: 'Brazilian', flag: '🇧🇷', currency: 'BRL', currencySymbol: 'R$', fxRate: 5, salaryMultiplier: 0.3, costOfLiving: 0.4, namePool: 'brazilian', climate: 'hot', southern: true, cities: ['São Paulo', 'Rio de Janeiro', 'Brasília', 'Salvador', 'Belo Horizonte', 'Curitiba', 'Recife', 'Porto Alegre'], schoolStartAge: 6, highSchoolEndAge: 17, drinkingAge: 18, publicHealthcare: true, gamblingLegal: false, lifeExpectancy: 76, taxRate: 0.22 },
  { code: 'JP', name: 'Japan', demonym: 'Japanese', flag: '🇯🇵', currency: 'JPY', currencySymbol: '¥', fxRate: 150, salaryMultiplier: 0.75, costOfLiving: 0.9, namePool: 'japanese', climate: 'snowy', cities: ['Tokyo', 'Osaka', 'Kyoto', 'Yokohama', 'Nagoya', 'Sapporo', 'Fukuoka', 'Kobe'], schoolStartAge: 6, highSchoolEndAge: 18, drinkingAge: 20, publicHealthcare: true, gamblingLegal: false, lifeExpectancy: 85, taxRate: 0.3 },
  { code: 'IN', name: 'India', demonym: 'Indian', flag: '🇮🇳', currency: 'INR', currencySymbol: '₹', fxRate: 83, salaryMultiplier: 0.15, costOfLiving: 0.25, namePool: 'indian', climate: 'hot', cities: ['Mumbai', 'Delhi', 'Bengaluru', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Jaipur'], schoolStartAge: 6, highSchoolEndAge: 18, drinkingAge: 21, publicHealthcare: true, gamblingLegal: false, lifeExpectancy: 70, taxRate: 0.18 },
  { code: 'NG', name: 'Nigeria', demonym: 'Nigerian', flag: '🇳🇬', currency: 'NGN', currencySymbol: '₦', fxRate: 1500, salaryMultiplier: 0.1, costOfLiving: 0.2, namePool: 'nigerian', climate: 'hot', cities: ['Lagos', 'Abuja', 'Kano', 'Ibadan', 'Port Harcourt', 'Benin City', 'Enugu'], schoolStartAge: 6, highSchoolEndAge: 18, drinkingAge: 18, publicHealthcare: false, gamblingLegal: true, lifeExpectancy: 55, taxRate: 0.15 },
];

export const COUNTRY_BY_CODE: Record<string, CountryDef> = Object.fromEntries(COUNTRIES.map((c) => [c.code, c]));

/**
 * The year the euro became the money people used: its notes and coins arrived on 1 January 2002. It had been the
 * banks' unit since 1999, but wages, prices and the cash in a wallet were still in the old currencies until then, so
 * a euro country shows the currency it replaced for every year before this one.
 */
export const EURO_SINCE = 2002;

/** How money is shown in a country in a given year: a symbol before the amount ("€18"), or a unit after it ("18 marks"). */
export interface CurrencyDisplay {
  fxRate: number;
  symbol?: string;
  unit?: { one: string; many: string };
}

/** The currency an amount is shown in: the country's own, or before the euro (EURO_SINCE) the one it replaced. With no year it is today's. */
export function currencyFor(code: string, year?: number): CurrencyDisplay {
  const c = getCountry(code);
  const old = c.preEuro;
  if (old && year !== undefined && year < EURO_SINCE) return { fxRate: old.fxRate, unit: { one: old.one, many: old.many } };
  return { fxRate: c.fxRate, symbol: c.currencySymbol };
}

export function getCountry(code: string): CountryDef {
  return COUNTRY_BY_CODE[code] ?? (COUNTRIES[0] as CountryDef);
}
