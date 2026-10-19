import { getCountry } from '@/data/countries';
import { jobDefsForTitle } from '@/data/jobs';
import { GRAD_BY_ID, majorProse } from '@/data/majors';
import type { GameState, JobHistoryEntry, Person } from '../types';
import { deathPhrase, formatMoneyFull, fullName, joinList, log, netWorth, numberWord, plural, pronouns, roleWithArticle, sentence, withArticle } from '../util';
import { settleQuietYear } from './flavor';
import { awardRibbon } from './ribbons';
import { fosterRelation } from './scenarios';

const EPITAPHS = [
  'Gone, but the group chat remembers.',
  'Lived every year like it was a tap away.',
  'Left this world with unfinished business and a full inbox.',
  'Proof that one more year is never enough.',
  'Here lies someone who always chose the second option.',
  'Finally found a bed nobody can make them get out of.',
  'Rest now. The ads are over.',
  'A life well simulated.',
];

/** A child's grave reads gentler than the jokes above. */
const CHILD_EPITAPHS = [
  'Small, and loved enormously.',
  'Gone too soon, never forgotten.',
  'A short life, and a bright one.',
  'Forever young.',
];

/**
 * Ends the life: computes ribbon, obituary, and writes the final log lines. Idempotent. A death during the year
 * (an event card) fills that year, so a quiet line ("nothing happened") written at its birthday is taken back.
 */
export function markDeath(state: GameState, cause: string): GameState {
  if (!state.alive) return state;
  const c = state.character;
  const worth = netWorth(state);
  const ribbon = awardRibbon({ ...state, alive: false });
  const hash = (c.id + cause).split('').reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7);
  const epitaphs = c.age < 13 ? CHILD_EPITAPHS : EPITAPHS;
  const epitaph = epitaphs[hash % epitaphs.length] as string;
  const obituary = buildObituary(state, cause, worth, ribbon.name);
  let s: GameState = {
    ...state,
    alive: false,
    pendingEvent: null,
    eventQueue: [],
    death: { age: c.age, year: state.year, cause, netWorth: worth, ribbonId: ribbon.id, obituary, epitaph },
    counters: { ...state.counters, peakNetWorth: Math.max(state.counters.peakNetWorth, worth) },
  };
  s = log(s, c.age === 0 ? `I ${deathPhrase(cause)} before my first birthday.` : `I ${deathPhrase(cause)} at the age of ${c.age}.`, 'death');
  s = log(s, `${fullName(c)} · ${c.birthYear} – ${state.year} · ${ribbon.emoji} ${ribbon.name}`, 'death');
  return settleQuietYear(s);
}

/**
 * A credential as it reads after "my" or "an": "degree in nursing", "MBA", "master's degree", "medical degree", "PhD"
 * ('bachelor:nursing', 'master:business', 'doctor:medicine'). Null for one with no field ('high_school').
 */
export function degreeNoun(degree: string): string | null {
  const [level, field] = degree.split(':');
  if (!field) return null;
  if (level === 'bachelor') return `degree in ${majorProse(field)}`;
  switch (degree) {
    case 'master:business': return 'MBA';
    case 'master:general': return "master's degree";
    case 'doctor:medicine': return 'medical degree';
    case 'doctor:law': return 'law degree';
    case 'doctor:dentistry': return 'dental degree';
    case 'doctor:philosophy': return 'PhD';
    default: return `degree in ${field.replace(/_/g, ' ')}`;
  }
}

/** A degree as an obituary would name it: "a degree in nursing", "an MBA", "a PhD". */
function degreePhrase(degree: string): string | null {
  const noun = degreeNoun(degree);
  return noun && withArticle(noun);
}

const DEGREE_RANK: Record<string, number> = { bachelor: 1, master: 2, doctor: 3 };

/** The obituary names the highest degree (a PhD over a later MBA); between equals, the most recent. */
export function highestDegree(degrees: readonly string[]): string | undefined {
  let best: { phrase: string; rank: number } | undefined;
  for (const d of degrees) {
    const phrase = degreePhrase(d);
    const rank = DEGREE_RANK[d.split(':')[0]!] ?? 0;
    if (phrase && (!best || rank >= best.rank)) best = { phrase, rank };
  }
  return best?.phrase;
}

const SCHOOL_STAGE: Record<string, string> = { primary: 'elementary school', middle: 'middle school', high: 'high school', university: 'college', graduate: 'graduate school' };

