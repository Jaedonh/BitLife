import { getCountry } from '@/data/countries';
import { HUSTLE_BY_ID, HUSTLES, type HustleDef } from '@/data/hustles';
import { JOB_BY_ID, JOBS, type JobDef } from '@/data/jobs';
import { majorProse } from '@/data/majors';
import { COMPANY_NAMES, COMPANY_SUFFIXES } from '@/data/names';
import { removeJob } from '../events/effects';
import { scaleMoney } from '../events/text';
import { Rng } from '../rng';
import type { GameState, Job, JobListing } from '../types';
import { addStats, bump, capitalize, clampStat, formatMoney, log, lowerTitle, plural, roleWithArticle, sentence, setResult, withArticle, withFame } from '../util';
import { bachelorMajor, hasDegree, hasHighSchool } from './education';

/** Past this age job listings stay closed; from 60 interviews get harder every year (applyForJob). */
export const MAX_HIRING_AGE = 75;

export function meetsRequirements(state: GameState, def: JobDef): { ok: boolean; reason?: string } {
  const r = def.requirements;
  const c = state.character;
  if (c.age < (r.minAge ?? (def.partTime ? 14 : 18))) return { ok: false, reason: `Age ${r.minAge ?? (def.partTime ? 14 : 18)}+` };
  if (def.partTime && c.age > 24) return { ok: false, reason: 'Part-time roles are for under-25s' };
  if (c.age > MAX_HIRING_AGE) return { ok: false, reason: 'Nobody is hiring at my age' };
  if (def.id === 'military' && c.age > 35) return { ok: false, reason: 'Too old to enlist' };
  if (state.crime.inPrison) return { ok: false, reason: 'In prison' };
  if (r.noRecord && state.crime.record) return { ok: false, reason: 'Criminal record' };
  switch (r.education) {
    case 'high_school':
      if (!hasHighSchool(state)) return { ok: false, reason: 'Needs a high school diploma' };
      break;
    case 'bachelor': {
      const major = bachelorMajor(state);
      if (!major) return { ok: false, reason: "Needs a bachelor's degree" };
      if (r.majors && r.majors.length && !r.majors.includes(major) && !hasDegree(state, 'master') && !hasDegree(state, 'doctor')) return { ok: false, reason: `Needs a degree in ${r.majors.slice(0, 2).map(majorProse).join(' or ')}` };
      break;
    }
    case 'master':
      if (!hasDegree(state, 'master') && !hasDegree(state, 'doctor')) return { ok: false, reason: "Needs a master's degree" };
      break;
    case 'doctor':
      if (!hasDegree(state, 'doctor')) return { ok: false, reason: 'Needs a doctorate' };
      break;
    case 'doctor:medicine':
    case 'doctor:law':
    case 'doctor:dentistry':
      if (!state.education.degrees.includes(r.education)) return { ok: false, reason: r.education === 'doctor:medicine' ? 'Needs medical school' : r.education === 'doctor:law' ? 'Needs law school' : 'Needs dental school' };
      break;
    default:
      break;
  }
  if (r.minSmarts !== undefined && c.stats.smarts < r.minSmarts) return { ok: false, reason: `Needs ${r.minSmarts} Smarts` };
  if (r.minLooks !== undefined && r.minLooks > 0 && c.stats.looks < r.minLooks) return { ok: false, reason: `Needs ${r.minLooks} Looks` };
  if (r.minHealth !== undefined && c.stats.health < r.minHealth) return { ok: false, reason: `Needs ${r.minHealth} Health` };
  if (r.experience !== undefined && (state.career.experience[def.category] ?? 0) + Math.floor(state.career.totalYearsWorked / 2) < r.experience) return { ok: false, reason: `Needs ${plural(r.experience, 'year')} of experience` };
  return { ok: true };
}

/** A student job kept past 24 moves to full hours: its base pay becomes at least an entry-level full-time wage (USD, country-scaled). */
export const PART_TIME_LIVING_WAGE = 24_000;

/** The rung's base pay in local money; a part-time rung held past 24 is paid at least the living wage. */
function rungBase(state: GameState, def: JobDef, level: number): number {
  const base = scaleMoney(state, def.ladder[Math.min(level, def.ladder.length - 1)]!.salary);
  return def.partTime && state.character.age > 24 ? Math.max(base, scaleMoney(state, PART_TIME_LIVING_WAGE)) : base;
}

