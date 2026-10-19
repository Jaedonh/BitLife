/**
 * Courts, juvenile detention and parole (docs/GAME_DESIGN.md §14).
 *
 * - An arrest that carries a prison sentence opens the court card (sys_trial) instead of jailing the player
 *   outright: plead guilty, take the public defender, hire a lawyer or represent myself.
 * - Under 18 the case goes to juvenile court: detention instead of prison, at most two years in all and never
 *   past the 18th birthday, school carries on inside, and the record is sealed at 18.
 * - An adult who has served half their time gets a yearly chance of a parole hearing (sys_parole). Parole lasts
 *   two years, and a conviction while on it counts double.
 *
 * Both cards are code-defined events in every registry (select.ts makeRegistry), so the usual pending-event
 * flow, modal and journal handle them. This module never imports the effect interpreter: the effects that
 * settle the cards pass in the function that convicts.
 */
import { CRIME_BY_ID } from '@/data/crimes';
import type { EventDef, ParoleApproach, TrialPlea } from '../events/schema';
import { personRef, scaleMoney } from '../events/text';
import type { Rng } from '../rng';
import type { GameState, QueuedEvent } from '../types';
import { addKarma, addStats, bump, clamp, clampStat, log, money, plural, setResult } from '../util';
import { returnToSchool } from './education';
import { canPay, guardianFunds, spend } from './guardians';

export const TRIAL_EVENT_ID = 'sys_trial';
export const PAROLE_EVENT_ID = 'sys_parole';
/** Longest stay in juvenile detention, sentences passed inside included. */
export const JUVENILE_MAX_YEARS = 2;
/** Parole covers the rest of the release year and two full years after it (it counts down at each birthday). */
export const PAROLE_YEARS = 3;
/** The content parole board (crime_and_prison.ts): the engine's hearing takes its place in a year it sits. */
const CONTENT_PAROLE_BOARD = 'cp_parole_hearing';

type Convict = (state: GameState, years: number) => GameState;

export function inJuvenileDetention(state: GameState): boolean {
  return state.crime.inPrison && state.crime.juvenile === true;
}

export function onParole(state: GameState): boolean {
  return !state.crime.inPrison && (state.crime.paroleYearsLeft ?? 0) > 0;
}

/**
 * How long a stay of `totalYears` (time already left included) really is at the player's age. An adult serves
 * it in full; a minor goes to juvenile detention for at most two years in all (time already served there
 * counts) and is out by 18.
 */
export function stayLength(state: GameState, totalYears: number): number {
  const total = Math.max(1, Math.round(totalYears));
  const age = state.character.age;
  if (age >= 18) return total;
  const c = state.crime;
  const served = c.inPrison && c.juvenile ? Math.max(0, (c.sentenceYears ?? c.sentenceYearsLeft) - c.sentenceYearsLeft) : 0;
  return Math.max(1, Math.min(total, JUVENILE_MAX_YEARS - served, 18 - age));
}

/** Years handed down if the player is convicted after this plea (before the juvenile cap). */
export function convictedYears(plea: TrialPlea, years: number): number {
  const factor = plea === 'plea' ? 0.6 : plea === 'lawyer' ? 0.8 : plea === 'self' ? 1.3 : 1;
  return Math.max(1, Math.round(years * factor));
}

/** Chance of walking free. Pleading guilty never does; a good lawyer is the best bet, a reputation the worst. */
export function acquittalChance(state: GameState, plea: TrialPlea, years: number): number {
  const smarts = state.character.stats.smarts;
  const notoriety = state.crime.notoriety;
  switch (plea) {
    case 'plea':
      return 0;
    case 'public':
      return clamp(0.2 + Math.max(0, smarts - 50) / 250 - notoriety / 300, 0.03, 0.6);
    case 'lawyer': {
      // 60% for a minor charge down to 45% for the most serious ones, before smarts and reputation.
      const severity = clamp((years - 1) / 9, 0, 1);
      return clamp(0.6 - 0.15 * severity + (smarts - 50) / 500 - notoriety / 400, 0.2, 0.85);
    }
    case 'self':
      return clamp(0.1 + (smarts - 50) / 150, 0.02, 0.6);
  }
}

