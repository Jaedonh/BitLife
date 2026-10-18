import { adjustRelationship, updatePerson } from '../events/effects';
import { scaleMoney } from '../events/text';
import type { Rng } from '../rng';
import type { GameState, Person, RelationshipKind } from '../types';
import { addKarma, addMoney, addStats, bump, clampStat, countAction, actionCount, fullName, log, lowerTitle, money, setResult, withArticle } from '../util';
import { makePerson } from './character';

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
  | 'walk';

export interface InteractionDef {
  id: InteractionId;
  label: string;
  emoji: string;
  kinds: RelationshipKind[];
  minAge: number;
  energy: number;
  cost?: number;
  perYear?: number;
}

export const INTERACTIONS: readonly InteractionDef[] = [
  { id: 'spendTime', label: 'Spend time', emoji: '🕰️', kinds: ['mother', 'father', 'stepmother', 'stepfather', 'sibling', 'child', 'friend', 'bestFriend', 'lover', 'spouse', 'coworker', 'classmate'], minAge: 3, energy: 1, perYear: 2 },
  { id: 'conversation', label: 'Have a conversation', emoji: '💬', kinds: ['mother', 'father', 'stepmother', 'stepfather', 'sibling', 'child', 'friend', 'bestFriend', 'lover', 'spouse', 'coworker', 'classmate', 'ex', 'enemy'], minAge: 4, energy: 0, perYear: 3 },
  { id: 'compliment', label: 'Compliment', emoji: '🌟', kinds: ['mother', 'father', 'stepmother', 'stepfather', 'sibling', 'child', 'friend', 'bestFriend', 'lover', 'spouse', 'coworker', 'classmate', 'ex'], minAge: 4, energy: 0, perYear: 2 },
  { id: 'insult', label: 'Insult', emoji: '😤', kinds: ['mother', 'father', 'stepmother', 'stepfather', 'sibling', 'child', 'friend', 'bestFriend', 'lover', 'spouse', 'coworker', 'classmate', 'ex', 'enemy'], minAge: 4, energy: 0, perYear: 2 },
  { id: 'gift', label: 'Give a gift', emoji: '🎁', kinds: ['mother', 'father', 'stepmother', 'stepfather', 'sibling', 'child', 'friend', 'bestFriend', 'lover', 'spouse', 'coworker'], minAge: 8, energy: 0, cost: 150, perYear: 2 },
  { id: 'askMoney', label: 'Ask for money', emoji: '🙏', kinds: ['mother', 'father', 'stepmother', 'stepfather', 'sibling', 'spouse', 'friend', 'bestFriend'], minAge: 6, energy: 0, perYear: 1 },
  { id: 'giveMoney', label: 'Give money', emoji: '💸', kinds: ['mother', 'father', 'sibling', 'child', 'friend', 'bestFriend', 'lover', 'spouse'], minAge: 16, energy: 0, cost: 1000, perYear: 2 },
  { id: 'date', label: 'Go on a date', emoji: '🍷', kinds: ['lover', 'spouse'], minAge: 16, energy: 1, cost: 120, perYear: 2 },
  { id: 'propose', label: 'Propose', emoji: '💍', kinds: ['lover'], minAge: 18, energy: 1, cost: 2500, perYear: 1 },
  { id: 'breakUp', label: 'Break up', emoji: '💔', kinds: ['lover'], minAge: 14, energy: 0 },
  { id: 'divorce', label: 'Divorce', emoji: '📜', kinds: ['spouse'], minAge: 18, energy: 1, perYear: 1 },
  { id: 'haveChild', label: 'Try for a baby', emoji: '👶', kinds: ['spouse', 'lover'], minAge: 18, energy: 1, perYear: 1 },
  { id: 'playWith', label: 'Play', emoji: '🎾', kinds: ['pet'], minAge: 3, energy: 0, perYear: 3 },
  { id: 'walk', label: 'Go for a walk', emoji: '🐕', kinds: ['pet'], minAge: 6, energy: 0, perYear: 3 },
];

export function availableInteractions(state: GameState, person: Person): InteractionDef[] {
  if (!person.alive) return [];
  return INTERACTIONS.filter((i) => i.kinds.includes(person.kind) && state.character.age >= i.minAge);
}

function touch(state: GameState, person: Person, patch: Partial<Person['memory']> = {}): GameState {
  return updatePerson(state, person.id, { memory: { ...person.memory, ...patch, lastInteractionAge: state.character.age, yearsNeglected: 0 } });
}

function relLabel(p: Person): string {
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
    default: return p.firstName;
  }
}

