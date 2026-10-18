import { getCountry } from '@/data/countries';
import { GRAD_BY_ID, GRADUATE_PROGRAMS, MAJOR_BY_ID, majorProse, MAJORS } from '@/data/majors';
import { scaleMoney } from '../events/text';
import type { Rng } from '../rng';
import type { GameState } from '../types';
import { actionCount, addMoney, addStats, clampStat, countAction, log, money, setResult, withArticle } from '../util';

export const STAGE_LABELS: Record<string, string> = {
  none: 'Not in school',
  primary: 'Elementary school',
  middle: 'Middle school',
  high: 'High school',
  university: 'University',
  graduate: 'Graduate school',
  done: 'Finished school',
};

export function hasHighSchool(state: GameState): boolean {
  return state.education.degrees.includes('high_school');
}

export function bachelorMajor(state: GameState): string | null {
  const d = state.education.degrees.find((x) => x.startsWith('bachelor:'));
  return d ? d.slice('bachelor:'.length) : null;
}

export function hasDegree(state: GameState, prefix: string): boolean {
  return state.education.degrees.some((d) => d === prefix || d.startsWith(`${prefix}:`));
}

function startStage(state: GameState, stage: 'primary' | 'middle' | 'high'): GameState {
  const smarts = state.character.stats.smarts;
  let s: GameState = { ...state, education: { ...state.education, stage, enrolled: true, yearsInStage: 0, grade: clampStat(50 + (smarts - 50) / 2) } };
  s = log(s, stage === 'primary' ? 'I started elementary school.' : stage === 'middle' ? 'I started middle school.' : 'I started high school.', 'milestone');
  return s;
}

/** Yearly schooling: auto-enrollment, grade changes, graduation. */
export function yearlyEducation(state: GameState, rng: Rng): GameState {
  let s = state;
  const c = s.character;
  const country = getCountry(c.countryCode);
  const edu = s.education;
  // School carries on in juvenile detention; adult prison ends it.
  if (s.crime.inPrison && !s.crime.juvenile) return edu.enrolled ? { ...s, education: { ...edu, enrolled: false } } : s;

  // Auto-enroll in compulsory school
  if (!edu.enrolled && !edu.droppedOut && !edu.expelled) {
    if (c.age === country.schoolStartAge) return startStage(s, 'primary');
    if (c.age === 11 && edu.stage === 'primary') return startStage(s, 'middle');
    if (c.age === 14 && (edu.stage === 'middle' || edu.stage === 'primary')) return startStage(s, 'high');
  }
  if (!edu.enrolled) return s;
  if (s.crime.inPrison) s = log(s, 'I did my schoolwork in detention.');

  // Grade movement
  let delta = (c.stats.smarts - 50) / 10 + rng.int(-5, 5);
  if (edu.studiedThisYear) delta += 10;
  if (c.traits.includes('quick_learner')) delta += 2;
  if (c.traits.includes('rebellious')) delta -= 3;
  if (c.stats.happiness < 25) delta -= 4;
  const grade = clampStat(edu.grade + delta);
  s = { ...s, education: { ...edu, grade, yearsInStage: edu.yearsInStage + 1 } };
  s = addStats(s, { smarts: rng.int(1, 2) + (edu.studiedThisYear ? 1 : 0) });

  // Stage transitions
  const e = s.education;
  if (e.stage === 'primary' && c.age >= 11) return startStage(s, 'middle');
  if (e.stage === 'middle' && c.age >= 14) return startStage(s, 'high');
  if (e.stage === 'high' && c.age >= country.highSchoolEndAge) {
    if (e.grade >= 30) {
      s = { ...s, education: { ...e, stage: 'done', enrolled: false, degrees: [...e.degrees, 'high_school'] } };
      s = log(s, e.grade >= 85 ? 'I graduated from high school with honors!' : 'I graduated from high school.', 'milestone');
      s = addStats(s, { happiness: 5 });
    } else {
      s = { ...s, education: { ...e, stage: 'done', enrolled: false } };
      s = log(s, "My grades weren't good enough. I didn't graduate from high school.", 'bad');
      s = addStats(s, { happiness: -6 });
    }
    return s;
  }
  if (e.stage === 'university' && e.major) {
    const major = MAJOR_BY_ID[e.major];
    const years = major?.years ?? 4;
    if (!e.scholarship) s = { ...s, education: { ...s.education, studentDebt: s.education.studentDebt + scaleMoney(s, major?.tuition ?? 12000) } };
    if (s.education.yearsInStage >= years) {
      if (s.education.grade >= 25) {
        s = { ...s, education: { ...s.education, stage: 'done', enrolled: false, degrees: [...s.education.degrees, `bachelor:${e.major}`] } };
        s = log(s, `I graduated with a bachelor's degree in ${majorProse(e.major)}.`, 'milestone');
        s = addStats(s, { happiness: 8, smarts: 3 });
      } else {
        s = { ...s, education: { ...s.education, stage: 'done', enrolled: false } };
        s = log(s, 'I flunked out of university in my final year.', 'bad');
        s = addStats(s, { happiness: -8 });
      }
    }
    return s;
  }
  if (e.stage === 'graduate' && e.major) {
    const prog = GRAD_BY_ID[e.major];
    if (!e.scholarship) s = { ...s, education: { ...s.education, studentDebt: s.education.studentDebt + scaleMoney(s, prog?.tuition ?? 20000) } };
    if (s.education.yearsInStage >= (prog?.years ?? 2)) {
      s = { ...s, education: { ...s.education, stage: 'done', enrolled: false, degrees: [...s.education.degrees, prog?.grants ?? `master:${e.major}`] } };
      s = log(s, prog?.earned ?? `I completed ${prog?.prose ?? 'graduate school'}.`, 'milestone');
      s = addStats(s, { happiness: 10, smarts: 4 });
    }
    return s;
  }
  return s;
}

