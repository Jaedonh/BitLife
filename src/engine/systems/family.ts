/**
 * The player's children growing up, and the grandchildren they bring (GAME_DESIGN §10a).
 *
 * Every year each living child can reach a milestone: starting school at the country's school age, finishing
 * high school (most graduate, the rest drop out quietly), moving out between 19 and 26, marrying between 24 and
 * 40, and, as adults, having children of their own (the player's grandchildren, at most three per child). Events
 * can bring some of these forward (`childMilestone`), so the engine and the event pool never tell the same story
 * twice. Pure: all randomness comes from the Rng passed in.
 */
import { getCountry } from '@/data/countries';
import type { Rng } from '../rng';
import type { ChildGrowth, GameState, Gender, Person } from '../types';
import { addStats, incFlag, log, numberWord, pronouns, setFlag } from '../util';
import { makePerson, randomName } from './character';

/** Children move out at 19-26: an even chance over those years, certain by 26. */
export const MOVE_OUT_FROM = 19;
export const MOVE_OUT_BY = 26;
/** About 40% marry between 24 and 40 (3% a year). */
export const MARRY_FROM = 24;
export const MARRY_UNTIL = 40;
export const MARRY_CHANCE = 0.03;
/** Grown children have kids of their own from 22 to 42, about 6% a year on average (more when married). */
export const KIDS_FROM = 22;
export const KIDS_UNTIL = 42;
export const KID_CHANCE_MARRIED = 0.08;
export const KID_CHANCE_SINGLE = 0.04;
export const MAX_KIDS_PER_CHILD = 3;
export const GRADUATION_CHANCE = 0.8;

/** Whether one of the player's children has left home. A save from before milestones has no record: past 26 they have. */
export function hasMovedOut(p: Person): boolean {
  return p.growth?.movedOut ?? p.age > MOVE_OUT_BY;
}

export function isMarried(p: Person): boolean {
  return p.growth?.spouse !== undefined;
}

/** Their own children born so far, plus any on the way. */
export function kidsCount(p: Person): number {
  return (p.growth?.kids ?? 0) + (p.growth?.expecting ?? 0);
}

function withGrowth(state: GameState, id: string, patch: Partial<ChildGrowth>): GameState {
  const p = state.people[id];
  if (!p) return state;
  return { ...state, people: { ...state.people, [id]: { ...p, growth: { ...p.growth, ...patch } } } };
}

/** "My son Leo", "My daughter Maya". */
function myChild(p: Person): string {
  return `My ${p.gender === 'male' ? 'son' : 'daughter'} ${p.firstName}`;
}

/** A first name no one else in the family has, when one turns up within a few draws. */
function freshFirstName(rng: Rng, state: GameState, gender: Gender): string {
  const taken = new Set([state.character.firstName, ...Object.values(state.people).map((p) => p.firstName)]);
  let name = randomName(rng, gender, state.character.countryCode).firstName;
  for (let i = 0; i < 4 && taken.has(name); i++) name = randomName(rng, gender, state.character.countryCode).firstName;
  return name;
}

/** The card where one of the player's children comes out to them as gay (love_and_family.ts). */
export const COMING_OUT_EVENT = 'lf_child_comes_out';

/**
 * Whether one of the player's children has come out to them as gay. The card records it on the child
 * (`childMilestone: 'cameOut'`); where it opened without doing so (older saves) its journal entry, which opens
 * with the child's name, still tells who it was.
 */
export function hasComeOut(state: GameState, p: Person): boolean {
  if (p.growth?.cameOut) return true;
  const at = state.firedEvents[COMING_OUT_EVENT];
  if (at === undefined) return false;
  const opening = `${p.firstName} asked to talk`;
  return state.log.some((l) => l.kind === 'event' && l.age === at && l.text.startsWith(opening) && l.text.includes(' is gay'));
}

