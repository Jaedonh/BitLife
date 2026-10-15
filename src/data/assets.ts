import type { AssetKind } from '@/engine/types';

export interface AssetDef {
  id: string;
  kind: AssetKind;
  name: string;
  emoji: string;
  /** USD, scaled by country. */
  price: number;
  /** Yearly upkeep as a fraction of price. */
  upkeepRate: number;
  /** Yearly appreciation (houses) or depreciation (cars), fraction. */
  valueDrift: number;
  /** Happiness on purchase. */
  joy: number;
  /** Houses: can be mortgaged. */
  mortgageable?: boolean;
  /** Houses: rent income per year as fraction of price when rented out. */
  rentYield?: number;
  minAge: number;
}

export const ASSETS: readonly AssetDef[] = [
  { id: 'bike', kind: 'car', name: 'Used bicycle', emoji: '🚲', price: 200, upkeepRate: 0.05, valueDrift: -0.1, joy: 2, minAge: 8 },
  { id: 'scooter', kind: 'car', name: 'Scooter', emoji: '🛵', price: 2500, upkeepRate: 0.08, valueDrift: -0.12, joy: 4, minAge: 16 },
  { id: 'old_hatchback', kind: 'car', name: 'Old hatchback', emoji: '🚗', price: 4500, upkeepRate: 0.15, valueDrift: -0.12, joy: 5, minAge: 16 },
  { id: 'sedan', kind: 'car', name: 'Family sedan', emoji: '🚙', price: 24000, upkeepRate: 0.08, valueDrift: -0.12, joy: 6, minAge: 17 },
  { id: 'pickup', kind: 'car', name: 'Pickup truck', emoji: '🛻', price: 38000, upkeepRate: 0.09, valueDrift: -0.11, joy: 7, minAge: 17 },
  { id: 'ev', kind: 'car', name: 'Electric car', emoji: '🔋', price: 46000, upkeepRate: 0.05, valueDrift: -0.13, joy: 8, minAge: 17 },
  { id: 'luxury_sedan', kind: 'car', name: 'Luxury sedan', emoji: '🚘', price: 95000, upkeepRate: 0.08, valueDrift: -0.14, joy: 10, minAge: 18 },
  { id: 'sports_car', kind: 'car', name: 'Sports car', emoji: '🏎️', price: 180000, upkeepRate: 0.1, valueDrift: -0.12, joy: 14, minAge: 18 },
  { id: 'supercar', kind: 'car', name: 'Supercar', emoji: '🏁', price: 450000, upkeepRate: 0.1, valueDrift: -0.1, joy: 18, minAge: 18 },
  { id: 'classic_car', kind: 'car', name: 'Classic car', emoji: '🚕', price: 120000, upkeepRate: 0.12, valueDrift: 0.03, joy: 12, minAge: 21 },
  { id: 'studio', kind: 'house', name: 'Studio apartment', emoji: '🏢', price: 120000, upkeepRate: 0.02, valueDrift: 0.03, joy: 6, mortgageable: true, rentYield: 0.06, minAge: 18 },
  { id: 'condo', kind: 'house', name: 'City condo', emoji: '🏙️', price: 260000, upkeepRate: 0.02, valueDrift: 0.03, joy: 8, mortgageable: true, rentYield: 0.055, minAge: 18 },
  { id: 'townhouse', kind: 'house', name: 'Townhouse', emoji: '🏘️', price: 380000, upkeepRate: 0.02, valueDrift: 0.03, joy: 10, mortgageable: true, rentYield: 0.05, minAge: 18 },
  { id: 'suburban', kind: 'house', name: 'Suburban family home', emoji: '🏡', price: 520000, upkeepRate: 0.02, valueDrift: 0.03, joy: 12, mortgageable: true, rentYield: 0.045, minAge: 18 },
  { id: 'farmhouse', kind: 'house', name: 'Farmhouse with land', emoji: '🌾', price: 700000, upkeepRate: 0.025, valueDrift: 0.03, joy: 13, mortgageable: true, rentYield: 0.04, minAge: 18 },
  { id: 'beach_house', kind: 'house', name: 'Beach house', emoji: '🏖️', price: 1400000, upkeepRate: 0.03, valueDrift: 0.035, joy: 16, mortgageable: true, rentYield: 0.045, minAge: 18 },
  { id: 'mansion', kind: 'house', name: 'Mansion', emoji: '🏰', price: 4500000, upkeepRate: 0.03, valueDrift: 0.03, joy: 20, mortgageable: true, rentYield: 0.035, minAge: 18 },
  { id: 'penthouse', kind: 'house', name: 'Penthouse', emoji: '🌆', price: 9000000, upkeepRate: 0.03, valueDrift: 0.035, joy: 22, mortgageable: true, rentYield: 0.035, minAge: 18 },
  { id: 'watch', kind: 'item', name: 'Luxury watch', emoji: '⌚', price: 12000, upkeepRate: 0, valueDrift: 0.01, joy: 5, minAge: 18 },
  { id: 'gaming_pc', kind: 'item', name: 'Gaming PC', emoji: '🖥️', price: 2500, upkeepRate: 0, valueDrift: -0.25, joy: 6, minAge: 12 },
  { id: 'guitar', kind: 'item', name: 'Electric guitar', emoji: '🎸', price: 900, upkeepRate: 0, valueDrift: -0.05, joy: 5, minAge: 10 },
  { id: 'boat', kind: 'item', name: 'Speedboat', emoji: '🚤', price: 85000, upkeepRate: 0.08, valueDrift: -0.08, joy: 12, minAge: 21 },
  { id: 'jewelry', kind: 'item', name: 'Diamond necklace', emoji: '💎', price: 30000, upkeepRate: 0, valueDrift: 0.02, joy: 7, minAge: 18 },
];

export const ASSET_BY_ID: Record<string, AssetDef> = Object.fromEntries(ASSETS.map((a) => [a.id, a]));
