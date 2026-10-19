import { availableInteractions } from '@/engine';
import { personRef, scaleMoney } from '@/engine/events/text';
import type { InteractionDef, InteractionId } from '@/engine/systems/relationships';
import { fosterRelation } from '@/engine/systems/scenarios';
import type { GameState, LogEntry, LogKind, Person, RelationshipKind } from '@/engine/types';
import { actionCount, capitalize, deathPhrase, lowerTitle } from '@/engine/util';
import { colors } from '@/theme';

export function kindLabel(p: Person): string {
  const foster = fosterRelation(p);
  if (foster) return capitalize(foster);
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
    case 'grandparent': return p.gender === 'male' ? 'Grandfather' : 'Grandmother';
    case 'grandchild': return p.gender === 'male' ? 'Grandson' : 'Granddaughter';
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
    case 'grandparent': return p.gender === 'male' ? '👴' : '👵';
    case 'grandchild': return p.age < 3 ? '👶' : p.gender === 'male' ? '👦' : '👧';
    default: return '👤';
  }
}

const PET_EMOJI: Record<string, string> = { dog: '🐶', cat: '🐱', hamster: '🐹', parrot: '🦜', pigeon: '🐦', rabbit: '🐰', fish: '🐟', horse: '🐴', turtle: '🐢', snake: '🐍' };

/** A face that ages with the person: baby, child, adult, elder (pets by species). */
export function personAvatar(p: Person): string {
  if (p.kind === 'pet') return PET_EMOJI[p.species ?? ''] ?? '🐾';
  const male = p.gender === 'male';
  if (p.age < 3) return '👶';
  if (p.age < 13) return male ? '👦' : '👧';
  if (p.age < 60) return male ? '👨' : '👩';
  return male ? '👴' : '👵';
}

/** The small relation mark on an avatar where the face alone does not say it (partner, best friend, ex, enemy). */
export function relationBadge(p: Person): string | null {
  switch (p.kind) {
    case 'spouse': return '💍';
    case 'lover': return '❤️';
    case 'bestFriend': return '⭐';
    case 'ex': return '💔';
    case 'enemy': return '😠';
    default: return null;
  }
}

/** Pets go by their first name; people by first and last. */
export function personName(p: Person): string {
  return p.kind === 'pet' ? p.firstName : `${p.firstName} ${p.lastName}`;
}

/** What the player calls them in the journal ("Mom", "Dad", or the first name). */
export { personRef };

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
  // "Retired IT specialist": acronyms keep their capitals.
  if (p.age >= 67 && p.occupation !== 'Unemployed') return `Retired ${lowerTitle(p.occupation)}`;
  return p.occupation;
}

/** "Mother · 54 · Nurse", "Dog · 3". */
export function personSubtitle(p: Person, kind: string): string {
  return [kind, String(p.age), occupationLabel(p)].filter(Boolean).join(' · ');
}

/**
 * How long someone has been in your life: "Known since you were born.", "Born when you were 31." A brother or sister
 * who arrived as a baby (a younger sibling of an heir, say) was born when you were that age; `playerAge` tells them
 * apart from a step-sibling met later.
 */
export function sinceLine(p: Person, playerAge?: number): string {
  if (p.metAtAge === 0 && p.kind !== 'child' && p.kind !== 'grandchild') return 'Known since you were born.';
  if (p.kind === 'child' || p.kind === 'grandchild') return `Born when you were ${p.metAtAge}.`;
  if (p.kind === 'pet') return `Part of the family since you were ${p.metAtAge}.`;
  if (p.kind === 'sibling' && p.alive && playerAge !== undefined && p.age === playerAge - p.metAtAge) return `Born when you were ${p.metAtAge}.`;
  return `Known since you were ${p.metAtAge}.`;
}

/**
 * What the family tree says about someone, for the person screen: whose parent a grandparent is, whose child a
 * grandchild is, how one of your children is getting on, and where a coworker works with you.
 */