function relationLabel(p: Person): string {
  const foster = fosterRelation(p);
  if (foster) return foster;
  switch (p.kind) {
    case 'mother': return 'mother';
    case 'father': return 'father';
    case 'stepmother': return 'stepmother';
    case 'stepfather': return 'stepfather';
    case 'grandparent': return p.gender === 'male' ? 'grandfather' : 'grandmother';
    default: return p.kind;
  }
}

/** Who a child leaves behind: "her parents, Ana and Marco, two siblings, and her dog, Biscuit". */
function childSurvivors(state: GameState, possessive: string): string {
  const alive = Object.values(state.people).filter((x) => x.alive);
  const parents = alive.filter((x) => x.kind === 'mother' || x.kind === 'father' || x.kind === 'stepmother' || x.kind === 'stepfather');
  const siblings = alive.filter((x) => x.kind === 'sibling').length;
  const grandparents = alive.filter((x) => x.kind === 'grandparent');
  const pets = alive.filter((x) => x.kind === 'pet');
  const mother = parents.find((x) => x.kind === 'mother');
  const father = parents.find((x) => x.kind === 'father');
  const pair = parents.length === 2 && mother && father;
  const items = pair ? [`${possessive} parents, ${mother.firstName} and ${father.firstName}`] : parents.map((x) => `${possessive} ${relationLabel(x)} ${x.firstName}`);
  if (siblings) items.push(`${numberWord(siblings)} ${siblings === 1 ? 'sibling' : 'siblings'}`);
  if (grandparents.length === 1) items.push(`${possessive} ${relationLabel(grandparents[0]!)} ${grandparents[0]!.firstName}`);
  else if (grandparents.length > 1) items.push(`${numberWord(grandparents.length)} grandparents`);
  if (pets.length === 1) items.push(`${possessive} ${pets[0]!.species ?? 'pet'}, ${pets[0]!.firstName}`);
  else if (pets.length > 1) items.push(`${numberWord(pets.length)} pets`);
  // "her parents, Ana and Marco, and one sibling": the names are set off by commas, so the list keeps its comma.
  if (pair && items.length === 2) return `${items[0]}, and ${items[1]}`;
  return joinList(items);
}

/** A career in the work history: every stint in one line of work (all its employers and rungs), named by the latest title. */
export interface CareerSpan {
  /** The job definition, or the title itself for a job the data no longer knows. */
  key: string;
  title: string;
  years: number;
  retired: boolean;
  /** When it last ended, to break ties toward the later career. */
  until: number;
}

/**
 * The work history as careers, in the order they last ended: two salons and two titles are one career as a stylist.
 * An entry names its job (`defId`); in an older save, a title on two ladders ("Partner" for a lawyer or a consultant,
 * "Lieutenant") goes with the line of work the rest of the history, or the job held now (`currentDefId`), shows.
 */
export function careerSpans(history: readonly JobHistoryEntry[], currentDefId?: string): CareerSpan[] {
  const known = new Set<string>(currentDefId ? [currentDefId] : []);
  for (const h of history) {
    const defs = jobDefsForTitle(h.title);
    if (h.defId) known.add(h.defId);
    else if (defs.length === 1) known.add(defs[0]!.id);
  }
  const keyOf = (h: JobHistoryEntry): string => {
    if (h.defId) return h.defId;
    const defs = jobDefsForTitle(h.title);
    return (defs.find((d) => known.has(d.id)) ?? defs[0])?.id ?? h.title;
  };
  const spans = new Map<string, CareerSpan>();
  for (const h of history) {
    const key = keyOf(h);
    const span = spans.get(key) ?? { key, title: h.title, years: 0, retired: false, until: h.toAge };
    span.years += Math.max(0, h.toAge - h.fromAge);
    if (h.toAge >= span.until) {
      span.title = h.title;
      span.until = h.toAge;
    }
    if (h.reason === 'retired') span.retired = true;
    spans.set(key, span);
  }
  return [...spans.values()].sort((a, b) => a.until - b.until);
}

/** The career of the most years (the later one on a tie). */
function longestOf(spans: readonly CareerSpan[]): CareerSpan | undefined {
  return spans.reduce<CareerSpan | undefined>((best, x) => (!best || x.years >= best.years ? x : best), undefined);
}

/** "14 years as a stylist", or "working as a stylist" for a short one. */
function yearsAs(span: CareerSpan): string {
  return span.years >= 5 ? `${span.years} years as ${roleWithArticle(span.title)}` : `working as ${roleWithArticle(span.title)}`;
}

