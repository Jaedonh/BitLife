import { getCountry } from '@/data/countries';
import type { GameState } from '../types';
import { formatMoneyFull, fullName, log, netWorth, pronouns } from '../util';
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

/** Ends the life: computes ribbon, obituary, and writes the final log lines. Idempotent. */
export function markDeath(state: GameState, cause: string): GameState {
  if (!state.alive) return state;
  const c = state.character;
  const worth = netWorth(state);
  const ribbon = awardRibbon({ ...state, alive: false });
  const hash = (c.id + cause).split('').reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7);
  const epitaph = EPITAPHS[hash % EPITAPHS.length] as string;
  const obituary = buildObituary(state, cause, worth, ribbon.name);
  let s: GameState = {
    ...state,
    alive: false,
    pendingEvent: null,
    eventQueue: [],
    death: { age: c.age, year: state.year, cause, netWorth: worth, ribbonId: ribbon.id, obituary, epitaph },
    counters: { ...state.counters, peakNetWorth: Math.max(state.counters.peakNetWorth, worth) },
  };
  s = log(s, `I died of ${cause} at the age of ${c.age}.`, 'death');
  s = log(s, `${fullName(c)} · ${c.birthYear} – ${state.year} · ${ribbon.emoji} ${ribbon.name}`, 'death');
  return s;
}

export function buildObituary(state: GameState, cause: string, worth: number, ribbonName: string): string {
  const c = state.character;
  const p = pronouns(c.gender);
  const country = getCountry(c.countryCode);
  const spouse = Object.values(state.people).find((x) => x.kind === 'spouse' && x.alive);
  const children = Object.values(state.people).filter((x) => x.kind === 'child');
  const aliveChildren = children.filter((x) => x.alive).length;
  const lastJob = state.career.job ?? null;
  const bestJob = [...state.career.history].sort((a, b) => b.salary - a.salary)[0];
  const careerText = lastJob
    ? `${p.Subject} worked as a ${lastJob.title.toLowerCase()} at ${lastJob.company}`
    : bestJob
      ? `${p.Subject} was best known for ${p.possessive} years as a ${bestJob.title.toLowerCase()}`
      : state.counters.yearsEmployed === 0
        ? `${p.Subject} never held a steady job, which ${p.subject} insisted was a lifestyle choice`
        : `${p.Subject} worked a string of jobs`;
  const degree = state.education.degrees.filter((d) => d.includes(':')).map((d) => d.split(':')[1]!.replace(/_/g, ' ')).pop();
  const eduText = degree ? ` and held a degree in ${degree}` : state.education.droppedOut ? ' and never finished school' : '';
  const familyText = spouse
    ? `${p.Subject} is survived by ${p.possessive} spouse ${spouse.firstName}${aliveChildren ? ` and ${aliveChildren} ${aliveChildren === 1 ? 'child' : 'children'}` : ''}.`
    : aliveChildren
      ? `${p.Subject} is survived by ${aliveChildren} ${aliveChildren === 1 ? 'child' : 'children'}.`
      : state.counters.marriages > 0
        ? `${p.Subject} was married ${state.counters.marriages === 1 ? 'once' : `${state.counters.marriages} times`}.`
        : `${p.Subject} never married.`;
  const moneyText = worth >= 1_000_000
    ? `${p.Subject} left behind a fortune of ${formatMoneyFull(worth, c.countryCode)}.`
    : worth < 0
      ? `${p.Subject} left behind debts of ${formatMoneyFull(-worth, c.countryCode)}, which surprised no one.`
      : `${p.Subject} left behind ${formatMoneyFull(worth, c.countryCode)}.`;
  const crimeText = state.crime.convictions > 0 ? ` ${p.Subject} had ${state.crime.convictions} ${state.crime.convictions === 1 ? 'conviction' : 'convictions'} on record.` : '';
  return `${fullName(c)}, ${c.age}, of ${c.city}, ${country.name}, died of ${cause}. ${careerText}${eduText}. ${familyText} ${moneyText}${crimeText} Remembered as: ${ribbonName}.`;
}