/** A lawyer's fee: $4k for a one-year charge up to $60k for the most serious ones, scaled to the country. */
export function lawyerFee(state: GameState, years: number): number {
  const usd = 4000 + 56000 * clamp((years - 1) / 14, 0, 1);
  return scaleMoney(state, Math.round(usd / 500) * 500);
}

/** Odds as the player would say them, never as a percentage. */
export function oddsWords(p: number, kind: 'trial' | 'parole'): string {
  if (p < 0.2) return 'a long shot';
  if (p < 0.4) return kind === 'trial' ? 'probably lose' : 'unlikely';
  if (p < 0.6) return 'could go either way';
  if (p < 0.8) return kind === 'trial' ? 'probably win' : 'probably granted';
  return kind === 'trial' ? 'almost sure to win' : 'almost certain';
}

function facility(state: GameState): string {
  return state.character.age < 18 ? 'in juvenile detention' : 'in prison';
}

/**
 * The court card for an arrest: `years` is the sentence the charge carries (already doubled for a parole
 * violation). Juvenile court asks for at most its own maximum, and a plea deal or a lawyer works down from
 * that; the fee and the lawyer's odds still follow the charge. Everything the card shows is worked out now
 * and kept in its context; the verdict is worked out again from the state when a plea is chosen.
 */
export function trialCard(state: GameState, crimeId: string, years: number, paroleBroken = false): QueuedEvent {
  const minor = state.character.age < 18;
  const full = stayLength(state, years);
  const plea = stayLength(state, convictedYears('plea', full));
  const fee = lawyerFee(state, years);
  const affordable = canPay(state, fee);
  const odds = (p: TrialPlea) => oddsWords(acquittalChance(state, p, years), 'trial');
  return {
    eventId: TRIAL_EVENT_ID,
    context: {
      crime: crimeId,
      years: String(full),
      chargeYears: String(years),
      fee: String(fee),
      opening: `I stood in ${minor ? 'juvenile court' : 'court'}, charged with ${CRIME_BY_ID[crimeId]?.noun ?? 'a crime'}.`,
      sentence: `${plural(full, 'year')} ${facility(state)}`,
      paroleNote: paroleBroken ? ' I was on parole, so it counted double.' : '',
      deal: plea < full ? ` The prosecutor offered ${plural(plea, 'year')} if I pleaded guilty.` : ' Pleading guilty would at least end it quickly.',
      pleaHint: `${plural(plea, 'year')}, guaranteed`,
      publicHint: `Free · ${odds('public')}`,
      lawyerHint: `${money(state, fee)} · ${affordable ? odds('lawyer') : minor ? 'more than we have' : 'more than I have'}`,
      selfHint: `Free · ${odds('self')}`,
      'tone:lawyer': affordable ? 'cost' : 'credit',
    },
  };
}

const ACQUITTED: Record<Exclude<TrialPlea, 'plea'>, string> = {
  public: 'My public defender had forty other cases and still won mine. Not guilty.',
  lawyer: "My lawyer took the prosecution's case apart, one receipt at a time. Not guilty.",
  self: 'I represented myself, objected to everything and somehow won. Not guilty.',
};

function convictedLine(plea: TrialPlea, term: string, minor: boolean): string {
  switch (plea) {
    case 'plea':
      return minor ? `I admitted it. The judge gave me ${term}.` : `I pleaded guilty. The judge gave me ${term}.`;
    case 'public':
      return `My public defender did what one tired person could. Guilty: ${term}.`;
    case 'lawyer':
      return `My lawyer couldn't win it, but got the sentence down to ${term}.`;
    case 'self':
      return `Representing myself went badly. The judge gave me ${term}.`;
  }
}