/** Pay ceiling for a rung: listings roll up to 1.12x the base, raises can push ~12% further. */
export function salaryCap(state: GameState, def: JobDef, level: number): number {
  return Math.round(rungBase(state, def, level) * 1.25);
}

export function listingSalary(state: GameState, def: JobDef, level: number, rng: Rng): number {
  const base = def.ladder[Math.min(level, def.ladder.length - 1)]!.salary;
  return Math.round(scaleMoney(state, base) * rng.float(0.92, 1.12));
}

/**
 * Who a job is with. Most jobs are at a generic company ("Granite & Sons"); jobs that only exist at a
 * hospital, a school, a police force and so on get an employer that sounds like one. The name and
 * suffix are drawn exactly as before, so the RNG sequence is unchanged.
 */
const EMPLOYERS: Record<string, (base: string, city: string) => string> = {
  pt_cashier: (b) => `${b} Market`,
  pt_babysitter: (b) => `${b} Daycare`,
  pt_lifeguard: (_b, c) => `the ${c} Aquatic Center`,
  pt_barista: (b) => `${b} Coffee`,
  pt_tutor: (b) => `${b} Tutoring`,
  pt_delivery: (b) => `${b} Eats`,
  fast_food: (b) => `${b} Burger`,
  waiter: (b) => `${b} Bistro`,
  bartender: (b) => `the ${b} Tavern`,
  hairdresser: (b) => `${b} Salon`,
  fitness_trainer: (b) => `${b} Fitness`,
  chef: (b) => `${b} Kitchen`,
  mechanic: (b) => `${b} Auto`,
  police: (_b, c) => `the ${c} Police Department`,
  firefighter: (_b, c) => `the ${c} Fire Department`,
  military: () => 'the Army',
  mail_carrier: () => 'the Postal Service',
  civil_servant: (_b, c) => (c.endsWith(' City') ? `${c} Hall` : `${c} City Hall`),
  politician: (_b, c) => (c.endsWith(' City') ? `${c} Hall` : `${c} City Hall`),
  bank_teller: (b) => `${b} Bank`,
  insurance_agent: (b) => `${b} Insurance`,
  caregiver: (b) => `${b} Senior Living`,
  paramedic: (_b, c) => `${c} EMS`,
  nurse: (b) => `${b} General Hospital`,
  doctor: (b) => `${b} General Hospital`,
  surgeon: (b) => `${b} General Hospital`,
  pharmacist: (b) => `${b} Pharmacy`,
  dentist: (b) => `${b} Dental`,
  therapist: (b) => `${b} Counseling`,
  vet: (b) => `${b} Animal Hospital`,
  paralegal: (b) => `${b} Law`,
  lawyer: (b) => `${b} Law`,
  judge: (_b, c) => `the ${c} District Court`,
  teacher: (b) => `${b} High School`,
  professor: (_b, c) => `the University of ${c}`,
  librarian: (_b, c) => `the ${c} Public Library`,
  scientist: (b) => `the ${b} Institute`,
  pilot: (b) => `${b} Airlines`,
  journalist: (b) => `the ${b} Herald`,
  actor: (b) => `${b} Pictures`,
  musician: (b) => `${b} Records`,
  athlete: (_b, c) => `${c} Athletic`,
  coach: (_b, c) => `${c} Athletic`,
};

function employerFor(def: JobDef, rng: Rng, city: string): string {
  const base = rng.pick(COMPANY_NAMES);
  const suffix = rng.pick(COMPANY_SUFFIXES);
  const named = EMPLOYERS[def.id];
  return named ? named(base, city) : `${base} ${suffix}`;
}

/**
 * The journal line for a step up the ladder: "I was promoted to senior teller." Elected and appointed
 * offices, owners and stars get a line that fits how anyone reaches them.
 */
function promotionLine(def: JobDef, title: string): string {
  switch (title) {
    case 'City Councilor': return 'I was elected to the city council.';
    case 'Mayor': return 'I was elected mayor.';
    case 'Member of Parliament': return 'I won a seat in Parliament.';
    case 'Minister': return 'I was appointed a government minister.';
    case 'District Judge': return 'I was appointed a district judge.';
    case 'Appeals Judge': return 'I was appointed to the court of appeals.';
    case 'Supreme Court Justice': return 'I was appointed to the Supreme Court.';
    case 'Hall of Famer': return 'I was voted into the Hall of Fame.';
    case 'Partner': return 'I was made a partner.';
    default:
      if (['actor', 'musician', 'chef_tv', 'athlete'].includes(def.id) || /(Owner|Contractor|Author)$/.test(title)) return `I became ${roleWithArticle(title)}.`;
      return `I was promoted to ${lowerTitle(title)}.`;
  }
}

