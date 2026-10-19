/**
 * People, round two of the playtest: the people a life is born into and meets are consistent with each other and
 * with what the journal says about them (GAME_DESIGN §4, §10).
 */
import { applyAction } from '../actions';
import { ageUp } from '../ageUp';
import { applyEffects } from '../events/effects';
import { Rng } from '../rng';
import { createLife, familySurnames, makePerson } from '../systems/character';
import { hireCoworkers } from '../systems/coworkers';
import { availableInteractions, growUp, yearlyRelationships } from '../systems/relationships';
import type { GameState, Job, Person, RelationshipKind } from '../types';

const WELL_PAID = ['Accountant', 'Software Developer', 'Pharmacist', 'Lawyer', 'Dentist', 'Engineer', 'Architect'];

/** A US player of `age` with these people only, energy and cash to spare. */
function life(age: number, people: Person[], seed = 21): GameState {
  const s = createLife({ countryCode: 'US', gender: 'male', lastName: 'Walker' }, seed);
  return {
    ...s,
    year: s.character.birthYear + age,
    character: { ...s.character, age, energy: 4, energyMax: 4 },
    finances: { ...s.finances, cash: 100_000 },
    people: Object.fromEntries(people.map((p) => [p.id, p])),
  };
}

function someone(kind: RelationshipKind, patch: Partial<Person> = {}, seed = 5): Person {
  return { ...makePerson(new Rng(seed), { kind, age: 40, countryCode: 'US', playerAge: 0 }), ...patch };
}

describe('birth: parents fit the family (findings 15, 16)', () => {
  const births = Array.from({ length: 1500 }, (_, i) => createLife([{}, { scenario: 'big_family' as const }, { scenario: 'single_parent' as const }, { scenario: 'wealthy' as const }][i % 4]!, i + 1));

  it('every parent at home was at least 17 when the eldest sibling was born', () => {
    for (const s of births) {
      const people = Object.values(s.people);
      const sibs = people.filter((p) => p.kind === 'sibling');
      if (!sibs.length) continue;
      const eldest = Math.max(...sibs.map((p) => p.age));
      const parents = people.filter((p) => p.kind === 'mother' || p.kind === 'father');
      for (const parent of parents) expect(parent.age - eldest).toBeGreaterThanOrEqual(17);
      // Room for every older child: teenage parents do not have three, born in the same year as each other.
      expect(sibs.length).toBeLessThanOrEqual(Math.max(1, Math.min(...parents.map((p) => p.age)) - 17));
    }
  });

  it('parents of 18 have at most one older child (seeds that gave them two or three)', () => {
    for (const [seed, scenario] of [[452, 'farm_kid'], [740, 'prodigy'], [289, 'single_parent'], [209, 'immigrant']] as const) {
      const people = Object.values(createLife({ scenario }, seed).people);
      const youngest = Math.min(...people.filter((p) => p.kind === 'mother' || p.kind === 'father').map((p) => p.age));
      expect(people.filter((p) => p.kind === 'sibling').length).toBeLessThanOrEqual(Math.max(1, youngest - 17));
    }
  });

  it('a family where money is always tight has no lawyer or dentist at home, and a wealthy one has established professionals', () => {
    let poor = 0;
    let wealthy = 0;
    for (const s of births) {
      const parents = Object.values(s.people).filter((p) => p.kind === 'mother' || p.kind === 'father');
      if (s.flags.poorFamily) {
        poor++;
        for (const p of parents) expect(WELL_PAID).not.toContain(p.occupation);
      }
      if (s.flags.wealthyFamily) {
        wealthy++;
        for (const p of parents) {
          expect(p.age).toBeGreaterThanOrEqual(23);
          expect(['Student', 'Unemployed']).not.toContain(p.occupation);
        }
      }
    }
    expect(poor).toBeGreaterThan(200);
    expect(wealthy).toBeGreaterThan(300);
  });

  it('the prodigy seed from the report no longer pairs a lawyer with "Money is always tight"', () => {
    const s = createLife({ scenario: 'prodigy', gender: 'male', countryCode: 'IN' }, 3853233080);
    const text = s.log.map((l) => l.text).join('\n');
    if (text.includes('Money is always tight')) for (const job of WELL_PAID) expect(text).not.toContain(`a ${job.toLowerCase()}`);
  });
});

describe('the Lucky trait is listed once (finding 34)', () => {
  it('a wealthy birth that also rolled Lucky has it once', () => {
    for (const seed of [7, 20, 37]) {
      const traits = createLife({ countryCode: 'US', scenario: 'wealthy' }, seed).character.traits;
      expect(traits).toContain('lucky');
      expect(new Set(traits).size).toBe(traits.length);
    }
  });
});