export function interact(state: GameState, rng: Rng, personId: string, interactionId: string): GameState {
  const person = state.people[personId];
  if (!person || !person.alive) return setResult(state, 'They are no longer around.', 'bad');
  const def = INTERACTIONS.find((i) => i.id === interactionId);
  if (!def || !def.kinds.includes(person.kind)) return state;
  if (state.character.age < def.minAge) return setResult(state, "I'm too young for that.", 'info');
  const key = `${def.id}:${personId}`;
  if (def.perYear && actionCount(state, key) >= def.perYear) return setResult(state, "I've done that enough this year.", 'info');
  if (def.energy > state.character.energy) return setResult(state, "I'm out of energy this year. Age up to recharge.", 'info');
  const cost = def.cost ? scaleMoney(state, def.cost) : 0;
  if (cost && state.finances.cash < cost) return setResult(state, "I can't afford that right now.", 'bad');
  let s = countAction(state, key);
  s = { ...s, character: { ...s.character, energy: s.character.energy - def.energy } };
  if (cost) s = addMoney(s, -cost);
  const who = `${person.firstName}`;
  const label = relLabel(person);
  const charming = s.character.traits.includes('charming') ? 3 : 0;

  switch (def.id) {
    case 'spendTime': {
      const gain = rng.int(4, 9) + charming;
      s = adjustRelationship(s, personId, gain);
      s = addStats(s, { happiness: person.relationship >= 40 ? 3 : 1 });
      if (person.love !== undefined) s = updatePerson(s, personId, { love: clampStat((s.people[personId]!.love ?? 0) + 4) });
      s = touch(s, s.people[personId]!);
      const young = s.character.age < 6;
      const text = rng.pick(young
        ? [`I spent a lovely afternoon with ${label}, ${who}.`, `${who} and I played together until it got dark.`, `I followed ${who} around all day, talking nonstop.`]
        : [`I spent a lovely afternoon with ${label}, ${who}.`, `${who} and I hung out and lost track of time.`, `I spent quality time with ${who}.`]);
      s = log(s, text, 'good');
      return setResult(s, text, 'good', { statDeltas: { happiness: 3 } });
    }
    case 'conversation': {
      const bad = rng.chance(person.craziness / 300 + (person.relationship < 30 ? 0.3 : 0.05));
      if (bad) {
        s = adjustRelationship(s, personId, -rng.int(3, 8));
        s = touch(s, s.people[personId]!, { fights: person.memory.fights + 1 });
        s = addStats(s, { happiness: -2 });
        const text = rng.pick([`My conversation with ${who} turned into an argument.`, `${who} and I got into it over nothing.`]);
        s = log(s, text, 'bad');
        return setResult(s, text, 'bad');
      }
      s = adjustRelationship(s, personId, rng.int(2, 5) + charming);
      s = touch(s, s.people[personId]!);
      const text = rng.pick(s.character.age < 8
        ? [`${who} and I had a good talk.`, `I told ${who} all about my day, and ${person.gender === 'male' ? 'he' : 'she'} listened to every word.`]
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
      const text = liked ? `I complimented ${who}. ${person.gender === 'male' ? 'He' : 'She'} beamed.` : `I complimented ${who}, who assumed I wanted something.`;
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
      const text = retaliates ? `I insulted ${who}, who fired back twice as hard.` : `I insulted ${who}. ${person.gender === 'male' ? 'He' : 'She'} walked away without a word.`;
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
      const text = loved ? `${who} loved the gift.` : `${who} said "you shouldn't have" and seemed to mean it.`;
      s = log(s, text, loved ? 'good' : 'info');
      return setResult(s, text, loved ? 'good' : 'info', { moneyDelta: -cost });
    }
    case 'askMoney': {
      const willing = person.relationship >= 50 && person.money > 0 && rng.chance(0.3 + person.relationship / 200);
      if (!willing) {
        s = adjustRelationship(s, personId, -3);
        const text = `I asked ${who} for money and got a lecture instead.`;
        s = log(s, text, 'bad');
        return setResult(s, text, 'bad');
      }
      const amount = Math.round(Math.min(person.money * 0.1, scaleMoney(s, rng.int(100, 2000))));
      s = addMoney(s, amount);
      s = updatePerson(s, personId, { money: person.money - amount });
      s = adjustRelationship(s, personId, -1);
      const text = `${who} slipped me ${money(s, amount)}.`;
      s = log(s, text, 'money');
      return setResult(s, text, 'good', { moneyDelta: amount });
    }
    case 'giveMoney': {
      s = addKarma(s, 2);
      s = adjustRelationship(s, personId, rng.int(6, 12));
      s = updatePerson(s, personId, { money: person.money + cost });
      s = touch(s, s.people[personId]!);
      const text = `I gave ${who} some money. It meant a lot.`;
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
        s = addStats(s, { happiness: -12 });
        s = adjustRelationship(s, personId, -8);
        const text = `I proposed to ${who}. ${person.gender === 'male' ? 'He' : 'She'} said no.`;
        s = log(s, text, 'bad');
        return setResult(s, text, 'bad');
      }
      s = updatePerson(s, personId, { kind: 'spouse', marriedAtAge: s.character.age, lastName: rng.chance(0.5) ? s.character.lastName : person.lastName });
      s = adjustRelationship(s, personId, 10);
      s = bump(s, 'marriages');
      s = addStats(s, { happiness: 15 });
      const text = `${who} said yes! We got married in ${s.character.city}.`;
      s = log(s, text, 'milestone');
      return setResult(s, text, 'good', { statDeltas: { happiness: 15 } });
    }
    case 'breakUp': {
      s = updatePerson(s, personId, { kind: 'ex', love: 0, relationship: clampStat(person.relationship - 30) });
      s = addStats(s, { happiness: person.relationship >= 60 ? -8 : -2 });
      const text = `I broke up with ${who}.`;
      s = log(s, text, 'bad');
      return setResult(s, text, 'info');
    }
    case 'divorce': {
      const settlement = Math.round(Math.max(0, s.finances.cash) * 0.3);
      s = addMoney(s, -settlement);
      s = updatePerson(s, personId, { kind: 'ex', love: 0, relationship: clampStat(person.relationship - 40), money: person.money + settlement });
      s = bump(s, 'divorces');
      s = addStats(s, { happiness: -15 });
      const text = settlement > 0 ? `I divorced ${who}. The settlement cost me ${money(s, settlement)}.` : `I divorced ${who}. There was nothing to split but the furniture.`;
      s = log(s, text, 'bad');
      return setResult(s, text, 'bad', { moneyDelta: -settlement });
    }
    case 'haveChild': {
      const me = s.character;
      const partnerAge = person.age;
      const fertile = me.age <= 50 && partnerAge <= 50 && (me.gender === 'female' ? me.age <= 45 : partnerAge <= 45);
      if (!fertile || !rng.chance(0.55)) {
        const text = fertile ? `${who} and I tried for a baby. No luck this year.` : `${who} and I tried for a baby, but it just wasn't in the cards.`;
        s = log(s, text);
        return setResult(s, text, 'info');
      }
      const baby = makePerson(rng, { kind: 'child', age: 0, countryCode: me.countryCode, lastName: me.lastName, playerAge: me.age, relationship: rng.int(70, 95), biological: true });
      baby.otherParentId = personId;
      baby.occupation = 'Baby';
      s = { ...s, people: { ...s.people, [baby.id]: baby } };
      s = bump(s, 'children');
      s = addStats(s, { happiness: 20 });
      s = adjustRelationship(s, personId, 6);
      const text = `${who} and I had a ${baby.gender === 'male' ? 'son' : 'daughter'}. We named ${baby.gender === 'male' ? 'him' : 'her'} ${baby.firstName}.`;
      s = log(s, text, 'milestone');
      return setResult(s, text, 'good', { statDeltas: { happiness: 20 } });
    }
    case 'playWith':
    case 'walk': {
      s = adjustRelationship(s, personId, rng.int(4, 8));
      s = addStats(s, { happiness: 3, health: def.id === 'walk' ? 1 : 0 });
      s = touch(s, s.people[personId]!);
      const text = def.id === 'walk' ? `I took ${who} for a long walk.` : `I played with ${who} until we were both exhausted.`;
      s = log(s, text, 'good');
      return setResult(s, text, 'good');
    }
    default:
      return s;
  }
}

