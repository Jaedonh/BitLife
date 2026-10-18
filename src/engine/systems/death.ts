import { getCountry } from '@/data/countries';
import { GRAD_BY_ID, majorProse } from '@/data/majors';
import type { GameState, Person } from '../types';
import { deathPhrase, formatMoneyFull, fullName, joinList, log, netWorth, numberWord, pronouns, roleWithArticle } from '../util';
import { awardRibbon } from './ribbons';

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

/** Ends the life: computes ribbon, obituary, and writes the final log lines. Idempotent. */
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
  return s;
}

/** A degree as an obituary would name it: "a degree in nursing", "an MBA", "a PhD". */
function degreePhrase(degree: string): string | null {
  const [level, field] = degree.split(':');
  if (!field) return null;
  if (level === 'bachelor') return `a degree in ${majorProse(field)}`;
  switch (degree) {
    case 'master:business': return 'an MBA';
    case 'master:general': return "a master's degree";
    case 'doctor:medicine': return 'a medical degree';
    case 'doctor:law': return 'a law degree';
    case 'doctor:dentistry': return 'a dental degree';
    case 'doctor:philosophy': return 'a PhD';
    default: return `a degree in ${field.replace(/_/g, ' ')}`;
  }
}

const SCHOOL_STAGE: Record<string, string> = { primary: 'elementary school', middle: 'middle school', high: 'high school' };

function relationLabel(p: Person): string {
  switch (p.kind) {
    case 'mother': return 'mother';
    case 'father': return 'father';
    case 'stepmother': return 'stepmother';
    case 'stepfather': return 'stepfather';
    default: return p.kind;
  }
}

/** Who a child leaves behind: "her parents, Ana and Marco, two siblings, and her dog, Biscuit". */
function childSurvivors(state: GameState, possessive: string): string {
  const alive = Object.values(state.people).filter((x) => x.alive);
  const parents = alive.filter((x) => x.kind === 'mother' || x.kind === 'father' || x.kind === 'stepmother' || x.kind === 'stepfather');
  const siblings = alive.filter((x) => x.kind === 'sibling').length;
  const pets = alive.filter((x) => x.kind === 'pet');
  const mother = parents.find((x) => x.kind === 'mother');
  const father = parents.find((x) => x.kind === 'father');
  const pair = parents.length === 2 && mother && father;
  const items = pair ? [`${possessive} parents, ${mother.firstName} and ${father.firstName}`] : parents.map((x) => `${possessive} ${relationLabel(x)} ${x.firstName}`);
  if (siblings) items.push(`${numberWord(siblings)} ${siblings === 1 ? 'sibling' : 'siblings'}`);
  if (pets.length === 1) items.push(`${possessive} ${pets[0]!.species ?? 'pet'}, ${pets[0]!.firstName}`);
  else if (pets.length > 1) items.push(`${numberWord(pets.length)} pets`);
  // "her parents, Ana and Marco, and one sibling": the names are set off by commas, so the list keeps its comma.
  if (pair && items.length === 2) return `${items[0]}, and ${items[1]}`;
  return joinList(items);
}

