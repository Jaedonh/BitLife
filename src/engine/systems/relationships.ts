import { livesWithPlayer } from '../events/conditions';
import { adjustRelationship, markContact, takeSurname, updatePerson } from '../events/effects';
import { personRef, scaleMoney } from '../events/text';
import type { Rng } from '../rng';
import type { GameState, Person, RelationshipKind } from '../types';
import { addKarma, addMoney, addStats, bump, clampStat, clearCoupleFlags, countAction, actionCount, fullName, log, lowerTitle, money, pronouns, setResult, withArticle } from '../util';
import { familySurnames, friendAgeRange, GROWN_UP_AGE, grownUpLivelihood, makePerson, namesInJournalThisYear, namesInLife } from './character';
import { worksWithMe } from './coworkers';
import { hasMovedOut } from './family';
import { ADULT_AGE, griefFactor, notePartnerYears, partnerAgeRange, partnerGender, romanceAllowed, yearlyGrief } from './romance';
import { fosterRelation } from './scenarios';

export type InteractionId =
  | 'spendTime'
  | 'conversation'
  | 'compliment'
  | 'insult'
  | 'gift'
  | 'askMoney'
  | 'giveMoney'
  | 'date'
  | 'propose'
  | 'breakUp'
  | 'divorce'
  | 'haveChild'
  | 'playWith'
  | 'walk'
  | 'visit';

export interface InteractionDef {
  id: InteractionId;
  label: string;
  emoji: string;
  kinds: RelationshipKind[];
  minAge: number;
  /** A later minimum age for some kinds, e.g. asking a grandparent for money from 10. */
  minAgeFor?: Partial<Record<RelationshipKind, number>>;
  /** Pets only: the species it suits (nobody walks a pigeon). Absent means every pet. */
  species?: readonly string[];
  /** How old the other person must be: nobody has a conversation with a baby or asks a toddler for money. */
  minTargetAge?: number;
  energy: number;
  cost?: number;
  perYear?: number;
}

/** Babies and toddlers (under 5, as the people screen labels them) are not talked to, praised or insulted like grown-ups. */
const TALKING_AGE = 5;
/** Below this age money given goes into savings, and nobody is asked to lend any. */
const SAVINGS_AGE = 16;

export const INTERACTIONS: readonly InteractionDef[] = [
  { id: 'spendTime', label: 'Spend time', emoji: '🕰️', kinds: ['mother', 'father', 'stepmother', 'stepfather', 'sibling', 'child', 'friend', 'bestFriend', 'lover', 'spouse', 'coworker', 'classmate', 'grandparent', 'grandchild'], minAge: 3, energy: 1, perYear: 2 },
  { id: 'visit', label: 'Visit', emoji: '🏡', kinds: ['grandparent'], minAge: 4, energy: 1, perYear: 1 },
  { id: 'conversation', label: 'Have a conversation', emoji: '💬', kinds: ['mother', 'father', 'stepmother', 'stepfather', 'sibling', 'child', 'friend', 'bestFriend', 'lover', 'spouse', 'coworker', 'classmate', 'ex', 'enemy', 'grandparent'], minAge: 4, minTargetAge: TALKING_AGE, energy: 0, perYear: 3 },
  { id: 'compliment', label: 'Compliment', emoji: '🌟', kinds: ['mother', 'father', 'stepmother', 'stepfather', 'sibling', 'child', 'friend', 'bestFriend', 'lover', 'spouse', 'coworker', 'classmate', 'ex', 'grandparent'], minAge: 4, minTargetAge: TALKING_AGE, energy: 0, perYear: 2 },
  { id: 'insult', label: 'Insult', emoji: '😤', kinds: ['mother', 'father', 'stepmother', 'stepfather', 'sibling', 'child', 'friend', 'bestFriend', 'lover', 'spouse', 'coworker', 'classmate', 'ex', 'enemy'], minAge: 4, minTargetAge: TALKING_AGE, energy: 0, perYear: 2 },
  { id: 'gift', label: 'Give a gift', emoji: '🎁', kinds: ['mother', 'father', 'stepmother', 'stepfather', 'sibling', 'child', 'friend', 'bestFriend', 'lover', 'spouse', 'coworker', 'grandparent', 'grandchild'], minAge: 8, energy: 0, cost: 150, perYear: 2 },
  { id: 'askMoney', label: 'Ask for money', emoji: '🙏', kinds: ['mother', 'father', 'stepmother', 'stepfather', 'sibling', 'spouse', 'friend', 'bestFriend', 'grandparent'], minAge: 6, minAgeFor: { grandparent: 10 }, minTargetAge: SAVINGS_AGE, energy: 0, perYear: 1 },
  { id: 'giveMoney', label: 'Give money', emoji: '💸', kinds: ['mother', 'father', 'sibling', 'child', 'friend', 'bestFriend', 'lover', 'spouse', 'grandchild'], minAge: 16, energy: 0, cost: 1000, perYear: 2 },
  { id: 'date', label: 'Go on a date', emoji: '🍷', kinds: ['lover', 'spouse'], minAge: 16, energy: 1, cost: 120, perYear: 2 },
  { id: 'propose', label: 'Propose', emoji: '💍', kinds: ['lover'], minAge: 18, energy: 1, cost: 2500, perYear: 1 },
  { id: 'breakUp', label: 'Break up', emoji: '💔', kinds: ['lover'], minAge: 14, energy: 0 },
  { id: 'divorce', label: 'Divorce', emoji: '📜', kinds: ['spouse'], minAge: 18, energy: 1, perYear: 1 },
  { id: 'haveChild', label: 'Try for a baby', emoji: '👶', kinds: ['spouse', 'lover'], minAge: 18, energy: 1, perYear: 1 },
  { id: 'playWith', label: 'Play', emoji: '🎾', kinds: ['pet'], minAge: 3, energy: 0, perYear: 3 },
  { id: 'walk', label: 'Go for a walk', emoji: '🐕', kinds: ['pet'], species: ['dog'], minAge: 6, energy: 0, perYear: 3 },
];

