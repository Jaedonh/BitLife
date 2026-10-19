/**
 * People, round three of the playtest: a silence on someone's page is real silence (GAME_DESIGN §10, Contact),
 * coworkers are of an age for their rung (§10a), an heir's brothers and sisters keep their schooling (§16), who the
 * player stays with leans the partners they meet (§10), and nobody's first name is their surname (§4).
 */
import { JOB_BY_ID, JOBS } from '@/data/jobs';
import { NAMES } from '@/data/names';
import type { FlavorLine } from '@/data/flavor';
import { ageUp } from '../ageUp';
import { applyEffects } from '../events/effects';
import { makeRegistry } from '../events/select';
import { Rng } from '../rng';
import { createLife, emptyMemory, makePerson, namesInLife, randomName, rungAgeBand, titleAgeBand } from '../systems/character';
import { coworkerTitle, hireCoworkers, settleCoworkers } from '../systems/coworkers';
import { addGrandchild } from '../systems/family';
import { yearlyFlavor } from '../systems/flavor';
import { markGoodbyes, noteTogether, seesDaily, yearlyRelationships } from '../systems/relationships';
import { notePartnerYears, partnerGender, sameSexChance } from '../systems/romance';
import type { GameState, Job, Person, RelationshipKind } from '../types';

const noEvents = makeRegistry([]);

/** A US player of `age` with these people only. */
function life(age: number, people: Person[], patch: Partial<GameState> = {}, seed = 21): GameState {
  const s = createLife({ countryCode: 'US', gender: 'female', lastName: 'Walker' }, seed);
  return {
    ...s,
    ...patch,
    year: s.character.birthYear + age,
    character: { ...s.character, age, energy: 4, energyMax: 4, ...(patch.character ?? {}) },
    people: Object.fromEntries(people.map((p) => [p.id, p])),
  };
}

function someone(kind: RelationshipKind, patch: Partial<Person> = {}, seed = 5): Person {
  return { ...makePerson(new Rng(seed), { kind, age: 40, countryCode: 'US', playerAge: 0 }), ...patch };
}

function job(defId: string, level = 0, salary = 30_000): Job {
  const def = JOB_BY_ID[defId]!;
  return { defId, title: def.ladder[level]!.title, company: 'Granite Counseling', salary, level, performance: 60, yearsHeld: 0, yearsAtLevel: 0, category: def.category, partTime: false } as Job;
}

describe('who I see every day (findings 6, 19, 25)', () => {
  const mom = someone('mother', { metAtAge: 0, memory: emptyMemory(0), age: 48 });

  it('a 22-year-old still living at home sees Mom every day, and the yearly pass records the year', () => {
    const s = life(22, [mom]);
    expect(seesDaily(s, mom)).toBe(true);
    expect(noteTogether(s).people[mom.id]!.memory.togetherUntil).toBe(22);
    // A well-paid job means a place of their own: the home is no longer shared, and the year is not recorded.
    const away = { ...s, career: { ...s.career, job: job('sales', 0, 90_000) } };
    expect(seesDaily(away, mom)).toBe(false);
    expect(noteTogether(away).people[mom.id]!.memory.togetherUntil).toBeUndefined();
  });

  it('a grown child who has not moved out, a coworker at my job and a spouse are seen daily; nobody is from a cell', () => {
    const kid = someone('child', { age: 21, metAtAge: 30, growth: { school: 'graduated' } });
    const gone = someone('child', { age: 23, metAtAge: 30, growth: { school: 'graduated', movedOut: true } }, 6);
    const mate = someone('coworker', { workplace: { jobId: 'therapist', company: 'Granite Counseling' } }, 7);
    const wife = someone('spouse', {}, 8);
    const s = life(51, [kid, gone, mate, wife], {});
    const working = { ...s, career: { ...s.career, job: job('therapist') } };
    expect([kid, gone, mate, wife].map((p) => seesDaily(working, p))).toEqual([true, false, true, true]);
    expect(seesDaily(s, mate)).toBe(false);
    const jailed = { ...working, crime: { ...working.crime, inPrison: true } };
    expect([kid, mate, wife].some((p) => seesDaily(jailed, p))).toBe(false);
  });

  it('a coworker who stays a friend after the job ends was seen until the last day', () => {
    const mate = someone('coworker', { relationship: 90, memory: emptyMemory(20), workplace: { jobId: 'therapist', company: 'Granite Counseling' } });
    const s = settleCoworkers(life(26, [mate]));
    expect(s.people[mate.id]).toMatchObject({ kind: 'friend', memory: { togetherUntil: 26, lastInteractionAge: 20 } });
  });

  it('over a real life, Mom is recorded every year the player lives at home and stops when they move out', () => {
    let s = createLife({ countryCode: 'US' }, 2);
    const momId = Object.values(s.people).find((p) => p.kind === 'mother')!.id;
    for (let i = 0; i < 21 && s.alive; i++) s = ageUp({ ...s, pendingEvent: null, eventQueue: [] }, noEvents);
    expect(s.people[momId]!.memory.togetherUntil).toBe(21);
    s = { ...s, career: { ...s.career, job: job('sales', 0, 90_000) } };
    for (let i = 0; i < 3 && s.alive; i++) s = ageUp({ ...s, pendingEvent: null, eventQueue: [] }, noEvents);
    expect(s.people[momId]!.memory.togetherUntil).toBe(21);
  });
});

