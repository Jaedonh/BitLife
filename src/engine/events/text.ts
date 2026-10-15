import { getCountry } from '@/data/countries';
import type { GameState, Person } from '../types';
import { formatMoney, pronouns } from '../util';

export interface TextContext {
  person?: Person;
}

/** Money values in content are authored in USD; scale to the character's economy. */
export function scaleMoney(state: GameState, usd: number): number {
  return Math.round(usd * getCountry(state.character.countryCode).salaryMultiplier);
}

function findKind(state: GameState, kind: Person['kind']): Person | undefined {
  return Object.values(state.people).find((p) => p.kind === kind && p.alive);
}

export function renderText(template: string, state: GameState, ctx: TextContext = {}): string {
  const c = state.character;
  const country = getCountry(c.countryCode);
  const me = pronouns(c.gender);
  const p = ctx.person;
  const pp = p ? pronouns(p.gender) : null;
  return template.replace(/\{\{([^}]+)\}\}/g, (_m, raw: string) => {
    const key = raw.trim();
    if (key.startsWith('$')) return formatMoney(scaleMoney(state, Number(key.slice(1))), c.countryCode);
    switch (key) {
      case 'name': return c.firstName;
      case 'fullName': return `${c.firstName} ${c.lastName}`;
      case 'city': return c.city;
      case 'country': return country.name;
      case 'demonym': return country.demonym;
      case 'age': return String(c.age);
      case 'year': return String(state.year);
      case 'person': return p ? p.firstName : 'someone';
      case 'personFull': return p ? `${p.firstName} ${p.lastName}` : 'someone';
      case 'they': return pp ? pp.subject : 'they';
      case 'They': return pp ? pp.Subject : 'They';
      case 'them': return pp ? pp.object : 'them';
      case 'their': return pp ? pp.possessive : 'their';
      case 'he': return me.subject;
      case 'she': return me.subject;
      case 'his': return me.possessive;
      case 'him': return me.object;
      case 'job': return state.career.job?.title ?? 'my job';
      case 'company': return state.career.job?.company ?? 'work';
      case 'spouse': return findKind(state, 'spouse')?.firstName ?? 'my spouse';
      case 'mother': return findKind(state, 'mother')?.firstName ?? 'my mother';
      case 'father': return findKind(state, 'father')?.firstName ?? 'my father';
      default: return `{{${key}}}`;
    }
  });
}