describe('newcomers do not share the family surname (finding 12)', () => {
  it('makePerson leaves the avoided surnames out of a single draw', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const p = makePerson(new Rng(seed), { kind: 'friend', age: 30, countryCode: 'US', playerAge: 30, avoidSurnames: new Set(['Smith', 'Johnson', 'Walker']) });
      expect(['Smith', 'Johnson', 'Walker']).not.toContain(p.lastName);
    }
  });

  it('friends and partners met by chance, coworkers and people a card brings in get a surname of their own', () => {
    const mom = someone('mother', { lastName: 'Walker', gender: 'female' });
    const grandma = someone('grandparent', { lastName: 'Ortiz', gender: 'female', age: 70 }, 6);
    const job: Job = { defId: 'accountant', title: 'Accountant', company: 'Granite & Sons', salary: 68_000, level: 1, performance: 70, yearsHeld: 1, yearsAtLevel: 1, category: 'finance', partTime: false, askedThisYear: false, workedHarderThisYear: false };
    const base = life(25, [mom, grandma]);
    expect(familySurnames(base)).toEqual(new Set(['Walker', 'Ortiz']));
    let made = 0;
    for (let seed = 1; seed <= 150; seed++) {
      const s = { ...base, career: { ...base.career, job } };
      const after = [
        yearlyRelationships(s, new Rng(seed)),
        hireCoworkers(s, new Rng(seed)),
        applyEffects(s, new Rng(seed), [{ newPerson: { kind: 'friend', minAge: 20, maxAge: 30 } }, { newPerson: { kind: 'lover' } }, { newPerson: { kind: 'enemy' } }]),
      ];
      for (const a of after) {
        for (const p of Object.values(a.people)) {
          if (base.people[p.id]) continue;
          made++;
          expect(['Walker', 'Ortiz']).not.toContain(p.lastName);
        }
      }
    }
    expect(made).toBeGreaterThan(300);
  });
});

describe('a card that names a job makes someone old enough for it (finding 9)', () => {
  it('"the mechanic" a card brings an adult player is a grown-up mechanic, a degree job a graduate', () => {
    const s = life(18, []);
    for (let seed = 1; seed <= 60; seed++) {
      const a = applyEffects(s, new Rng(seed), [{ newPerson: { kind: 'friend', relationship: 50, occupation: 'Mechanic' } }]);
      const f = Object.values(a.people).find((p) => p.kind === 'friend')!;
      expect(f.age).toBeGreaterThanOrEqual(18);
      expect(f.occupation).toBe('Mechanic');
      const b = applyEffects(s, new Rng(seed), [{ newPerson: { kind: 'friend', occupation: 'Dentist' } }]);
      const d = Object.values(b.people).find((p) => p.kind === 'friend')!;
      expect(d.age).toBeGreaterThanOrEqual(23);
      expect(d.occupation).toBe('Dentist');
    }
  });
});

describe('a name a choice frees is not reused in the same choice (finding 30)', () => {
  it('a friend who drifts off is never replaced by a namesake in the same choice', () => {
    let replaced = 0;
    for (let seed = 1; seed <= 400; seed++) {
      const friend = someone('friend', { firstName: 'Olivia', gender: 'female', age: 14 }, seed);
      const s = life(14, [friend], seed);
      const after = applyEffects(s, new Rng(seed), [{ removePerson: true }, { newPerson: { kind: 'friend', gender: 'female' } }], { personId: friend.id, person: friend });
      const fresh = Object.values(after.people).filter((p) => p.id !== friend.id);
      expect(after.people[friend.id]).toBeUndefined();
      if (fresh.length) replaced++;
      for (const p of fresh) expect(p.firstName).not.toBe('Olivia');
    }
    expect(replaced).toBe(400);
  });
});

describe('a name this year\'s journal mentions waits for the next birthday (finding 14)', () => {
  it('the old job\'s Lucy, left behind this year, is not hired again, nor met on a card, before the next birthday', () => {
    const job: Job = { defId: 'accountant', title: 'Accountant', company: 'Granite & Sons', salary: 68_000, level: 1, performance: 70, yearsHeld: 0, yearsAtLevel: 0, category: 'finance', partTime: false, askedThisYear: false, workedHarderThisYear: false };
    const lucys = (lineAge: number) => {
      let n = 0;
      for (let seed = 1; seed <= 300; seed++) {
        const base = life(34, []);
        const s: GameState = { ...base, career: { ...base.career, job }, log: [...base.log, { age: lineAge, year: base.year, text: 'I caught up with Lucy. We talked for hours.', kind: 'info' }] };
        const after = [hireCoworkers(s, new Rng(seed)), applyEffects(s, new Rng(seed), [{ newPerson: { kind: 'friend', gender: 'female', minAge: 30, maxAge: 40 } }])];
        for (const a of after) n += Object.values(a.people).filter((p) => p.firstName === 'Lucy').length;
      }
      return n;
    };
    // Mentioned last year: the name is free again. Mentioned this year: it waits.
    expect(lucys(33)).toBeGreaterThan(0);
    expect(lucys(34)).toBe(0);
  });
});

