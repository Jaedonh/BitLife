export interface CrimeDef {
  id: string;
  name: string;
  /** The crime as a noun mid-sentence: "I was arrested for car theft". */
  noun: string;
  /** What I was doing when caught: "I was caught breaking into a house". */
  gerund: string;
  emoji: string;
  description: string;
  minAge: number;
  /** Base success chance (0-1); modified by smarts and notoriety. */
  success: number;
  /** USD payout range on success, scaled by country. */
  payout: [number, number];
  /** Chance of arrest when it fails. */
  arrestOnFail: number;
  /** Prison years range if convicted. */
  sentence: [number, number];
  karma: number;
  /** Chance of injury during the crime. */
  injury: number;
  energy: number;
  /** The era it belongs to (util.inEra): online fraud from 2000, passing bad checks before it. */
  minYear?: number;
  maxYear?: number;
}

export const CRIMES: readonly CrimeDef[] = [
  { id: 'shoplift', name: 'Shoplifting', noun: 'shoplifting', gerund: 'shoplifting', emoji: '🛍️', description: 'Pocket something small.', minAge: 12, success: 0.7, payout: [20, 300], arrestOnFail: 0.6, sentence: [0, 1], karma: -3, injury: 0.02, energy: 1 },
  { id: 'pickpocket', name: 'Pickpocketing', noun: 'pickpocketing', gerund: 'picking pockets', emoji: '👛', description: 'Lift a wallet in a crowd.', minAge: 13, success: 0.6, payout: [50, 600], arrestOnFail: 0.5, sentence: [0, 1], karma: -4, injury: 0.05, energy: 1 },
  { id: 'vandalism', name: 'Vandalism', noun: 'vandalism', gerund: 'vandalizing a wall', emoji: '🎨', description: 'Leave your mark. No payout, some thrill.', minAge: 12, success: 0.75, payout: [0, 0], arrestOnFail: 0.5, sentence: [0, 1], karma: -3, injury: 0.03, energy: 1 },
  { id: 'burglary', name: 'Burglary', noun: 'burglary', gerund: 'breaking into a house', emoji: '🏠', description: 'Break into an empty house.', minAge: 16, success: 0.5, payout: [500, 8000], arrestOnFail: 0.7, sentence: [1, 4], karma: -8, injury: 0.1, energy: 2 },
  { id: 'car_theft', name: 'Car theft', noun: 'car theft', gerund: 'stealing a car', emoji: '🚗', description: 'Hotwire and drive off.', minAge: 16, success: 0.45, payout: [2000, 25000], arrestOnFail: 0.75, sentence: [1, 5], karma: -10, injury: 0.12, energy: 2 },
  { id: 'fraud', name: 'Online fraud', noun: 'online fraud', gerund: 'running an online scam', emoji: '💻', description: 'Run a scam from your laptop.', minAge: 18, success: 0.5, payout: [3000, 60000], arrestOnFail: 0.6, sentence: [2, 7], karma: -10, injury: 0, energy: 2, minYear: 2000 },
  { id: 'check_fraud', name: 'Check fraud', noun: 'check fraud', gerund: 'passing bad checks', emoji: '🧾', description: 'Write checks that are sure to bounce.', minAge: 18, success: 0.5, payout: [3000, 60000], arrestOnFail: 0.6, sentence: [2, 7], karma: -10, injury: 0, energy: 2, maxYear: 1999 },
  { id: 'bank_robbery', name: 'Bank robbery', noun: 'bank robbery', gerund: 'robbing a bank', emoji: '🏦', description: 'The big one.', minAge: 18, success: 0.25, payout: [50000, 900000], arrestOnFail: 0.9, sentence: [8, 20], karma: -20, injury: 0.3, energy: 3 },
];

export const CRIME_BY_ID: Record<string, CrimeDef> = Object.fromEntries(CRIMES.map((c) => [c.id, c]));