/** The person no longer lives far away (a partner who moves in at the wedding). */
function withoutFarAway(state: GameState, id: string): GameState {
  const p = state.people[id];
  if (!p?.farAway) return state;
  const near: Person = { ...p };
  delete near.farAway;
  return { ...state, people: { ...state.people, [id]: near } };
}

/** What still works from a cell: a phone call or the visiting room. */
const PRISON_INTERACTIONS: ReadonlySet<InteractionId> = new Set(['conversation', 'compliment', 'insult', 'breakUp']);
/**
 * What only works in the same room. Someone who lives far away (a friend or grandparent left behind by a move
 * abroad, `farAway`, or a partner left behind by a move to another city: no baby by phone) is not offered these;
 * everything else reaches them by phone, mail or a bank transfer.
 */
const IN_PERSON: ReadonlySet<InteractionId> = new Set(['spendTime', 'visit', 'date', 'haveChild', 'playWith', 'walk']);
/** Romantic acts, gated on both ages (see romance.ts); marriage and children need two adults. */
const ROMANTIC: ReadonlySet<InteractionId> = new Set(['date', 'propose', 'haveChild']);

/** Why an interaction is off the table for this person right now, or null. The person screen hides it; `interact` refuses with this text. */
function unavailableReason(state: GameState, person: Person, def: InteractionDef): string | null {
  const me = state.character;
  if (me.age < (def.minAgeFor?.[person.kind] ?? def.minAge)) return "I'm too young for that.";
  if (def.minTargetAge !== undefined && person.age < def.minTargetAge) return person.age < 2 ? `${person.firstName} is still a baby.` : `${person.firstName} is only ${person.age}.`;
  if (state.crime.inPrison && !PRISON_INTERACTIONS.has(def.id)) return "Not while I'm behind bars.";
  if (person.farAway && IN_PERSON.has(def.id)) return 'They live far away now.';
  if (ROMANTIC.has(def.id) && (!romanceAllowed(me.age, person.age) || (def.id !== 'date' && person.age < ADULT_AGE))) {
    return person.age < ADULT_AGE && person.age <= me.age
      ? `${person.firstName} is only ${person.age}. That will have to wait.`
      : `I'm only ${me.age}, and ${person.firstName} is ${person.age}. That will have to wait.`;
  }
  return null;
}

/** Whether the interaction is meant for this kind of person (and, for a pet, this species). */
function suits(def: InteractionDef, person: Person): boolean {
  return def.kinds.includes(person.kind) && (!def.species || def.species.includes(person.species ?? ''));
}

export function availableInteractions(state: GameState, person: Person): InteractionDef[] {
  if (!person.alive) return [];
  return INTERACTIONS.filter((i) => suits(i, person) && unavailableReason(state, person, i) === null);
}

