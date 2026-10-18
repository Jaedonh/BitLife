import type { Person } from '@/engine/types';
import { capitalize, deathPhrase } from '@/engine/util';

export function kindLabel(p: Person): string {
  switch (p.kind) {
    case 'mother': return 'Mother';
    case 'father': return 'Father';
    case 'stepmother': return 'Stepmother';
    case 'stepfather': return 'Stepfather';
    case 'sibling': return p.gender === 'male' ? 'Brother' : 'Sister';
    case 'child': return p.gender === 'male' ? 'Son' : 'Daughter';
    case 'spouse': return p.gender === 'male' ? 'Husband' : 'Wife';
    case 'lover': return p.gender === 'male' ? 'Boyfriend' : 'Girlfriend';
    case 'bestFriend': return 'Best friend';
    case 'friend': return 'Friend';
    case 'ex': return 'Ex';
    case 'pet': return capitalize(p.species ?? 'pet');
    case 'coworker': return 'Coworker';
    case 'classmate': return 'Classmate';
    case 'enemy': return 'Enemy';
    default: return p.kind;
  }
}

export function kindEmoji(p: Person): string {
  switch (p.kind) {
    case 'mother':
    case 'stepmother':
      return '👩';
    case 'father':
    case 'stepfather':
      return '👨';
    case 'sibling': return p.gender === 'male' ? '👦' : '👧';
    case 'child': return p.age < 3 ? '👶' : p.gender === 'male' ? '👦' : '👧';
    case 'spouse': return '💍';
    case 'lover': return '❤️';
    case 'bestFriend': return '🤝';
    case 'friend': return '🙂';
    case 'ex': return '💔';
    case 'pet': return '🐾';
    case 'enemy': return '😠';
    default: return '👤';
  }
}

/** Pets go by their first name; people by first and last. */
export function personName(p: Person): string {
  return p.kind === 'pet' ? p.firstName : `${p.firstName} ${p.lastName}`;
}

/**
 * What someone does, for the subtitle under their name. Children are created as "Student" or "Baby" and
 * never get a job, so their label follows their age; pets have none.
 */
export function occupationLabel(p: Person): string | null {
  if (p.kind === 'pet') return null;
  const childish = p.occupation === 'Student' || p.occupation === 'Baby';
  if (childish || p.age < 18) {
    if (p.age < 2) return 'Baby';
    if (p.age < 5) return 'Toddler';
    // A grown-up child never had a job assigned, so past college age nothing is shown.
    if (p.age < 23) return 'Student';
    return null;
  }
  if (p.age >= 67 && p.occupation !== 'Unemployed') return `Retired ${p.occupation.toLowerCase()}`;
  return p.occupation;
}

/** "Mother · 54 · Nurse", "Dog · 3". */
export function personSubtitle(p: Person, kind: string): string {
  return [kind, String(p.age), occupationLabel(p)].filter(Boolean).join(' · ');
}

/** How long someone has been in your life: "Known since you were born.", "Born when you were 31." */
export function sinceLine(p: Person): string {
  if (p.metAtAge === 0 && p.kind !== 'child') return 'Known since you were born.';
  if (p.kind === 'child') return `Born when you were ${p.metAtAge}.`;
  if (p.kind === 'pet') return `Part of the family since you were ${p.metAtAge}.`;
  return `Known since you were ${p.metAtAge}.`;
}

/** "Died of cancer at 71", "Died in a car accident at 40". */
export function deathLine(p: Person): string {
  return `${capitalize(deathPhrase(p.deathCause))} at ${p.deathAge ?? p.age}`;
}
