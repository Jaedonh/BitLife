import { CRIMES } from '@/data/crimes';
import { ageUp } from '../ageUp';
import { applyAction, statBoostBlocker, statBoostGain } from '../actions';
import { makeRegistry } from '../events/select';
import { Rng } from '../rng';
import { createLife, makePerson } from '../systems/character';
import { markDeath } from '../systems/death';
import type { GameState, Person, PlayerAction, Stats } from '../types';
import { numberWord } from '../util';

const noEvents = makeRegistry([]);

function ageTo(state: GameState, age: number): GameState {
  let s = state;
  while (s.alive && s.character.age < age) {
    s = ageUp(s, noEvents);
    s = { ...s, character: { ...s.character, stats: { ...s.character.stats, health: 90 } }, health: { ...s.health, illnesses: [] } };
  }
  return s;
}

const withStats = (s: GameState, stats: Partial<Stats>): GameState => ({ ...s, character: { ...s.character, stats: { ...s.character.stats, ...stats } } });
const statDiff = (a: GameState, b: GameState): Partial<Stats> => {
  const out: Partial<Stats> = {};
  for (const k of ['happiness', 'health', 'smarts', 'looks'] as const) if (b.character.stats[k] !== a.character.stats[k]) out[k] = b.character.stats[k] - a.character.stats[k];
  return out;
};

describe('result toasts report the change actually applied (F10)', () => {
  const adult = ageTo(createLife({ countryCode: 'US' }, 3), 20);

  it('refuses a stat boost that would change nothing, without spending it', () => {
    const s = withStats(adult, { health: adult.character.potential.health });
    expect(statBoostGain(s, 'health')).toBe(0);
    expect(statBoostBlocker(s, 'health')).toBe('My health is already as good as it gets.');
    const after = applyAction(s, { type: 'rewarded', placement: 'statBoost', option: 'health' });
    expect(after.character.stats.health).toBe(s.character.stats.health);
    expect(after.counters.rewardedAdsUsed).toBe(s.counters.rewardedAdsUsed);
    expect(after.lastResult).toEqual({ text: 'My health is already as good as it gets.', kind: 'info' });
  });

  it('reports the real gain of a boost that runs into the cap', () => {
    const s = withStats(adult, { happiness: 88 });
    expect(statBoostGain(s, 'happiness')).toBe(12);
    const after = applyAction(s, { type: 'rewarded', placement: 'statBoost', option: 'happiness' });
    expect(after.character.stats.happiness).toBe(100);
    expect(after.counters.rewardedAdsUsed).toBe(s.counters.rewardedAdsUsed + 1);
    expect(after.lastResult).toMatchObject({ text: "Happiness +12. That's as high as it goes.", statDeltas: { happiness: 12 } });
  });

  it('a boost with no stat chosen goes to happiness, and is refused (not spent) when happiness is maxed', () => {
    const p = adult.character.potential;
    const happy = withStats(adult, { happiness: 100, health: 40 });
    expect(p.health).toBeGreaterThan(40);
    expect(statBoostBlocker(happy, undefined)).toBe("I'm already as happy as I can be.");
    const after = applyAction(happy, { type: 'rewarded', placement: 'statBoost' });
    expect(after.counters.rewardedAdsUsed).toBe(happy.counters.rewardedAdsUsed);
    expect(statBoostBlocker(withStats(happy, { happiness: 60 }), undefined)).toBeNull();
  });

  it('spending time with a distant relative claims the +1 it gives, not +3', () => {
    const parent = Object.values(adult.people).find((x) => x.kind === 'mother' || x.kind === 'father')!;
    const s = withStats({ ...adult, people: { ...adult.people, [parent.id]: { ...parent, relationship: 20 } } }, { happiness: 50 });
    const after = applyAction(s, { type: 'interact', personId: parent.id, interaction: 'spendTime' });
    expect(after.character.stats.happiness).toBe(51);
    expect(after.lastResult?.statDeltas).toEqual({ happiness: 1 });
  });

  it('studying and the library at the smarts limit claim no smarts', () => {
    const s = withStats({ ...adult, education: { ...adult.education, enrolled: true, stage: 'university', studiedThisYear: false } }, { smarts: adult.character.potential.smarts, happiness: 50 });
    for (const action of [{ type: 'study' } as const, { type: 'activity', id: 'library' } as const]) {
      const after = applyAction(s, action);
      expect(after.character.stats.smarts).toBe(s.character.stats.smarts);
      expect(after.lastResult?.statDeltas?.smarts).toBeUndefined();
      expect(after.lastResult?.statDeltas ?? {}).toEqual(statDiff(s, after));
    }
  });

  it('every action toast matches the stats it changed, across fuzzed lives', () => {
    for (let seed = 1; seed <= 25; seed++) {
      let s = ageTo(createLife({ countryCode: 'GB' }, seed), 16);
      const rng = new Rng(seed);
      for (let year = 0; year < 12 && s.alive; year++) {
        const people = Object.values(s.people).filter((x) => x.alive && x.kind !== 'pet');
        const actions: PlayerAction[] = [
          { type: 'activity', id: rng.pick(['gym', 'library', 'meditate', 'jog', 'movies', 'hobby', 'party']) },
          { type: 'study' },
          ...(people.length ? [{ type: 'interact' as const, personId: rng.pick(people).id, interaction: rng.pick(['spendTime', 'conversation', 'insult']) }] : []),
          { type: 'rewarded', placement: 'statBoost', option: rng.pick(['happiness', 'health', 'smarts', 'looks']) },
        ];
        for (const a of actions) {
          const after = applyAction(s, a);
          if (after.lastResult) expect(after.lastResult.statDeltas ?? {}).toEqual(statDiff(s, after));
          s = after;
        }
        s = ageTo(s, s.character.age + 1);
      }
    }
  });
});