/** "I played with Biscuit until we were both exhausted.", in the way this pet plays. */
function playLine(pet: Person, who: string): string {
  const pp = pronouns(pet.gender);
  switch (pet.species) {
    case 'dog': return `I threw a ball for ${who} until we were both exhausted.`;
    case 'cat': return `I dragged a string around for ${who}, who pounced on it every single time.`;
    case 'hamster': return `I built ${who} a cardboard maze. ${pp.Subject} ignored it and stuffed both cheeks.`;
    case 'rabbit': return `I let ${who} hop around the living room and inspect every corner.`;
    case 'parrot': return `I tried to teach ${who} a new word. ${pp.Subject} taught me two whistles instead.`;
    case 'pigeon': return `I sat by the open window with ${who} and a handful of seeds.`;
    default: return `I played with ${who} until we were both exhausted.`;
  }
}

function touch(state: GameState, person: Person, patch: Partial<Person['memory']> = {}): GameState {
  return updatePerson(state, person.id, { memory: { ...person.memory, ...patch, lastInteractionAge: state.character.age, yearsNeglected: 0 } });
}

function relLabel(p: Person): string {
  const foster = fosterRelation(p);
  if (foster) return `my ${foster}`;
  switch (p.kind) {
    case 'mother': return 'my mother';
    case 'father': return 'my father';
    case 'stepmother': return 'my stepmother';
    case 'stepfather': return 'my stepfather';
    case 'sibling': return p.gender === 'male' ? 'my brother' : 'my sister';
    case 'child': return p.gender === 'male' ? 'my son' : 'my daughter';
    case 'spouse': return p.gender === 'male' ? 'my husband' : 'my wife';
    case 'lover': return p.gender === 'male' ? 'my boyfriend' : 'my girlfriend';
    case 'bestFriend': return 'my best friend';
    case 'friend': return 'my friend';
    case 'ex': return 'my ex';
    case 'pet': return `my ${p.species ?? 'pet'}`;
    case 'coworker': return 'my coworker';
    case 'classmate': return 'my classmate';
    case 'enemy': return 'my enemy';
    case 'grandparent': return p.gender === 'male' ? 'my grandfather' : 'my grandmother';
    case 'grandchild': return p.gender === 'male' ? 'my grandson' : 'my granddaughter';
    default: return p.firstName;
  }
}

export function interact(state: GameState, rng: Rng, personId: string, interactionId: string): GameState {
  let out = interactOnce(state, rng, personId, interactionId);
  // A paid interaction that went ahead reports its cost in the toast, whatever the outcome (a ring for a 'no').
  const def = INTERACTIONS.find((i) => i.id === interactionId);
  const key = `${interactionId}:${personId}`;
  const done = actionCount(out, key) > actionCount(state, key);
  // Whatever it was (a proposal, a break-up, a no to a loan), we spoke this year.
  if (done) out = markContact(out, personId);
  if (def?.cost && done && out.lastResult && out.lastResult.moneyDelta === undefined) {
    return { ...out, lastResult: { ...out.lastResult, moneyDelta: -scaleMoney(state, def.cost) } };
  }
  return out;
}