describe('contact the journal already tells (findings 16, 26, 27)', () => {
  it('the friends and grandparents left behind by a move abroad were said goodbye to that year', () => {
    const friend = someone('friend', { metAtAge: 6, memory: emptyMemory(6), farAway: true });
    const grandma = someone('grandparent', { metAtAge: 0, memory: emptyMemory(0), farAway: true, gender: 'female' }, 6);
    const rival = someone('enemy', { metAtAge: 7, memory: emptyMemory(7), farAway: true }, 7);
    const s = life(11, [friend, grandma, rival], { flags: { immigrant: 'NG' } });
    const moved = { ...s, character: { ...s.character, moveAbroad: { age: 11, countryCode: 'IN' } } };
    const after = markGoodbyes(moved);
    expect([friend, grandma, rival].map((p) => after.people[p.id]!.memory.lastInteractionAge)).toEqual([11, 11, 7]);
    // Only in the year of the move.
    expect(markGoodbyes({ ...moved, character: { ...moved.character, age: 12 } }).people[friend.id]!.memory.lastInteractionAge).toBe(6);
  });

  it('a flavor line about someone counts as time with them', () => {
    const florence = someone('grandchild', { age: 10, metAtAge: 53, memory: emptyMemory(53), gender: 'female' });
    const start = life(63, [florence]);
    const line: FlavorLine = { text: '{{person}} taught me a dance. I did it badly on purpose.', minAge: 50, maxAge: 90, person: { kind: ['grandchild'] } };
    const s = yearlyFlavor(start, { start, lines: 0, event: false }, [line]);
    expect(s.log.at(-1)!.text).toMatch(/taught me a dance/);
    expect(s.people[florence.id]!.memory.lastInteractionAge).toBe(63);
  });

  it('a spouse who files for divorce told me so: no silence counted through the marriage', () => {
    const alfie = someone('spouse', { age: 58, metAtAge: 40, marriedAtAge: 47, love: 0, memory: emptyMemory(40), gender: 'male' });
    let s = life(59, [alfie]);
    let filed: GameState | undefined;
    for (let seed = 1; seed < 40 && !filed; seed++) {
      const out = yearlyRelationships(s, new Rng(seed));
      if (out.people[alfie.id]!.kind === 'ex') filed = out;
    }
    expect(filed).toBeDefined();
    s = filed!;
    expect(s.log.some((l) => /filed for divorce/.test(l.text))).toBe(true);
    expect(s.people[alfie.id]!.memory).toMatchObject({ lastInteractionAge: 59, togetherUntil: 59 });
  });
});