export function familyFacts(p: Person, state: Pick<GameState, 'people' | 'career'>): string[] {
  const via = p.viaId ? state.people[p.viaId] : undefined;
  if (p.kind === 'grandparent' && via) return [`${via.kind === 'mother' ? "Mom's" : via.kind === 'father' ? "Dad's" : `${via.firstName}'s`} ${p.gender === 'male' ? 'father' : 'mother'}.`];
  if (p.kind === 'grandchild' && via) return [`${via.firstName}'s ${p.gender === 'male' ? 'son' : 'daughter'}.`];
  if (p.kind === 'coworker' && p.workplace && state.career.job?.defId === p.workplace.jobId && state.career.job.company === p.workplace.company) {
    // Prose, so the employer keeps its article ("at the Ember Grill"); the Army is served in, not worked at.
    const company = p.workplace.company;
    return [company === 'the Army' ? 'Serves with you in the Army.' : `Works with you at ${company}.`];
  }
  if (p.kind !== 'child' || !p.growth) return [];
  const g = p.growth;
  const out: string[] = [];
  if (g.school === 'graduated') out.push('Finished high school.');
  if (g.school === 'droppedOut') out.push('Left high school without a diploma.');
  if (g.movedOut) out.push('Has moved out.');
  if (g.spouse) out.push(`Married to ${g.spouse.firstName}.`);
  const kids = g.kids ?? 0;
  const own = p.gender === 'male' ? 'his' : 'her';
  if (kids) out.push(kids === 1 ? `Has a child of ${own} own.` : `Has ${kids} children of ${own} own.`);
  if (g.expecting) out.push('Has a baby on the way.');
  return out;
}

/** "Died of cancer at 71", "Died in a car accident at 40". */
export function deathLine(p: Person): string {
  return `${capitalize(deathPhrase(p.deathCause))} at ${p.deathAge ?? p.age}`;
}

const HOUSEHOLD: ReadonlySet<RelationshipKind> = new Set(['mother', 'father', 'stepmother', 'stepfather', 'sibling']);

/**
 * "You haven't spoken in 3 years." Only for real silence: a child lives with their parents and siblings until 18
 * (and a parent with their own kids), so those years never count as neglect, nor do years before you met.
 */
export function neglectLine(p: Person, playerAge: number): string | null {
  if (!p.alive) return null;
  if (p.kind === 'child' && p.age < 18) return null;
  // A small grandchild is seen with their parents; a young child sees their grandparents the same way.
  if (p.kind === 'grandchild' && p.age < 6) return null;
  const sharedHomeUntil = HOUSEHOLD.has(p.kind) ? 18 : p.kind === 'child' ? p.metAtAge + 18 : p.kind === 'grandparent' ? 12 : 0;
  const since = Math.max(p.memory.lastInteractionAge, p.metAtAge, Math.min(sharedHomeUntil, playerAge));
  const years = playerAge - since;
  if (years < 2) return null;
  return p.kind === 'pet' ? `You haven't spent time together in ${years} years.` : `You haven't spoken in ${years} years.`;
}

/** Relationship colour on bars and percentages: green when close, amber when it is middling, red when it is bad. */
export function bondColor(value: number): string {
  return value >= 60 ? colors.success : value >= 30 ? colors.warning : colors.danger;
}

/** One word for a relationship value, next to the percentage. */
export function bondWord(value: number): string {
  if (value >= 80) return 'Very close';
  if (value >= 60) return 'Close';
  if (value >= 40) return 'Okay';
  if (value >= 20) return 'Rocky';
  return 'Strained';
}

/** One word for a romantic bond (the Love bar). */
export function loveWord(value: number): string {
  if (value >= 80) return 'Smitten';
  if (value >= 60) return 'In love';
  if (value >= 40) return 'Warm';
  if (value >= 20) return 'Cooling';
  return 'Cold';
}

// ---------------------------------------------------------------------------------------------------------------
// People list grouping

export interface PeopleGroup {
  key: string;
  title: string;
  people: Person[];
}

const GROUPS: { key: string; title: string; kinds: RelationshipKind[] }[] = [
  { key: 'family', title: 'Family', kinds: ['mother', 'father', 'stepmother', 'stepfather', 'grandparent', 'sibling', 'child', 'grandchild'] },
  { key: 'partner', title: 'Partner', kinds: ['spouse', 'lover'] },
  { key: 'friends', title: 'Friends', kinds: ['bestFriend', 'friend'] },
  { key: 'work', title: 'Work', kinds: ['coworker', 'classmate'] },
  { key: 'pets', title: 'Pets', kinds: ['pet'] },
  { key: 'others', title: 'Exes & rivals', kinds: ['ex', 'enemy'] },
];

/** Living people in display groups (Family, Partner, Friends, Work, Pets, Exes & rivals); empty groups are left out. */
export function groupPeople(people: readonly Person[]): PeopleGroup[] {
  const alive = people.filter((p) => p.alive);
  const out: PeopleGroup[] = [];
  for (const g of GROUPS) {
    // Within a group: by relation (parents, grandparents, siblings, children, grandchildren), then oldest first.
    const members = alive.filter((p) => g.kinds.includes(p.kind)).sort((a, b) => g.kinds.indexOf(a.kind) - g.kinds.indexOf(b.kind) || b.age - a.age);
    if (!members.length) continue;
    let title = g.title;
    if (g.key === 'work') {
      const school = members.some((p) => p.kind === 'classmate');
      const work = members.some((p) => p.kind === 'coworker');
      title = school && work ? 'Work & school' : school ? 'School' : 'Work';
    }
    out.push({ key: g.key, title, people: members });
  }
  return out;
}

// ---------------------------------------------------------------------------------------------------------------
// Interactions

/** Interactions that hurt the relationship or end it; shown apart from the friendly ones. */
export const RISKY_INTERACTIONS: ReadonlySet<InteractionId> = new Set(['insult', 'breakUp', 'divorce']);
/** Interactions that cannot be undone; they ask for confirmation first. */
export const CONFIRM_INTERACTIONS: ReadonlySet<InteractionId> = new Set(['breakUp', 'divorce']);

export interface InteractionTile {
  def: InteractionDef;
  available: boolean;
  /** Why the tile is disabled, shown on it. */
  reason?: string;
  /** Price in the player's currency (0 when free). */
  cost: number;
  /** Uses left this year with this person, when the interaction has a yearly limit. */
  usesLeft?: number;
  risky: boolean;
}

/**
 * Every interaction offered for this person, with cost, energy, uses left and, when it cannot be done right now,
 * the reason. The checks mirror the engine's refusals in `interact` (yearly limit, then energy, then money), so a
 * tile is only enabled when the engine would accept it.
 */
export function interactionTiles(state: GameState, person: Person): InteractionTile[] {
  return availableInteractions(state, person).map((def) => {
    const cost = def.cost ? scaleMoney(state, def.cost) : 0;
    const usesLeft = def.perYear ? Math.max(0, def.perYear - actionCount(state, `${def.id}:${person.id}`)) : undefined;
    let reason: string | undefined;
    if (usesLeft === 0) reason = 'Done for this year';
    else if (def.energy > state.character.energy) reason = 'No energy left';
    else if (cost > state.finances.cash) reason = "Can't afford it";
    return { def, available: reason === undefined, reason, cost, usesLeft, risky: RISKY_INTERACTIONS.has(def.id) };
  });
}

/** The 30% divorce settlement the engine takes from cash, for the confirmation message. */
export function divorceSettlement(state: GameState): number {
  return Math.round(Math.max(0, state.finances.cash) * 0.3);
}

// ---------------------------------------------------------------------------------------------------------------
// Memories

export interface Memory {
  age: number;
  text: string;
  /** For an event card: the choice the player made. */
  choice?: string;
  kind: LogKind;
}

function isWordChar(ch: string | undefined): boolean {
  if (!ch) return false;
  return /[0-9_]/.test(ch) || ch.toLowerCase() !== ch.toUpperCase();
}

/** Whole-word search that also works for names with accents ("Zoë", "Søren"), where \b does not. */
function mentions(text: string, word: string): boolean {
  let i = text.indexOf(word);
  while (i >= 0) {
    if (!isWordChar(text[i - 1]) && !isWordChar(text[i + word.length])) return true;
    i = text.indexOf(word, i + 1);
  }
  return false;
}

/** The words that identify this person in the journal: full name, unique first name, and "Mom"/"Dad" for parents. */
function memoryTerms(p: Person, state: Pick<GameState, 'people' | 'character'>): string[] {
  const terms = [`${p.firstName} ${p.lastName}`];
  const shared = p.firstName === state.character.firstName || Object.values(state.people).some((o) => o.id !== p.id && o.firstName === p.firstName);
  if (!shared) terms.push(p.firstName);
  if (p.kind === 'mother') terms.push('Mom', 'my mother', 'My mother');
  if (p.kind === 'father') terms.push('Dad', 'my father', 'My father');
  // "Grandma Rosa" even when another Rosa in the family keeps the first name out of the terms.
  if (p.kind === 'grandparent') terms.push(personRef(p));
  return terms;
}

/**
 * The last few journal lines that mention this person, newest first. An event card and its outcome line from
 * the same year usually both mention them; the outcome wins, so the list is not the same moment twice.
 */
export function personMemories(state: Pick<GameState, 'people' | 'character' | 'log'>, p: Person, limit = 3): Memory[] {
  const terms = memoryTerms(p, state);
  const out: Memory[] = [];
  const outcomeAges = new Set<number>();
  for (let i = state.log.length - 1; i >= 0 && out.length < limit; i--) {
    const entry: LogEntry = state.log[i]!;
    if (entry.kind === 'year' || entry.kind === 'death') continue;
    if (!terms.some((t) => mentions(entry.text, t))) continue;
    if (entry.kind === 'event') {
      if (outcomeAges.has(entry.age)) continue;
      const [text, choice] = entry.text.split(' → ');
      out.push({ age: entry.age, text: text ?? entry.text, choice, kind: entry.kind });
    } else {
      outcomeAges.add(entry.age);
      out.push({ age: entry.age, text: entry.text, kind: entry.kind });
    }
  }
  return out;
}