describe('people who joined as students grow up (finding 22)', () => {
  it('from 23 a partner, sibling or friend still marked Student gets a job and money; my children are left to their milestones', () => {
    const wife = someone('spouse', { age: 23, occupation: 'Student', money: 0, metAtAge: 17, gender: 'female' }, 1);
    const sister = someone('sibling', { age: 30, occupation: 'Student', money: 0 }, 2);
    const young = someone('lover', { age: 20, occupation: 'Student', money: 0 }, 3);
    const son = someone('child', { age: 25, occupation: 'Student', money: 0 }, 4);
    const s = growUp(life(24, [wife, sister, young, son]), new Rng(9));
    for (const id of [wife.id, sister.id]) {
      expect(s.people[id]!.occupation).not.toBe('Student');
      expect(s.people[id]!.money).toBeGreaterThan(0);
    }
    expect(s.people[young.id]!.occupation).toBe('Student');
    expect(s.people[son.id]!.occupation).toBe('Student');
    // Grown up once: nothing changes the next year.
    expect(growUp(s, new Rng(10)).people).toEqual(s.people);
  });
});

describe('babies and toddlers are not talked to like grown-ups (finding 26)', () => {
  const TALK = ['conversation', 'compliment', 'insult', 'askMoney'];

  it('a baby or toddler is not offered a conversation, a compliment, an insult or a request for money', () => {
    for (const kind of ['child', 'sibling', 'grandchild', 'friend'] as const) {
      for (const age of [0, 1, 2, 4]) {
        const p = someone(kind, { age });
        const offered = availableInteractions(life(kind === 'sibling' || kind === 'friend' ? 8 : 30, [p]), p).map((i) => i.id);
        for (const id of TALK) expect(offered).not.toContain(id);
      }
    }
    const five = someone('child', { age: 5 });
    expect(availableInteractions(life(35, [five]), five).map((i) => i.id)).toEqual(expect.arrayContaining(['conversation', 'compliment', 'insult']));
  });

  it('the engine refuses them too, and nobody under 16 is asked for money', () => {
    const baby = someone('child', { age: 0, firstName: 'Grace' });
    const s = life(30, [baby]);
    for (const id of ['conversation', 'compliment', 'insult']) {
      const after = applyAction(s, { type: 'interact', personId: baby.id, interaction: id });
      expect(after.log).toHaveLength(s.log.length);
      expect(after.lastResult?.text).toBe('Grace is still a baby.');
    }
    const friend = someone('friend', { age: 12 });
    expect(availableInteractions(life(12, [friend]), friend).map((i) => i.id)).not.toContain('askMoney');
  });

  it('time with a baby or toddler, and a gift for one, read like it (no long talks, no "you shouldn\'t have")', () => {
    const seen = new Set<string>();
    for (let seed = 1; seed <= 40; seed++) {
      for (const age of [0, 3]) {
        const kid = someone('child', { age, firstName: 'Grace', gender: 'female' });
        const s = { ...life(30, [kid]), rng: { s: seed * 7919 } };
        for (const id of ['spendTime', 'gift']) {
          const line = applyAction(s, { type: 'interact', personId: kid.id, interaction: id }).log.at(-1)!.text;
          seen.add(line);
          expect(line).not.toMatch(/talk|hung out|lost track|quality time|shouldn't have|called|wrote/i);
        }
      }
    }
    expect(seen.size).toBeGreaterThanOrEqual(6);
  });

  it('money given to a young child goes into savings', () => {
    const baby = someone('child', { age: 1, firstName: 'Grace' });
    const s = life(30, [baby]);
    const after = applyAction(s, { type: 'interact', personId: baby.id, interaction: 'giveMoney' });
    expect(after.log.at(-1)?.text).toBe('I put some money into a savings account for Grace.');
  });
});

describe('the Windfall fits the family (finding 33)', () => {
  const windfall = (s: GameState) => applyAction(s, { type: 'rewarded', placement: 'cashBoost' }).log.at(-1)!.text;

  it('an orphan with no relatives finds the money; a grandparent slips it or sends it', () => {
    const foster = someone('stepfather', { foster: true, gender: 'male' });
    expect(windfall(life(5, [foster]))).not.toMatch(/relative|Grandma|Grandpa/);
    const grandma = someone('grandparent', { firstName: 'Rosa', gender: 'female', age: 70 });
    expect(windfall(life(5, [grandma]))).toMatch(/^A windfall! Grandma Rosa slipped me \$[\d,]+ for my piggy bank\.$/);
    expect(windfall(life(5, [{ ...grandma, farAway: true }]))).toMatch(/^A windfall! Grandma Rosa sent me /);
    const mom = someone('mother', { gender: 'female' });
    expect(windfall(life(5, [mom]))).toMatch(/A relative slipped me/);
  });

  it('the orphan from the report no longer hears from a relative', () => {
    let s = createLife({ countryCode: 'US', scenario: 'orphan' }, 777);
    while (s.character.age < 5) s = ageUp({ ...s, pendingEvent: null, eventQueue: [] });
    expect(windfall({ ...s, pendingEvent: null })).not.toContain('relative');
  });
});