describe('coworkers are of an age for their rung (findings 7, 37)', () => {
  const fullTime = JOBS.filter((d) => !d.partTime);

  it('every rung has a band: degree jobs from 22, medicine from 26, three years a rung, trainees young', () => {
    expect(rungAgeBand(JOB_BY_ID.therapist!, 0)).toEqual([22, 70]);
    expect(rungAgeBand(JOB_BY_ID.therapist!, 1)).toEqual([25, 70]);
    expect(rungAgeBand(JOB_BY_ID.doctor!, 1)).toEqual([29, 70]);
    expect(rungAgeBand(JOB_BY_ID.pharmacist!, 0)).toEqual([22, 34]);
    expect(rungAgeBand(JOB_BY_ID.janitor!, 0)).toEqual([18, 70]);
    expect(titleAgeBand('Partner')).toEqual([31, 70]);
    expect(titleAgeBand('Ringmaster')).toBeNull();
  });

  it('hired coworkers hold a rung up to one above mine and are of an age for it, whatever my age', () => {
    for (const def of fullTime) {
      for (const playerAge of [18, 22, 26, 40, 55, 68]) {
        for (let seed = 1; seed <= 6; seed++) {
          const base = life(playerAge, []);
          const s = { ...base, career: { ...base.career, job: { ...job(def.id), title: def.ladder[0]!.title } } };
          for (const p of Object.values(hireCoworkers(s, new Rng(seed * 7 + playerAge)).people)) {
            const rung = def.ladder.findIndex((r) => r.title === p.occupation);
            const [lo, hi] = rungAgeBand(def, Math.max(0, rung));
            expect(p.age).toBeGreaterThanOrEqual(lo);
            expect(p.age).toBeLessThanOrEqual(hi);
          }
        }
      }
    }
  });

  it('a 55-year-old pharmacy intern works beside young interns; a new graduate beside no 19-year-old therapist', () => {
    const intern = { ...life(55, []), career: { ...life(55, []).career, job: job('pharmacist') } };
    const grad = { ...life(22, []), career: { ...life(22, []).career, job: job('therapist') } };
    for (let seed = 1; seed <= 60; seed++) {
      for (const p of Object.values(hireCoworkers(intern, new Rng(seed)).people)) if (p.occupation === 'Pharmacy Intern') expect(p.age).toBeLessThanOrEqual(34);
      for (const p of Object.values(hireCoworkers(grad, new Rng(seed)).people)) expect(p.age).toBeGreaterThanOrEqual(p.occupation === 'Therapist' ? 25 : 22);
    }
  });

  it('a title drawn for a coworker of a given age fits it, and a coworker an event makes is of an age for the title', () => {
    const s = life(68, []);
    for (let seed = 1; seed <= 40; seed++) {
      expect(coworkerTitle(new Rng(seed), job('pharmacist', 2), s, 70)).not.toBe('Pharmacy Intern');
      expect(coworkerTitle(new Rng(seed), job('pharmacist', 2), s, 23)).toBe('Pharmacy Intern');
    }
    const p = makePerson(new Rng(3), { kind: 'coworker', age: 71, countryCode: 'US', playerAge: 68, occupation: 'Pharmacy Intern' });
    expect(p.age).toBe(34);
    const resident = makePerson(new Rng(3), { kind: 'coworker', age: 19, countryCode: 'US', playerAge: 22, occupation: 'Physician' });
    expect(resident.age).toBe(29);
    // An event's new hire beside a 68-year-old: whatever the title, the age fits it.
    const working = { ...s, career: { ...s.career, job: job('pharmacist', 2) } };
    for (let seed = 1; seed <= 30; seed++) {
      const out = applyEffects(working, new Rng(seed), [{ newPerson: { kind: 'coworker', relationship: 70 } }]);
      const hire = Object.values(out.people).find((x) => x.kind === 'coworker')!;
      const band = titleAgeBand(hire.occupation)!;
      expect(hire.age).toBeGreaterThanOrEqual(band[0]);
      expect(hire.age).toBeLessThanOrEqual(band[1]);
    }
  });
});

describe("an heir's brothers and sisters keep their schooling (finding 15)", () => {
  it('a sibling who finished or left high school is not a student again', () => {
    const prev = createLife({ countryCode: 'AU' }, 132);
    const kid = (name: string, age: number, school: 'graduated' | 'droppedOut' | 'started'): Person => ({
      ...makePerson(new Rng(age), { kind: 'child', age, countryCode: 'AU', playerAge: 47 - age, lastName: 'Scott', occupation: 'Student' }),
      firstName: name,
      growth: { school },
    });
    const kids = [kid('Isaac', 22, 'graduated'), kid('Luke', 21, 'droppedOut'), kid('Phoebe', 19, 'graduated'), kid('Ivy', 15, 'started')];
    const dead: GameState = { ...prev, alive: false, character: { ...prev.character, age: 47 }, people: Object.fromEntries(kids.map((k) => [k.id, k])) };
    const heir = createLife({ heir: { childId: kids[1]!.id, previous: dead } }, 3);
    const sibs = Object.values(heir.people).filter((p) => p.kind === 'sibling');
    expect(Object.fromEntries(sibs.map((p) => [p.firstName, p.growth?.school]))).toEqual({ Isaac: 'graduated', Phoebe: 'graduated', Ivy: 'started' });
  });
});