/** Why a fresh set of job listings would be useless right now (null when it would not). */
export function listingsBlocker(state: GameState): string | null {
  if (state.character.age < 14) return "I'm too young for job listings. They open up at 14.";
  if (state.crime.inPrison) return "I can't job-hunt from a prison cell.";
  return null;
}

/** Rolls a fresh set of job listings for this year. */
export function rollListings(state: GameState, rng: Rng): GameState {
  const age = state.character.age;
  const pool = JOBS.filter((j) => (j.partTime ? age >= 14 && age <= 24 : age >= 16));
  const fullTime = rng.shuffle(pool.filter((j) => !j.partTime)).slice(0, 10);
  const partTime = age <= 24 ? rng.shuffle(pool.filter((j) => j.partTime)).slice(0, 4) : [];
  const listings: JobListing[] = [...partTime, ...fullTime].map((def) => ({
    id: rng.id('l_'),
    defId: def.id,
    title: def.ladder[0]!.title,
    company: employerFor(def, rng, state.character.city),
    salary: listingSalary(state, def, 0, rng),
    category: def.category,
    partTime: !!def.partTime,
  }));
  return { ...state, career: { ...state.career, listings, listingsYear: state.year } };
}

export function applyForJob(state: GameState, rng: Rng, listingId: string): GameState {
  const listing = state.career.listings.find((l) => l.id === listingId);
  if (!listing) return setResult(state, 'That listing is gone.', 'bad');
  const def = JOB_BY_ID[listing.defId];
  if (!def) return state;
  const req = meetsRequirements(state, def);
  if (!req.ok) {
    const reason = req.reason ?? 'not eligible';
    return setResult(state, `Rejected: ${/^[A-Z][a-z]/.test(reason) ? reason[0]!.toLowerCase() + reason.slice(1) : reason}.`, 'bad');
  }
  if (state.career.job && !state.career.job.partTime && listing.partTime) return setResult(state, "I'd have to quit my full-time job first.", 'bad');
  const c = state.character;
  let chance = 0.65 + (c.stats.smarts - 50) / 200 + (c.stats.looks - 50) / 400;
  if (c.traits.includes('charming')) chance += 0.1;
  if (state.crime.record) chance -= 0.1;
  // Employers favor younger candidates for new hires: from 60 the odds drop about 3 points a year.
  if (c.age > 60) chance -= (c.age - 60) * 0.03;
  if (!rng.chance(Math.max(c.age > 60 ? 0.05 : 0.15, Math.min(0.95, chance)))) {
    const military = def.id === 'military';
    let s = log(state, military ? 'I tried to enlist in the Army and was turned down.' : `I interviewed for ${withArticle(`${lowerTitle(listing.title)} position`)} at ${listing.company} and didn't get it.`, 'bad');
    s = addStats(s, { happiness: -2 });
    s = { ...s, career: { ...s.career, listings: s.career.listings.filter((l) => l.id !== listingId) } };
    return setResult(s, military ? 'The Army turned me down.' : `${capitalize(listing.company)} went with another candidate.`, 'bad');
  }
  let s = state.career.job ? removeJob(state, 'left') : state;
  const job: Job = {
    defId: def.id,
    title: listing.title,
    company: listing.company,
    salary: listing.salary,
    level: 0,
    performance: 55,
    yearsHeld: 0,
    yearsAtLevel: 0,
    category: def.category,
    partTime: listing.partTime,
    askedThisYear: false,
    workedHarderThisYear: false,
  };
  s = { ...s, career: { ...s.career, job, listings: s.career.listings.filter((l) => l.id !== listingId) } };
  s = bump(s, 'jobsHeld');
  s = addStats(s, { happiness: 5 });
  s = log(s, def.id === 'military' ? `I enlisted in the Army as ${roleWithArticle(job.title)}.` : sentence(`I was hired as ${roleWithArticle(job.title)} at ${job.company}`), 'milestone');
  return setResult(s, def.id === 'military' ? `Enlisted! ${job.title} in the Army.` : sentence(`Hired! ${job.title} at ${job.company}`), 'good');
}

