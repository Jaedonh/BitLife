/**
 * The year recap's headline (third playtest): a close family death outranks everything, and a card that sends the
 * player back to prison outranks the release. Plus older saves from before this round's changes still load and play.
 */
import { ageUp, createLife, EVENT_REGISTRY, resolveChoice } from '@/engine';
import { sendToPrison } from '@/engine/events/effects';
import type { GameState, LogEntry, Person } from '@/engine/types';
import { migrateSave } from '../migrations';
import { yearHighlight } from '../yearRecap';

const base = (): GameState => {
  const g = createLife({ countryCode: 'US' }, 42, 1_700_000_000_000);
  return { ...g, character: { ...g.character, age: 30 } };
};

const lines = (age: number, entries: [string, LogEntry['kind']][]): LogEntry[] => [
  { age, year: 2000 + age, text: `${2000 + age}: Age ${age}`, kind: 'year' },
  ...entries.map(([text, kind]) => ({ age, year: 2000 + age, text, kind })),
];

const mother = (g: GameState): Person => Object.values(g.people).find((p) => p.kind === 'mother')!;

/** The year after `before`: the same people, `dead` marked dead, and these journal lines. */
function nextYear(before: GameState, entries: [string, LogEntry['kind']][], dead: Person[] = [], patch: Partial<GameState> = {}): GameState {
  const people = { ...before.people };
  for (const p of dead) people[p.id] = { ...p, alive: false };
  return { ...before, ...patch, people, character: { ...before.character, age: before.character.age + 1 }, log: [...before.log, ...lines(before.character.age + 1, entries)] };
}

describe('a close family death is the year headline', () => {
  it("Mom's death outranks a milestone and a card's happy outcome", () => {
    const before = base();
    const mom = mother(before);
    expect(mom.alive).toBe(true);
    const after = nextYear(before, [['I started middle school.', 'milestone'], ['Mom died of pneumonia at 44.', 'bad'], ['I inherited $25,000 from Mom\'s estate.', 'money'], ['We went camping. Best weekend in years.', 'good']], [mom]);
    expect(yearHighlight(before, after)).toBe('Mom died of pneumonia at 44.');
    expect(yearHighlight(before, after, after.log.length - 1)).toBe('Mom died of pneumonia at 44.');
  });

  it("a partner's death written by a card counts too, and a grandparent's does not outrank a milestone", () => {
    const before = base();
    const lover: Person = { ...mother(before), id: 'p_lover', kind: 'lover', firstName: 'Hollie', lastName: 'Allen', age: 70 };
    const withLover = { ...before, people: { ...before.people, [lover.id]: lover } };
    const after = nextYear(withLover, [['I turned 31.', 'milestone'], ['Hollie passed away in her sleep, holding my hand.', 'bad']], [lover]);
    expect(yearHighlight(withLover, after, after.log.length - 1)).toBe('Hollie passed away in her sleep, holding my hand.');
    const grandma: Person = { ...mother(before), id: 'p_gm', kind: 'grandparent', firstName: 'Rosa', age: 88 };
    const withGrandma = { ...before, people: { ...before.people, [grandma.id]: grandma } };
    const later = nextYear(withGrandma, [['I turned 31.', 'milestone'], ['Grandma Rosa died of a stroke at 88.', 'bad']], [grandma]);
    expect(yearHighlight(withGrandma, later)).toBe('I turned 31.');
  });

  it('names with accents count as whole words (Zoé, Élodie), and a longer name is not a match', () => {
    const before = base();
    const zoe: Person = { ...mother(before), id: 'p_zoe', kind: 'lover', firstName: 'Zoé', lastName: 'Martin', age: 60 };
    const elodie: Person = { ...mother(before), id: 'p_elo', kind: 'spouse', firstName: 'Élodie', lastName: 'Roux', age: 60 };
    const withThem = { ...before, people: { ...before.people, [zoe.id]: zoe, [elodie.id]: elodie } };
    const one = nextYear(withThem, [['I turned 31.', 'milestone'], ['My girlfriend Zoé Martin died of cancer at 60.', 'bad']], [zoe]);
    expect(yearHighlight(withThem, one)).toBe('My girlfriend Zoé Martin died of cancer at 60.');
    const two = nextYear(withThem, [['I turned 31.', 'milestone'], ['Élodie died in her sleep.', 'bad']], [elodie]);
    expect(yearHighlight(withThem, two)).toBe('Élodie died in her sleep.');
    const other = nextYear(withThem, [['I turned 31.', 'milestone'], ['Zoéline died of a stroke at 90.', 'bad']], [zoe]);
    expect(yearHighlight(withThem, other)).toBe('I turned 31.');
  });

  it('a death line about someone who did not die this year is not promoted', () => {
    const before = base();
    const after = nextYear(before, [['I turned 31.', 'milestone'], ['Mom told me how her father died when she was ten.', 'info']]);
    expect(yearHighlight(before, after)).toBe('I turned 31.');
  });
});

