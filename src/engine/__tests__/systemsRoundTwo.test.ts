/**
 * Fixes from the second playtest (systems): era gates on the engine's own menus, habits, hustle levels, the
 * obituary's career, an heir's uncle, Pet Person, bankruptcy, a minor's inheritance, rent as income, incurable
 * illnesses and each country's national offices.
 */
import { ASSET_BY_ID } from '@/data/assets';
import { CRIME_BY_ID } from '@/data/crimes';
import { HUSTLE_BY_ID, HUSTLES } from '@/data/hustles';
import { jobDefForTitle, JOB_BY_ID, rungTitle } from '@/data/jobs';
import { applyAction } from '../actions';
import { Rng } from '../rng';
import { newAchievements, achievementContext } from '../systems/achievements';
import { ageNpcs, onNpcDeath, takeInOrphan } from '../systems/aging';
import { assetsForSale, canBuy } from '../systems/assets';
import { askForPromotion, hustleOptions, rollListings, startHustle, yearlyCareer } from '../systems/careers';
import { createLife, makePerson } from '../systems/character';
import { crimeAvailability, crimesInEra } from '../systems/crime';
import { buildObituary, careerSpans, markDeath } from '../systems/death';
import { BANKRUPTCY_DEBT, bankruptcyLine, BANKRUPTCY_LINES, invest, investmentKinds, yearlyFinance } from '../systems/finance';
import { HABIT_LEVEL, habitFlag, visitDoctor, yearlyHealth } from '../systems/health';
import { scaleMoney } from '../events/text';
import type { Asset, GameState, Hustle, Job, Person } from '../types';
import { inEra, lowerTitle, netWorth, roleWithArticle } from '../util';

/** A life of `countryCode` at `age` in `year` (the birth year moves with it). */
function at(age: number, year: number, countryCode = 'US', seed = 3): GameState {
  const s = createLife({ countryCode }, seed);
  return { ...s, year, character: { ...s.character, age, birthYear: year - age } };
}

const job = (patch: Partial<Job>): Job => ({
  defId: 'accountant', title: 'Junior Accountant', company: 'Granite & Sons', salary: 50_000, level: 0, performance: 60, yearsHeld: 3, yearsAtLevel: 3,
  category: 'office', partTime: false, askedThisYear: false, workedHarderThisYear: false, ...patch,
});