/** Relationship-driven yearly events that are too systemic for the event tables. */
export function yearlyRelationships(state: GameState, rng: Rng): GameState {
  let s = state;
  const age = s.character.age;
  // Partners may leave when neglected or unhappy.
  for (const p of Object.values(s.people)) {
    if (!p.alive) continue;
    if ((p.kind === 'lover' || p.kind === 'spouse') && (p.love ?? 50) < 20 && rng.chance(0.4)) {
      s = updatePerson(s, p.id, { kind: 'ex', love: 0 });
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
  // Meeting people.
  const friends = Object.values(s.people).filter((p) => p.alive && (p.kind === 'friend' || p.kind === 'bestFriend')).length;
  if (age >= 4 && age < 80 && friends < 4 && rng.chance(age < 25 ? 0.4 : 0.2)) {
    const f = makePerson(rng, { kind: 'friend', age: Math.max(1, age + rng.int(-3, 3)), countryCode: s.character.countryCode, playerAge: age, relationship: rng.int(45, 70) });
    s = { ...s, people: { ...s.people, [f.id]: f } };
    s = bump(s, 'friendsMade');
    s = log(s, `I made a new friend, ${fullName(f)}.`, 'good');
  }
  const hasPartner = Object.values(s.people).some((p) => p.alive && (p.kind === 'lover' || p.kind === 'spouse'));
  if (!hasPartner && age >= 16 && age < 75 && !s.crime.inPrison && rng.chance(0.25 + s.character.stats.looks / 400)) {
    const partnerGender = rng.chance(0.9) ? (s.character.gender === 'male' ? 'female' : 'male') : s.character.gender;
    const lover = makePerson(rng, { kind: 'lover', gender: partnerGender, age: Math.max(16, age + rng.int(-4, 4)), countryCode: s.character.countryCode, playerAge: age, relationship: rng.int(50, 75) });
    lover.love = rng.int(50, 80);
    s = { ...s, people: { ...s.people, [lover.id]: lover } };
    s = bump(s, 'lovers');
    s = addStats(s, { happiness: 6 });
    s = log(s, lover.occupation === 'Unemployed' ? `I started dating ${fullName(lover)}, who was between jobs.` : `I started dating ${fullName(lover)}, ${withArticle(lowerTitle(lover.occupation))}.`, 'good');
  }
  // Children grow up and move out of the household economically at 18 (handled in finance); nothing to do here.
  return s;
}