export function quitJob(state: GameState): GameState {
  if (!state.career.job) return state;
  const { title, defId } = state.career.job;
  let s = removeJob(state, 'quit');
  s = log(s, defId === 'military' ? `I left the Army as ${roleWithArticle(title)}.` : `I quit my job as ${roleWithArticle(title)}.`);
  return setResult(s, 'I handed in my notice.', 'info');
}

export function workHarder(state: GameState): GameState {
  const job = state.career.job;
  if (!job) return state;
  if (job.workedHarderThisYear) return setResult(state, "I'm already working as hard as I can this year.", 'info');
  let s: GameState = { ...state, career: { ...state.career, job: { ...job, performance: clampStat(job.performance + 8), workedHarderThisYear: true } } };
  s = addStats(s, { happiness: -2, health: -1 });
  return setResult(s, 'I put in extra hours. My boss noticed.', 'good');
}

export function askForRaise(state: GameState, rng: Rng): GameState {
  const job = state.career.job;
  if (!job) return state;
  if (job.askedThisYear) return setResult(state, 'I already asked this year. Best not to push it.', 'info');
  const def = JOB_BY_ID[job.defId];
  const cap = def ? salaryCap(state, def, job.level) : Infinity;
  if (job.salary >= cap) return setResult(state, "I'm already at the top of the pay band for this role.", 'info');
  const chance = job.performance >= 80 ? 0.6 : job.performance >= 60 ? 0.35 : 0.1;
  let s: GameState = { ...state, career: { ...state.career, job: { ...job, askedThisYear: true } } };
  if (rng.chance(chance + (state.character.traits.includes('charming') ? 0.1 : 0))) {
    const pct = rng.int(4, 10);
    s = { ...s, career: { ...s.career, job: { ...s.career.job!, salary: Math.min(cap, Math.round(job.salary * (1 + pct / 100))) } } };
    s = log(s, `I asked for a raise and got ${pct}%.`, 'good');
    return setResult(s, `Raise approved: +${pct}%.`, 'good');
  }
  s = log(s, 'I asked for a raise and was told "not this year".', 'bad');
  s = addStats(s, { happiness: -2 });
  return setResult(s, 'Denied. "Budget constraints."', 'bad');
}

function promote(state: GameState, rng: Rng, job: Job, def: JobDef): GameState {
  const nextLevel = job.level + 1;
  const title = def.ladder[nextLevel]!.title;
  const salary = Math.max(job.salary, Math.min(salaryCap(state, def, nextLevel), Math.max(Math.round(job.salary * 1.1), listingSalary(state, def, nextLevel, rng))));
  let s: GameState = { ...state, career: { ...state.career, job: { ...job, level: nextLevel, title, salary, yearsAtLevel: 0, performance: clampStat(job.performance - 10) } } };
  s = bump(s, 'promotions');
  s = addStats(s, { happiness: 6 });
  s = log(s, promotionLine(def, title), 'milestone');
  return s;
}

export function askForPromotion(state: GameState, rng: Rng): GameState {
  const job = state.career.job;
  if (!job) return state;
  const def = JOB_BY_ID[job.defId];
  if (!def) return state;
  if (job.level >= def.ladder.length - 1) return setResult(state, "I'm already at the top of this ladder.", 'info');
  if (job.askedThisYear) return setResult(state, 'I already asked this year.', 'info');
  let s: GameState = { ...state, career: { ...state.career, job: { ...job, askedThisYear: true } } };
  const chance = job.performance >= 85 && job.yearsAtLevel >= 1 ? 0.55 : job.performance >= 70 && job.yearsAtLevel >= 2 ? 0.4 : 0.08;
  if (rng.chance(chance)) {
    s = promote(s, rng, s.career.job!, def);
    return setResult(s, promotionLine(def, s.career.job!.title), 'good');
  }
  s = log(s, 'I asked for a promotion and was told to keep proving myself.', 'bad');
  return setResult(s, 'Not yet. "Keep it up."', 'bad');
}

export function retire(state: GameState): GameState {
  if (!state.career.job) return state;
  if (state.character.age < 60) return setResult(state, 'Retirement starts at 60.', 'info');
  let s = removeJob(state, 'retired');
  s = { ...s, career: { ...s.career, retired: true } };
  s = addStats(s, { happiness: 6 });
  s = log(s, 'I retired. Time to finally relax.', 'milestone');
  return setResult(s, 'Retired with a pension.', 'good');
}