describe('era gates on the engine menus', () => {
  it('inEra reads a first and a last year', () => {
    expect(inEra(1990, {})).toBe(true);
    expect(inEra(2006, { minYear: 2007 })).toBe(false);
    expect(inEra(2007, { minYear: 2007 })).toBe(true);
    expect(inEra(1999, { maxYear: 1998 })).toBe(false);
  });

  it('side hustles: no streaming, app studio, online shop or rideshare in 1990, and six ideas in every year', () => {
    const teen1990 = at(16, 1990);
    const ids = hustleOptions(teen1990).map((h) => h.def.id);
    expect(ids).toEqual(expect.arrayContaining(['wedding_video', 'pc_repair', 'craft_stall', 'pizza_delivery', 'tutoring', 'flipping']));
    for (const modern of ['streamer', 'app_dev', 'etsy', 'rideshare']) expect(ids).not.toContain(modern);
    for (let year = 1985; year <= 2030; year++) expect(hustleOptions(at(30, year)).length).toBe(6);
    const now = hustleOptions(at(30, 2020)).map((h) => h.def.id);
    expect(now).toEqual(expect.arrayContaining(['streamer', 'app_dev', 'etsy', 'rideshare']));
    expect(now).not.toContain('craft_stall');
    // Starting one out of its era is refused, and a 13-year-old has something to start in any year.
    const refused = startHustle(teen1990, 'streamer');
    expect(refused.career.hustle).toBeNull();
    expect(refused.lastResult?.text).toBe("That isn't a thing yet.");
    for (const year of [1988, 2000, 2020]) expect(hustleOptions(at(13, year)).some((h) => h.eligible)).toBe(true);
  });

  it('a hustle that cannot go viral has its own breakout line, and nothing goes viral before 2005', () => {
    for (const def of HUSTLES) if (def.maxYear !== undefined && def.viralChance > 0) expect(def.breakout).toBeTruthy();
    let s = at(30, 1995);
    s = { ...s, career: { ...s.career, job: null, hustle: { defId: 'tutoring', name: 'Tutoring', level: 4, peak: 4, followers: 0, yearsActive: 3, lastIncome: 0 } } };
    const lines = new Set<string>();
    for (let r = 0; r < 400; r++) {
      for (const id of ['flipping', 'etsy']) {
        const t = yearlyCareer({ ...s, career: { ...s.career, hustle: { ...s.career.hustle!, defId: id } } }, new Rng(r));
        for (const l of t.log.slice(s.log.length)) lines.add(l.text);
      }
    }
    expect([...lines].some((t) => /went viral/.test(t))).toBe(false);
    expect(lines).toContain(HUSTLE_BY_ID.flipping!.breakout);
    expect(lines).toContain('My craft shop took off this year!');
  });

  it('the shop: no electric car before 2012, a home computer before the gaming PC', () => {
    const rich = (year: number) => {
      const s = at(30, year);
      return { ...s, finances: { ...s.finances, cash: 1_000_000 } };
    };
    expect(canBuy(rich(1996), 'ev', 'cash')).toMatchObject({ ok: false, reason: 'Not on sale yet' });
    expect(canBuy(rich(2015), 'ev', 'cash').ok).toBe(true);
    expect(assetsForSale(rich(1990)).map((d) => d.id)).toEqual(expect.arrayContaining(['home_computer']));
    expect(assetsForSale(rich(1990)).map((d) => d.id)).not.toContain('gaming_pc');
    expect(assetsForSale(rich(2000)).map((d) => d.id)).not.toContain('home_computer');
    expect(canBuy(rich(2000), 'home_computer', 'cash')).toMatchObject({ ok: false, reason: 'No longer sold' });
    // Everything else is always on sale.
    expect(assetsForSale(rich(1990)).length).toBe(assetsForSale(rich(2020)).length - 1);
    expect(ASSET_BY_ID.ev!.minYear).toBe(2012);
  });

  it('investing: crypto waits for 2011, but crypto already held can still be withdrawn', () => {
    let s = at(25, 1995);
    s = { ...s, finances: { ...s.finances, cash: 50_000 } };
    expect(investmentKinds(s)).toEqual(['savings', 'index']);
    const refused = invest(s, 'crypto', 5_000);
    expect(refused.finances.investments).toEqual([]);
    expect(refused.lastResult?.text).toBe('Nobody I know has heard of crypto yet.');
    expect(investmentKinds({ ...s, finances: { ...s.finances, investments: [{ kind: 'crypto', amount: 10, costBasis: 10 }] } })).toContain('crypto');
    const later = { ...s, year: 2015 };
    expect(invest(later, 'crypto', 5_000).finances.investments).toEqual([{ kind: 'crypto', amount: 5_000, costBasis: 5_000 }]);
  });

  it('crime: no laptop scams before 2000, bad checks instead; and no bad checks after', () => {
    const born = at(25, 1993);
    const s = { ...born, character: { ...born.character, energy: 4 } };
    expect(crimeAvailability(s, CRIME_BY_ID.fraud!)).toEqual({ available: false, reason: 'Not possible yet' });
    expect(crimeAvailability(s, CRIME_BY_ID.check_fraud!).available).toBe(true);
    expect(crimesInEra(s).map((c) => c.id)).not.toContain('fraud');
    const later = at(25, 2010);
    expect(crimesInEra(later).map((c) => c.id)).toContain('fraud');
    expect(crimeAvailability(later, CRIME_BY_ID.check_fraud!)).toEqual({ available: false, reason: 'Not possible anymore' });
    expect(crimesInEra(s).length).toBe(crimesInEra(later).length);
  });

  it('job listings: no data scientists before 2008, and the food blogger wrote a column before blogs', () => {
    const titles = (year: number) => {
      const out = new Set<string>();
      const s = at(30, year);
      for (let r = 0; r < 80; r++) for (const l of rollListings(s, new Rng(r)).career.listings) out.add(`${l.defId}:${l.title}`);
      return out;
    };
    const old = titles(1995);
    expect([...old].some((t) => t.startsWith('data_scientist:'))).toBe(false);
    expect(old).toContain('chef_tv:Food Columnist');
    expect([...old].some((t) => /Blogger/.test(t))).toBe(false);
    const now = titles(2015);
    expect(now).toContain('chef_tv:Food Blogger');
    expect([...now].some((t) => t.startsWith('data_scientist:'))).toBe(true);
    expect(JOB_BY_ID.web_designer!.minYear).toBe(1995);
  });
});

describe('national offices', () => {
  const mayor = (cc: string): GameState => {
    const s = at(45, 2010, cc);
    return { ...s, career: { ...s.career, job: job({ defId: 'politician', title: 'Mayor', company: 'City Hall', level: 2, performance: 95, yearsAtLevel: 5, category: 'public' }) } };
  };
  /** Promotes until two more rungs are reached, and returns the titles with their journal lines. */
  function climb(s: GameState): string[] {
    const out: string[] = [];
    for (let r = 0; r < 200 && out.length < 2; r++) {
      const next = askForPromotion(s, new Rng(r));
      if (next.career.job!.level > s.career.job!.level) {
        out.push(`${next.career.job!.title}|${next.log.at(-1)!.text}`);
        s = { ...next, career: { ...next.career, job: { ...next.career.job!, askedThisYear: false, performance: 95, yearsAtLevel: 5 } } };
      }
    }
    return out;
  }

  it('the United States, Mexico, Brazil and Nigeria have no Parliament', () => {
    expect(climb(mayor('US'))).toEqual(['Member of Congress|I won a seat in Congress.', 'Senator|I won a seat in the Senate.']);
    expect(climb(mayor('MX'))).toEqual(['Federal Deputy|I won a seat in the Chamber of Deputies.', 'Senator|I won a seat in the Senate.']);
    expect(climb(mayor('BR'))[0]).toBe('Federal Deputy|I won a seat in the Chamber of Deputies.');
    expect(climb(mayor('NG'))).toEqual(['Representative|I won a seat in the House of Representatives.', 'Senator|I won a seat in the Senate.']);
    expect(climb(mayor('JP'))[0]).toBe('Member of the Diet|I won a seat in the Diet.');
    expect(climb(mayor('GB'))).toEqual(['Member of Parliament|I won a seat in Parliament.', 'Minister|I was appointed a government minister.']);
  });

  it('titles read right mid-sentence and lead back to their job', () => {
    expect(roleWithArticle('Member of Congress')).toBe('a member of Congress');
    expect(roleWithArticle('Member of the Diet')).toBe('a member of the Diet');
    expect(lowerTitle('Member of Parliament')).toBe('member of Parliament');
    expect(roleWithArticle('Senator')).toBe('a senator');
    expect(jobDefForTitle('Senator')?.id).toBe('politician');
    expect(jobDefForTitle('Food Columnist')?.id).toBe('chef_tv');
    expect(rungTitle(JOB_BY_ID.politician!, 4, { countryCode: 'FR', year: 2000 })).toBe('Minister');
  });
});

