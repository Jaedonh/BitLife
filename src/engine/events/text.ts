import { getCountry } from '@/data/countries';
import type { GameState, Person } from '../types';
import { article, capitalize, formatMoney, lowerTitle, pronouns } from '../util';

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

/** True when a placeholder at `offset` opens a sentence (or a quote), so its value needs a capital letter. */
function startsSentence(whole: string, offset: number): boolean {
  return /(^\s*["'“‘(]?|[.!?…]["'”’)]?\s+["'“‘(]?|\n\s*["'“‘(]?)$/.test(whole.slice(0, offset));
}

export function renderText(template: string, state: GameState, ctx: TextContext = {}): string {
  const c = state.character;
  const country = getCountry(c.countryCode);
  const me = pronouns(c.gender);
  const p = ctx.person;
  const pp = p ? pronouns(p.gender) : null;
  const job = state.career.job ? lowerTitle(state.career.job.title) : null;
  const company = state.career.job?.company ?? 'work';
  // "a {{job}}" needs the right article for the title ("an EMT"); with no job it reads "my job".
  // "the {{company}}" must not double up with employers that carry their own ("the Army").
  const prepared = template
    .replace(/\b([Aa])n? \{\{\s*job\s*\}\}/g, (_m, a: string) => {
      if (!job) return a === 'A' ? 'My job' : 'my job';
      const art = article(job);
      return `${a === 'A' ? capitalize(art) : art} ${job}`;
    })
    .replace(/\b([Tt])he \{\{\s*company\s*\}\}/g, (_m, t: string) => `${t}he ${company.replace(/^the /, '')}`);
  return prepared.replace(/\{\{([^}]+)\}\}/g, (_m, raw: string, offset: number, whole: string) => {
    const value = placeholder(raw.trim());
    // Fallbacks such as "my mother" or "someone" are lower case; a sentence that opens with one needs a capital.
    return startsSentence(whole, offset) ? capitalize(value) : value;
  });

  function placeholder(key: string): string {
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
      case 'job': return job ?? 'my job';
      case 'company': return company;
      case 'spouse': return findKind(state, 'spouse')?.firstName ?? 'my spouse';
      case 'mother': return findKind(state, 'mother')?.firstName ?? 'my mother';
      case 'father': return findKind(state, 'father')?.firstName ?? 'my father';
      default: return `{{${key}}}`;
    }
  }
}
