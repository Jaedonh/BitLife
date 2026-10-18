/**
 * Playable birth countries. `salaryMultiplier` and `costOfLiving` scale the
 * (USD-denominated) base tables in jobs/assets; `currency`, `currencySymbol` and
 * `fxRate` only affect display (formatMoney converts at `fxRate`).
 * `namePool` picks the name tables used for the character and all NPCs.
 */
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
}

export const COUNTRIES: readonly CountryDef[] = [
  { code: 'US', name: 'United States', demonym: 'American', flag: '🇺🇸', currency: 'USD', currencySymbol: '$', fxRate: 1, salaryMultiplier: 1, costOfLiving: 1, namePool: 'anglo', cities: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Austin', 'Seattle', 'Denver', 'Miami', 'Atlanta', 'Boston', 'Nashville'], schoolStartAge: 6, highSchoolEndAge: 18, drinkingAge: 21, publicHealthcare: false, gamblingLegal: true, lifeExpectancy: 78, taxRate: 0.24 },
  { code: 'GB', name: 'United Kingdom', demonym: 'British', flag: '🇬🇧', currency: 'GBP', currencySymbol: '£', fxRate: 0.79, salaryMultiplier: 0.8, costOfLiving: 0.95, namePool: 'anglo', cities: ['London', 'Manchester', 'Birmingham', 'Glasgow', 'Edinburgh', 'Liverpool', 'Bristol', 'Leeds', 'Cardiff', 'Belfast'], schoolStartAge: 5, highSchoolEndAge: 18, drinkingAge: 18, publicHealthcare: true, gamblingLegal: true, lifeExpectancy: 81, taxRate: 0.27 },
  { code: 'CA', name: 'Canada', demonym: 'Canadian', flag: '🇨🇦', currency: 'CAD', currencySymbol: '$', fxRate: 1.36, salaryMultiplier: 0.9, costOfLiving: 0.95, namePool: 'anglo', cities: ['Toronto', 'Vancouver', 'Montreal', 'Calgary', 'Ottawa', 'Edmonton', 'Winnipeg', 'Halifax'], schoolStartAge: 6, highSchoolEndAge: 18, drinkingAge: 19, publicHealthcare: true, gamblingLegal: true, lifeExpectancy: 82, taxRate: 0.26 },
  { code: 'AU', name: 'Australia', demonym: 'Australian', flag: '🇦🇺', currency: 'AUD', currencySymbol: '$', fxRate: 1.52, salaryMultiplier: 0.95, costOfLiving: 1.05, namePool: 'anglo', cities: ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Canberra', 'Hobart', 'Darwin'], schoolStartAge: 6, highSchoolEndAge: 18, drinkingAge: 18, publicHealthcare: true, gamblingLegal: true, lifeExpectancy: 83, taxRate: 0.28 },
  { code: 'DE', name: 'Germany', demonym: 'German', flag: '🇩🇪', currency: 'EUR', currencySymbol: '€', fxRate: 0.92, salaryMultiplier: 0.85, costOfLiving: 0.9, namePool: 'german', cities: ['Berlin', 'Munich', 'Hamburg', 'Frankfurt', 'Cologne', 'Stuttgart', 'Düsseldorf', 'Leipzig'], schoolStartAge: 6, highSchoolEndAge: 18, drinkingAge: 16, publicHealthcare: true, gamblingLegal: true, lifeExpectancy: 81, taxRate: 0.35 },
  { code: 'FR', name: 'France', demonym: 'French', flag: '🇫🇷', currency: 'EUR', currencySymbol: '€', fxRate: 0.92, salaryMultiplier: 0.8, costOfLiving: 0.9, namePool: 'french', cities: ['Paris', 'Lyon', 'Marseille', 'Toulouse', 'Nice', 'Bordeaux', 'Lille', 'Nantes'], schoolStartAge: 6, highSchoolEndAge: 18, drinkingAge: 18, publicHealthcare: true, gamblingLegal: true, lifeExpectancy: 82, taxRate: 0.33 },
  { code: 'ES', name: 'Spain', demonym: 'Spanish', flag: '🇪🇸', currency: 'EUR', currencySymbol: '€', fxRate: 0.92, salaryMultiplier: 0.6, costOfLiving: 0.7, namePool: 'hispanic', cities: ['Madrid', 'Barcelona', 'Valencia', 'Seville', 'Bilbao', 'Málaga', 'Zaragoza'], schoolStartAge: 6, highSchoolEndAge: 18, drinkingAge: 18, publicHealthcare: true, gamblingLegal: true, lifeExpectancy: 83, taxRate: 0.3 },
  { code: 'IT', name: 'Italy', demonym: 'Italian', flag: '🇮🇹', currency: 'EUR', currencySymbol: '€', fxRate: 0.92, salaryMultiplier: 0.65, costOfLiving: 0.75, namePool: 'italian', cities: ['Rome', 'Milan', 'Naples', 'Turin', 'Florence', 'Bologna', 'Venice', 'Palermo'], schoolStartAge: 6, highSchoolEndAge: 19, drinkingAge: 18, publicHealthcare: true, gamblingLegal: true, lifeExpectancy: 83, taxRate: 0.33 },
  { code: 'MX', name: 'Mexico', demonym: 'Mexican', flag: '🇲🇽', currency: 'MXN', currencySymbol: '$', fxRate: 17, salaryMultiplier: 0.3, costOfLiving: 0.4, namePool: 'hispanic', cities: ['Mexico City', 'Guadalajara', 'Monterrey', 'Puebla', 'Tijuana', 'Cancún', 'Mérida'], schoolStartAge: 6, highSchoolEndAge: 18, drinkingAge: 18, publicHealthcare: true, gamblingLegal: true, lifeExpectancy: 75, taxRate: 0.2 },
  { code: 'BR', name: 'Brazil', demonym: 'Brazilian', flag: '🇧🇷', currency: 'BRL', currencySymbol: 'R$', fxRate: 5, salaryMultiplier: 0.3, costOfLiving: 0.4, namePool: 'brazilian', cities: ['São Paulo', 'Rio de Janeiro', 'Brasília', 'Salvador', 'Belo Horizonte', 'Curitiba', 'Recife', 'Porto Alegre'], schoolStartAge: 6, highSchoolEndAge: 17, drinkingAge: 18, publicHealthcare: true, gamblingLegal: false, lifeExpectancy: 76, taxRate: 0.22 },
  { code: 'JP', name: 'Japan', demonym: 'Japanese', flag: '🇯🇵', currency: 'JPY', currencySymbol: '¥', fxRate: 150, salaryMultiplier: 0.75, costOfLiving: 0.9, namePool: 'japanese', cities: ['Tokyo', 'Osaka', 'Kyoto', 'Yokohama', 'Nagoya', 'Sapporo', 'Fukuoka', 'Kobe'], schoolStartAge: 6, highSchoolEndAge: 18, drinkingAge: 20, publicHealthcare: true, gamblingLegal: false, lifeExpectancy: 85, taxRate: 0.3 },
  { code: 'IN', name: 'India', demonym: 'Indian', flag: '🇮🇳', currency: 'INR', currencySymbol: '₹', fxRate: 83, salaryMultiplier: 0.15, costOfLiving: 0.25, namePool: 'indian', cities: ['Mumbai', 'Delhi', 'Bengaluru', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Jaipur'], schoolStartAge: 6, highSchoolEndAge: 18, drinkingAge: 21, publicHealthcare: true, gamblingLegal: false, lifeExpectancy: 70, taxRate: 0.18 },
  { code: 'NG', name: 'Nigeria', demonym: 'Nigerian', flag: '🇳🇬', currency: 'NGN', currencySymbol: '₦', fxRate: 1500, salaryMultiplier: 0.1, costOfLiving: 0.2, namePool: 'nigerian', cities: ['Lagos', 'Abuja', 'Kano', 'Ibadan', 'Port Harcourt', 'Benin City', 'Enugu'], schoolStartAge: 6, highSchoolEndAge: 18, drinkingAge: 18, publicHealthcare: false, gamblingLegal: true, lifeExpectancy: 55, taxRate: 0.15 },
];

export const COUNTRY_BY_CODE: Record<string, CountryDef> = Object.fromEntries(COUNTRIES.map((c) => [c.code, c]));

export function getCountry(code: string): CountryDef {
  return COUNTRY_BY_CODE[code] ?? (COUNTRIES[0] as CountryDef);
}
