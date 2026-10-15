import { getCountry } from '@/data/countries';
import { HUSTLE_BY_ID, HUSTLES } from '@/data/hustles';
import { JOB_BY_ID, JOBS, type JobDef } from '@/data/jobs';
import { removeJob } from '../events/effects';
import { scaleMoney } from '../events/text';
import { Rng } from '../rng';
import type { GameState, Job, JobListing } from '../types';
import { addStats, bump, clampStat, log, setResult } from '../util';
import { randomCompany } from './character';
import { bachelorMajor, hasDegree, hasHighSchool } from './education';

export function meetsRequirements(state: GameState, def: JobDef): { ok: boolean; reason?: string } {
  const r = def.requirements;
  const c = state.character;
  if (c.age < (r.minAge ?? (def.partTime ? 14 : 18))) return { ok: false, reason: `Must be ${r.minAge ?? (def.partTime ? 14 : 18)}+` };
  if (def.partTime && c.age > 24) return { ok: false, reason: 'Part-time roles are for students' };
  if (state.crime.inPrison) return { ok: false, reason: 'In prison' };
  if (r.noRecord && state.crime.record) return { ok: false, reason: 'Criminal record' };
  switch (r.education) {
    case 'high_school':
      if (!hasHighSchool(state)) return { ok: false, reason: 'Needs high school diploma' };
      break;
    case 'bachelor': {
      const major = bachelorMajor(state);
      if (!major) return { ok: false, reason: "Needs a bachelor's degree" };
      if (r.majors && r.majors.length && !r.majors.includes(major) && !hasDegree(state, 'master') && !hasDegree(state, 'doctor')) return { ok: false, reason: `Needs a degree in ${r.majors.slice(0, 2).join(' or ')}` };
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
  if (r.experience !== undefined && (state.career.experience[def.category] ?? 0) + Math.floor(state.career.totalYearsWorked / 2) < r.experience) return { ok: false, reason: `Needs ${r.experience} years experience` };
  return { ok: true };
}

export function listingSalary(state: GameState, def: JobDef, level: number, rng: Rng): number {
  const base = def.ladder[Math.min(level, def.ladder.length - 1)]!.salary;
  return Math.round(scaleMoney(state, base) * rng.float(0.92, 1.12));
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
    company: randomCompany(rng),
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
  if (!req.ok) return setResult(state, `Rejected: ${req.reason}.`, 'bad');
  if (state.career.job && !state.career.job.partTime && listing.partTime) return setResult(state, 'Quit your full-time job first.', 'bad');
  const c = state.character;
  let chance = 0.65 + (c.stats.smarts - 50) / 200 + (c.stats.looks - 50) / 400;
  if (c.traits.includes('charming')) chance += 0.1;
  if (state.crime.record) chance -= 0.1;
  if (!rng.chance(Math.max(0.15, Math.min(0.95, chance)))) {
    let s = log(state, `I interviewed for a ${listing.title.toLowerCase()} position at ${listing.company} and didn't get it.`, 'bad');
    s = addStats(s, { happiness: -2 });
    s = { ...s, career: { ...s.career, listings: s.career.listings.filter((l) => l.id !== listingId) } };
    return setResult(s, `${listing.company} went with another candidate.`, 'bad');
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
  s = log(s, `I was hired as a ${job.title.toLowerCase()} at ${job.company}.`, 'milestone');
  return setResult(s, `Hired! ${job.title} at ${job.company}.`, 'good');
}

export function quitJob(state: GameState): GameState {
  if (!state.career.job) return state;
  const title = state.career.job.title;
  let s = removeJob(state, 'quit');
  s = log(s, `I quit my job as a ${title.toLowerCase()}.`);
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
  const chance = job.performance >= 80 ? 0.6 : job.performance >= 60 ? 0.35 : 0.1;
  let s: GameState = { ...state, career: { ...state.career, job: { ...job, askedThisYear: true } } };
  if (rng.chance(chance + (state.character.traits.includes('charming') ? 0.1 : 0))) {
    const pct = rng.int(4, 10);
    s = { ...s, career: { ...s.career, job: { ...s.career.job!, salary: Math.round(job.salary * (1 + pct / 100)) } } };
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
  const salary = Math.max(Math.round(job.salary * 1.1), listingSalary(state, def, nextLevel, rng));
  let s: GameState = { ...state, career: { ...state.career, job: { ...job, level: nextLevel, title, salary, yearsAtLevel: 0, performance: clampStat(job.performance - 10) } } };
  s = bump(s, 'promotions');
  s = addStats(s, { happiness: 6 });
  s = log(s, `I was promoted to ${title}.`, 'milestone');
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
    return setResult(s, `Promoted to ${s.career.job!.title}!`, 'good');
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
export function yearlyCareer(state: GameState, rng: Rng): GameState {
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
    s = { ...s, career: { ...s.career, job: updated, totalYearsWorked: s.career.totalYearsWorked + 1, experience: { ...s.career.experience, [def.category]: (s.career.experience[def.category] ?? 0) + 1 } } };
    s = bump(s, 'yearsEmployed');
    s = addStats(s, { happiness: -Math.round(def.stress / 25), health: -Math.round(def.stress / 30) });
    if (def.fame) s = { ...s, character: { ...s.character, fame: clampStat(s.character.fame + def.fame * (1 + updated.level)) } };
    if (rng.chance(def.danger / 400)) {
      s = addStats(s, { health: -rng.int(4, 12) });
      s = { ...s, health: { ...s.health, injuries: s.health.injuries + 1 } };
      s = log(s, 'I was injured on the job.', 'bad');
    }
    if (perf < 18 && rng.chance(0.5)) {
      s = removeJob(s, 'fired');
      s = addStats(s, { happiness: -10 });
      s = log(s, `I was fired from ${job.company} for poor performance.`, 'bad');
      return yearlyHustle(s, rng);
    }
    if (rng.chance(0.02)) {
      s = removeJob(s, 'fired');
      s = addStats(s, { happiness: -8 });
      s = log(s, `${job.company} made cutbacks and I was laid off.`, 'bad');
      return yearlyHustle(s, rng);
    }
    if (perf >= 65 && updated.yearsAtLevel >= 1) {
      const pct = rng.int(1, 5);
      updated = { ...updated, salary: Math.round(updated.salary * (1 + pct / 100)) };
      s = { ...s, career: { ...s.career, job: updated } };
    }
    if (!updated.partTime && updated.level < def.ladder.length - 1 && perf >= 72 && updated.yearsAtLevel >= 2 && rng.chance(0.3)) {
      s = promote(s, rng, updated, def);
    }
  }
  return yearlyHustle(s, rng);
}

export function startHustle(state: GameState, defId: string): GameState {
  const def = HUSTLE_BY_ID[defId];
  if (!def) return state;
  if (state.career.hustle) return setResult(state, 'Finish your current hustle first.', 'info');
  if (state.character.age < def.minAge) return setResult(state, `You must be ${def.minAge}+.`, 'bad');
  if (def.id === 'rideshare' && !state.assets.some((a) => a.kind === 'car' && !['bike', 'scooter'].includes(a.defId))) return setResult(state, 'You need a car for that.', 'bad');
  let s: GameState = { ...state, career: { ...state.career, hustle: { defId, name: def.name, level: 0, followers: 0, yearsActive: 0, lastIncome: 0 } } };
  s = log(s, `I started a side hustle: ${def.name.toLowerCase()}.`);
  return setResult(s, `Started: ${def.name}.`, 'good');
}

export function stopHustle(state: GameState): GameState {
  if (!state.career.hustle) return state;
  let s: GameState = { ...state, career: { ...state.career, hustle: null } };
  s = log(s, `I shut down my ${state.career.hustle.name.toLowerCase()}.`);
  return setResult(s, 'Hustle closed.', 'info');
}

function yearlyHustle(state: GameState, rng: Rng): GameState {
  const h = state.career.hustle;
  if (!h || state.crime.inPrison) return h ? { ...state, career: { ...state.career, hustle: { ...h, lastIncome: 0 } } } : state;
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
    s = log(s, `My ${def.name.toLowerCase()} went viral this year!`, 'good');
    s = addStats(s, { happiness: 8 });
  }
  if (level > h.level) s = log(s, `My ${def.name.toLowerCase()} is growing (level ${level}).`, 'good');
  if (level >= 3 && def.fame) s = { ...s, character: { ...s.character, fame: clampStat(s.character.fame + def.fame) } };
  if (level >= 5) s = { ...s, flags: { ...s.flags, hustleMaxed: true } };
  s = { ...s, career: { ...s.career, hustle: { ...h, level, yearsActive: h.yearsActive + 1, lastIncome: income, followers: Math.round(h.followers * 1.1 + level * level * 1000) } } };
  return s;
}

export function hustleOptions(state: GameState) {
  return HUSTLES.map((h) => ({ def: h, eligible: state.character.age >= h.minAge }));
}

export function countryCurrency(state: GameState): string {
  return getCountry(state.character.countryCode).currencySymbol;
}