export function studyHarder(state: GameState): GameState {
  if (!state.education.enrolled) return state;
  if (state.education.studiedThisYear) return setResult(state, "I've already been studying as hard as I can this year.", 'info');
  let s: GameState = { ...state, education: { ...state.education, studiedThisYear: true } };
  s = addStats(s, { smarts: 2, happiness: -1 });
  s = log(s, 'I studied harder this year.');
  return setResult(s, 'I hit the books. Grades should improve.', 'good', { statDeltas: { smarts: 2 } });
}

/** Times a year the player can skip class, and the energy each skip takes. */
export const SKIP_CLASS_PER_YEAR = 2;
export const SKIP_CLASS_ENERGY = 1;

/** Why skipping class is not possible right now (null when it is). */
export function skipClassBlocker(state: GameState): string | null {
  if (!state.education.enrolled) return "I'm not in school right now.";
  if (state.crime.inPrison) return 'There is no skipping class in detention.';
  if (actionCount(state, 'skipClass') >= SKIP_CLASS_PER_YEAR) return "I've skipped enough this year.";
  if (state.character.energy < SKIP_CLASS_ENERGY) return "I'm out of energy this year. Age up to recharge.";
  return null;
}

/** Why dropping out is not possible right now (null when it is). School is compulsory until 16. */
export function dropOutBlocker(state: GameState): string | null {
  const edu = state.education;
  if (!edu.enrolled) return "I'm not in school right now.";
  if (state.character.age < 16 || edu.stage === 'primary' || edu.stage === 'middle') return "I'm too young to drop out.";
  if (state.crime.inPrison) return 'Not from detention.';
  return null;
}

/**
 * After a release: a young person without a diploma goes back to school (a new one, if they were expelled),
 * unless they had chosen to drop out. Adults past school age have no way back yet.
 */
export function returnToSchool(state: GameState): GameState {
  const edu = state.education;
  const age = state.character.age;
  const country = getCountry(state.character.countryCode);
  if (edu.enrolled || edu.droppedOut || hasHighSchool(state)) return state;
  if (age < country.schoolStartAge || age >= Math.max(18, country.highSchoolEndAge)) return state;
  if (edu.stage === 'university' || edu.stage === 'graduate') return state;
  const stage = age >= 14 ? 'high' : age >= 11 ? 'middle' : 'primary';
  // A student picks up where they left off; anyone else starts the stage for their age.
  const same = edu.stage === stage;
  const smarts = state.character.stats.smarts;
  let s: GameState = {
    ...state,
    education: { ...edu, stage, enrolled: true, expelled: false, yearsInStage: same ? edu.yearsInStage : 0, grade: same ? edu.grade : clampStat(50 + (smarts - 50) / 2) },
  };
  s = log(s, `I went back to ${STAGE_LABELS[stage]!.toLowerCase()}. A few people stared. Most had their own problems.`, 'milestone');
  return s;
}

export function skipClass(state: GameState, rng: Rng): GameState {
  const blocked = skipClassBlocker(state);
  if (blocked) return setResult(state, blocked, 'info');
  let s: GameState = countAction(state, 'skipClass');
  s = { ...s, character: { ...s.character, energy: s.character.energy - SKIP_CLASS_ENERGY }, education: { ...s.education, grade: clampStat(s.education.grade - 8) } };
  const college = state.education.stage === 'university' || state.education.stage === 'graduate';
  if (rng.chance(0.25)) {
    const parents = Object.values(s.people).some((p) => (p.kind === 'mother' || p.kind === 'father' || p.kind === 'stepmother' || p.kind === 'stepfather') && p.alive);
    if (!parents) {
      s = addStats(log(s, college ? 'I skipped class and got caught. The professor noticed, and so did my grade.' : 'I skipped class and got caught. Detention, and a note in my file.', 'bad'), { happiness: -3 });
      return setResult(s, college ? 'Caught skipping. My grade took the hit.' : 'Caught skipping. Detention.', 'bad');
    }
    s = log(s, college ? 'I skipped class and got caught. Word got back to my parents, who were furious.' : 'I skipped class and got caught. My parents were furious.', 'bad');
    for (const p of Object.values(s.people)) if ((p.kind === 'mother' || p.kind === 'father') && p.alive) s = { ...s, people: { ...s.people, [p.id]: { ...p, relationship: clampStat(p.relationship - 6) } } };
    s = addStats(s, { happiness: -3 });
    return setResult(s, college ? 'Caught skipping. My parents heard about it.' : 'Caught skipping. Grounded.', 'bad');
  }
  s = addStats(s, { happiness: 4 });
  s = log(s, 'I skipped class and spent the day doing nothing in particular.');
  return setResult(s, 'Freedom! My grades quietly slipped.', 'info', { statDeltas: { happiness: 4 } });
}