describe('crime and money lines (F16)', () => {
  it('name the crime in prose and price everything in the local currency', () => {
    const texts = new Set<string>();
    for (let seed = 1; seed <= 120; seed++) {
      const teen = ageTo(createLife({ countryCode: 'JP' }, seed), 18);
      for (const def of CRIMES) {
        const after = applyAction({ ...teen, finances: { ...teen.finances, cash: 50_000 } }, { type: 'crime', id: def.id });
        if (after.lastResult) texts.add(after.lastResult.text);
      }
    }
    expect(texts.size).toBeGreaterThan(20);
    for (const t of texts) {
      expect(t).not.toMatch(/with (shoplift|pickpocket|car_theft|bank_robbery|fraud)\b|for (shoplift|pickpocket)\b|attempting /);
      // Every amount of money carries the yen sign; the only other numbers are sentence lengths.
      const amounts = t.replace(/\d+ years? in prison/g, '').match(/.?\d[\d,]*/g) ?? [];
      for (const a of amounts) expect([t, a[0]]).toEqual([t, '¥']);
    }
  });

  it('the inheritance line uses the shared money format', () => {
    let parent = ageTo(createLife({ countryCode: 'IN' }, 11), 30);
    const kid: Person = { ...makePerson(new Rng(5), { kind: 'child', age: 5, countryCode: 'IN', playerAge: 30, lastName: parent.character.lastName }), id: 'kid' };
    parent = markDeath({ ...parent, people: { ...parent.people, kid }, finances: { ...parent.finances, cash: 1_234_567 } }, 'a heart attack');
    const heir = createLife({ heir: { childId: 'kid', previous: parent } }, 99);
    const line = heir.log.find((l) => l.text.startsWith('I inherited'));
    expect(line?.text).toMatch(/^I inherited ₹\d{1,3}(,\d{3})+ from /);
  });
});

