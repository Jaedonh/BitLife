export interface IllnessDef {
  id: string;
  name: string;
  /** 1 (nuisance) .. 5 (life-threatening). Health drain per untreated year ~= severity * 4. */
  severity: number;
  chronic: boolean;
  /** Typical duration in years when not chronic. */
  duration: number;
  /** Base yearly probability weights by age band: child (<18), adult (18-64), senior (65+). */
  weights: [number, number, number];
  /** Cost multiplier for a doctor visit (base 400). */
  treatCost: number;
  /** Chance a doctor visit cures it. */
  cureChance: number;
  /** No visit cures it (cureChance is ignored): a doctor can only help manage it, and the journal never says it went away. */
  incurable?: boolean;
  /** Youngest age it can strike at random (default 0), so a toddler is never diagnosed with migraines. */
  minAge?: number;
  /** Journal line when it starts (default "I was diagnosed with {name}."). */
  onset?: string;
  /** How it reads after "my" ("my cold", "my anxiety"); defaults to the name without its article. */
  short?: string;
  /** The short name is a plural ("my migraines are"). */
  plural?: boolean;
  /**
   * At most once a life (an appendix comes out once): never rolled again once it has been had (illnessHadFlag, set when
   * it is given), nor after one of `hadAfterEvents` fired (a card where it was operated on).
   */
  oncePerLife?: boolean;
  /** Cards that mean the player has had a once-a-life illness (the appendix cards). */
  hadAfterEvents?: readonly string[];
}