function interactOnce(state: GameState, rng: Rng, personId: string, interactionId: string): GameState {
  const person = state.people[personId];
  if (!person || !person.alive) return setResult(state, 'They are no longer around.', 'bad');
  const def = INTERACTIONS.find((i) => i.id === interactionId);
  if (!def || !suits(def, person)) return state;
  const unavailable = unavailableReason(state, person, def);
  if (unavailable) return setResult(state, unavailable, 'info');
  const key = `${def.id}:${personId}`;
  if (def.perYear && actionCount(state, key) >= def.perYear) return setResult(state, "I've done that enough this year.", 'info');
  if (def.energy > state.character.energy) return setResult(state, "I'm out of energy this year. Age up to recharge.", 'info');
  const cost = def.cost ? scaleMoney(state, def.cost) : 0;
  if (cost && state.finances.cash < cost) return setResult(state, "I can't afford that right now.", 'bad');
  let s = countAction(state, key);
  s = { ...s, character: { ...s.character, energy: s.character.energy - def.energy } };
  if (cost) s = addMoney(s, -cost);
  // Parents are Mom and Dad in narration, as in event text (a second father or mother Papa or Mama); everyone
  // else goes by their first name.
  const who = personRef(person, state.people);
  const withWho = who === person.firstName ? `${relLabel(person)}, ${who}` : who;
  const charming = s.character.traits.includes('charming') ? 3 : 0;
  // Someone far away is reached by phone, mail or a transfer: the lines say so (in-person acts are refused above).
  const far = person.farAway === true;
  const pp = pronouns(person.gender);

  switch (def.id) {
    case 'spendTime': {
      const gain = rng.int(4, 9) + charming;
      s = adjustRelationship(s, personId, gain);
      s = addStats(s, { happiness: person.relationship >= 40 ? 3 : 1 });
      if (person.love !== undefined) s = updatePerson(s, personId, { love: clampStat((s.people[personId]!.love ?? 0) + 4) });
      s = touch(s, s.people[personId]!);
      const young = s.character.age < 6;
      // A baby or toddler is played with, not talked at (TALKING_AGE).
      const text = rng.pick(person.age < 2
        ? [`I made faces at ${who} until ${pp.subject} giggled.`, `${who} fell asleep on me. I didn't move for an hour.`, `I spent a lovely afternoon with ${withWho}.`]
        : person.age < TALKING_AGE
          ? [`I built a block tower so ${who} could knock it down. Eleven times.`, `${who} and I played hide-and-seek. ${pp.Subject} hid behind the same curtain every time.`, `I spent a lovely afternoon with ${withWho}.`]
          : young
            ? [`I spent a lovely afternoon with ${withWho}.`, `${who} and I played together until it got dark.`, `I followed ${who} around all day, talking nonstop.`]
            : [`I spent a lovely afternoon with ${withWho}.`, `${who} and I hung out and lost track of time.`, `I spent quality time with ${who}.`]);
      s = log(s, text, 'good');
      return setResult(s, text, 'good', { statDeltas: { happiness: 3 } });
    }
    case 'conversation': {
      const bad = rng.chance(person.craziness / 300 + (person.relationship < 30 ? 0.3 : 0.05));
      if (bad) {
        s = adjustRelationship(s, personId, -rng.int(3, 8));
        s = touch(s, s.people[personId]!, { fights: person.memory.fights + 1 });
        s = addStats(s, { happiness: -2 });
        const text = far
          ? rng.pick([`My call with ${who} turned into an argument.`, `${who} and I got into it over the phone, about nothing.`])
          : rng.pick([`My conversation with ${who} turned into an argument.`, `${who} and I got into it over nothing.`]);
        s = log(s, text, 'bad');
        return setResult(s, text, 'bad');
      }
      s = adjustRelationship(s, personId, rng.int(2, 5) + charming);
      s = touch(s, s.people[personId]!);
      const text = far
        ? rng.pick(person.kind === 'grandparent'
          ? [`I called ${who}, who had saved up a whole year of stories for me.`, `I called ${who}. ${pp.Subject} wanted to hear everything twice.`]
          : [`I called ${who}. We talked until the phone was warm.`, `${who} and I talked on the phone for hours.`])
        : rng.pick(s.character.age < 8
          ? [`${who} and I had a good talk.`, `I told ${who} all about my day, and ${pp.subject} listened to every word.`]
          : [`${who} and I had a good talk.`, `I caught up with ${who}. We talked for hours.`]);
      s = log(s, text);
      return setResult(s, text, 'good');
    }
    case 'compliment': {
      s = bump(s, 'compliments');
      s = addKarma(s, 1);
      const liked = rng.chance(0.8 + charming / 20);
      s = adjustRelationship(s, personId, liked ? rng.int(2, 6) + charming : -2);
      s = touch(s, s.people[personId]!, { compliments: person.memory.compliments + 1 });
      const text = far
        ? liked ? `I paid ${who} a compliment over the phone. I could hear ${pp.object} smiling.` : `I paid ${who} a compliment over the phone. ${pp.Subject} asked what I wanted.`
        : liked ? `I complimented ${who}. ${pp.Subject} beamed.` : `I complimented ${who}, who assumed I wanted something.`;
      s = log(s, text, liked ? 'good' : 'info');
      return setResult(s, text, liked ? 'good' : 'info');
    }
    case 'insult': {
      s = bump(s, 'insults');
      s = addKarma(s, -2);
      const retaliates = rng.chance(0.3 + person.craziness / 200);
      s = adjustRelationship(s, personId, -rng.int(8, 16));
      s = touch(s, s.people[personId]!, { insults: person.memory.insults + 1, fights: person.memory.fights + (retaliates ? 1 : 0) });
      if (retaliates) s = addStats(s, { happiness: -4 });
      else s = addStats(s, { happiness: s.character.traits.includes('hot_headed') ? 2 : -1 });
      const text = far
        ? retaliates ? `I insulted ${who} over the phone. ${pp.Subject} fired back twice as hard.` : `I insulted ${who} over the phone. ${pp.Subject} hung up without a word.`
        : retaliates ? `I insulted ${who}, who fired back twice as hard.` : `I insulted ${who}. ${pp.Subject} walked away without a word.`;
      s = log(s, text, 'bad');
      return setResult(s, text, 'bad');
    }
    case 'gift': {
      s = bump(s, 'giftsGiven');
      s = addKarma(s, 1);
      const loved = rng.chance(0.75);
      s = adjustRelationship(s, personId, loved ? rng.int(5, 12) : rng.int(0, 2));
      s = touch(s, s.people[personId]!, { gifts: person.memory.gifts + 1 });
      if (person.love !== undefined) s = updatePerson(s, personId, { love: clampStat((s.people[personId]!.love ?? 0) + 5) });
      // A baby or toddler does not call, write or say "you shouldn't have".
      const little = person.age < TALKING_AGE;
      const text = far
        ? little
          ? loved ? `I mailed ${who} a gift. I hear ${pp.subject} would not let go of it.` : `I mailed ${who} a gift. I hear ${pp.subject} liked the box better.`
          : loved ? `I mailed ${who} a gift. ${pp.Subject} called the day it arrived.` : `I mailed ${who} a gift. ${pp.Subject} wrote back "you shouldn't have" and seemed to mean it.`
        : little
          ? loved ? `${who} grabbed the gift with both hands and would not let go.` : `${who} ignored the gift and played with the box.`
          : loved ? `${who} loved the gift.` : `${who} said "you shouldn't have" and seemed to mean it.`;
      s = log(s, text, loved ? 'good' : 'info');
      return setResult(s, text, loved ? 'good' : 'info', { moneyDelta: -cost });
    }
    case 'askMoney': {
      // A grandparent is a softer touch than a parent, but gives pocket money, not rent.
      const grand = person.kind === 'grandparent';
      const willing = person.relationship >= (grand ? 40 : 50) && person.money > 0 && rng.chance((grand ? 0.45 : 0.3) + person.relationship / 200);
      if (!willing) {
        s = adjustRelationship(s, personId, -3);
        const how = far ? ' over the phone' : '';
        const text = grand ? `I asked ${who} for money${how} and got a story about what bread cost in the old days.` : `I asked ${who} for money${how} and got a lecture instead.`;
        s = log(s, text, 'bad');
        return setResult(s, text, 'bad');
      }
      const amount = Math.round(Math.min(person.money * 0.1, scaleMoney(s, grand ? rng.int(20, 300) : rng.int(100, 2000))));
      s = addMoney(s, amount);
      s = updatePerson(s, personId, { money: person.money - amount });
      s = adjustRelationship(s, personId, -1);
      const text = far ? `${who} sent me ${money(s, amount)}.` : `${who} slipped me ${money(s, amount)}.`;
      s = log(s, text, 'money');
      return setResult(s, text, 'good', { moneyDelta: amount });
    }
    case 'giveMoney': {
      s = addKarma(s, 2);
      s = adjustRelationship(s, personId, rng.int(6, 12));
      s = updatePerson(s, personId, { money: person.money + cost });
      s = touch(s, s.people[personId]!);
      // A young child, grandchild, brother or sister has no use for cash yet: it goes into savings for later.
      const text = (person.kind === 'grandchild' || person.kind === 'child' || person.kind === 'sibling') && person.age < SAVINGS_AGE
        ? `I put some money into a savings account for ${who}.`
        : far ? `I sent ${who} some money. It meant a lot.` : `I gave ${who} some money. It meant a lot.`;
      s = log(s, text, 'good');
      return setResult(s, text, 'good', { moneyDelta: -cost });
    }
    case 'date': {
      const great = rng.chance(0.7 + charming / 30);
      s = adjustRelationship(s, personId, great ? rng.int(5, 10) : -3);
      s = updatePerson(s, personId, { love: clampStat((s.people[personId]!.love ?? 50) + (great ? 8 : -4)) });
      s = touch(s, s.people[personId]!);
      s = addStats(s, { happiness: great ? 5 : -2 });
      const text = great ? `${who} and I had a wonderful date.` : `The date with ${who} was awkward from start to finish.`;
      s = log(s, text, great ? 'good' : 'bad');
      return setResult(s, text, great ? 'good' : 'bad', { moneyDelta: -cost });
    }
    case 'propose': {
      const yes = (person.love ?? 50) >= 55 && person.relationship >= 55 && rng.chance(0.55 + (person.love ?? 50) / 200);
      if (!yes) {
        // Counted for the "Ouch" achievement (src/data/achievements.ts).
        const rejected = s.flags.proposalsRejected;
        s = { ...s, flags: { ...s.flags, proposalsRejected: (typeof rejected === 'number' ? rejected : 0) + 1 } };
        s = addStats(s, { happiness: -12 });
        s = adjustRelationship(s, personId, -8);
        const text = `I proposed to ${who}. ${person.gender === 'male' ? 'He' : 'She'} said no.`;
        s = log(s, text, 'bad');
        return setResult(s, text, 'bad');
      }
      s = updatePerson(s, personId, { kind: 'spouse', marriedAtAge: s.character.age, ...takeSurname(person, rng.chance(0.5), s.character.lastName) });
      // A spouse never lives far away: one met far from home (or left behind by a move) moves in at the wedding.
      if (person.farAway) s = withoutFarAway(s, personId);
      s = adjustRelationship(s, personId, 10);
      s = bump(s, 'marriages');
      s = addStats(s, { happiness: 15 });
      s = clearCoupleFlags(s, ['lf_living_together']);
      const text = `${who} said yes! We got married in ${s.character.city}.`;
      s = log(s, text, 'milestone');
      return setResult(s, text, 'good', { statDeltas: { happiness: 15 } });
    }
    case 'breakUp': {
      s = clearCoupleFlags(updatePerson(s, personId, { kind: 'ex', love: 0, relationship: clampStat(person.relationship - 30) }));
      s = addStats(s, { happiness: person.relationship >= 60 ? -8 : -2 });
      const text = `I broke up with ${who}.`;
      s = log(s, text, 'bad');
      return setResult(s, text, 'info');
    }
    case 'divorce': {
      const settlement = Math.round(Math.max(0, s.finances.cash) * 0.3);
      s = addMoney(s, -settlement);
      s = clearCoupleFlags(updatePerson(s, personId, { kind: 'ex', love: 0, relationship: clampStat(person.relationship - 40), money: person.money + settlement }));
      s = bump(s, 'divorces');
      s = addStats(s, { happiness: -15 });
      const text = settlement > 0 ? `I divorced ${who}. The settlement cost me ${money(s, settlement)}.` : `I divorced ${who}. There was nothing to split but the furniture.`;
      s = log(s, text, 'bad');
      return setResult(s, text, 'bad', { moneyDelta: -settlement });
    }
    case 'haveChild': {
      const me = s.character;
      const partnerAge = person.age;
      // Two mothers or two fathers adopt; agencies stop placing babies once both are past 55.
      const adopting = person.gender === me.gender;
      const fertile = adopting ? me.age <= 55 && partnerAge <= 55 : me.age <= 50 && partnerAge <= 50 && (me.gender === 'female' ? me.age <= 45 : partnerAge <= 45);
      if (!fertile || !rng.chance(0.55)) {
        const text = adopting
          ? fertile ? `${who} and I applied to adopt. No match this year.` : `${who} and I looked into adopting, but the agencies said we had left it too late.`
          : fertile ? `${who} and I tried for a baby. No luck this year.` : `${who} and I tried for a baby, but it just wasn't in the cards.`;
        s = log(s, text);
        return setResult(s, text, 'info');
      }
      // A name nobody in the family has (two sons called David read as one), nor anyone this year's journal mentions.
      const baby = makePerson(rng, { kind: 'child', age: 0, countryCode: me.countryCode, lastName: me.lastName, playerAge: me.age, relationship: rng.int(70, 95), biological: !adopting, taken: new Set([...namesInLife(s), ...namesInJournalThisYear(s)]) });
      baby.otherParentId = personId;
      baby.occupation = 'Baby';
      s = { ...s, people: { ...s.people, [baby.id]: baby } };
      s = bump(s, 'children');
      s = addStats(s, { happiness: 20 });
      s = adjustRelationship(s, personId, 6);
      const male = baby.gender === 'male';
      const text = adopting
        ? `${who} and I adopted a baby ${male ? 'boy' : 'girl'}. We named ${male ? 'him' : 'her'} ${baby.firstName}.`
        : `${who} and I had a ${male ? 'son' : 'daughter'}. We named ${male ? 'him' : 'her'} ${baby.firstName}.`;
      s = log(s, text, 'milestone');
      return setResult(s, text, 'good', { statDeltas: { happiness: 20 } });
    }
    case 'visit': {
      const gain = rng.int(6, 12) + charming;
      s = adjustRelationship(s, personId, gain);
      s = addStats(s, { happiness: 4 });
      s = touch(s, s.people[personId]!);
      const kid = s.character.age < 18;
      let text = rng.pick(kid
        ? [`I visited ${who}. ${pp.Subject} fed me until I couldn't move.`, `I spent the weekend at ${who}'s. We did a puzzle with three pieces missing.`, `I visited ${who}, who had saved up a whole year of stories for me.`]
        : [`I went to see ${who}. ${pp.Subject} showed me every plant in the garden, twice.`, `I visited ${who} and stayed for dinner, then dessert, then a second dinner.`, `I dropped in on ${who}. We looked at old photos until it got dark.`]);
      // Grandparents send a grandchild home with a little something.
      const treat = kid && person.money > 0 && rng.chance(0.4) ? Math.round(Math.min(person.money, scaleMoney(s, rng.int(10, 60)))) : 0;
      if (treat > 0) {
        s = addMoney(s, treat);
        s = updatePerson(s, personId, { money: person.money - treat });
        text += ` ${pp.Subject} pressed ${money(s, treat)} into my hand on the way out.`;
      }
      s = log(s, text, 'good');
      return setResult(s, text, 'good', { statDeltas: { happiness: 4 }, ...(treat > 0 ? { moneyDelta: treat } : {}) });
    }
    case 'playWith':
    case 'walk': {
      s = adjustRelationship(s, personId, rng.int(4, 8));
      s = addStats(s, { happiness: 3, health: def.id === 'walk' ? 1 : 0 });
      s = touch(s, s.people[personId]!);
      const text = def.id === 'walk' ? `I took ${who} for a long walk.` : playLine(person, who);
      s = log(s, text, 'good');
      return setResult(s, text, 'good');
    }
    default:
      return s;
  }
}