/** A career long enough to be what someone is remembered for, next to a later, shorter one. */
const DEFINING_YEARS = 10;

export function buildObituary(state: GameState, cause: string, worth: number, ribbonName: string): string {
  const c = state.character;
  const p = pronouns(c.gender);
  const country = getCountry(c.countryCode);
  const ageText = c.age === 0 ? 'just months old' : String(c.age);
  const opening = `${fullName(c)}, ${ageText}, of ${c.city}, ${country.name}, ${deathPhrase(cause)}.`;
  // Convictions sealed with a juvenile record at 18 are not on the record any more.
  const onRecord = state.crime.convictions - (state.crime.sealedConvictions ?? 0);
  const crimeText = state.crime.inPrison
    ? state.crime.juvenile
      ? ` ${p.Subject} died while in juvenile detention.`
      : ` ${p.Subject} died while serving a prison sentence.`
    : onRecord > 0
      ? ` ${p.Subject} had ${numberWord(onRecord)} ${onRecord === 1 ? 'conviction' : 'convictions'} on record.`
      : '';
  const lastJob = state.career.job ?? null;

  // A child's obituary is about school and family, not careers, marriages and money.
  if (c.age < 18) {
    const stage = state.education.enrolled ? SCHOOL_STAGE[state.education.stage] : undefined;
    const schoolText = stage
      ? sentence(`${p.Subject} was in ${stage}${lastJob ? ` and worked part-time as ${roleWithArticle(lastJob.title)} at ${lastJob.company}` : ''}`)
      : c.age < 1
        ? `${p.Subject} was only a baby.`
        : c.age < 4
          ? `${p.Subject} was only a toddler.`
          : c.age < country.schoolStartAge
            ? `${p.Subject} had not started school yet.`
            : state.crime.inPrison || state.crime.prisonYearsTotal > 0
              ? `${p.Subject} had been in school before ${p.possessive} sentence.`
              : `${p.Subject} had already left school.`;
    const survivors = childSurvivors(state, p.possessive);
    const familyText = survivors ? ` ${p.Subject} is survived by ${survivors}.` : '';
    return `${opening} ${schoolText}${familyText}${crimeText} Remembered as: ${ribbonName}.`;
  }

  const spouse = Object.values(state.people).find((x) => x.kind === 'spouse' && x.alive);
  const children = Object.values(state.people).filter((x) => x.kind === 'child');
  const aliveChildren = children.filter((x) => x.alive).length;
  // The career told is the one retired from or the one of the most years, never just the best paid or the latest.
  const spans = careerSpans(state.career.history, state.career.job?.defId);
  const longest = longestOf(spans);
  const retiredFrom = longestOf(spans.filter((x) => x.retired));
  // Retired from a short last job after a long career: the long one is the story.
  const remembered = retiredFrom && longest && longest.key !== retiredFrom.key && longest.years >= DEFINING_YEARS && longest.years > 2 * retiredFrom.years ? longest : (retiredFrom ?? longest);
  const edu = state.education;
  const studying = edu.enrolled && edu.major
    ? edu.stage === 'university'
      ? `was studying ${majorProse(edu.major)} at university`
      : `was enrolled in ${GRAD_BY_ID[edu.major]?.prose ?? 'graduate school'}`
    : null;
  // Elected office and the armed forces are served in, not worked at.
  const serving = lastJob && (lastJob.defId === 'military' || (lastJob.defId === 'politician' && lastJob.level > 0));
  // Never worked at all: "which he insisted was a lifestyle choice" ends that sentence, so the education goes first.
  const idle = !lastJob && !studying && !remembered && state.counters.yearsEmployed === 0 && c.age >= 23;
  // Still working at death after a long career in something else: "He spent 24 years as a staff engineer and later
  // worked as a help desk technician at Clearwater Ltd."
  const currentYears = lastJob ? lastJob.yearsHeld + spans.filter((x) => x.key === lastJob.defId).reduce((n, x) => n + x.years, 0) : 0;
  const earlier = lastJob && longest && longest.key !== lastJob.defId && longest.years >= DEFINING_YEARS && longest.years > 2 * currentYears ? longest : undefined;
  const nowText = lastJob
    ? serving
      ? `served ${lastJob.defId === 'military' ? 'in the Army ' : ''}as ${roleWithArticle(lastJob.title)}`
      : lastJob.defId === 'athlete' || lastJob.defId === 'musician'
        ? `was ${roleWithArticle(lastJob.title)} with ${lastJob.company}`
        : `worked as ${roleWithArticle(lastJob.title)} at ${lastJob.company}`
    : '';
  const careerText = lastJob
    ? earlier
      ? `${p.Subject} spent ${earlier.years} years as ${roleWithArticle(earlier.title)} and later ${nowText.replace(/^was /, 'became ')}`
      : `${p.Subject} ${nowText}`
    : studying
      ? `${p.Subject} ${studying}`
      : remembered
        ? state.career.retired
          ? remembered === retiredFrom
            ? `${p.Subject} retired after ${yearsAs(remembered)}`
            : `${p.Subject} spent ${plural(remembered.years, 'year')} as ${roleWithArticle(remembered.title)} before retiring`
          : `${p.Subject} was best known for ${p.possessive} years as ${roleWithArticle(remembered.title)}`
        : state.counters.yearsEmployed === 0
          ? c.age < 23
            ? `${p.Subject} was just getting started in life`
            : `${p.Subject} never held a steady job`
          : `${p.Subject} worked a string of jobs`;
  const degree = highestDegree(edu.degrees);
  const eduText = degree ? ` and held ${degree}` : edu.droppedOut ? (edu.degrees.includes('high_school') ? ' and dropped out of college' : ' and never finished school') : '';
  const idleText = degree
    ? `${p.Subject} earned ${degree} but never held a steady job`
    : edu.droppedOut
      ? edu.degrees.includes('high_school')
        ? `${p.Subject} dropped out of college and never held a steady job`
        : `${p.Subject} never finished school or held a steady job`
      : `${p.Subject} never held a steady job`;
  // "…and later worked as a nurse at Mercy General, and held a degree in biology": the comma keeps the two "and"s apart.
  const lifeText = idle ? `${idleText}, which ${p.subject} insisted was a lifestyle choice` : `${careerText}${earlier && eduText ? ',' : ''}${eduText}`;
  const aliveGrandchildren = Object.values(state.people).filter((x) => x.kind === 'grandchild' && x.alive).length;
  const kidsText = aliveChildren ? `${numberWord(aliveChildren)} ${aliveChildren === 1 ? 'child' : 'children'}` : '';
  const grandText = aliveGrandchildren ? `${numberWord(aliveGrandchildren)} ${aliveGrandchildren === 1 ? 'grandchild' : 'grandchildren'}` : '';
  const descendants = [kidsText, grandText].filter(Boolean);
  // "her husband, Tom, and two children" keeps the commas that set off the name; in a longer list they would make
  // "her husband" and "Tom" read as two survivors, so there it is "her husband Tom, two children, and …".
  const spouseWord = spouse ? `${p.possessive} ${spouse.gender === 'male' ? 'husband' : 'wife'}` : '';
  const spouseText = spouse ? `${spouseWord}, ${spouse.firstName}` : '';
  const survivors = spouseText
    ? descendants.length <= 1 ? [spouseText, ...descendants].join(', and ') : joinList([`${spouseWord} ${spouse!.firstName}`, ...descendants])
    : joinList(descendants);
  const familyText = survivors
    ? `${p.Subject} is survived by ${survivors}.`
    : state.counters.marriages > 0
      ? `${p.Subject} was married ${state.counters.marriages === 1 ? 'once' : state.counters.marriages === 2 ? 'twice' : `${state.counters.marriages} times`}.`
      : c.age < 25
        ? '' // "never married" is a punchline at 60, not at 19
        : `${p.Subject} never married.`;
  const moneyText = worth >= 1_000_000
    ? `${p.Subject} left behind a fortune of ${formatMoneyFull(worth, c.countryCode, state.year)}.`
    : worth < 0
      ? `${p.Subject} left behind debts of ${formatMoneyFull(-worth, c.countryCode, state.year)}${c.age < 25 ? '' : ', which surprised no one'}.`
      : worth < 1_000
        ? `${p.Subject} left behind next to nothing.`
        : `${p.Subject} left behind ${formatMoneyFull(worth, c.countryCode, state.year)}.`;
  // An athlete voted into the Hall of Fame after the playing days (careers.ts, flag `hallOfFame`).
  const honorText = !idle && state.flags.hallOfFame === true ? ` ${p.Subject} was voted into the Hall of Fame.` : '';
  return `${opening} ${sentence(lifeText)}${honorText}${familyText ? ` ${familyText}` : ''} ${moneyText}${crimeText} Remembered as: ${ribbonName}.`;
}
