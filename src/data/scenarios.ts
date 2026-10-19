import type { ScenarioId } from '@/engine/types';

/**
 * Starting scenarios (GAME_DESIGN §4a): how a new life begins. The engine reads the id
 * (systems/character.ts and systems/scenarios.ts); the new-life screen shows the cards.
 */
export interface ScenarioDef {
  id: ScenarioId;
  emoji: string;
  name: string;
  /** One line for the card on the new-life screen. */
  description: string;
  /** Premium perk (the wealthy family). Everything else is free. */
  premium?: boolean;
}

export const SCENARIOS: readonly ScenarioDef[] = [
  { id: 'standard', emoji: '🎲', name: 'Standard', description: 'Any family, anywhere.' },
  { id: 'orphan', emoji: '🧸', name: 'Orphan', description: 'No parents. Raised in foster care.' },
  { id: 'big_family', emoji: '👨‍👩‍👧‍👦', name: 'Big family', description: 'Three to five siblings, tight money.' },
  { id: 'single_parent', emoji: '👩‍👦', name: 'Single parent', description: 'One parent doing the work of two.' },
  { id: 'immigrant', emoji: '✈️', name: 'Immigrant', description: 'Born in one country, raised in another.' },
  { id: 'prodigy', emoji: '🧠', name: 'Prodigy', description: 'Born brilliant and a quick learner.' },
  { id: 'farm_kid', emoji: '🚜', name: 'Farm kid', description: 'Grow up on a farm near a small town.' },
  { id: 'wealthy', emoji: '💎', name: 'Wealthy', description: 'Born into money, with luck to match.', premium: true },
];

export const SCENARIO_BY_ID: Record<ScenarioId, ScenarioDef> = Object.fromEntries(SCENARIOS.map((s) => [s.id, s])) as Record<ScenarioId, ScenarioDef>;

export function isScenarioId(id: unknown): id is ScenarioId {
  return typeof id === 'string' && Object.prototype.hasOwnProperty.call(SCENARIO_BY_ID, id);
}

/**
 * Farm towns per birth country for the farm-kid scenario. A country without a list (one added later)
 * falls back to "a small town near <city>".
 */
export const FARM_TOWNS: Readonly<Record<string, readonly string[]>> = {
  US: ['Dodge City', 'Grand Island', 'Hutchinson', 'Walla Walla', 'Ames'],
  GB: ['Hereford', 'Ludlow', 'Thirsk', 'Kendal'],
  CA: ['Moose Jaw', 'Brandon', 'Red Deer', 'Lethbridge'],
  AU: ['Dubbo', 'Wagga Wagga', 'Toowoomba', 'Mildura'],
  DE: ['Husum', 'Cloppenburg', 'Uelzen', 'Vechta'],
  FR: ['Aurillac', 'Rodez', 'Guéret', 'Mende'],
  ES: ['Teruel', 'Soria', 'Cuenca', 'Zamora'],
  IT: ['Cremona', 'Mantua', 'Matera', 'Rieti'],
  MX: ['Tepatitlán', 'Zamora', 'Celaya', 'Ciudad Obregón'],
  BR: ['Rio Verde', 'Sorriso', 'Chapecó', 'Passo Fundo'],
  JP: ['Obihiro', 'Tsuruoka', 'Uonuma', 'Furano'],
  IN: ['Anand', 'Karnal', 'Bathinda', 'Nanded'],
  NG: ['Makurdi', 'Gboko', 'Funtua', 'Ogbomosho'],
};