describe('a habit, not a drink', () => {
  const adult = (alcohol: number) => {
    const s = at(40, 2000);
    return { ...s, health: { ...s.health, illnesses: [], addictions: { alcohol } } };
  };
  const fade = (s: GameState, years: number) => {
    for (let y = 0; y < years; y++) s = yearlyHealth(s, new Rng(100 + y));
    return s;
  };

  it('a party drink fades without a word', () => {
    for (let r = 0; r < 30; r++) {
      const s = fade({ ...adult(3), rng: new Rng(r).snapshot() }, 6);
      expect(s.health.addictions.alcohol ?? 0).toBe(0);
      expect(s.log.some((l) => /finally shook/.test(l.text))).toBe(false);
    }
  });

  it('a habit that took hold, then was cut down, is news when it finally fades', () => {
    let s = yearlyHealth(adult(HABIT_LEVEL + 5), new Rng(1));
    expect(s.flags[habitFlag('alcohol')]).toBe(true);
    s = { ...s, health: { ...s.health, addictions: { alcohol: 5 } } };
    s = fade(s, 8);
    expect(s.log.filter((l) => l.text === 'I finally shook my drinking habit.')).toHaveLength(1);
    expect(s.flags[habitFlag('alcohol')]).toBeUndefined();
    // A later party drink is a party drink again.
    s = fade({ ...s, health: { ...s.health, addictions: { alcohol: 3 } } }, 6);
    expect(s.log.filter((l) => /finally shook/.test(l.text))).toHaveLength(1);
  });

  it('a habit that ended some other way (rehab) is forgotten', () => {
    let s = yearlyHealth(adult(50), new Rng(1));
    s = { ...s, health: { ...s.health, addictions: {} } };
    s = yearlyHealth(s, new Rng(2));
    expect(s.flags[habitFlag('alcohol')]).toBeUndefined();
  });
});

describe('side hustle levels', () => {
  const running = (h: Partial<Hustle>): GameState => {
    const s = at(30, 2005);
    return { ...s, career: { ...s.career, job: null, hustle: { defId: 'tutoring', name: 'Private tutoring', level: 3, followers: 0, yearsActive: 4, lastIncome: 0, ...h } } };
  };
  /** The first roll whose year moves the level by `delta`. */
  function year(s: GameState, delta: number): GameState {
    for (let r = 0; r < 2000; r++) {
      const t = yearlyCareer(s, new Rng(r));
      if (t.career.hustle!.level - s.career.hustle!.level === delta) return t;
    }
    throw new Error('no such year');
  }

  it('a slip is written, a level won back is a recovery, and only a new peak "reached" it', () => {
    let s = running({ level: 3, peak: 3 });
    s = year(s, -1);
    expect(s.log.at(-1)!.text).toBe('My tutoring business had a slow year and slipped back to level 2.');
    expect(s.career.hustle!.peak).toBe(3);
    s = year(s, 1);
    expect(s.log.at(-1)!.text).toBe('My tutoring business bounced back to level 3.');
    s = year(s, 1);
    expect(s.log.at(-1)!.text).toBe('My tutoring business is growing. It reached level 4.');
    expect(s.career.hustle!.peak).toBe(4);
  });

  it('a save from before peaks counts its level as the highest', () => {
    const s = year(running({ level: 2 }), 1);
    expect(s.log.at(-1)!.text).toBe('My tutoring business is growing. It reached level 3.');
  });
});