/**
 * People who were still students when they joined the life grow up (GAME_DESIGN §10): from 23, anyone whose
 * occupation still says "Student" gets an adult job (or none) and savings of their own, so a partner met at 17 is
 * not a student with nothing at 50. The player's own children and grandchildren are left alone: the engine tells
 * their story through milestones (family.ts), and an heir starts between jobs.
 */
export function growUp(state: GameState, rng: Rng): GameState {
  let s = state;
  for (const p of Object.values(state.people)) {
    if (!p.alive || p.kind === 'pet' || p.kind === 'child' || p.kind === 'grandchild' || p.age < GROWN_UP_AGE) continue;
    if (p.occupation !== 'Student' && p.occupation !== 'Baby') continue;
    const { occupation, money } = grownUpLivelihood(rng, p.age, s.character.countryCode);
    s = updatePerson(s, p.id, { occupation, money: p.money + money });
  }
  return s;
}

/**
 * Whether the player sees this person every day (GAME_DESIGN §10): someone they live with (`livesWithPlayer`, as for
 * `household` selectors: the parents and siblings of the home they still live in, a spouse, a partner they moved in
 * with, a pet), one of their children who has not moved out, or a coworker at their current job. Nobody who lives far
 * away, and nobody while the player is in prison. Their page shows no silence, and the yearly pass records the year
 * (`memory.togetherUntil`), so a silence after a move, a divorce or a job change counts from then.
 */