describe('who I stay with leans who I meet (finding 38)', () => {
  it('with no history one partner in ten is of my own sex; years with one lean the next ones that way', () => {
    const me = (partnerYears?: { same: number; other: number }) => ({ character: { ...life(30, []).character, partnerYears } });
    expect(sameSexChance(me())).toBeCloseTo(0.1);
    expect(sameSexChance(me({ same: 1, other: 0 }))).toBeCloseTo(0.55);
    expect(sameSexChance(me({ same: 14, other: 0 }))).toBeGreaterThan(0.9);
    expect(sameSexChance(me({ same: 0, other: 20 }))).toBeCloseTo(0.03);
    expect(sameSexChance(me({ same: 5, other: 5 }))).toBeGreaterThan(0.4);
    const rng = new Rng(4);
    const women = Array.from({ length: 400 }, () => partnerGender(rng, me({ same: 6, other: 0 }))).filter((g) => g === 'female').length;
    expect(women).toBeGreaterThan(320);
  });

  it('a year counts only with a partner met before it (one I left in the year we met counts for nothing)', () => {
    const eleanor = someone('spouse', { gender: 'female', metAtAge: 36 });
    const tom = someone('lover', { gender: 'male', metAtAge: 40 }, 6);
    let s = notePartnerYears(life(40, [eleanor, tom]));
    expect(s.character.partnerYears).toEqual({ same: 1, other: 0 });
    s = notePartnerYears({ ...s, character: { ...s.character, age: 41 } });
    expect(s.character.partnerYears).toEqual({ same: 2, other: 1 });
    expect(notePartnerYears(life(40, [])).character.partnerYears).toBeUndefined();
  });

  it('a player who stays with women and leaves the men meets mostly women afterwards', () => {
    let same = 0;
    let total = 0;
    for (let seed = 1; seed <= 30; seed++) {
      const her = { ...life(36, [someone('spouse', { gender: 'female', metAtAge: 36, age: 36 })]) };
      let s: GameState = { ...her, character: { ...her.character, partnerYears: { same: 14, other: 0 } }, people: {} };
      for (let i = 0; i < 25; i++) {
        s = yearlyRelationships({ ...s, character: { ...s.character, age: 37 + i } }, new Rng(seed * 100 + i));
        for (const p of Object.values(s.people)) {
          if (p.kind !== 'lover') continue;
          total++;
          if (p.gender === 'female') same++;
          // She leaves every new partner within the year, so nothing new is learned.
          s = { ...s, people: { ...s.people, [p.id]: { ...p, kind: 'ex' } } };
        }
      }
    }
    expect(same / total).toBeGreaterThan(0.8);
  });
});

describe('nobody is named after their own surname (finding 46)', () => {
  it('the name pools still share some names, but no first name is drawn as its own surname', () => {
    const shared = Object.values(NAMES).flatMap((t) => [...t.male, ...t.female].filter((n) => t.surnames.includes(n)));
    expect(shared.length).toBeGreaterThan(0);
    for (let seed = 1; seed <= 3000; seed++) {
      for (const cc of ['GB', 'FR', 'NG']) {
        const n = randomName(new Rng(seed), seed % 2 ? 'male' : 'female', cc);
        expect(n.firstName).not.toBe(n.lastName);
        expect(makePerson(new Rng(seed), { kind: 'friend', age: 30, countryCode: cc, playerAge: 30 }).firstName).not.toBe('');
        const kin = makePerson(new Rng(seed), { kind: 'father', gender: 'male', age: 40, countryCode: cc, playerAge: 0, lastName: cc === 'NG' ? 'Bello' : cc === 'FR' ? 'Laurent' : 'Thomas' });
        expect(kin.firstName).not.toBe(kin.lastName);
      }
    }
  });

  it('no family is born with a member named after its surname (seeds 393 and 2552 had Laurent Laurent and Bello Bello)', () => {
    for (const seed of [393, 2552, ...Array.from({ length: 4000 }, (_, i) => i + 1)]) {
      const s = createLife({}, seed);
      const family = s.character.lastName;
      expect(s.character.firstName).not.toBe(family);
      for (const p of Object.values(s.people)) {
        expect(p.firstName).not.toBe(p.lastName);
        if (!p.foster) expect(p.firstName).not.toBe(family);
      }
    }
  });
});