describe('the obituary tells the career that mattered', () => {
  const life = (patch: Partial<GameState['career']>, age = 61): GameState => {
    const s = at(age, 2030, 'NG', 5);
    return { ...s, character: { ...s.character, gender: 'female' }, career: { ...s.career, job: null, ...patch } };
  };
  const career = (text: string) => text.split('. ')[1];

  it('groups a career across employers and rungs', () => {
    const spans = careerSpans([
      { title: 'Junior Stylist', company: 'Gold Salon', fromAge: 46, toAge: 50, salary: 3000, reason: 'left' },
      { title: 'EMT', company: 'Lagos EMS', fromAge: 32, toAge: 41, salary: 7000, reason: 'quit' },
      { title: 'Stylist', company: 'Pearl Salon', fromAge: 50, toAge: 60, salary: 5000, reason: 'retired' },
    ]);
    expect(spans.map((x) => [x.key, x.title, x.years, x.retired])).toEqual([['paramedic', 'EMT', 9, false], ['hairdresser', 'Stylist', 14, true]]);
  });

  it('a retiree is remembered for the job retired from, not the best paid', () => {
    const s = life({
      retired: true,
      history: [
        { title: 'Help Desk Technician', company: 'Clearwater Ltd.', fromAge: 18, toAge: 25, salary: 9000, reason: 'quit' },
        { title: 'Junior Stylist', company: 'Gold Salon', fromAge: 46, toAge: 50, salary: 3000, reason: 'left' },
        { title: 'Stylist', company: 'Pearl Salon', fromAge: 50, toAge: 60, salary: 5000, reason: 'retired' },
      ],
    });
    expect(career(buildObituary(s, 'a stroke', 5000, 'Mediocre'))).toBe('She retired as a stylist after 14 years');
  });

  it('a long career before a short last job retired from is the story', () => {
    const s = life({
      retired: true,
      history: [
        { title: 'Tutor', company: 'Ace Tutoring', fromAge: 18, toAge: 60, salary: 20000, reason: 'retired' },
        { title: 'Bank Teller', company: 'Granite Bank', fromAge: 65, toAge: 66, salary: 30000, reason: 'retired' },
      ],
    }, 70);
    expect(career(buildObituary(s, 'a stroke', 5000, 'Mediocre'))).toBe('She retired as a tutor after 42 years');
    const shortLast = life({ retired: true, history: [{ title: 'Teacher', company: 'Oak High School', fromAge: 25, toAge: 55, salary: 40000, reason: 'quit' }, { title: 'Cashier', company: 'Oak Market', fromAge: 58, toAge: 62, salary: 20000, reason: 'retired' }] }, 70);
    expect(career(buildObituary(shortLast, 'a stroke', 5000, 'Mediocre'))).toBe('She spent 30 years as a teacher before retiring');
  });

  it('"best known for" is the career of most years', () => {
    const s = life({ history: [{ title: 'Barista', company: 'Zen Coffee', fromAge: 18, toAge: 30, salary: 12000, reason: 'quit' }, { title: 'Laborer', company: 'Granite Ltd.', fromAge: 30, toAge: 35, salary: 30000, reason: 'quit' }] });
    expect(career(buildObituary(s, 'a stroke', 5000, 'Mediocre'))).toBe('She was best known for her years as a barista');
  });

  it('a long career is named beside the job held at death', () => {
    const s = life({
      job: job({ defId: 'it_support', title: 'Help Desk Technician', company: 'Clearwater Ltd.', yearsHeld: 8, category: 'tech' }),
      history: [{ title: 'Staff Engineer', company: 'Quantum Inc.', fromAge: 22, toAge: 46, salary: 190000, reason: 'quit' }],
    }, 58);
    const withDegree = { ...s, education: { ...s.education, degrees: ['high_school', 'bachelor:computer_science'] } };
    expect(buildObituary(withDegree, 'a stroke', 5000, 'Mediocre')).toContain('She spent 24 years as a staff engineer and later worked as a help desk technician at Clearwater Ltd., and held a degree in computer science.');
    // A job held as long as the earlier one needs no history lesson.
    const settled = { ...s, career: { ...s.career, job: { ...s.career.job!, yearsHeld: 20 } } };
    expect(career(buildObituary(settled, 'a stroke', 5000, 'Mediocre'))).toBe('She worked as a help desk technician at Clearwater Ltd');
  });
});

describe("an heir's aunt or uncle", () => {
  /** Oliver Collins dies; his husband Daniel took his surname at the wedding and died before him; their son is 12. */
  function widowed(birthLastName?: string): { prev: GameState; son: Person } {
    let prev = createLife({ countryCode: 'US', firstName: 'Oliver', lastName: 'Collins', gender: 'male' }, 52);
    const rng = new Rng(4);
    const daniel: Person = { ...makePerson(rng, { kind: 'spouse', gender: 'male', age: 50, countryCode: 'US', lastName: 'Collins', playerAge: 25 }), firstName: 'Daniel', alive: false, deathAge: 49, ...(birthLastName ? { birthLastName } : {}) };
    const son: Person = { ...makePerson(rng, { kind: 'child', gender: 'male', age: 12, countryCode: 'US', lastName: 'Collins', playerAge: 40 }), firstName: 'Eli', otherParentId: daniel.id };
    const people = Object.fromEntries(Object.entries(prev.people).filter(([, p]) => p.kind !== 'sibling'));
    prev = { ...prev, character: { ...prev.character, age: 52 }, year: prev.character.birthYear + 52, people: { ...people, [daniel.id]: daniel, [son.id]: son } };
    return { prev: markDeath(prev, 'a stroke'), son };
  }

  it("Papa's brother does not carry the late player's surname", () => {
    const { prev, son } = widowed();
    let papaSide = 0;
    for (let seed = 1; seed <= 40; seed++) {
      const s = createLife({ heir: { childId: son.id, previous: prev } }, seed);
      const carer = Object.values(s.people).find((p) => p.relative)!;
      expect(carer).toBeDefined();
      const side = s.people[carer.viaId!]!;
      if (side.firstName !== 'Daniel') continue;
      papaSide++;
      expect(carer.lastName).not.toBe('Collins');
    }
    expect(papaSide).toBeGreaterThan(0);
  });

  it('carries the birth surname when it is known', () => {
    const { prev, son } = widowed();
    const heir = createLife({ heir: { childId: son.id, previous: prev } }, 1);
    // The heir before anyone took them in, with Papa's birth surname on record.
    const people = Object.fromEntries(Object.entries(heir.people).filter(([, p]) => !p.relative).map(([id, p]) => [id, p.firstName === 'Daniel' ? { ...p, birthLastName: 'Kelly' } : p]));
    let papaSide = 0;
    for (let seed = 1; seed <= 40; seed++) {
      const s = takeInOrphan({ ...heir, people }, [], new Rng(seed));
      const carer = Object.values(s.people).find((p) => p.relative)!;
      if (s.people[carer.viaId!]!.firstName !== 'Daniel') continue;
      papaSide++;
      expect(carer.lastName).toBe('Kelly');
    }
    expect(papaSide).toBeGreaterThan(0);
  });
});