export function seesDaily(state: GameState, p: Person): boolean {
  if (!p.alive || p.farAway || state.crime.inPrison) return false;
  if (p.kind === 'child') return !hasMovedOut(p);
  if (p.kind === 'coworker') return worksWithMe(state, p);
  return livesWithPlayer(state, p);
}

/** Records this year as a year spent together for everyone the player sees every day (seesDaily). */
export function noteTogether(state: GameState): GameState {
  const age = state.character.age;
  let people: GameState['people'] | undefined;
  for (const p of Object.values(state.people)) {
    if (p.memory.togetherUntil === age || !seesDaily(state, p)) continue;
    people ??= { ...state.people };
    people[p.id] = { ...p, memory: { ...p.memory, togetherUntil: age } };
  }
  return people ? { ...state, people } : state;
}

/**
 * The friends and grandparents left behind by this year's move abroad (systems/scenarios.ts) said goodbye at the
 * move: that counts as time with them this year (GAME_DESIGN §10, Contact), so the goodbye line is not followed by
 * "You haven't spoken in 2 years" on their page. Everyone else stayed behind without a word (rivals) or left the life.
 */
export function markGoodbyes(state: GameState): GameState {
  const move = state.character.moveAbroad;
  const age = state.character.age;
  if (!move || move.age !== age || state.flags.immigrant === undefined) return state;
  let s = state;
  for (const p of Object.values(state.people)) {
    if (p.alive && p.farAway && p.metAtAge < age && (p.kind === 'grandparent' || p.kind === 'friend' || p.kind === 'bestFriend')) s = markContact(s, p.id);
  }
  return s;
}