export function buildObituary(state: GameState, cause: string, worth: number, ribbonName: string): string {
  const c = state.character;
  const p = pronouns(c.gender);
  const country = getCountry(c.countryCode);
  const ageText = c.age === 0 ? 'just months old' : String(c.age);
  const opening = `${fullName(c)}, ${ageText}, of ${c.city}, ${country.name}, ${deathPhrase(cause)}.`;
  const crimeText = state.crime.inPrison
    ? ` ${p.Subject} died while serving a prison sentence.`
    : state.crime.convictions > 0
      ? ` ${p.Subject} had ${numberWord(state.crime.convictions)} ${state.crime.convictions === 1 ? 'conviction' : 'convictions'} on record.`
      : '';
  const lastJob = state.career.job ?? null;

  // A child's obituary is about school and family, not careers, marriages and money.
  if (c.age < 18) {
    const stage = state.education.enrolled ? SCHOOL_STAGE[state.education.stage] : undefined;
    const schoolText = stage
      ? `${p.Subject} was in ${stage}${lastJob ? ` and worked part-time as ${roleWithArticle(lastJob.title)} at ${lastJob.company}` : ''}.`
      : c.age < 1
        ? `${p.Subject} was only a baby.`
        : c.age < 4
          ? `${p.Subject} was only a toddler.`
          : c.age < country.schoolStartAge
            ? `${p.Subject} had not started school yet.`
            : `${p.Subject} had already left school.`;
    const survivors = childSurvivors(state, p.possessive);
    const familyText = survivors ? ` ${p.Subject} is survived by ${survivors}.` : '';
    return `${opening} ${schoolText}${familyText}${crimeText} Remembered as: ${ribbonName}.`;
  }

  const spouse = Object.values(state.people).find((x) => x.kind === 'spouse' && x.alive);
  const children = Object.values(state.people).filter((x) => x.kind === 'child');
  const aliveChildren = children.filter((x) => x.alive).length;
  const bestJob = [...state.career.history].sort((a, b) => b.salary - a.salary)[0];
  const edu = state.education;
  const studying = edu.enrolled && edu.major
    ? edu.stage === 'university'
      ? `was studying ${majorProse(edu.major)} at university`
      : `was enrolled in ${GRAD_BY_ID[edu.major]?.prose ?? 'graduate school'}`
    : null;
  // Elected office and the armed forces are served in, not worked at.
  const serving = lastJob && (lastJob.defId === 'military' || (lastJob.defId === 'politician' && lastJob.level > 0));
  const careerText = lastJob
    ? serving
      ? `${p.Subject} served ${lastJob.defId === 'military' ? 'in the Army ' : ''}as ${roleWithArticle(lastJob.title)}`
      : lastJob.defId === 'athlete' || lastJob.defId === 'musician'
        ? `${p.Subject} was ${roleWithArticle(lastJob.title)} with ${lastJob.company}`
        : `${p.Subject} worked as ${roleWithArticle(lastJob.title)} at ${lastJob.company}`
    : studying
      ? `${p.Subject} ${studying}`
      : bestJob
        ? state.career.retired
          ? `${p.Subject} retired after working as ${roleWithArticle(bestJob.title)}`
          : `${p.Subject} was best known for ${p.possessive} years as ${roleWithArticle(bestJob.title)}`
        : state.counters.yearsEmployed === 0
          ? c.age < 23
            ? `${p.Subject} was just getting started in life`
            : `${p.Subject} never held a steady job, which ${p.subject} insisted was a lifestyle choice`
          : `${p.Subject} worked a string of jobs`;
  const degree = edu.degrees.filter((d) => d.includes(':')).map(degreePhrase).filter((d): d is string => !!d).pop();
  const eduText = degree ? ` and held ${degree}` : edu.droppedOut ? (edu.degrees.includes('high_school') ? ' and dropped out of college' : ' and never finished school') : '';
  const childText = aliveChildren ? `${numberWord(aliveChildren)} ${aliveChildren === 1 ? 'child' : 'children'}` : '';
  const familyText = spouse
    ? `${p.Subject} is survived by ${p.possessive} ${spouse.gender === 'male' ? 'husband' : 'wife'}, ${spouse.firstName}${childText ? `, and ${childText}` : ''}.`
    : childText
      ? `${p.Subject} is survived by ${childText}.`
      : state.counters.marriages > 0
        ? `${p.Subject} was married ${state.counters.marriages === 1 ? 'once' : state.counters.marriages === 2 ? 'twice' : `${state.counters.marriages} times`}.`
        : c.age < 25
          ? '' // "never married" is a punchline at 60, not at 19
          : `${p.Subject} never married.`;
  const moneyText = worth >= 1_000_000
    ? `${p.Subject} left behind a fortune of ${formatMoneyFull(worth, c.countryCode)}.`
    : worth < 0
      ? `${p.Subject} left behind debts of ${formatMoneyFull(-worth, c.countryCode)}${c.age < 25 ? '' : ', which surprised no one'}.`
      : worth < 1_000
        ? `${p.Subject} left behind next to nothing.`
        : `${p.Subject} left behind ${formatMoneyFull(worth, c.countryCode)}.`;
  return `${opening} ${careerText}${eduText}.${familyText ? ` ${familyText}` : ''} ${moneyText}${crimeText} Remembered as: ${ribbonName}.`;
}