describe('Pet Person', () => {
  it('the family dog that was there at birth is not my first pet', () => {
    const s = at(0, 2000);
    const dog: Person = { ...makePerson(new Rng(1), { kind: 'pet', age: 4, countryCode: 'US', playerAge: 0, species: 'dog' }), species: 'dog' };
    const withDog = { ...s, people: { ...s.people, [dog.id]: dog } };
    expect(newAchievements(withDog, achievementContext([], withDog), {}).map((a) => a.id)).not.toContain('first_pet');
    const later = { ...withDog, character: { ...withDog.character, age: 9 }, people: { ...withDog.people, [dog.id]: { ...dog, metAtAge: 9 } } };
    expect(newAchievements(later, achievementContext([], later), {}).map((a) => a.id)).toContain('first_pet');
  });
});

describe('debt, bankruptcy and what I own', () => {
  const broke = (patch: Partial<GameState['finances']> = {}, assets: Asset[] = []): GameState => {
    const s = at(45, 2010);
    return { ...s, assets, career: { ...s.career, job: null, retired: false }, finances: { ...s.finances, cash: 0, bankrupt: false, investments: [], ...patch } };
  };
  const house = (patch: Partial<Asset>): Asset => ({ id: 'h1', defId: 'townhouse', kind: 'house', name: 'Townhouse', value: 900_000, purchasePrice: 380_000, condition: 90, yearlyUpkeep: 7_600, mortgage: null, boughtAtAge: 30, primary: true, ...patch });

  it('investments that cover the debt are cashed in, and there is no bankruptcy', () => {
    const s = broke({ debt: 1_000_000, investments: [{ kind: 'index', amount: 1_600_000, costBasis: 1_000_000 }] });
    expect(netWorth(s)).toBe(600_000);
    const after = yearlyFinance(s, new Rng(3));
    expect(after.finances.bankrupt).toBe(false);
    expect(after.finances.debt).toBe(0);
    expect(after.finances.investments[0]!.amount).toBeGreaterThan(0);
    expect(after.log.some((l) => /^With my debts piling up, I cashed in \$[\d,]+ from my index fund to pay them off\.$/.test(l.text))).toBe(true);
    // The year's shortfall was mostly the debt repayment, and the line says so.
    expect(after.log.some((l) => /^Money was tight, so I cashed in \$[\d,]+ from my index fund to keep up with my debt payments\.$/.test(l.text))).toBe(true);
  });

  it('a home that covers the debt is sold, never kept through a bankruptcy', () => {
    const after = yearlyFinance(broke({ debt: 400_000 }, [house({})]), new Rng(4));
    expect(after.finances.bankrupt).toBe(false);
    expect(after.assets).toEqual([]);
    expect(after.finances.debt).toBe(0);
    expect(after.log.at(-1)!.text).toBe('With my debts piling up, I sold my home to pay them off.');
  });

  it('other things go before the home, as few as it takes, and only until the debt is back under the line', () => {
    const boat: Asset = { ...house({ id: 'b1', defId: 'boat', kind: 'item', name: 'Speedboat', value: 80_000, primary: undefined }) };
    const rental = house({ id: 'r1', defId: 'condo', name: 'City condo', value: 300_000, primary: undefined, rentedOut: true });
    const after = yearlyFinance(broke({ debt: 500_000 }, [house({}), boat, rental]), new Rng(5));
    expect(after.finances.bankrupt).toBe(false);
    expect(after.assets.map((a) => a.id)).toEqual(['h1']);
    expect(after.finances.debt).toBeLessThanOrEqual(scaleMoney(after, BANKRUPTCY_DEBT));
    // Neither alone covers it: the bigger goes first, then the smallest that covers the rest.
    expect(after.log.at(-1)!.text).toBe('With my debts piling up, I sold my city condo and my speedboat to pay them down.');
  });

  it('a player who cannot cover the debt goes bankrupt and keeps the home, and the lines change each time', () => {
    let s = broke({ debt: 600_000 }, [house({ value: 100_000 })]);
    const lines: string[] = [];
    for (let i = 0; i < 5; i++) {
      s = yearlyFinance({ ...s, finances: { ...s.finances, debt: 900_000 } }, new Rng(i));
      lines.push(s.log.at(-1)!.text);
      expect(s.assets.map((a) => a.id)).toEqual(['h1']);
    }
    expect(lines).toEqual([BANKRUPTCY_LINES.first, BANKRUPTCY_LINES.second, BANKRUPTCY_LINES.third, bankruptcyLine(4), bankruptcyLine(5)]);
    expect(new Set(lines).size).toBe(5);
    expect(bankruptcyLine(4)).toBe('Bankruptcy number four. I could fill in the forms with my eyes closed.');
    expect(bankruptcyLine(5)).toBe('I declared bankruptcy for the fifth time. The judge barely looked up.');
    expect(s.flags.bankruptcies).toBe(5);
  });

  it('an older save that went bankrupt counts it as the first', () => {
    const s = yearlyFinance(broke({ debt: 900_000, bankrupt: true }), new Rng(1));
    expect(s.log.at(-1)!.text).toBe(BANKRUPTCY_LINES.second);
  });

  it('a short year is paid out of savings before anything is borrowed, and the journal says so once', () => {
    let s = broke({ investments: [{ kind: 'savings', amount: 20_000, costBasis: 20_000 }, { kind: 'index', amount: 200_000, costBasis: 150_000 }] });
    const from = s.log.length;
    for (let age = 45; age <= 48; age++) s = yearlyFinance({ ...s, character: { ...s.character, age } }, new Rng(age));
    expect(s.finances.debt).toBe(0);
    expect(s.finances.investments.find((i) => i.kind === 'savings')).toBeUndefined();
    const lines = s.log.slice(from).map((l) => l.text);
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatch(/^Money was tight, so I cashed in \$[\d,]+ from my savings account to pay the bills\.$/);
    // Once the savings account is empty, the index fund pays, without another line.
    expect(s.finances.investments.find((i) => i.kind === 'index')!.costBasis).toBeLessThan(150_000);
  });

  it('no "no income" line for a landlord with rent coming in, nor for debt being paid', () => {
    const rental = house({ id: 'r1', value: 400_000, primary: undefined, rentedOut: true });
    let s = broke({ debt: 120_000 }, [house({ value: 120_000 }), rental]);
    for (let age = 45; age < 50; age++) s = yearlyFinance({ ...s, character: { ...s.character, age } }, new Rng(age));
    expect(s.finances.lastYear.passive).toBeGreaterThan(0);
    expect(s.log.some((l) => /no income|without an income/i.test(l.text))).toBe(false);
    // Debt with cash to pay it is not collections either.
    const flush = yearlyFinance(broke({ debt: 100_000, cash: 300_000 }), new Rng(1));
    expect(flush.log.some((l) => /no income/i.test(l.text))).toBe(false);
  });
});