/** The `trial` effect: settles the case in the court card's context. */
export function settleTrial(state: GameState, rng: Rng, plea: TrialPlea, vars: Readonly<Record<string, string>>, convict: Convict): GameState {
  const years = Number(vars.years);
  if (!(years >= 1) || state.crime.inPrison) return state;
  const charge = Number(vars.chargeYears) || years;
  const minor = state.character.age < 18;
  let s = state;
  if (plea === 'lawyer') {
    const fee = Number(vars.fee) || lawyerFee(s, charge);
    if (!canPay(s, fee)) {
      s = log(s, `The lawyer wanted ${money(s, fee)} up front. ${minor ? 'We' : 'I'} didn't have it.`, 'bad');
      // The same case again, without the lawyer.
      const hide = [...(vars.hide ? vars.hide.split(',') : []), 'lawyer'].join(',');
      const opening = 'No lawyer, then. The judge was still waiting.';
      return { ...s, eventQueue: [{ eventId: TRIAL_EVENT_ID, context: { ...vars, hide, opening } }, ...s.eventQueue] };
    }
    const parents = minor ? Math.min(fee, guardianFunds(s)) : 0;
    s = spend(s, fee);
    s = log(s, parents >= fee ? `My parents paid ${money(s, fee)} for a lawyer.` : parents > 0 ? `My parents and I scraped together ${money(s, fee)} for a lawyer.` : `I paid a lawyer ${money(s, fee)}.`, 'money');
  }
  if (plea === 'plea') s = addKarma(s, 1);
  if (plea !== 'plea' && rng.chance(acquittalChance(s, plea, charge))) {
    s = { ...s, crime: { ...s.crime, arrests: s.crime.arrests + 1, notoriety: clampStat(s.crime.notoriety + 2) } };
    s = bump(s, 'arrests');
    s = addStats(s, { happiness: 8 });
    s = log(s, ACQUITTED[plea], 'good');
    return setResult(s, 'Not guilty. I walked out of court free.', 'good');
  }
  const sentence = convictedYears(plea, years);
  const term = `${plural(stayLength(s, sentence), 'year')} ${facility(s)}`;
  s = convict(s, sentence);
  s = addStats(s, { happiness: plea === 'plea' ? -12 : -15 });
  s = log(s, convictedLine(plea, term, minor), 'bad');
  return setResult(s, `Guilty: ${term}.`, 'bad');
}

const numFlag = (s: GameState, key: string): number => {
  const v = s.flags[key];
  return typeof v === 'number' ? v : 0;
};

/** Good conduct written up by prison events raises the odds of a hearing and of parole; infractions lower them. */
function conduct(s: GameState): { good: number; bad: number; recommended: boolean } {
  return { good: Math.min(6, numFlag(s, 'cp_prison_good_conduct')), bad: Math.min(6, numFlag(s, 'cp_prison_infraction')), recommended: s.flags.cp_parole_recommended === true };
}

/** An adult who has served at least half of the current stay, with time still left, and has not waived parole. */
export function paroleEligible(state: GameState): boolean {
  const c = state.crime;
  if (!c.inPrison || c.juvenile || state.character.age < 18 || c.sentenceYearsLeft <= 0 || state.flags.paroleWaived === true) return false;
  const total = c.sentenceYears ?? c.sentenceYearsLeft;
  return (total - c.sentenceYearsLeft) * 2 >= total;
}

/** Yearly chance of a hearing once eligible: 30%, more with good conduct or a board recommendation. */
export function paroleHearingChance(state: GameState): number {
  const k = conduct(state);
  return clamp(0.3 + 0.05 * k.good - 0.05 * k.bad + (k.recommended ? 0.2 : 0), 0.1, 0.8);
}

export function paroleGrantChance(state: GameState, approach: ParoleApproach): number {
  if (approach === 'waive') return 0;
  const k = conduct(state);
  const base = 0.4 + 0.07 * k.good - 0.08 * k.bad + (k.recommended ? 0.15 : 0);
  return clamp(approach === 'remorse' ? base + 0.1 : base + (state.character.stats.smarts - 50) / 200, 0.05, 0.9);
}

export function paroleCard(state: GameState): QueuedEvent {
  const c = state.crime;
  const total = c.sentenceYears ?? c.sentenceYearsLeft;
  const k = conduct(state);
  return {
    eventId: PAROLE_EVENT_ID,
    context: {
      served: plural(total - c.sentenceYearsLeft, 'year'),
      left: plural(c.sentenceYearsLeft, 'year'),
      file: k.good >= 2 && k.good > k.bad ? 'My file mentioned good behavior more than once.' : k.bad >= 2 ? 'My file had a few write-ups in it.' : 'My file was mostly quiet.',
      remorseHint: oddsWords(paroleGrantChance(state, 'remorse'), 'parole'),
      plansHint: oddsWords(paroleGrantChance(state, 'plans'), 'parole'),
    },
  };
}

/**
 * The `paroleHearing` effect. Waiving means serving the full time: no more hearings this stay. The board does
 * not sit twice in a year, so the content board queued behind this hearing is dropped.
 */