export function dropOut(state: GameState): GameState {
  const blocked = dropOutBlocker(state);
  if (blocked) return setResult(state, blocked, 'info');
  const stage = state.education.stage;
  let s: GameState = { ...state, education: { ...state.education, enrolled: false, stage: 'done', droppedOut: true, major: null } };
  s = log(s, stage === 'university' ? 'I dropped out of university.' : stage === 'graduate' ? 'I dropped out of graduate school.' : stage === 'high' ? 'I dropped out of high school.' : 'I dropped out of school.', 'bad');
  return setResult(s, 'I dropped out.', 'info');
}

export interface EnrollOption {
  id: string;
  name: string;
  kind: 'university' | 'graduate';
  years: number;
  tuition: number;
  eligible: boolean;
  reason?: string;
}

export function enrollOptions(state: GameState): EnrollOption[] {
  const out: EnrollOption[] = [];
  const smarts = state.character.stats.smarts;
  if (enrollBlocker(state)) return out;
  const major = bachelorMajor(state);
  if (!major) {
    for (const m of MAJORS) out.push({ id: m.id, name: m.name, kind: 'university', years: m.years, tuition: scaleMoney(state, m.tuition), eligible: smarts >= m.minSmarts, reason: smarts >= m.minSmarts ? undefined : `Needs ${m.minSmarts} Smarts` });
  } else {
    for (const g of GRADUATE_PROGRAMS) {
      if (state.education.degrees.includes(g.grants)) continue;
      const majorOk = g.requiresMajors.length === 0 || g.requiresMajors.includes(major);
      const ok = majorOk && smarts >= g.minSmarts;
      out.push({ id: g.id, name: g.name, kind: 'graduate', years: g.years, tuition: scaleMoney(state, g.tuition), eligible: ok, reason: !majorOk ? 'Wrong undergraduate major' : smarts < g.minSmarts ? `Needs ${g.minSmarts} Smarts` : undefined });
    }
  }
  return out;
}

/** Why no university or graduate program can be started right now (null when one can). */
export function enrollBlocker(state: GameState): string | null {
  if (state.crime.inPrison) return "I can't enroll while I'm in prison.";
  if (state.education.enrolled) return "I'm already enrolled.";
  if (!hasHighSchool(state)) return 'I need a high school diploma first.';
  return null;
}

export function enroll(state: GameState, rng: Rng, id: string): GameState {
  const blocked = enrollBlocker(state);
  if (blocked) return setResult(state, blocked, 'bad');
  const opt = enrollOptions(state).find((o) => o.id === id);
  if (!opt || !opt.eligible) return setResult(state, opt?.reason ? `${opt.reason}.` : "That program isn't open to me.", 'bad');
  const wealthy = state.flags.wealthyFamily === true;
  const scholarship = rng.chance(state.education.grade >= 85 && state.character.stats.smarts >= 70 ? 0.6 : state.character.stats.smarts >= 90 ? 0.4 : 0.05);
  let s: GameState = {
    ...state,
    education: { ...state.education, enrolled: true, stage: opt.kind, major: id, yearsInStage: 0, grade: clampStat(45 + (state.character.stats.smarts - 50) / 2), scholarship: scholarship || wealthy, droppedOut: false },
  };
  const university = opt.kind === 'university';
  // "computer science" for a major, "medical school" for a graduate program.
  const prose = university ? majorProse(id) : (GRAD_BY_ID[id]?.prose ?? opt.name);
  if (wealthy && !scholarship) s = log(s, university ? `My parents are paying for my ${prose} degree. I know how lucky I am.` : `My parents are paying for ${prose}. I know how lucky I am.`, 'good');
  if (scholarship) s = log(s, university ? `I won a full scholarship to study ${prose}!` : `I won a full scholarship to ${prose}!`, 'good');
  s = log(s, university ? `I started university as ${withArticle(prose)} major.` : `I started ${prose}.`, 'milestone');
  s = addStats(s, { happiness: 4 });
  return setResult(s, `Enrolled: ${opt.name}.`, 'good');
}

export function payOffStudentDebt(state: GameState, amount: number): GameState {
  amount = Math.min(state.education.studentDebt, Math.round(amount), state.finances.cash);
  if (amount <= 0) return state;
  let s = addMoney(state, -amount);
  s = { ...s, education: { ...s.education, studentDebt: s.education.studentDebt - amount } };
  return setResult(s, `I paid ${money(s, amount)} toward my student loans.`, 'good', { moneyDelta: -amount });
}
