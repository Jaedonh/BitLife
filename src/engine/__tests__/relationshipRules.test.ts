import { EVENTS } from '@/data/events';
import { applyAction } from '../actions';
import { applyEffects } from '../events/effects';
import type { Effect } from '../events/schema';
import { Rng } from '../rng';
import { createLife, emptyMemory, makePerson } from '../systems/character';
import { markDeath } from '../systems/death';
import { availableInteractions, yearlyRelationships } from '../systems/relationships';
import type { GameState, Gender, Person } from '../types';

/** The legal-age rule, written out independently of the engine: no romance under 16, adults only with adults, minors only with minors within two years. */
function legal(playerAge: number, partnerAge: number): boolean {
  if (playerAge < 16 || partnerAge < 16) return false;
  if (playerAge >= 18) return partnerAge >= 18;
  return partnerAge < 18 && Math.abs(playerAge - partnerAge) <= 2;
}

/** A player of `age` with no partners, plenty of cash and energy. */
function player(age: number, opts: { gender?: Gender; seed?: number } = {}): GameState {
  const s = createLife({ countryCode: 'US', gender: opts.gender ?? 'male' }, opts.seed ?? 21);
  const people: Record<string, Person> = {};
  for (const p of Object.values(s.people)) if (p.kind !== 'lover' && p.kind !== 'spouse') people[p.id] = { ...p, age: p.age + age };
  return {
    ...s,
    people,
    year: s.character.birthYear + age,
    character: { ...s.character, age, energy: 4, energyMax: 4, stats: { ...s.character.stats, looks: 100 } },
    finances: { ...s.finances, cash: 1_000_000 },
  };
}

function withPartner(s: GameState, partner: Partial<Person> & { kind: 'lover' | 'spouse' }): { state: GameState; id: string } {
  const p: Person = {
    ...makePerson(new Rng(5), { kind: partner.kind, age: 20, countryCode: 'US', playerAge: s.character.age }),
    gender: 'female',
    relationship: 100,
    love: 100,
    memory: emptyMemory(s.character.age),
    ...partner,
  };
  return { state: { ...s, people: { ...s.people, [p.id]: p } }, id: p.id };
}

function newPeople(before: GameState, after: GameState): Person[] {
  return Object.values(after.people).filter((p) => !before.people[p.id]);
}

function interactFresh(s: GameState, personId: string, interaction: string, seed = 1): GameState {
  return applyAction({ ...s, actionsThisYear: {}, character: { ...s.character, energy: 4 }, rng: new Rng(seed).snapshot() }, { type: 'interact', personId, interaction });
}