describe('back to prison on a card', () => {
  it('outranks the release earlier that year', () => {
    const g = base();
    const inside = sendToPrison(g, 2);
    const release = 'I walked out of prison with my things in a paper bag. The sky looked enormous.';
    const conviction = 'One of my "customers" was a retired fraud investigator. Two years for fraud.';
    const after = nextYear(inside, [[release, 'milestone'], ['A scam caller tried the fake tax-agency routine. → Run the scam myself', 'event'], [conviction, 'bad']], [], {
      crime: { ...inside.crime, inPrison: true, sentenceYearsLeft: 2, lastRelease: { age: 31, juvenile: false } },
    });
    const cardsFrom = after.log.length - 2;
    expect(yearHighlight(inside, after, cardsFrom)).toBe(conviction);
    // Out for good at the end of the year: the release is the news.
    const free = { ...after, crime: { ...after.crime, inPrison: false } };
    expect(yearHighlight(inside, free, cardsFrom)).toBe(release);
  });

  it('a card that jails me outranks a birthday milestone; a year served inside keeps the usual order', () => {
    const before = base();
    const jailed = nextYear(before, [['I turned 31.', 'milestone'], ['The warehouse had a silent alarm. Four years for burglary.', 'bad']], [], { crime: { ...before.crime, inPrison: true, sentenceYearsLeft: 4 } });
    expect(yearHighlight(before, jailed, jailed.log.length - 1)).toBe('The warehouse had a silent alarm. Four years for burglary.');
    const inside = sendToPrison(before, 6);
    const served = nextYear(inside, [['I turned 31 behind bars.', 'milestone'], ['The fight was written up as an assault. A year added to my sentence.', 'bad']]);
    expect(yearHighlight(inside, served, served.log.length - 1)).toBe('I turned 31 behind bars.');
  });
});

describe('older saves keep loading and playing', () => {
  it('a save playing as a Hall of Famer, with no had:, home or Hall of Fame flags, loads and retires at the next birthday', () => {
    let g = createLife({ countryCode: 'US' }, 9, 1_700_000_000_000);
    g = { ...g, character: { ...g.character, age: 50, stats: { ...g.character.stats, health: 90 } }, year: g.character.birthYear + 50 };
    const old = JSON.parse(
      JSON.stringify({
        ...g,
        career: {
          ...g.career,
          job: { defId: 'athlete', title: 'Hall of Famer', company: 'Austin Athletic', salary: 3_000_000, level: 3, performance: 70, yearsHeld: 20, yearsAtLevel: 8, category: 'sports', partTime: false, askedThisYear: false, workedHarderThisYear: false },
          history: [{ title: 'Star Athlete', company: 'Austin Athletic', fromAge: 25, toAge: 30, salary: 800_000, reason: 'promoted' }],
        },
      }),
    );
    const loaded = migrateSave(old);
    expect(loaded).not.toBeNull();
    let next = ageUp(loaded!);
    while (next.pendingEvent) next = resolveChoice(next, next.pendingEvent.choices[0]!.id, EVENT_REGISTRY);
    if (!next.alive) return;
    expect(next.career.job?.defId).not.toBe('athlete');
    expect(next.career.history.some((h) => h.defId === 'athlete' && h.reason === 'sportRetired')).toBe(true);
    expect(next.flags.hallOfFame).toBe(true);
  });
});
