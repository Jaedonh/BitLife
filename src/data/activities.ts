import type { Stats } from '@/engine/types';

export type ActivityGroup = 'mind_body' | 'doctor' | 'fun' | 'money' | 'shady';

export interface ActivityDef {
  id: string;
  group: ActivityGroup;
  name: string;
  emoji: string;
  description: string;
  minAge: number;
  maxAge?: number;
  /** USD cost, scaled by country. 0 = free. */
  cost: number;
  /** Social/focus energy spent (0-3). */
  energy: number;
  /** Max uses per year (0 = unlimited). */
  perYear: number;
  /** Guaranteed stat deltas. */
  effects: Partial<Stats>;
  karma?: number;
  /** Chance (0-1) of a bad outcome with its own effects + log line. */
  risk?: { chance: number; effects: Partial<Stats>; text: string; injury?: boolean; illness?: string; arrestYears?: number };
  /** Counter to bump on success. */
  counter?: 'workouts' | 'libraryVisits' | 'meditations' | 'vacations' | 'surgeries' | 'gamblingSessions';
  /** Log line on success. */
  text: string;
  requiresJob?: boolean;
  premium?: boolean;
}

export const ACTIVITIES: readonly ActivityDef[] = [
  { id: 'gym', group: 'mind_body', name: 'Gym', emoji: '🏋️', description: 'Work out for health and looks.', minAge: 12, cost: 40, energy: 1, perYear: 3, effects: { health: 6, looks: 3, happiness: 1 }, counter: 'workouts', text: 'I hit the gym and felt stronger for it.', risk: { chance: 0.04, effects: { health: -6 }, text: 'I pulled a muscle on the bench press.', injury: true } },
  { id: 'library', group: 'mind_body', name: 'Library', emoji: '📚', description: 'Read for a few weeks. Boosts Smarts.', minAge: 6, cost: 0, energy: 1, perYear: 3, effects: { smarts: 5, happiness: 1 }, counter: 'libraryVisits', text: 'I spent long afternoons reading at the library.' },
  { id: 'meditate', group: 'mind_body', name: 'Meditate', emoji: '🧘', description: 'Calm your mind. Boosts Happiness and Health.', minAge: 10, cost: 0, energy: 1, perYear: 2, effects: { happiness: 4, health: 2 }, karma: 1, counter: 'meditations', text: 'I meditated and felt the noise in my head go quiet.' },
  { id: 'jog', group: 'mind_body', name: 'Go jogging', emoji: '🏃', description: 'Free cardio.', minAge: 8, cost: 0, energy: 1, perYear: 3, effects: { health: 3, looks: 1, happiness: 1 }, counter: 'workouts', text: 'I went jogging most mornings.' },
  { id: 'diet', group: 'mind_body', name: 'Start a diet', emoji: '🥗', description: 'Eat better for a year.', minAge: 14, cost: 600, energy: 1, perYear: 1, effects: { health: 5, looks: 3, happiness: -2 }, text: 'I stuck to a healthy diet. Mostly.' },
  { id: 'salon', group: 'mind_body', name: 'Salon', emoji: '💇', description: 'A fresh look.', minAge: 12, cost: 120, energy: 0, perYear: 2, effects: { looks: 3, happiness: 2 }, text: 'I treated myself to a new look at the salon.', risk: { chance: 0.08, effects: { looks: -4, happiness: -3 }, text: 'The stylist misunderstood what I wanted. Badly.' } },
  { id: 'plastic_surgery', group: 'mind_body', name: 'Plastic surgery', emoji: '🩹', description: 'A permanent change, with risks.', minAge: 18, cost: 9000, energy: 1, perYear: 1, effects: { looks: 15, happiness: 4 }, counter: 'surgeries', text: 'The surgery went well. I barely recognised myself.', risk: { chance: 0.12, effects: { looks: -18, happiness: -10, health: -6 }, text: 'The surgery was botched. I avoided mirrors for a year.' } },
  { id: 'doctor', group: 'doctor', name: 'See a doctor', emoji: '🩺', description: 'Treat illnesses and recover health.', minAge: 0, cost: 400, energy: 0, perYear: 4, effects: { health: 4 }, text: 'The doctor patched me up.' },
  { id: 'therapy', group: 'doctor', name: 'Therapy', emoji: '🛋️', description: 'Talk things through.', minAge: 10, cost: 900, energy: 1, perYear: 2, effects: { happiness: 8 }, text: 'Therapy helped me untangle a few things.' },
  { id: 'rehab', group: 'doctor', name: 'Rehab', emoji: '🏥', description: 'Treat an addiction.', minAge: 16, cost: 12000, energy: 2, perYear: 1, effects: { health: 4, happiness: -3 }, text: 'I checked into rehab and did the work.' },
  { id: 'movies', group: 'fun', name: 'Movies', emoji: '🎬', description: 'A night out.', minAge: 6, cost: 30, energy: 0, perYear: 3, effects: { happiness: 3 }, text: 'I saw a movie. The popcorn was the best part.' },
  { id: 'vacation', group: 'fun', name: 'Vacation', emoji: '🏖️', description: 'Get away for a while.', minAge: 18, cost: 2500, energy: 1, perYear: 2, effects: { happiness: 12, health: 2 }, counter: 'vacations', text: 'I took a vacation and came back a new person.', risk: { chance: 0.06, effects: { happiness: -4, health: -4 }, text: 'I got food poisoning on vacation and spent it in bed.', illness: 'food_poisoning' } },
  { id: 'party', group: 'fun', name: 'Party', emoji: '🎉', description: 'Go out with friends.', minAge: 16, cost: 150, energy: 1, perYear: 3, effects: { happiness: 6, health: -1 }, text: 'I went out and danced until my feet hurt.', risk: { chance: 0.1, effects: { happiness: -5, health: -3 }, text: 'The party got out of hand and I woke up somewhere unfamiliar.' } },
  { id: 'hobby', group: 'fun', name: 'Hobby', emoji: '🎨', description: 'Paint, play, build.', minAge: 5, cost: 100, energy: 1, perYear: 2, effects: { happiness: 4, smarts: 1 }, text: 'I lost myself in a hobby for a while.' },
  { id: 'volunteer', group: 'fun', name: 'Volunteer', emoji: '🤲', description: 'Help out in the community.', minAge: 12, cost: 0, energy: 1, perYear: 2, effects: { happiness: 3 }, karma: 4, text: 'I volunteered at a shelter. It felt good to be useful.' },
  { id: 'lottery', group: 'money', name: 'Lottery ticket', emoji: '🎟️', description: 'A long shot.', minAge: 18, cost: 20, energy: 0, perYear: 3, effects: {}, counter: 'gamblingSessions', text: 'I bought a lottery ticket. Not a winner.' },
];

export const ACTIVITY_BY_ID: Record<string, ActivityDef> = Object.fromEntries(ACTIVITIES.map((a) => [a.id, a]));