describe("a child's inheritance", () => {
  it('parents who die before their child turns 18 leave the share in the child\'s savings', () => {
    let s = at(12, 2000);
    const people = { ...s.people };
    for (const p of Object.values(people)) if (p.kind === 'mother' || p.kind === 'father') people[p.id] = { ...p, age: 99, health: 1, money: 500_000, relationship: 70 };
    s = { ...s, finances: { ...s.finances, cash: 40 }, people };
    for (let r = 1; r < 30 && Object.values(s.people).some((p) => p.alive && (p.kind === 'mother' || p.kind === 'father')); r++) s = ageNpcs(s, new Rng(r));
    const inherited = s.log.filter((l) => /^I inherited \$[\d,]+ from (Mom|Dad)'s estate\. It went into my savings\.$/.test(l.text));
    expect(inherited.length).toBeGreaterThan(0);
    expect(s.finances.cash).toBeGreaterThan(100_000);
  });
});

describe('incurable illnesses', () => {
  it('a doctor manages dementia, arthritis and osteoporosis but never cures them', () => {
    let s = at(80, 2040);
    s = { ...s, finances: { ...s.finances, cash: 10_000_000 }, health: { ...s.health, illnesses: ['dementia', 'arthritis', 'osteoporosis'].map((defId) => ({ defId, name: defId, severity: 2, chronic: true, yearsLeft: -1, treated: false })) } };
    const first = visitDoctor(s, new Rng(1));
    expect(first.log.at(-1)!.text).toBe('The doctor gave me a plan to manage my dementia, arthritis, and osteoporosis.');
    for (let r = 0; r < 300; r++) {
      const t = visitDoctor({ ...first, health: { ...first.health, doctorVisitsThisYear: 0 } }, new Rng(r));
      expect(t.health.illnesses).toHaveLength(3);
      expect(t.log.at(-1)!.text).toBe("The doctor checked on my dementia, arthritis, and osteoporosis. They're stable for now.");
    }
  });

  it('a plural illness reads as one', () => {
    let s = at(50, 2040);
    s = { ...s, finances: { ...s.finances, cash: 1_000_000 }, health: { ...s.health, illnesses: [{ defId: 'migraines', name: 'migraines', severity: 2, chronic: true, yearsLeft: -1, treated: true }] } };
    for (let r = 0; r < 50; r++) {
      const t = visitDoctor(s, new Rng(r));
      if (t.health.illnesses.length) expect(t.log.at(-1)!.text).toBe("The doctor checked on my migraines. They're stable for now.");
    }
  });

  it('a curable chronic illness can still be treated away', () => {
    let s = at(50, 2040);
    s = { ...s, finances: { ...s.finances, cash: 1_000_000 }, health: { ...s.health, illnesses: [{ defId: 'migraines', name: 'migraines', severity: 2, chronic: true, yearsLeft: -1, treated: true }] } };
    let cured = 0;
    for (let r = 0; r < 100; r++) if (!visitDoctor(s, new Rng(r)).health.illnesses.length) cured++;
    expect(cured).toBeGreaterThan(20);
  });
});

describe('older saves', () => {
  it('a hustle and a career from before these fields keep working', () => {
    const s = at(30, 1995);
    const old: GameState = { ...s, career: { ...s.career, hustle: { defId: 'streamer', name: 'Streaming channel', level: 1, followers: 0, yearsActive: 6, lastIncome: 0 } } };
    // A streaming channel started before the era gates carries on.
    const t = yearlyCareer(old, new Rng(1));
    expect(t.career.hustle?.defId).toBe('streamer');
    expect(t.career.hustle?.peak).toBeGreaterThanOrEqual(1);
    expect(applyAction(old, { type: 'stopHustle' }).career.hustle).toBeNull();
  });
});

describe('review: settling debts, small shortfalls, careers and a minor heir', () => {
  const broke = (patch: Partial<GameState['finances']> = {}, assets: Asset[] = []): GameState => {
    const s = at(45, 2010);
    return { ...s, assets, career: { ...s.career, job: null, retired: false }, finances: { ...s.finances, cash: 0, bankrupt: false, investments: [], ...patch } };
  };
  const thing = (id: string, defId: string, value: number, patch: Partial<Asset> = {}): Asset => {
    const def = ASSET_BY_ID[defId]!;
    return { id, defId, kind: def.kind, name: def.name, value, purchasePrice: value, condition: 90, yearlyUpkeep: 0, mortgage: null, boughtAtAge: 30, ...patch };
  };

  it('the debt is settled with as few sales as it takes, and a bicycle is not sold for nothing', () => {
    const assets = [thing('k1', 'bike', 150), thing('k2', 'bike', 150), thing('g1', 'gaming_pc', 1_000), thing('w1', 'watch', 11_000), thing('c1', 'condo', 400_000, { rentedOut: true }), thing('h1', 'townhouse', 500_000, { primary: true })];
    const after = yearlyFinance(broke({ debt: 500_000 }, assets), new Rng(5));
    expect(after.finances.bankrupt).toBe(false);
    expect(after.assets.map((a) => a.id).sort()).toEqual(['g1', 'h1', 'k1', 'k2', 'w1']);
    expect(after.log.at(-1)!.text).toBe('With my debts piling up, I sold my city condo to pay them down.');
  });

  it('when no one thing covers it, the biggest goes first, and two of a kind are counted', () => {
    const assets = [thing('b1', 'boat', 80_000), thing('b2', 'boat', 80_000), thing('g1', 'gaming_pc', 1_000), thing('h1', 'townhouse', 120_000, { primary: true })];
    const after = yearlyFinance(broke({ debt: 300_000 }, assets), new Rng(5));
    expect(after.finances.bankrupt).toBe(false);
    expect(after.assets.map((a) => a.id).sort()).toEqual(['g1', 'h1']);
    expect(after.log.at(-1)!.text).toBe('With my debts piling up, I sold my two speedboats to pay them down.');
  });

  it('when the home has to go anyway, the small things are kept', () => {
    const assets = [thing('k1', 'bike', 150), thing('g1', 'gaming_pc', 1_000), thing('s1', 'sedan', 15_000), thing('h1', 'suburban', 600_000, { primary: true })];
    const after = yearlyFinance(broke({ debt: 400_000 }, assets), new Rng(5));
    expect(after.finances.bankrupt).toBe(false);
    expect(after.finances.debt).toBe(0);
    expect(after.assets.map((a) => a.id).sort()).toEqual(['g1', 'k1', 's1']);
    expect(after.log.at(-1)!.text).toBe('With my debts piling up, I sold my home to pay them off.');
  });

  it('a gaming PC keeps its capitals in the journal', () => {
    let s: GameState = { ...at(20, 2010), finances: { ...at(20, 2010).finances, cash: 10_000 } };
    s = applyAction(s, { type: 'buyAsset', defId: 'gaming_pc', financing: 'cash' });
    expect(s.log.at(-1)!.text).toBe('I bought a gaming PC.');
    s = applyAction(s, { type: 'sellAsset', assetId: s.assets[0]!.id });
    expect(s.log.at(-1)!.text).toMatch(/^I sold my gaming PC and cleared \$[\d,]+\.$/);
  });

  it('bankruptcy takes the cash too: only the home is kept', () => {
    // The year's repayment leaves cash over, and the debt is still far beyond everything owned.
    const after = yearlyFinance(broke({ debt: 3_000_000, cash: 900_000 }, [thing('h1', 'studio', 100_000, { primary: true })]), new Rng(2));
    expect(after.finances.bankrupt).toBe(true);
    expect(after.finances.cash).toBe(0);
    expect(after.finances.debt).toBe(0);
    expect(after.assets.map((a) => a.id)).toEqual(['h1']);
  });

  it('a few dollars out of savings is not news', () => {
    // Living costs of a renter with no income: about $9,000, so a year short by less than $1,000 says nothing.
    const s = broke({ cash: 8_500, investments: [{ kind: 'savings', amount: 50_000, costBasis: 50_000 }] });
    const after = yearlyFinance(s, new Rng(1));
    expect(after.finances.investments[0]!.amount).toBeLessThan(51_000);
    expect(after.log.some((l) => /^Money was tight/.test(l.text))).toBe(false);
    const bigger = yearlyFinance(broke({ cash: 0, investments: [{ kind: 'savings', amount: 50_000, costBasis: 50_000 }] }), new Rng(1));
    expect(bigger.log.some((l) => /^Money was tight, so I cashed in \$[\d,]+ from my savings account to pay the bills\.$/.test(l.text))).toBe(true);
  });

  it('a title on two ladders belongs to the career the rest of the history shows', () => {
    const lawyer = careerSpans([
      { title: 'Senior Associate', company: 'Hale & Stone', fromAge: 26, toAge: 38, salary: 120_000, reason: 'left' },
      { title: 'Partner', company: 'Reed LLP', fromAge: 38, toAge: 60, salary: 300_000, reason: 'retired' },
    ], 'lawyer');
    expect(lawyer.map((x) => [x.key, x.years])).toEqual([['lawyer', 34]]);
    expect(careerSpans([{ title: 'Senior Associate', company: 'Mega Mart', fromAge: 20, toAge: 24, salary: 30_000, reason: 'quit' }]).map((x) => x.key)).toEqual(['retail']);
    // Still a partner at death after a partnership at another firm: one career, not "a partner and later a partner".
    const s = at(62, 2030, 'US', 5);
    const partner = { ...s, career: { ...s.career, job: job({ defId: 'lawyer', title: 'Partner', company: 'Reed LLP', level: 3, yearsHeld: 3, category: 'law' }), history: [{ title: 'Partner', company: 'Hale & Stone', fromAge: 40, toAge: 59, salary: 300_000, reason: 'quit' as const }] } };
    expect(buildObituary(partner, 'a stroke', 5000, 'Mediocre')).not.toMatch(/later/);
  });

  it("a late mother's brother carries her surname, and her husband's family does not", () => {
    let prev = createLife({ countryCode: 'GB', firstName: 'Zoe', lastName: 'Hughes', gender: 'female' }, 77);
    const rng = new Rng(6);
    // Her husband took her surname at the wedding and died before her; she had no brother or sister of her own left.
    const husband: Person = { ...makePerson(rng, { kind: 'spouse', gender: 'male', age: 45, countryCode: 'GB', lastName: 'Hughes', playerAge: 25 }), alive: false, deathAge: 44 };
    const girl: Person = { ...makePerson(rng, { kind: 'child', gender: 'female', age: 9, countryCode: 'GB', lastName: 'Hughes', playerAge: 36 }), otherParentId: husband.id };
    const people = Object.fromEntries(Object.entries(prev.people).filter(([, p]) => !['sibling', 'mother', 'father', 'grandparent'].includes(p.kind)));
    prev = markDeath({ ...prev, character: { ...prev.character, age: 45 }, year: prev.character.birthYear + 45, people: { ...people, [husband.id]: husband, [girl.id]: girl } }, 'a stroke');
    const sides = new Set<string>();
    for (let seed = 1; seed <= 30; seed++) {
      const s = createLife({ heir: { childId: girl.id, previous: prev } }, seed);
      const carer = Object.values(s.people).find((p) => p.relative)!;
      const side = s.people[carer.viaId!]!;
      sides.add(side.firstName);
      if (side.firstName === 'Zoe') expect(carer.lastName).toBe('Hughes');
      else expect(carer.lastName).not.toBe('Hughes');
    }
    expect(sides.size).toBe(2);
  });

  it('a minor always gets their share: parents do not write a child out of the will', () => {
    let s = at(10, 2000);
    const people = { ...s.people };
    for (const p of Object.values(people)) if (p.kind === 'mother' || p.kind === 'father') people[p.id] = { ...p, money: 300_000, relationship: 5 };
    s = { ...s, people };
    const mom = Object.values(s.people).find((p) => p.kind === 'mother' || p.kind === 'father')!;
    for (let seed = 1; seed <= 20; seed++) {
      const dead = { ...s, people: { ...s.people, [mom.id]: { ...mom, alive: false, deathAge: mom.age } } };
      const after = onNpcDeath(dead, dead.people[mom.id]!, new Rng(seed));
      expect(after.log.some((l) => /^I inherited \$[\d,]+ from .*'s estate\. It went into my savings\.$/.test(l.text))).toBe(true);
    }
  });
});