/** Yearly career progression: performance drift, raises, promotions, layoffs, injuries, hustle income. */
export function yearlyCareer(state: GameState, rng: Rng, servedYear = false): GameState {
  let s = state;
  const job = s.career.job;
  if (job && !s.crime.inPrison) {
    const def = JOB_BY_ID[job.defId];
    if (!def) return s;
    const c = s.character;
    let perf = job.performance + rng.int(-7, 6) + (c.stats.smarts - 50) / 20;
    if (c.stats.happiness < 25) perf -= 5;
    if (c.stats.health < 30) perf -= 5;
    if ((s.health.addictions.alcohol ?? 0) >= 40 || (s.health.addictions.drugs ?? 0) >= 40) perf -= 8;
    perf = clampStat(perf);
    let updated: Job = { ...job, performance: perf, yearsHeld: job.yearsHeld + 1, yearsAtLevel: job.yearsAtLevel + 1 };
    const floor = rungBase(s, def, job.level);
    if (job.partTime && c.age > 24 && updated.salary < floor) {
      // A student job kept past 24 goes full hours, so it pays enough to live on.
      updated = { ...updated, salary: floor };
      s = log(s, `${capitalize(job.company)} moved me to full hours. My pay rose to ${formatMoney(floor, c.countryCode)} a year.`, 'money');
    }
    s = { ...s, career: { ...s.career, job: updated, totalYearsWorked: s.career.totalYearsWorked + 1, experience: { ...s.career.experience, [def.category]: (s.career.experience[def.category] ?? 0) + 1 } } };
    s = bump(s, 'yearsEmployed');
    s = addStats(s, { happiness: -Math.round(def.stress / 25), health: -Math.round(def.stress / 30) });
    // Fame comes from the rungs above entry level; out of the spotlight it fades.
    if (def.fame) s = withFame(s, s.character.fame + def.fame * updated.level);
    else if (s.character.fame > 0) s = { ...s, character: { ...s.character, fame: clampStat(s.character.fame - 3) } };
    if (rng.chance(def.danger / 400)) {
      s = addStats(s, { health: -rng.int(4, 12) });
      s = { ...s, health: { ...s.health, injuries: s.health.injuries + 1 } };
      s = log(s, 'I was injured on the job.', 'bad');
    }
    if (perf < 18 && rng.chance(0.5)) {
      s = removeJob(s, 'fired');
      s = addStats(s, { happiness: -10 });
      s = log(s, def.id === 'military' ? 'I was discharged from the Army for poor performance.' : `I was fired from ${job.company} for poor performance.`, 'bad');
      return yearlyHustle(s, rng, servedYear);
    }
    if (rng.chance(0.02)) {
      s = removeJob(s, 'fired');
      s = addStats(s, { happiness: -8 });
      s = log(s, def.id === 'military' ? 'The Army cut its numbers and I was discharged.' : `${capitalize(job.company)} made cutbacks and I was laid off.`, 'bad');
      return yearlyHustle(s, rng, servedYear);
    }
    if (perf >= 65 && updated.yearsAtLevel >= 1) {
      const pct = rng.int(1, 5);
      // Yearly raises stop at the rung's pay ceiling; only a promotion moves the ceiling.
      updated = { ...updated, salary: Math.max(updated.salary, Math.min(salaryCap(s, def, updated.level), Math.round(updated.salary * (1 + pct / 100)))) };
      s = { ...s, career: { ...s.career, job: updated } };
    }
    if (!updated.partTime && updated.level < def.ladder.length - 1 && perf >= 72 && updated.yearsAtLevel >= 2 && rng.chance(0.3)) {
      s = promote(s, rng, updated, def);
    }
  } else if (s.character.fame > 0) {
    s = { ...s, character: { ...s.character, fame: clampStat(s.character.fame - 3) } };
  }
  return yearlyHustle(s, rng, servedYear);
}

/** Owns a car that can carry passengers (a bike or scooter does not count). */
export function ownsCar(state: GameState): boolean {
  return state.assets.some((a) => a.kind === 'car' && !['bike', 'scooter'].includes(a.defId));
}

/** Why this hustle cannot be started right now (null when it can). */
export function hustleBlocker(state: GameState, def: HustleDef): string | null {
  if (state.crime.inPrison) return "I can't run a side hustle from a prison cell.";
  if (state.career.hustle) return 'I already have a side hustle going.';
  if (state.character.age < def.minAge) return `I have to be ${def.minAge} or older for that.`;
  if (def.needsCar && !ownsCar(state)) return 'I need a car for that.';
  if (state.character.energy < def.energy) return "I'm out of energy this year. Age up to recharge.";
  return null;
}

