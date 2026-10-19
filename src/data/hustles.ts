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
  /** Needs a car (not a bike or scooter) to start, and ends once no car is owned. */
  needsCar?: boolean;
  /**
   * The era it belongs to (util.inEra): offered from `minYear` (a streaming channel waits for online video) and up
   * to `maxYear` (a craft stall gives way to the online craft shop). One already running carries on either way.
   */
  minYear?: number;
  maxYear?: number;
  /** The journal line for a breakout year, for a hustle that cannot "go viral" (a market stall, a camcorder). */
  breakout?: string;
}

/**
 * Six ideas are on the menu in any year: before the internet versions arrive, someone young in 1990 films
 * weddings, fixes computers, sells crafts at a weekend market or delivers pizzas instead.
 */
export const HUSTLES: readonly HustleDef[] = [
  { id: 'streamer', name: 'Streaming channel', noun: 'streaming channel', emoji: '🎥', description: 'Build an audience one upload at a time.', minAge: 13, stat: 'looks', incomeByLevel: [0, 600, 3000, 12000, 45000, 160000], growth: 0.45, energy: 1, fame: 4, viralChance: 0.06, viralBonus: 25000, minYear: 2007 },
  { id: 'wedding_video', name: 'Wedding videos', noun: 'wedding video business', emoji: '📼', description: 'Film weddings on a camcorder.', minAge: 16, stat: 'looks', incomeByLevel: [0, 1200, 3500, 8000, 14000, 24000], growth: 0.5, energy: 1, fame: 0, viralChance: 0.03, viralBonus: 5000, maxYear: 2006, breakout: 'A wedding video I made got passed around town, and the bookings poured in!' },
  { id: 'app_dev', name: 'Indie app developer', noun: 'app studio', emoji: '📱', description: 'Ship small apps and hope one sticks.', minAge: 15, stat: 'smarts', incomeByLevel: [0, 800, 4000, 15000, 50000, 180000], growth: 0.4, energy: 1, fame: 1, viralChance: 0.05, viralBonus: 40000, minYear: 2008 },
  { id: 'pc_repair', name: 'Computer repair', noun: 'computer repair business', emoji: '💾', description: 'Fix computers for the neighbors.', minAge: 15, stat: 'smarts', incomeByLevel: [0, 1000, 3500, 9000, 16000, 28000], growth: 0.45, energy: 1, fame: 0, viralChance: 0.03, viralBonus: 6000, maxYear: 2007, breakout: 'A local firm hired me to fix every computer in the building!' },
  { id: 'etsy', name: 'Craft shop', noun: 'craft shop', emoji: '🧶', description: 'Sell handmade goods online.', minAge: 13, stat: 'happiness', incomeByLevel: [0, 500, 2500, 8000, 20000, 45000], growth: 0.5, energy: 1, fame: 0, viralChance: 0.04, viralBonus: 8000, minYear: 1999 },
  { id: 'craft_stall', name: 'Craft stall', noun: 'craft stall', emoji: '🧺', description: 'Sell handmade goods at weekend markets.', minAge: 13, stat: 'happiness', incomeByLevel: [0, 400, 2000, 6000, 14000, 28000], growth: 0.5, energy: 1, fame: 0, viralChance: 0.03, viralBonus: 4000, maxYear: 1998, breakout: 'My craft stall sold out at the big holiday fair!' },
  { id: 'rideshare', name: 'Rideshare driving', noun: 'rideshare gig', emoji: '🚕', description: 'Drive nights and weekends. Needs a car.', minAge: 21, stat: 'health', incomeByLevel: [0, 4000, 8000, 12000, 15000, 18000], growth: 0.7, energy: 1, fame: 0, viralChance: 0, viralBonus: 0, needsCar: true, minYear: 2012 },
  { id: 'pizza_delivery', name: 'Pizza delivery', noun: 'pizza delivery gig', emoji: '🍕', description: 'Deliver pizzas nights and weekends. Needs a car.', minAge: 18, stat: 'health', incomeByLevel: [0, 3000, 6000, 9000, 12000, 15000], growth: 0.7, energy: 1, fame: 0, viralChance: 0, viralBonus: 0, needsCar: true, maxYear: 2011 },
  { id: 'tutoring', name: 'Private tutoring', noun: 'tutoring business', emoji: '📐', description: 'Teach what you know.', minAge: 16, stat: 'smarts', incomeByLevel: [0, 2000, 5000, 9000, 14000, 20000], growth: 0.6, energy: 1, fame: 0, viralChance: 0, viralBonus: 0 },
  { id: 'flipping', name: 'Furniture flipping', noun: 'furniture-flipping business', emoji: '🪑', description: 'Buy low, sand, varnish, sell high.', minAge: 16, stat: 'health', incomeByLevel: [0, 1500, 4000, 8000, 15000, 25000], growth: 0.55, energy: 1, fame: 0, viralChance: 0.02, viralBonus: 5000, breakout: 'A dresser I restored sold for a small fortune!' },
];

export const HUSTLE_BY_ID: Record<string, HustleDef> = Object.fromEntries(HUSTLES.map((h) => [h.id, h]));
