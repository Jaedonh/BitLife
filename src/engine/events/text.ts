import { getCountry } from '@/data/countries';
import type { GameState, Person } from '../types';
import { article, capitalize, formatMoney, lowerTitle, pronouns } from '../util';

export interface TextContext {
  person?: Person;
  /** Values for a code-defined card's own placeholders (EventDef.vars), from its queued context. */
  vars?: Readonly<Record<string, string>>;
}

/** Money values in content are authored in USD; scale to the character's economy. */
export function scaleMoney(state: GameState, usd: number): number {
  return Math.round(usd * getCountry(state.character.countryCode).salaryMultiplier);
}

function findKind(state: GameState, kind: Person['kind']): Person | undefined {
  return Object.values(state.people).find((p) => p.kind === kind && p.alive);
}

/** Who personRef can name: a person, or just enough of one (kind and first name). */
type Named = Pick<Person, 'kind' | 'firstName'> & Partial<Pick<Person, 'id' | 'gender' | 'relative'>>;

/**
 * Two parents of the same kind (an heir of two fathers or two mothers): the first one in the family is "Dad" or
 * "Mom" (an heir's late parent, the previous player, is created first), the other "Papa" or "Mama".
 */
function isSecondParent(p: Named, people: Readonly<Record<string, Person>> | undefined): boolean {
  if (!people || !p.id || (p.kind !== 'mother' && p.kind !== 'father')) return false;
  const first = Object.values(people).find((x) => x.kind === p.kind);
  return !!first && first.id !== p.id;
}

/**
 * How the player names someone in first-person narration. A parent is "Mom" or "Dad" at any age (a toddler's
 * parents must not read as strangers), and with two of the same kind the second is "Mama" or "Papa" (pass the
 * family, `state.people`, so they can be told apart); a grandparent is "Grandma Rosa" or "Grandpa Joe", and an
 * aunt or uncle who took the player in "Aunt Rosa" or "Uncle Joe". Step-parents, foster parents and everyone
 * else go by their first name. Always capitalized, so it works mid-sentence and at the start of one.
 * {{personFull}} keeps the full name for formal lines.
 */
export function personRef(p: Named, people?: Readonly<Record<string, Person>>): string {
  if (p.kind === 'mother') return isSecondParent(p, people) ? 'Mama' : 'Mom';
  if (p.kind === 'father') return isSecondParent(p, people) ? 'Papa' : 'Dad';
  if (p.kind === 'grandparent') return `${p.gender === 'male' ? 'Grandpa' : 'Grandma'} ${p.firstName}`;
  if (p.relative && (p.kind === 'stepmother' || p.kind === 'stepfather')) return `${p.gender === 'male' ? 'Uncle' : 'Aunt'} ${p.firstName}`;
  return p.firstName;
}

/**
 * The grown-ups at home, as a child says it: "Mom and Dad", "Mom", "Dad and Papa", "Dad and Maria" (a step-parent
 * by name), "Aunt Rosa" (a relative who took the child in), or "my family" when no parent is alive. Content using
 * {{parents}} keeps verbs that agree with one or two people (past tense: "{{parents}} paid", not "{{parents}} were").
 */
export function parentsRef(state: GameState): string {
  const living = Object.values(state.people).filter((p) => p.alive);
  const parents = [...living.filter((p) => p.kind === 'mother'), ...living.filter((p) => p.kind === 'father')];
  const step = [findKind(state, 'stepmother'), findKind(state, 'stepfather')].filter((x): x is Person => !!x);
  const names = [...parents, ...(parents.length >= 2 ? [] : step)].map((p) => personRef(p, state.people));
  if (!names.length) return 'my family';
  return names.length === 1 ? names[0]! : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

/**
 * The grandparent {{grandma}} or {{grandpa}} names: the bound person when they are one of that gender, else the
 * closest living one ("Grandma Rosa"), one nearby before one who lives far away, else just "Grandma" / "Grandpa".
 */
function grandparentRef(state: GameState, gender: Person['gender'], bound: Person | undefined): string {
  if (bound?.kind === 'grandparent' && bound.alive && bound.gender === gender) return personRef(bound);
  const closest = Object.values(state.people)
    .filter((x) => x.kind === 'grandparent' && x.alive && x.gender === gender)
    .sort((a, b) => Number(a.farAway === true) - Number(b.farAway === true) || b.relationship - a.relationship || a.id.localeCompare(b.id))[0];
  return closest ? personRef(closest) : gender === 'male' ? 'Grandpa' : 'Grandma';
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
  return prepared.replace(/\{\{([^}]+)\}\}/g, (m, raw: string, offset: number, whole: string) => {
    let value = placeholder(raw.trim());
    // "Nimbus Ltd." at the end of a sentence must not print "Ltd..".
    if (value.endsWith('.') && whole[offset + m.length] === '.') value = value.slice(0, -1);
    // Fallbacks such as "my mother" or "someone" are lower case; a sentence that opens with one needs a capital.
    return startsSentence(whole, offset) ? capitalize(value) : value;
  });

  function livingParentRef(kind: 'mother' | 'father'): string | undefined {
    const parent = findKind(state, kind);
    return parent && personRef(parent, state.people);
  }

  function placeholder(key: string): string {
    if (ctx.vars && Object.prototype.hasOwnProperty.call(ctx.vars, key)) return ctx.vars[key]!;
    if (key.startsWith('$')) return formatMoney(scaleMoney(state, Number(key.slice(1))), c.countryCode);
    switch (key) {
      case 'name': return c.firstName;
      case 'fullName': return `${c.firstName} ${c.lastName}`;
      case 'city': return c.city;
      case 'country': return country.name;
      case 'demonym': return country.demonym;
      case 'age': return String(c.age);
      case 'year': return String(state.year);
      case 'person': return p ? personRef(p, state.people) : 'someone';
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
      // A living parent is "Mom"/"Dad" (or "Mama"/"Papa", the second of two); with none alive the line still reads ("my mother").
      case 'mother': return livingParentRef('mother') ?? 'my mother';
      case 'father': return livingParentRef('father') ?? 'my father';
      case 'parents': return parentsRef(state);
      case 'grandma': return grandparentRef(state, 'female', p);
      case 'grandpa': return grandparentRef(state, 'male', p);
      default: return `{{${key}}}`;
    }
  }
}