/** A hustle that needs a car ends once no car is owned (sold, wrecked or repossessed). */
export function dropCarlessHustle(state: GameState): GameState {
  const h = state.career.hustle;
  const def = h ? HUSTLE_BY_ID[h.defId] : undefined;
  if (!def?.needsCar || ownsCar(state)) return state;
  const text = `Without a car, my ${def.noun} was over.`;
  let s: GameState = { ...state, career: { ...state.career, hustle: null } };
  s = log(s, text);
  return s.lastResult ? { ...s, lastResult: { ...s.lastResult, text: `${s.lastResult.text} ${text}` } } : s;
}

/** Starts a side hustle. It takes its energy now and again every year it keeps running. */
export function startHustle(state: GameState, defId: string): GameState {
  const def = HUSTLE_BY_ID[defId];
  if (!def) return state;
  const blocked = hustleBlocker(state, def);
  if (blocked) return setResult(state, blocked, state.career.hustle ? 'info' : 'bad');
  let s: GameState = { ...state, character: { ...state.character, energy: state.character.energy - def.energy }, career: { ...state.career, hustle: { defId, name: def.name, level: 0, followers: 0, yearsActive: 0, lastIncome: 0 } } };
  s = log(s, `I started ${withArticle(def.noun)} on the side.`);
  return setResult(s, `Started: ${def.name}.`, 'good');
}

export function stopHustle(state: GameState): GameState {
  if (!state.career.hustle) return state;
  const noun = HUSTLE_BY_ID[state.career.hustle.defId]?.noun ?? state.career.hustle.name.toLowerCase();
  let s: GameState = { ...state, career: { ...state.career, hustle: null } };
  s = log(s, `I shut down my ${noun}.`);
  return setResult(s, 'Hustle closed.', 'info');
}

function yearlyHustle(before: GameState, rng: Rng, servedYear: boolean): GameState {
  const state = dropCarlessHustle(before);
  const h = state.career.hustle;
  if (!h || state.crime.inPrison || servedYear) return h ? { ...state, career: { ...state.career, hustle: { ...h, lastIncome: 0 } } } : state;
  const def = HUSTLE_BY_ID[h.defId];
  if (!def) return state;
  const c = state.character;
  const stat = c.stats[def.stat];
  const boost = c.traits.includes('creative') && ['streamer', 'etsy', 'app_dev'].includes(def.id) ? 0.15 : 0;
  let level = h.level;
  if (level < 5 && rng.chance(def.growth * (0.3 + stat / 120) + boost)) level += 1;
  else if (level > 0 && rng.chance(0.08)) level -= 1;
  let income = Math.round(scaleMoney(state, def.incomeByLevel[level] ?? 0) * rng.float(0.8, 1.2));
  let s = state;
  if (def.viralChance > 0 && level >= 2 && rng.chance(def.viralChance)) {
    income += scaleMoney(s, def.viralBonus);
    s = log(s, def.id === 'app_dev' ? 'One of my apps went viral this year!' : `My ${def.noun} went viral this year!`, 'good');
    s = addStats(s, { happiness: 8 });
  }
  if (level > h.level) s = log(s, `My ${def.noun} is growing. It reached level ${level}.`, 'good');
  if (level >= 3 && def.fame) s = withFame(s, s.character.fame + def.fame);
  if (level >= 5) s = { ...s, flags: { ...s.flags, hustleMaxed: true } };
  s = { ...s, career: { ...s.career, hustle: { ...h, level, yearsActive: h.yearsActive + 1, lastIncome: income, followers: Math.round(h.followers * 1.1 + level * level * 1000) } } };
  // Keeping it running takes energy out of the new year's budget.
  return { ...s, character: { ...s.character, energy: Math.max(0, s.character.energy - def.energy) } };
}

export function hustleOptions(state: GameState): { def: HustleDef; eligible: boolean; reason?: string }[] {
  return HUSTLES.map((h) => {
    const reason = state.character.age < h.minAge ? `Age ${h.minAge}+` : hustleBlocker(state, h);
    return reason ? { def: h, eligible: false, reason } : { def: h, eligible: true };
  });
}

export function countryCurrency(state: GameState): string {
  return getCountry(state.character.countryCode).currencySymbol;
}