export function settleParole(state: GameState, rng: Rng, approach: ParoleApproach): GameState {
  if (!state.crime.inPrison || state.crime.juvenile) return state;
  let s: GameState = { ...state, eventQueue: state.eventQueue.filter((q) => q.eventId !== CONTENT_PAROLE_BOARD) };
  if (approach === 'waive') {
    s = addStats({ ...s, flags: { ...s.flags, paroleWaived: true } }, { happiness: 1 });
    return log(s, "I told the board I'd serve every day and walk out owing nobody.", 'info');
  }
  if (approach === 'remorse') s = addKarma(s, 1);
  if (rng.chance(paroleGrantChance(s, approach))) return releaseFromPrison(s, 'parole');
  s = addStats(s, { happiness: -4 });
  return log(s, approach === 'remorse' ? 'They listened, nodded and denied parole. Maybe next year.' : 'They said my plans sounded like a wish list. Parole denied.', 'bad');
}

function releaseLine(state: GameState, how: 'served' | 'parole', juvenile: boolean): string {
  if (juvenile) {
    const parent = Object.values(state.people).find((p) => p.alive && (p.kind === 'mother' || p.kind === 'father')) ?? Object.values(state.people).find((p) => p.alive && (p.kind === 'stepmother' || p.kind === 'stepfather'));
    return parent
      ? `I walked out of juvenile detention with my things in a plastic bag. ${personRef(parent)} was waiting outside.`
      : 'I walked out of juvenile detention with my things in a plastic bag. Nobody came, so I took the bus.';
  }
  return how === 'parole'
    ? "The board granted parole. I walked out with my things in a paper bag and a parole officer's number."
    : 'I walked out of prison with my things in a paper bag. The sky looked enormous.';
}

/** Release day: out, a `released` flag for re-entry events, parole if granted, and back to school if still young. */
export function releaseFromPrison(state: GameState, how: 'served' | 'parole'): GameState {
  const juvenile = state.crime.juvenile === true;
  const crime = { ...state.crime, inPrison: false, sentenceYearsLeft: 0 };
  delete crime.juvenile;
  delete crime.sentenceYears;
  if (how === 'parole') crime.paroleYearsLeft = PAROLE_YEARS;
  crime.lastRelease = { age: state.character.age, juvenile };
  const flags: GameState['flags'] = { ...state.flags, released: true };
  if (how === 'parole') flags.parole = true;
  delete flags.cp_parole_recommended;
  delete flags.paroleWaived;
  // Conduct write-ups belong to this stay; a later sentence starts with a clean file.
  delete flags.cp_prison_good_conduct;
  delete flags.cp_prison_infraction;
  let s: GameState = { ...state, crime, flags };
  s = addStats(s, { happiness: 10 });
  s = log(s, releaseLine(s, how, juvenile), 'milestone');
  return returnToSchool(s);
}

/**
 * An event's `prison` effect narrates its own verdict. After the event's lines, the journal says how the sentence
 * really came out: doubled for a conviction on parole, or juvenile detention for a minor (two years at most, out
 * by 18). `years` is the sentence the event passed.
 */
export function verdictNote(before: GameState, after: GameState, years: number): GameState {
  if (!after.alive || !after.crime.inPrison || after.crime.convictions <= before.crime.convictions) return after;
  if (onParole(before)) return log(after, `I was on parole, so it counted double: ${plural(Math.max(1, Math.round(years * 2)), 'year')}.`, 'bad');
  if (!after.crime.juvenile) return after;
  const age = before.character.age;
  const stay = after.crime.sentenceYearsLeft - (before.crime.inPrison ? before.crime.sentenceYearsLeft : 0);
  if (stay <= 0) return after;
  return log(after, stay < Math.max(1, Math.round(years)) ? `I was ${age}, so it meant juvenile detention instead: ${plural(stay, 'year')}.` : `I was ${age}, so I'd serve it in juvenile detention.`, 'bad');
}

/** A year on parole passes outside; it ends quietly after two full years. */
export function yearlyParole(state: GameState): GameState {
  if (!onParole(state)) return state;
  const left = (state.crime.paroleYearsLeft ?? 0) - 1;
  if (left > 0) return { ...state, crime: { ...state.crime, paroleYearsLeft: left } };
  const crime = { ...state.crime };
  delete crime.paroleYearsLeft;
  const flags = { ...state.flags };
  delete flags.parole;
  return log({ ...state, crime, flags }, 'My parole ended. Nobody checks up on me anymore.', 'good');
}