describe('legal ages for romance', () => {
  it('the yearly partner roll only pairs minors with minors their age and adults with adults', () => {
    for (const age of [14, 15, 16, 17, 18, 19, 20, 21, 35, 70]) {
      const base = player(age);
      for (let r = 1; r <= 150; r++) {
        const s = yearlyRelationships(base, new Rng(r));
        for (const p of newPeople(base, s).filter((x) => x.kind === 'lover')) {
          expect(age).toBeGreaterThanOrEqual(16);
          expect({ age, partner: p.age, legal: legal(age, p.age) }).toEqual({ age, partner: p.age, legal: true });
          // A minor's partner is their own age, so the pair turns 18 together and never ends up as an adult and a minor.
          if (age < 18) expect(p.age).toBe(age);
        }
      }
    }
  });

  it('an event lover (the school dance) is the same age for a 16-year-old and an adult for an adult', () => {
    const effect: Effect[] = [{ newPerson: { kind: 'lover', relationship: 60 } }];
    for (const [age, lo, hi] of [[16, 16, 16], [17, 17, 17], [18, 18, 22], [40, 36, 44]] as const) {
      const base = player(age);
      for (let r = 1; r <= 200; r++) {
        const lover = newPeople(base, applyEffects(base, new Rng(r), effect))[0]!;
        expect(lover.kind).toBe('lover');
        expect(lover.age).toBeGreaterThanOrEqual(lo);
        expect(lover.age).toBeLessThanOrEqual(hi);
      }
    }
    // Explicit ranges in content are clamped to the legal band, never widened past it.
    const sixteen = player(16);
    const ranged = newPeople(sixteen, applyEffects(sixteen, new Rng(3), [{ newPerson: { kind: 'lover', minAge: 10, maxAge: 30 } }]))[0]!;
    expect(ranged.age).toBeGreaterThanOrEqual(16);
    expect(ranged.age).toBeLessThanOrEqual(17);
    // Nobody under 16 gets a lover, whatever the content says.
    const fifteen = player(15);
    expect(newPeople(fifteen, applyEffects(fifteen, new Rng(3), effect))).toHaveLength(0);
  });

  it('an adult cannot date, marry or have a child with a 17-year-old partner, and the person screen hides those options', () => {
    const { state, id } = withPartner(player(18), { kind: 'lover', age: 17 });
    const shown = availableInteractions(state, state.people[id]!).map((i) => i.id);
    expect(shown).not.toContain('date');
    expect(shown).not.toContain('propose');
    expect(shown).not.toContain('haveChild');
    expect(shown).toContain('conversation');
    for (const interaction of ['date', 'propose', 'haveChild']) {
      for (let r = 1; r <= 20; r++) {
        const s = interactFresh(state, id, interaction, r);
        expect(s.people[id]!.kind).toBe('lover');
        expect(Object.values(s.people).some((p) => p.kind === 'child')).toBe(false);
        expect(s.finances.cash).toBe(state.finances.cash);
        expect(s.lastResult?.text).toMatch(/17/);
      }
    }
    // A year later both are adults and the same couple can marry.
    const older = { ...state, character: { ...state.character, age: 19 }, people: { ...state.people, [id]: { ...state.people[id]!, age: 18 } } };
    expect(interactFresh(older, id, 'propose').people[id]!.kind).toBe('spouse');
  });

  it('a 17-year-old cannot date an 18-year-old partner either', () => {
    const { state, id } = withPartner(player(17), { kind: 'lover', age: 18 });
    expect(availableInteractions(state, state.people[id]!).map((i) => i.id)).not.toContain('date');
    const s = interactFresh(state, id, 'date');
    expect(s.finances.cash).toBe(state.finances.cash);
    expect(s.lastResult?.text).toMatch(/I'm only 17/);
  });

  it('step-parents are aged from the parent they marry and are always a generation older than the player', () => {
    const base = player(70);
    const mother = Object.values(base.people).find((p) => p.kind === 'mother')!;
    const s0 = { ...base, people: { ...base.people, [mother.id]: { ...mother, age: 92, alive: true } } };
    const effect: Effect[] = [{ newPerson: { kind: 'stepfather', gender: 'male', relationship: 50, minAge: 50, maxAge: 75 } }];
    for (let r = 1; r <= 100; r++) {
      const step = newPeople(s0, applyEffects(s0, new Rng(r), effect, { personId: mother.id }))[0]!;
      expect(step.age).toBeGreaterThanOrEqual(70 + 16);
      expect(step.age).toBeGreaterThanOrEqual(92 - 10);
      expect(step.age).toBeLessThanOrEqual(92 + 10);
    }
  });

  it('every event that creates a lover or a baby is 16+, never written for prison, and babies only with an adult partner', () => {
    const walk = (effects: readonly Effect[]): Effect[] =>
      effects.flatMap((e) => [e, ...('random' in e ? e.random.flatMap((o) => walk(o.effects)) : []), ...('chance' in e ? [...walk(e.then), ...walk(e.else ?? [])] : [])]);
    const creates = (kinds: string[]) => EVENTS.filter((d) => d.choices.some((c) => walk(c.effects).some((e) => 'newPerson' in e && kinds.includes(e.newPerson.kind))));
    const romantic = creates(['lover', 'spouse', 'child']);
    expect(romantic.length).toBeGreaterThan(5);
    for (const d of romantic) {
      expect({ id: d.id, minAge: d.minAge >= 16 }).toEqual({ id: d.id, minAge: true });
      // Only events written for prison ({ inPrison: true }) open there, so none of these may be one.
      expect({ id: d.id, inPrison: d.conditions?.some((c) => 'inPrison' in c && c.inPrison === true) ?? false }).toEqual({ id: d.id, inPrison: false });
    }
    for (const d of creates(['child'])) {
      expect({ id: d.id, adult: d.minAge >= 18 && (d.person?.minAge ?? 0) >= 18 }).toEqual({ id: d.id, adult: true });
    }
  });
});

describe('relationships from prison', () => {
  function jailed(): { state: GameState; loverId: string; motherId: string } {
    const { state, id } = withPartner(player(30), { kind: 'lover', age: 29 });
    const motherId = Object.values(state.people).find((p) => p.kind === 'mother')!.id;
    return { state: { ...state, crime: { ...state.crime, inPrison: true, sentenceYearsLeft: 5, record: true } }, loverId: id, motherId };
  }

  it('refuses dates, gifts, money, proposals and babies with a readable message', () => {
    const { state, loverId, motherId } = jailed();
    for (const [personId, interaction] of [[loverId, 'date'], [loverId, 'gift'], [loverId, 'giveMoney'], [loverId, 'propose'], [loverId, 'haveChild'], [loverId, 'spendTime'], [motherId, 'askMoney'], [motherId, 'gift']] as const) {
      for (let r = 1; r <= 10; r++) {
        const s = interactFresh(state, personId, interaction, r);
        expect(s.lastResult?.text).toBe("Not while I'm behind bars.");
        expect(s.people).toEqual(state.people);
        expect(s.finances.cash).toBe(state.finances.cash);
        expect(s.character.energy).toBe(4);
      }
    }
  });

  it('still allows a phone call or a visit, and the person screen only offers those', () => {
    const { state, loverId, motherId } = jailed();
    const s = interactFresh(state, motherId, 'conversation', 4);
    expect(s.lastResult?.text).not.toBe("Not while I'm behind bars.");
    expect(s.people[motherId]!.memory.lastInteractionAge).toBe(30);
    for (const id of [loverId, motherId]) {
      const shown = availableInteractions(state, state.people[id]!).map((i) => i.id);
      expect(shown.length).toBeGreaterThan(0);
      for (const i of shown) expect(['conversation', 'compliment', 'insult', 'breakUp']).toContain(i);
    }
  });
});

describe('children and heirs come from the real family', () => {
  it('a baby from an event belongs to the partner the event is about, or to the current partner', () => {
    const { state, id } = withPartner(player(30, { gender: 'female' }), { kind: 'spouse', gender: 'male', age: 31 });
    const baby: Effect[] = [{ newPerson: { kind: 'child', relationship: 80 } }];
    const bound = newPeople(state, applyEffects(state, new Rng(2), baby, { personId: id }))[0]!;
    expect(bound.otherParentId).toBe(id);
    expect(bound.biological).toBe(true);
    const unbound = newPeople(state, applyEffects(state, new Rng(2), baby))[0]!;
    expect(unbound.otherParentId).toBe(id);
  });

  it('an heir with no recorded other parent gets no invented living parent', () => {
    let prev = player(30, { gender: 'female', seed: 5 });
    const kid = makePerson(new Rng(9), { kind: 'child', age: 0, countryCode: 'US', lastName: prev.character.lastName, playerAge: 30 });
    prev = markDeath({ ...prev, people: { ...prev.people, [kid.id]: kid } }, 'a car accident');
    const s = createLife({ heir: { childId: kid.id, previous: prev } }, 1234);
    const parents = Object.values(s.people).filter((p) => p.kind === 'mother' || p.kind === 'father');
    expect(parents).toHaveLength(1);
    expect(parents[0]).toMatchObject({ kind: 'mother', firstName: prev.character.firstName, alive: false });
    expect(s.log.some((l) => l.text.includes('still with us'))).toBe(false);
  });

  it('a same-sex couple adopts, and their heir has two mothers', () => {
    const { state, id } = withPartner(player(30, { gender: 'female', seed: 5 }), { kind: 'spouse', gender: 'female', firstName: 'Alicia', age: 30 });
    let s = state;
    for (let r = 1; r <= 30 && !Object.values(s.people).some((p) => p.kind === 'child'); r++) s = interactFresh(s, id, 'haveChild', r);
    const kid = Object.values(s.people).find((p) => p.kind === 'child')!;
    expect(kid.otherParentId).toBe(id);
    expect(kid.biological).toBe(false);
    expect(s.log.some((l) => l.text.startsWith('Alicia and I adopted'))).toBe(true);
    const heir = createLife({ heir: { childId: kid.id, previous: markDeath(s, 'a car accident') } }, 4);
    const parents = Object.values(heir.people).filter((p) => p.kind === 'mother' || p.kind === 'father');
    expect(parents.map((p) => `${p.kind}:${p.firstName}:${p.gender}:${p.alive}`).sort()).toEqual([`mother:${state.character.firstName}:female:false`, 'mother:Alicia:female:true'].sort());
  });

  it('a wedding event marries the bound lover, and breaking up clears the engagement', () => {
    const { state, id } = withPartner(player(30), { kind: 'lover', age: 31 });
    const engaged = { ...state, flags: { ...state.flags, lf_engaged: true, lf_living_together: true } };
    const wed = applyEffects(engaged, new Rng(1), [{ marry: true }], { personId: id });
    expect(wed.people[id]!.kind).toBe('spouse');
    expect(wed.people[id]!.marriedAtAge).toBe(30);
    expect(wed.counters.marriages).toBe(engaged.counters.marriages + 1);
    expect(wed.flags.lf_engaged).toBeUndefined();
    expect(wed.flags.lf_living_together).toBe(true);
    // Not for a minor partner, and not twice.
    const young = withPartner(player(17), { kind: 'lover', age: 17 });
    expect(applyEffects(young.state, new Rng(1), [{ marry: true }], { personId: young.id }).people[young.id]!.kind).toBe('lover');
    expect(applyEffects(wed, new Rng(1), [{ marry: true }], { personId: id }).counters.marriages).toBe(wed.counters.marriages);
    const split = interactFresh(engaged, id, 'breakUp');
    expect(split.flags.lf_engaged).toBeUndefined();
    expect(split.flags.lf_living_together).toBeUndefined();
  });
});