describe('obituaries fit the age (F17)', () => {
  const base = createLife({ countryCode: 'GB' }, 105);
  const parents = Object.values(base.people).filter((x) => x.kind === 'mother' || x.kind === 'father');

  it("a toddler's obituary has no job, marriage or money jokes", () => {
    const s = ageTo(base, 2);
    const obit = markDeath({ ...s, finances: { ...s.finances, debt: 37 } }, 'a freak accident').death!.obituary;
    expect(obit).toMatch(/only a toddler/);
    expect(obit).not.toMatch(/steady job|lifestyle choice|never married|debts|surprised no one/);
  });

  it('lists a single parent, siblings and a pet without stray commas', () => {
    const s = ageTo(base, 9);
    const [gone] = parents;
    const pet: Person = { ...makePerson(new Rng(3), { kind: 'pet', age: 2, countryCode: 'GB', playerAge: 9, species: 'dog' }), id: 'pet1', firstName: 'Biscuit' };
    // Grandparents are listed too (see the grandparents test); this one is about parents, siblings and pets.
    const people = Object.fromEntries(Object.entries({ ...s.people, [gone!.id]: { ...s.people[gone!.id]!, alive: false } }).filter(([, x]) => x.kind !== 'grandparent'));
    const left = Object.values(people).find((x) => x.alive && (x.kind === 'mother' || x.kind === 'father'))!;
    const sibs = Object.values(people).filter((x) => x.alive && x.kind === 'sibling').length;
    const pos = s.character.gender === 'male' ? 'his' : 'her';
    const noPet = markDeath({ ...s, people }, 'pneumonia').death!.obituary;
    expect(noPet).toContain(sibs ? `survived by ${pos} ${left.kind} ${left.firstName} and ${numberWord(sibs)} sibling` : `survived by ${pos} ${left.kind} ${left.firstName}.`);
    const withPet = markDeath({ ...s, people: { ...people, pet1: pet } }, 'pneumonia').death!.obituary;
    expect(withPet).toMatch(new RegExp(`survived by ${pos} ${left.kind} ${left.firstName}(, .+ siblings?,)? and ${pos} dog, Biscuit\\.`));
  });

  it('a 19-year-old is not mocked for never marrying or for student debt', () => {
    const s = ageTo(base, 19);
    const obit = markDeath({ ...s, finances: { ...s.finances, cash: 0, debt: 4_000 } }, 'a car crash').death!.obituary;
    // 4,000 game units shown in pounds at the display rate (0.79).
    expect(obit).toMatch(/left behind debts of £3,160\./);
    expect(obit).not.toMatch(/never married|surprised no one/);
  });

  it('an adult still gets the full obituary', () => {
    const s = ageTo(base, 40);
    const obit = markDeath({ ...s, finances: { ...s.finances, cash: 0, debt: 4_000 }, people: Object.fromEntries(Object.entries(s.people).filter(([, x]) => x.kind !== 'spouse' && x.kind !== 'child')) }, 'a car crash').death!.obituary;
    expect(obit).toMatch(/never married\./);
    expect(obit).toMatch(/which surprised no one\./);
  });
});

describe('recheck follow-ups', () => {
  const base = ageTo(createLife({ countryCode: 'US' }, 3), 20);
  const job = (company: string, partTime: boolean) => ({ defId: 'cashier', title: 'Cashier', company, salary: 20_000, level: 0, performance: 50, yearsHeld: 1, yearsAtLevel: 1, category: 'service' as const, partTime, askedThisYear: false });

  it('an obituary does not double the period after a company name ending in one', () => {
    const adultDeath = markDeath({ ...base, career: { ...base.career, job: { ...base.career.job!, ...job('Northwind Inc.', false) } } }, 'a heart attack');
    expect(adultDeath.death!.obituary).toContain('at Northwind Inc.');
    expect(adultDeath.death!.obituary).not.toContain('..');
    const teen = { ...base, character: { ...base.character, age: 16 }, education: { ...base.education, enrolled: true, stage: 'high' as const }, career: { ...base.career, job: { ...base.career.job!, ...job('Harvest Ltd.', true) } } };
    expect(markDeath(teen, 'a car crash').death!.obituary).not.toContain('..');
  });

  it('rehab reports its cost in the toast', () => {
    const s = { ...base, finances: { ...base.finances, cash: 50_000 }, health: { ...base.health, addictions: { alcohol: 50 } } };
    const after = applyAction(s, { type: 'activity', id: 'rehab' });
    expect(after.lastResult?.moneyDelta).toBe(after.finances.cash - s.finances.cash);
    expect(after.lastResult?.moneyDelta).toBeLessThan(0);
  });

  it("a minor's fine with no parent to pay it is not said to be paid by parents", () => {
    let caught: GameState | undefined;
    for (let seed = 1; seed < 400 && !caught; seed++) {
      const kid = { ...base, rng: { s: seed }, character: { ...base.character, age: 15 }, people: Object.fromEntries(Object.entries(base.people).map(([k, p]) => [k, p.kind === 'mother' || p.kind === 'father' ? { ...p, alive: false } : p])) };
      const t = applyAction(kid, { type: 'crime', id: 'shoplift' });
      if (t.lastResult?.text.includes('on my record')) caught = t;
    }
    expect(caught?.lastResult?.text).toMatch(/too young to be fined/);
  });
});

