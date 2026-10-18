export interface HustleDef {
  id: string;
  name: string;
  /** What it is called in a sentence: "my streaming channel", "a tutoring business". */
  noun: string;
  emoji: string;
  description: string;
  minAge: number;
  /** Stat that drives growth. */
  stat: 'smarts' | 'looks' | 'happiness' | 'health';
  /** USD base income per level (0..5), scaled by country. */
  incomeByLevel: number[];
  /** Yearly chance to level up at full effort (scaled by stat). */
  growth: number;
  /** Energy per year to keep it running. */
  energy: number;
  /** Fame gain per year at level >= 3. */
  fame: number;
  /** Chance per year of a viral/breakout bonus. */
  viralChance: number;
  viralBonus: number;
}

export const HUSTLES: readonly HustleDef[] = [
  { id: 'streamer', name: 'Streaming channel', noun: 'streaming channel', emoji: '🎥', description: 'Build an audience one upload at a time.', minAge: 13, stat: 'looks', incomeByLevel: [0, 600, 3000, 12000, 45000, 160000], growth: 0.45, energy: 1, fame: 4, viralChance: 0.06, viralBonus: 25000 },
  { id: 'app_dev', name: 'Indie app developer', noun: 'app studio', emoji: '📱', description: 'Ship small apps and hope one sticks.', minAge: 15, stat: 'smarts', incomeByLevel: [0, 800, 4000, 15000, 50000, 180000], growth: 0.4, energy: 1, fame: 1, viralChance: 0.05, viralBonus: 40000 },
  { id: 'etsy', name: 'Craft shop', noun: 'craft shop', emoji: '🧶', description: 'Sell handmade goods online.', minAge: 14, stat: 'happiness', incomeByLevel: [0, 500, 2500, 8000, 20000, 45000], growth: 0.5, energy: 1, fame: 0, viralChance: 0.04, viralBonus: 8000 },
  { id: 'rideshare', name: 'Rideshare driving', noun: 'rideshare gig', emoji: '🚕', description: 'Drive nights and weekends. Needs a car.', minAge: 21, stat: 'health', incomeByLevel: [0, 4000, 8000, 12000, 15000, 18000], growth: 0.7, energy: 1, fame: 0, viralChance: 0, viralBonus: 0 },
  { id: 'tutoring', name: 'Private tutoring', noun: 'tutoring business', emoji: '📐', description: 'Teach what you know.', minAge: 16, stat: 'smarts', incomeByLevel: [0, 2000, 5000, 9000, 14000, 20000], growth: 0.6, energy: 1, fame: 0, viralChance: 0, viralBonus: 0 },
  { id: 'flipping', name: 'Furniture flipping', noun: 'furniture-flipping business', emoji: '🪑', description: 'Buy low, sand, varnish, sell high.', minAge: 16, stat: 'health', incomeByLevel: [0, 1500, 4000, 8000, 15000, 25000], growth: 0.55, energy: 1, fame: 0, viralChance: 0.02, viralBonus: 5000 },
];

export const HUSTLE_BY_ID: Record<string, HustleDef> = Object.fromEntries(HUSTLES.map((h) => [h.id, h]));