/** Ends parole early: a new conviction sends the player back inside. */
export function revokeParole(state: GameState): GameState {
  if (state.crime.paroleYearsLeft === undefined && state.flags.parole === undefined) return state;
  const crime = { ...state.crime };
  delete crime.paroleYearsLeft;
  const flags = { ...state.flags };
  delete flags.parole;
  return { ...state, crime, flags };
}

/** At 18 a record from before 18 is sealed: no longer a record for jobs or events, or in the obituary. */
export function sealJuvenileRecord(state: GameState): GameState {
  if (state.character.age !== 18 || state.crime.inPrison || !state.crime.record) return state;
  const s: GameState = { ...state, crime: { ...state.crime, record: false, sealedConvictions: state.crime.convictions } };
  return log(s, 'My juvenile record was sealed. On paper, adult me starts clean.', 'milestone');
}

/**
 * Older saves predate juvenile court and parole: a minor in prison moves to juvenile detention (school
 * resumes, the stay is capped), and an adult's stay gets a length so parole can be worked out.
 */
export function upgradeJusticeState(state: GameState): GameState {
  const c = state.crime;
  if (!c.inPrison) return state;
  if (state.character.age < 18 && c.juvenile === undefined) {
    const edu = state.education;
    const school = (edu.stage === 'primary' || edu.stage === 'middle' || edu.stage === 'high') && !edu.droppedOut && !edu.expelled;
    const left = stayLength(state, c.sentenceYearsLeft);
    return {
      ...state,
      crime: { ...c, juvenile: true, sentenceYearsLeft: left, sentenceYears: left },
      education: school ? { ...edu, enrolled: true } : edu,
    };
  }
  if (c.sentenceYears === undefined) return { ...state, crime: { ...c, sentenceYears: c.sentenceYearsLeft } };
  return state;
}

const TRIAL_EVENT: EventDef = {
  id: TRIAL_EVENT_ID,
  category: 'crime',
  title: 'My day in court',
  text: '{{opening}} If convicted, I was looking at {{sentence}}.{{paroleNote}}{{deal}}',
  minAge: 0,
  maxAge: 120,
  weight: 0,
  followUpOnly: true,
  conditions: [{ inPrison: false }],
  vars: ['opening', 'sentence', 'paroleNote', 'deal', 'pleaHint', 'publicHint', 'lawyerHint', 'selfHint'],
  choices: [
    { id: 'plea', label: 'Plead guilty', hint: '{{pleaHint}}', effects: [{ trial: 'plea' }] },
    { id: 'public', label: 'Take the public defender', hint: '{{publicHint}}', effects: [{ trial: 'public' }] },
    { id: 'lawyer', label: 'Hire a lawyer', hint: '{{lawyerHint}}', effects: [{ trial: 'lawyer' }] },
    { id: 'self', label: 'Represent myself', hint: '{{selfHint}}', effects: [{ trial: 'self' }] },
  ],
};

const PAROLE_EVENT: EventDef = {
  id: PAROLE_EVENT_ID,
  category: 'prison',
  title: 'Parole hearing',
  text: 'The parole board had my file open: {{served}} served, {{left}} to go. {{file}} They asked what I would do with my freedom.',
  minAge: 18,
  maxAge: 120,
  weight: 0,
  followUpOnly: true,
  conditions: [{ inPrison: true }, { juvenile: false }],
  vars: ['served', 'left', 'file', 'remorseHint', 'plansHint'],
  choices: [
    { id: 'remorse', label: 'Show real remorse', hint: '{{remorseHint}}', effects: [{ paroleHearing: 'remorse' }] },
    { id: 'plans', label: 'Talk about my plans', hint: '{{plansHint}}', effects: [{ paroleHearing: 'plans' }] },
    { id: 'waive', label: 'Serve my full time', hint: 'No parole strings', effects: [{ paroleHearing: 'waive' }] },
  ],
};

/** The engine's own cards, part of every event registry. */
export const SYSTEM_EVENTS: readonly EventDef[] = [TRIAL_EVENT, PAROLE_EVENT];