export const ILLNESSES: readonly IllnessDef[] = [
  { id: 'cold', name: 'the common cold', severity: 1, chronic: false, duration: 1, weights: [6, 4, 3], treatCost: 0.3, cureChance: 0.95, onset: 'I caught a cold.', short: 'cold' },
  { id: 'flu', name: 'the flu', severity: 2, chronic: false, duration: 1, weights: [4, 3, 3], treatCost: 0.5, cureChance: 0.9, onset: 'I came down with the flu.', short: 'flu' },
  { id: 'chickenpox', name: 'chickenpox', severity: 1, chronic: false, duration: 1, weights: [3, 0.2, 0], treatCost: 0.4, cureChance: 0.95, onset: 'I came down with chickenpox.' },
  { id: 'ear_infection', name: 'an ear infection', severity: 1, chronic: false, duration: 1, weights: [3, 0.5, 0.3], treatCost: 0.4, cureChance: 0.95, onset: 'I got an ear infection.' },
  { id: 'asthma', name: 'asthma', severity: 2, chronic: true, duration: -1, weights: [1.2, 0.4, 0.2], treatCost: 1, cureChance: 0.1, minAge: 3 },
  { id: 'food_poisoning', name: 'food poisoning', severity: 2, chronic: false, duration: 1, weights: [1, 2, 1], treatCost: 0.5, cureChance: 0.95, minAge: 2, onset: 'I got food poisoning.' },
  { id: 'mono', name: 'mononucleosis', severity: 2, chronic: false, duration: 1, weights: [0.5, 1, 0.1], treatCost: 0.6, cureChance: 0.85, minAge: 10, onset: 'I came down with mononucleosis.', short: 'mono' },
  { id: 'back_pain', name: 'chronic back pain', severity: 2, chronic: true, duration: -1, weights: [0, 1.2, 2], treatCost: 1.2, cureChance: 0.3, minAge: 25, onset: 'I developed chronic back pain.', short: 'back pain' },
  { id: 'migraines', name: 'migraines', severity: 2, chronic: true, duration: -1, weights: [0.2, 1, 0.5], treatCost: 0.8, cureChance: 0.3, minAge: 8, onset: 'I started getting migraines.', plural: true },
  { id: 'depression', name: 'depression', severity: 3, chronic: true, duration: -1, weights: [0.3, 1.2, 0.8], treatCost: 1.5, cureChance: 0.4, minAge: 12 },
  { id: 'anxiety', name: 'an anxiety disorder', severity: 2, chronic: true, duration: -1, weights: [0.4, 1.2, 0.5], treatCost: 1.2, cureChance: 0.4, minAge: 10, short: 'anxiety' },
  { id: 'hypertension', name: 'high blood pressure', severity: 3, chronic: true, duration: -1, weights: [0, 1, 3], treatCost: 1, cureChance: 0.25, minAge: 30 },
  { id: 'diabetes', name: 'type 2 diabetes', severity: 3, chronic: true, duration: -1, weights: [0.05, 0.8, 2], treatCost: 1.5, cureChance: 0.15, minAge: 10 },
  { id: 'pneumonia', name: 'pneumonia', severity: 4, chronic: false, duration: 1, weights: [0.5, 0.6, 2.5], treatCost: 2, cureChance: 0.85, onset: 'I came down with pneumonia.' },
  { id: 'kidney_stones', name: 'kidney stones', severity: 3, chronic: false, duration: 1, weights: [0, 0.8, 0.8], treatCost: 2, cureChance: 0.9, minAge: 20, plural: true },
  { id: 'appendicitis', name: 'appendicitis', severity: 4, chronic: false, duration: 1, weights: [0.6, 0.5, 0.2], treatCost: 4, cureChance: 0.95, minAge: 4, oncePerLife: true, hadAfterEvents: ['kl_appendicitis', 'hl_appendix_pain'] },
  { id: 'arthritis', name: 'arthritis', severity: 2, chronic: true, duration: -1, weights: [0, 0.3, 3], treatCost: 1, cureChance: 0, incurable: true, minAge: 35 },
  { id: 'heart_disease', name: 'heart disease', severity: 5, chronic: true, duration: -1, weights: [0, 0.4, 2.5], treatCost: 6, cureChance: 0.2, minAge: 35 },
  { id: 'cancer', name: 'cancer', severity: 5, chronic: true, duration: -1, weights: [0.05, 0.3, 1.8], treatCost: 12, cureChance: 0.35, minAge: 12 },
  { id: 'stroke', name: 'a stroke', severity: 5, chronic: false, duration: 2, weights: [0, 0.15, 1.5], treatCost: 8, cureChance: 0.6, minAge: 35, onset: 'I had a stroke.' },
  { id: 'dementia', name: 'dementia', severity: 4, chronic: true, duration: -1, weights: [0, 0.02, 1.5], treatCost: 3, cureChance: 0, incurable: true, minAge: 50 },
  { id: 'hearing_loss', name: 'hearing loss', severity: 1, chronic: true, duration: -1, weights: [0, 0.2, 2], treatCost: 1.5, cureChance: 0.4, minAge: 40, onset: 'My hearing started to go.' },
  { id: 'cataracts', name: 'cataracts', severity: 1, chronic: true, duration: -1, weights: [0, 0.1, 2], treatCost: 2.5, cureChance: 0.9, minAge: 45, plural: true },
  { id: 'osteoporosis', name: 'osteoporosis', severity: 2, chronic: true, duration: -1, weights: [0, 0.1, 1.5], treatCost: 1.2, cureChance: 0, incurable: true, minAge: 45 },
  { id: 'std', name: 'an STI', severity: 2, chronic: false, duration: 1, weights: [0, 0.6, 0.05], treatCost: 0.6, cureChance: 0.9, minAge: 16, short: 'STI' },
];

export const ILLNESS_BY_ID: Record<string, IllnessDef> = Object.fromEntries(ILLNESSES.map((i) => [i.id, i]));

/** Flag `had:<id>`: a once-a-life illness (IllnessDef.oncePerLife) the player has had. Content can wait it out with `{ flag: 'had:appendicitis', exists: false }`. */
export const illnessHadFlag = (id: string): string => `had:${id}`;

/** Whether the player has already had this once-a-life illness (always false for one that can come back). */
export function hadOnceIllness(def: IllnessDef, flags: Readonly<Record<string, unknown>>, firedEvents: Readonly<Record<string, number>>): boolean {
  if (!def.oncePerLife) return false;
  return flags[illnessHadFlag(def.id)] !== undefined || (def.hadAfterEvents ?? []).some((e) => firedEvents[e] !== undefined);
}

/** The chance one doctor visit cures it: none for an incurable illness, a little more once it is being treated. */
export function visitCureChance(defId: string, treated: boolean): number {
  const def = ILLNESS_BY_ID[defId];
  if (def?.incurable) return 0;
  return (def?.cureChance ?? 0.7) + (treated ? 0.1 : 0);
}

/** The illness as it reads after "my": "my cold", "my anxiety", "my ear infection". */
export function shortIllnessName(defId: string, fallbackName: string): string {
  const def = ILLNESS_BY_ID[defId];
  return def?.short ?? (def?.name ?? fallbackName).replace(/^(a|an|the) /, '');
}