/** Someone for a child to marry: usually of the other gender (always their own once they came out), with a name from the family's country. */
function rollSpouse(rng: Rng, state: GameState, child: Person): { firstName: string; gender: Gender } {
  const other = rng.chance(0.9);
  const gender: Gender = other && !hasComeOut(state, child) ? (child.gender === 'male' ? 'female' : 'male') : child.gender;
  return { firstName: freshFirstName(rng, state, gender), gender };
}

/**
 * An event made one of these milestones happen (the event writes its own lines): the child moves out, marries,
 * or has a baby on the way, which is born the next year, or comes out as gay (they then marry someone of their
 * own gender). Does nothing that would repeat a milestone or pass the three-grandchildren limit.
 */
export function markChildMilestone(state: GameState, rng: Rng, id: string, milestone: 'movedOut' | 'married' | 'expecting' | 'cameOut', opts: { namedAfterMe?: boolean } = {}): GameState {
  const p = state.people[id];
  if (!p || p.kind !== 'child' || !p.alive) return state;
  if (milestone === 'movedOut') return hasMovedOut(p) ? state : withGrowth(state, id, { movedOut: true });
  if (milestone === 'cameOut') return p.growth?.cameOut ? state : withGrowth(state, id, { cameOut: true });
  if (milestone === 'married') return isMarried(p) ? state : withGrowth(state, id, { spouse: rollSpouse(rng, state, p) });
  if (kidsCount(p) >= MAX_KIDS_PER_CHILD) return state;
  const me = state.character;
  return withGrowth(state, id, {
    expecting: (p.growth?.expecting ?? 0) + 1,
    ...(opts.namedAfterMe ? { babyName: { firstName: me.firstName, gender: me.gender } } : {}),
  });
}

/** A grandchild is born to one of the player's children: the person, the journal line and the grandparent flag. */
export function addGrandchild(state: GameState, rng: Rng, parentId: string): GameState {
  const parent = state.people[parentId];
  if (!parent || parent.kind !== 'child' || !parent.alive) return state;
  const me = state.character;
  const promised = parent.growth?.babyName;
  const gender: Gender = promised?.gender ?? rng.pick<Gender>(['male', 'female']);
  const baby = makePerson(rng, { kind: 'grandchild', gender, age: 0, countryCode: me.countryCode, lastName: parent.lastName, playerAge: me.age, relationship: rng.int(55, 85), occupation: 'Baby', money: 0 });
  baby.firstName = promised?.firstName ?? freshFirstName(rng, state, gender);
  baby.viaId = parent.id;
  const growth: ChildGrowth = { ...parent.growth, kids: (parent.growth?.kids ?? 0) + 1, expecting: Math.max(0, (parent.growth?.expecting ?? 0) - 1) };
  delete growth.babyName;
  let s: GameState = { ...state, people: { ...state.people, [parent.id]: { ...parent, growth }, [baby.id]: baby } };
  const first = typeof s.flags.grandchildren !== 'number' || s.flags.grandchildren < 1;
  s = incFlag(s, 'grandchildren');
  s = setFlag(s, 'grandparent', true);
  s = addStats(s, { happiness: first ? 10 : 5 });

  const pp = pronouns(parent.gender);
  const spouse = parent.growth?.spouse;
  const partner = spouse ? `${pp.possessive} ${spouse.gender === 'male' ? 'husband' : 'wife'} ${spouse.firstName}` : `${pp.possessive} partner`;
  // Two husbands or two wives adopt, as the player does (so does a child who came out, with a partner).
  const verb = (spouse ? spouse.gender === parent.gender : hasComeOut(state, parent)) ? 'adopted' : 'had';
  const kid = gender === 'male' ? 'son' : 'daughter';
  const bp = pronouns(gender);
  const birth = promised
    ? `${myChild(parent)} and ${partner} ${verb} a ${kid}. They named ${bp.object} ${baby.firstName}, after me.`
    : `${myChild(parent)} and ${partner} ${verb} a ${kid}, ${baby.firstName}.`;
  const living = Object.values(s.people).filter((x) => x.kind === 'grandchild' && x.alive).length;
  const after = first ? ' I am a grandparent.' : living > 1 ? ` I have ${numberWord(living)} grandchildren now.` : '';
  return log(s, `${birth}${after}`, 'milestone');
}

