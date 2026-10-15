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
}

export const ILLNESSES: readonly IllnessDef[] = [
  { id: 'cold', name: 'the common cold', severity: 1, chronic: false, duration: 1, weights: [6, 4, 3], treatCost: 0.3, cureChance: 0.95 },
  { id: 'flu', name: 'the flu', severity: 2, chronic: false, duration: 1, weights: [4, 3, 3], treatCost: 0.5, cureChance: 0.9 },
  { id: 'chickenpox', name: 'chickenpox', severity: 1, chronic: false, duration: 1, weights: [3, 0.2, 0], treatCost: 0.4, cureChance: 0.95 },
  { id: 'ear_infection', name: 'an ear infection', severity: 1, chronic: false, duration: 1, weights: [3, 0.5, 0.3], treatCost: 0.4, cureChance: 0.95 },
  { id: 'asthma', name: 'asthma', severity: 2, chronic: true, duration: -1, weights: [1.2, 0.4, 0.2], treatCost: 1, cureChance: 0.1 },
  { id: 'food_poisoning', name: 'food poisoning', severity: 2, chronic: false, duration: 1, weights: [1, 2, 1], treatCost: 0.5, cureChance: 0.95 },
  { id: 'mono', name: 'mononucleosis', severity: 2, chronic: false, duration: 1, weights: [0.5, 1, 0.1], treatCost: 0.6, cureChance: 0.85 },
  { id: 'back_pain', name: 'chronic back pain', severity: 2, chronic: true, duration: -1, weights: [0, 1.2, 2], treatCost: 1.2, cureChance: 0.3 },
  { id: 'migraines', name: 'migraines', severity: 2, chronic: true, duration: -1, weights: [0.2, 1, 0.5], treatCost: 0.8, cureChance: 0.3 },
  { id: 'depression', name: 'depression', severity: 3, chronic: true, duration: -1, weights: [0.3, 1.2, 0.8], treatCost: 1.5, cureChance: 0.4 },
  { id: 'anxiety', name: 'an anxiety disorder', severity: 2, chronic: true, duration: -1, weights: [0.4, 1.2, 0.5], treatCost: 1.2, cureChance: 0.4 },
  { id: 'hypertension', name: 'high blood pressure', severity: 3, chronic: true, duration: -1, weights: [0, 1, 3], treatCost: 1, cureChance: 0.25 },
  { id: 'diabetes', name: 'type 2 diabetes', severity: 3, chronic: true, duration: -1, weights: [0.05, 0.8, 2], treatCost: 1.5, cureChance: 0.15 },
  { id: 'pneumonia', name: 'pneumonia', severity: 4, chronic: false, duration: 1, weights: [0.5, 0.6, 2.5], treatCost: 2, cureChance: 0.85 },
  { id: 'kidney_stones', name: 'kidney stones', severity: 3, chronic: false, duration: 1, weights: [0, 0.8, 0.8], treatCost: 2, cureChance: 0.9 },
  { id: 'appendicitis', name: 'appendicitis', severity: 4, chronic: false, duration: 1, weights: [0.6, 0.5, 0.2], treatCost: 4, cureChance: 0.95 },
  { id: 'arthritis', name: 'arthritis', severity: 2, chronic: true, duration: -1, weights: [0, 0.3, 3], treatCost: 1, cureChance: 0.1 },
  { id: 'heart_disease', name: 'heart disease', severity: 5, chronic: true, duration: -1, weights: [0, 0.4, 2.5], treatCost: 6, cureChance: 0.2 },
  { id: 'cancer', name: 'cancer', severity: 5, chronic: true, duration: -1, weights: [0.05, 0.3, 1.8], treatCost: 12, cureChance: 0.35 },
  { id: 'stroke', name: 'a stroke', severity: 5, chronic: false, duration: 2, weights: [0, 0.15, 1.5], treatCost: 8, cureChance: 0.6 },
  { id: 'dementia', name: 'dementia', severity: 4, chronic: true, duration: -1, weights: [0, 0.02, 1.5], treatCost: 3, cureChance: 0.05 },
  { id: 'hearing_loss', name: 'hearing loss', severity: 1, chronic: true, duration: -1, weights: [0, 0.2, 2], treatCost: 1.5, cureChance: 0.4 },
  { id: 'cataracts', name: 'cataracts', severity: 1, chronic: true, duration: -1, weights: [0, 0.1, 2], treatCost: 2.5, cureChance: 0.9 },
  { id: 'osteoporosis', name: 'osteoporosis', severity: 2, chronic: true, duration: -1, weights: [0, 0.1, 1.5], treatCost: 1.2, cureChance: 0.2 },
  { id: 'std', name: 'an STI', severity: 2, chronic: false, duration: 1, weights: [0, 0.6, 0.05], treatCost: 0.6, cureChance: 0.9 },
];

export const ILLNESS_BY_ID: Record<string, IllnessDef> = Object.fromEntries(ILLNESSES.map((i) => [i.id, i]));