describe('review of round three', () => {
  it("a teen job's coworkers can be teens: the band starts at the job's own minimum age, not after school", () => {
    expect(rungAgeBand(JOB_BY_ID.pt_cashier!, 0)).toEqual([15, 70]);
    expect(rungAgeBand(JOB_BY_ID.pt_babysitter!, 0)).toEqual([14, 70]);
    const def = JOB_BY_ID.pt_cashier!;
    const base = life(16, []);
    const s = { ...base, career: { ...base.career, job: { ...job('pt_cashier', 0, 5_000), title: def.ladder[0]!.title, partTime: true } } };
    const ages = Array.from({ length: 60 }, (_, seed) => {
      const out = applyEffects(s, new Rng(seed + 1), [{ newPerson: { kind: 'coworker', relationship: 60 } }]);
      return Object.values(out.people).find((x) => x.kind === 'coworker')!.age;
    });
    expect(Math.min(...ages)).toBeGreaterThanOrEqual(15);
    expect(ages.filter((a) => a < 18).length).toBeGreaterThan(20);
  });

  it('a title a rung goes by in some countries or before its era has the band of that rung', () => {
    expect(titleAgeBand('Member of Congress')).toEqual(rungAgeBand(JOB_BY_ID.politician!, 3));
    expect(titleAgeBand('Food Columnist')).toEqual(rungAgeBand(JOB_BY_ID.chef_tv!, 0));
    expect(makePerson(new Rng(2), { kind: 'coworker', age: 20, countryCode: 'US', playerAge: 40, occupation: 'Senator' }).age).toBe(rungAgeBand(JOB_BY_ID.politician!, 4)[0]);
  });

  it('nobody who carries the family surname, or may take it at a wedding, has it as a first name', () => {
    const s = createLife({ countryCode: 'GB', gender: 'female', lastName: 'Thomas' }, 4);
    expect(namesInLife(s).has('Thomas')).toBe(true);
    // A partner met by the yearly roll (who may take the name at the wedding), seeds where one arrives.
    let lovers = 0;
    for (let seed = 1; seed <= 300; seed++) {
      const single = { ...s, character: { ...s.character, age: 30, partnerYears: { same: 0, other: 3 } }, people: {} };
      const lover = Object.values(yearlyRelationships(single, new Rng(seed)).people).find((p) => p.kind === 'lover');
      if (!lover) continue;
      lovers++;
      expect(lover.firstName).not.toBe('Thomas');
    }
    expect(lovers).toBeGreaterThan(50);
    // A grandchild who carries it.
    const son = someone('child', { gender: 'male', age: 30, metAtAge: 25, lastName: 'Thomas', growth: { school: 'graduated', movedOut: true } });
    const grandma = { ...s, character: { ...s.character, age: 55 }, people: { [son.id]: son } };
    for (let seed = 1; seed <= 300; seed++) {
      const baby = Object.values(addGrandchild(grandma, new Rng(seed), son.id).people).find((p) => p.kind === 'grandchild')!;
      expect(`${baby.firstName} ${baby.lastName}`).not.toBe('Thomas Thomas');
    }
  });

  it("a minor heir's inheritance goes into their savings, as the journal says", () => {
    const prev = createLife({ countryCode: 'US', gender: 'male' }, 8);
    const kid = { ...makePerson(new Rng(1), { kind: 'child', age: 9, countryCode: 'US', playerAge: 31, lastName: prev.character.lastName, occupation: 'Student' }), firstName: 'Ivy' };
    const dead: GameState = { ...prev, alive: false, character: { ...prev.character, age: 40 }, death: { cause: 'a heart attack', age: 40, year: prev.year + 40, netWorth: 100_000, ribbonId: 'mediocre', obituary: '', epitaph: '' }, people: { [kid.id]: kid } };
    const heir = createLife({ heir: { childId: kid.id, previous: dead } }, 3);
    expect(heir.log.find((l) => l.text.startsWith('I inherited'))?.text).toBe("I inherited $80,000 from Dad's estate. It went into my savings.");
  });
});