/**
 * Relationship-driven yearly events that are too systemic for the event tables. `reserved` are names that stay
 * taken this year although their owner may have left the life during it (ageUp passes the names at the start of
 * the year, so a coworker who left with the job does not hand their name to a new friend the same year).
 */
export function yearlyRelationships(state: GameState, rng: Rng, reserved: ReadonlySet<string> = new Set()): GameState {
  let s = state;
  const age = s.character.age;
  // Names stay reserved all year: a friend who drifts apart is not replaced by a new one of the same name.
  const taken = new Set([...reserved, ...namesInLife(state)]);
  // Someone new is not family, so they do not share the family's surname (it would read as a relative).
  const avoidSurnames = familySurnames(state);
  // The year with the people I see every day, a goodbye at a move abroad, and a year with a partner (the leaning of
  // the partners I meet).
  s = notePartnerYears(markGoodbyes(noteTogether(s)));
  s = growUp(s, rng);
  // A partner who died this year (ageNpcs runs just before) starts the grief window (an event death already has),
  // and a window that has run its course closes.
  s = yearlyGrief(s);
  // Partners may leave when neglected or unhappy. Telling me is contact: an ex's silence starts from then.
  for (const p of Object.values(s.people)) {
    if (!p.alive) continue;
    if ((p.kind === 'lover' || p.kind === 'spouse') && (p.love ?? 50) < 20 && rng.chance(0.4)) {
      s = markContact(s, p.id);
      s = clearCoupleFlags(updatePerson(s, p.id, { kind: 'ex', love: 0 }));
      s = addStats(s, { happiness: -10 });
      if (p.kind === 'spouse') s = bump(s, 'divorces');
      s = log(s, p.kind === 'spouse' ? `${fullName(p)} filed for divorce. ${p.gender === 'male' ? 'He' : 'She'} said we'd grown apart.` : `${p.firstName} broke up with me.`, 'bad');
    }
    if (p.kind === 'friend' && p.relationship < 15 && rng.chance(0.5)) {
      const people = { ...s.people };
      delete people[p.id];
      s = { ...s, people };
      s = log(s, `${p.firstName} and I drifted apart for good.`);
    }
  }
  // Meeting people. Friends left behind far away keep in touch, but leave room for friends nearby.
  const friends = Object.values(s.people).filter((p) => p.alive && (p.kind === 'friend' || p.kind === 'bestFriend') && !p.farAway).length;
  if (age >= 4 && age < 80 && friends < 4 && rng.chance(age < 25 ? 0.4 : 0.2)) {
    const [youngest, oldest] = friendAgeRange(age);
    const f = makePerson(rng, { kind: 'friend', age: rng.int(youngest, oldest), countryCode: s.character.countryCode, playerAge: age, relationship: rng.int(45, 70), taken, avoidSurnames });
    s = { ...s, people: { ...s.people, [f.id]: f } };
    s = bump(s, 'friendsMade');
    s = log(s, `I made a new friend, ${fullName(f)}.`, 'good');
  }
  const hasPartner = Object.values(s.people).some((p) => p.alive && (p.kind === 'lover' || p.kind === 'spouse'));
  const band = partnerAgeRange(age);
  // Nobody new in the year of losing a partner, and less likely the year after (the grief window, romance.ts).
  const grief = griefFactor(s);
  if (!hasPartner && band && age < 75 && !s.crime.inPrison && grief > 0 && rng.chance((0.25 + s.character.stats.looks / 400) * grief)) {
    const lover = makePerson(rng, { kind: 'lover', gender: partnerGender(rng, s), age: rng.int(band[0], band[1]), countryCode: s.character.countryCode, playerAge: age, relationship: rng.int(50, 75), taken, avoidSurnames });
    lover.love = rng.int(50, 80);
    s = { ...s, people: { ...s.people, [lover.id]: lover } };
    s = bump(s, 'lovers');
    s = addStats(s, { happiness: 6 });
    s = log(s, lover.occupation === 'Unemployed' ? `I started dating ${fullName(lover)}, who was between jobs.` : `I started dating ${fullName(lover)}, ${withArticle(lowerTitle(lover.occupation))}.`, 'good');
  }
  // Children grow up and move out of the household economically at 18 (handled in finance); nothing to do here.
  return s;
}