/** Yearly milestones for each of the player's living children (ageUp, after NPCs have aged). */
export function yearlyFamily(state: GameState, rng: Rng): GameState {
  let s = state;
  const country = getCountry(s.character.countryCode);
  const inPrison = s.crime.inPrison;
  const ids = Object.values(s.people).filter((p) => p.kind === 'child' && p.alive).map((p) => p.id);
  for (const id of ids) {
    let c = s.people[id]!;
    const pp = pronouns(c.gender);
    // School: the first day, then the end of high school.
    if (c.age === country.schoolStartAge && !c.growth?.school) {
      s = withGrowth(s, id, { school: 'started' });
      s = log(s, inPrison ? `${myChild(c)} started school. I heard all about it on the phone.` : rng.pick([`${myChild(c)} started school.`, `${myChild(c)} started school. ${pp.Subject} walked in without looking back, which I took personally.`]), 'good');
    }
    if (c.age === country.highSchoolEndAge && c.growth?.school !== 'graduated' && c.growth?.school !== 'droppedOut') {
      if (rng.chance(GRADUATION_CHANCE)) {
        s = withGrowth(s, id, { school: 'graduated' });
        s = addStats(s, { happiness: 3 });
        s = log(s, inPrison ? `${myChild(c)} graduated from high school. ${pp.Subject} sent me a photo of the cap.` : rng.pick([`${myChild(c)} graduated from high school.`, `${myChild(c)} graduated from high school. I cheered louder than was strictly allowed.`]), 'good');
      } else {
        // Dropping out happens quietly: no line, and an heir who takes over has no diploma.
        s = withGrowth(s, id, { school: 'droppedOut' });
      }
    }
    // Leaving home: an even chance over 19-26, so everyone has moved out by 26.
    c = s.people[id]!;
    if (!hasMovedOut(c) && c.age >= MOVE_OUT_FROM && rng.chance(1 / (MOVE_OUT_BY + 1 - c.age))) {
      s = withGrowth(s, id, { movedOut: true });
      const stillHome = Object.values(s.people).some((x) => x.kind === 'child' && x.alive && x.id !== id && !hasMovedOut(x));
      s = log(
        s,
        inPrison ? `${myChild(c)} moved into a place of ${pp.possessive} own.` : stillHome ? `${myChild(c)} moved out. One fewer pair of shoes by the door.` : `${myChild(c)} moved out. The house is very quiet.`,
        'info',
      );
    }
    // Marriage.
    c = s.people[id]!;
    if (!isMarried(c) && c.age >= MARRY_FROM && c.age <= MARRY_UNTIL && rng.chance(MARRY_CHANCE)) {
      const spouse = rollSpouse(rng, s, c);
      s = withGrowth(s, id, { spouse });
      s = addStats(s, { happiness: 4 });
      s = log(
        s,
        inPrison
          ? `${myChild(c)} married ${spouse.firstName}. I wasn't there, but they sent photos.`
          : rng.pick([`${myChild(c)} married ${spouse.firstName}.`, `${myChild(c)} married ${spouse.firstName} in a small ceremony. I cried at all the right moments.`]),
        'milestone',
      );
    }
    // Children of their own: a baby announced last year arrives; otherwise a yearly chance while 22-42.
    c = s.people[id]!;
    if ((c.growth?.expecting ?? 0) > 0) {
      s = addGrandchild(s, rng, id);
    } else if (c.age >= KIDS_FROM && c.age <= KIDS_UNTIL && kidsCount(c) < MAX_KIDS_PER_CHILD && rng.chance(isMarried(c) ? KID_CHANCE_MARRIED : KID_CHANCE_SINGLE)) {
      s = addGrandchild(s, rng, id);
    }
  }
  return s;
}
