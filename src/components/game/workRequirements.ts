import type { JobDef } from '@/data/jobs';
import { MAJOR_BY_ID } from '@/data/majors';
import { bachelorMajor, hasHighSchool, type GameState } from '@/engine';
import { hasDegree } from '@/engine/systems/education';

import type { BadgeSpec } from './WorkChip';

const majorName = (id: string) => MAJOR_BY_ID[id]?.name ?? id.replace(/_/g, ' ');

/** "🎓 Nursing degree", "🎓 Biology or Chemistry", "🎓 Business or 3 more". */
function degreeLabel(majors: readonly string[]): string {
  if (!majors.length) return "🎓 Bachelor's";
  const names = majors.map(majorName);
  if (names.length === 1) return `🎓 ${names[0]} degree`;
  if (names.length === 2) return `🎓 ${names[0]} or ${names[1]}`;
  return `🎓 ${names[0]} or ${names.length - 1} more`;
}

/**
 * One badge per requirement of a job, green when the character meets it and red when not,
 * so a listing shows at a glance what is still missing ("🎓 Bachelor's", "🧠 60+ Smarts").
 * `verdict` is the engine's own check (meetsRequirements); if it refuses for a reason no
 * badge covers (too old for part-time, in prison), that reason is added as a red badge.
 */
export function jobRequirementBadges(state: GameState, def: JobDef, verdict: { ok: boolean; reason?: string }): BadgeSpec[] {
  const r = def.requirements;
  const c = state.character;
  const out: BadgeSpec[] = [];
  const add = (label: string, met: boolean) => out.push({ label, tone: met ? 'good' : 'bad' });
  if (def.partTime) out.push({ label: 'Part-time', tone: 'info' });
  const minAge = r.minAge ?? (def.partTime ? 14 : 18);
  if (c.age < minAge) add(`🎂 Age ${minAge}+`, false);
  switch (r.education) {
    case 'high_school':
      add('🎓 High school', hasHighSchool(state));
      break;
    case 'bachelor': {
      const major = bachelorMajor(state);
      const majors = r.majors ?? [];
      add(degreeLabel(majors), !!major && (!majors.length || majors.includes(major) || hasDegree(state, 'master') || hasDegree(state, 'doctor')));
      break;
    }
    case 'master':
      add("🎓 Master's", hasDegree(state, 'master') || hasDegree(state, 'doctor'));
      break;
    case 'doctor':
      add('🎓 Doctorate', hasDegree(state, 'doctor'));
      break;
    case 'doctor:medicine':
      add('🩺 Medical school', state.education.degrees.includes(r.education));
      break;
    case 'doctor:law':
      add('⚖️ Law school', state.education.degrees.includes(r.education));
      break;
    case 'doctor:dentistry':
      add('🦷 Dental school', state.education.degrees.includes(r.education));
      break;
    default:
      break;
  }
  if (r.minSmarts !== undefined) add(`🧠 ${r.minSmarts}+ Smarts`, c.stats.smarts >= r.minSmarts);
  if (r.minLooks !== undefined && r.minLooks > 0) add(`✨ ${r.minLooks}+ Looks`, c.stats.looks >= r.minLooks);
  if (r.minHealth !== undefined) add(`💪 ${r.minHealth}+ Health`, c.stats.health >= r.minHealth);
  if (r.experience !== undefined) {
    const years = (state.career.experience[def.category] ?? 0) + Math.floor(state.career.totalYearsWorked / 2);
    add(`💼 ${r.experience} ${r.experience === 1 ? 'yr' : 'yrs'} experience`, years >= r.experience);
  }
  if (r.noRecord) add('🚫 Clean record', !state.crime.record);
  if (!verdict.ok && !out.some((b) => b.tone === 'bad')) out.push({ label: verdict.reason ?? 'Not eligible', tone: 'bad' });
  return out;
}
