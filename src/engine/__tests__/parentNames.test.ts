import { EVENTS } from '@/data/events';
import { FLAVOR } from '@/data/flavor';
import type { Effect, EventDef } from '../events/schema';
import { personRef, renderText } from '../events/text';
import { Rng } from '../rng';
import { createLife, makePerson } from '../systems/character';
import { onNpcDeath } from '../systems/aging';
import { markDeath } from '../systems/death';
import type { GameState, Person, RelationshipKind } from '../types';

/** A life with a living mother and father (and nobody else), plus a step-parent and a sibling to bind. */
function family(): { s: GameState; mother: Person; father: Person; stepmother: Person; sibling: Person } {
  const base = createLife({ countryCode: 'US' }, 7);
  const rng = new Rng(11);
  const make = (kind: RelationshipKind, gender: 'male' | 'female', age: number) => makePerson(rng, { kind, gender, age, countryCode: 'US', playerAge: base.character.age });
  const mother = { ...make('mother', 'female', 31), firstName: 'Layla', lastName: 'Richardson' };
  const father = { ...make('father', 'male', 33), firstName: 'Noah', lastName: 'Richardson' };
  const stepmother = { ...make('stepmother', 'female', 40), firstName: 'Gwen', lastName: 'Hale' };
  const sibling = { ...make('sibling', 'female', 6), firstName: 'Ivy', lastName: 'Richardson' };
  const people = Object.fromEntries([mother, father, stepmother, sibling].map((p) => [p.id, p]));
  return { s: { ...base, people }, mother, father, stepmother, sibling };
}

describe('parents in first-person narration', () => {
  it('calls a bound mother or father Mom or Dad, and everyone else by first name', () => {
    const { s, mother, father, stepmother, sibling } = family();
    expect(renderText('Bath time. {{person}} has the look.', s, { person: mother })).toBe('Bath time. Mom has the look.');
    expect(renderText('Ask {{person}} to step in', s, { person: father })).toBe('Ask Dad to step in');
    expect(renderText("{{person}}'s doctor was blunt.", s, { person: father })).toBe("Dad's doctor was blunt.");
    expect(renderText('{{person}} handed me a box.', s, { person: stepmother })).toBe('Gwen handed me a box.');
    expect(renderText('I hugged {{person}}.', s, { person: sibling })).toBe('I hugged Ivy.');
    expect(personRef(mother)).toBe('Mom');
    expect(personRef(stepmother)).toBe('Gwen');
  });

  it('keeps the full name for {{personFull}}', () => {
    const { s, mother } = family();
    expect(renderText('A letter from {{personFull}}.', s, { person: mother })).toBe('A letter from Layla Richardson.');
  });

  it('renders {{mother}} and {{father}} as Mom and Dad while they are alive', () => {
    const { s, mother } = family();
    expect(renderText('{{mother}} and {{father}} were shouting.', s)).toBe('Mom and Dad were shouting.');
    expect(renderText("I hid in {{mother}}'s coat.", s)).toBe("I hid in Mom's coat.");
    const orphaned = { ...s, people: { ...s.people, [mother.id]: { ...mother, alive: false } } };
    expect(renderText('{{mother}} cried. I told {{mother}}.', orphaned)).toBe('My mother cried. I told my mother.');
  });

  it('never produces doubled or clashing parent names in event, outcome or flavor text', () => {
    const { s, mother, father } = family();
    const texts = (e: EventDef): string[] => {
      const out = [e.title, e.text];
      const walk = (effects: readonly Effect[] | undefined) => {
        for (const x of effects ?? []) {
          // newPerson logs are left out: the engine renders them with the new person bound, not the event's.
          if ('log' in x) out.push(x.log);
          if ('random' in x) for (const o of x.random) walk(o.effects);
          if ('chance' in x) {
            walk(x.then);
            walk(x.else);
          }
        }
      };
      for (const c of e.choices) {
        out.push(c.label, c.hint ?? '');
        walk(c.effects);
      }
      return out.filter(Boolean);
    };
    const AWKWARD = [
      /\b(my|your|our|the|a|his|her) (mom|mum|mother|dad|father|parent)\b,? (Mom|Dad)\b/i,
      /\b(Mom|Dad),? (my|your|our|the) (mom|mum|mother|dad|father|parent)\b/,
      /\b(Mom|Dad) (Mom|Dad)\b/,
      /\bMom and Mom\b|\bDad and Dad\b/,
      /\b(named|called) (Mom|Dad)\b/,
    ];
    const problems: string[] = [];
    for (const e of EVENTS) {
      const kinds = e.person?.kind ?? [];
      const bound = [kinds.includes('mother') ? mother : null, kinds.includes('father') ? father : null].filter((p): p is Person => p !== null);
      for (const person of bound.length ? bound : [undefined]) {
        for (const t of texts(e)) {
          const out = renderText(t, s, { person });
          if (AWKWARD.some((re) => re.test(out))) problems.push(`${e.id}: ${out}`);
        }
      }
    }
    for (const f of FLAVOR) {
      const out = renderText(f.text, s);
      if (AWKWARD.some((re) => re.test(out))) problems.push(`flavor: ${out}`);
    }
    expect(problems).toEqual([]);
  });

  it('{{parents}} names whoever is at home, and still reads when nobody is', () => {
    const { s, mother, father, stepmother } = family();
    const dead = (st: GameState, p: Person) => ({ ...st, people: { ...st.people, [p.id]: { ...p, alive: false } } });
    const without = (st: GameState, p: Person) => Object.fromEntries(Object.entries(st.people).filter(([id]) => id !== p.id));
    const line = '{{parents}} paid. Ask {{parents}} first.';
    const noStep = { ...s, people: without(s, stepmother) };
    expect(renderText(line, noStep)).toBe('Mom and Dad paid. Ask Mom and Dad first.');
    expect(renderText(line, dead(noStep, father))).toBe('Mom paid. Ask Mom first.');
    expect(renderText(line, dead(s, mother))).toBe('Dad and Gwen paid. Ask Dad and Gwen first.');
    expect(renderText(line, dead(dead(noStep, mother), father))).toBe('My family paid. Ask my family first.');
  });

  it('tells two fathers or two mothers apart: the second is Papa or Mama, everywhere', () => {
    // An heir of two fathers: the late player (created first) is Dad, the surviving father Papa.
    const base = createLife({ countryCode: 'IN', gender: 'male' }, 77);
    const prev0 = { ...base, character: { ...base.character, age: 40 }, year: base.character.birthYear + 40 };
    const rng = new Rng(3);
    const spouse = { ...makePerson(rng, { kind: 'spouse', gender: 'male', age: 41, countryCode: 'IN', playerAge: 40 }), firstName: 'Sanjay' };
    const kid = { ...makePerson(rng, { kind: 'child', gender: 'female', age: 12, countryCode: 'IN', playerAge: 28 }), otherParentId: spouse.id };
    const heir = createLife({ heir: { childId: kid.id, previous: markDeath({ ...prev0, people: { ...prev0.people, [spouse.id]: spouse, [kid.id]: kid } }, 'a car accident') } }, 4);
    const fathers = Object.values(heir.people).filter((p) => p.kind === 'father');
    const late = fathers.find((p) => !p.alive)!;
    const papa = fathers.find((p) => p.alive)!;
    expect(late.firstName).toBe(base.character.firstName);
    expect(papa.firstName).toBe('Sanjay');
    expect(personRef(late, heir.people)).toBe('Dad');
    expect(personRef(papa, heir.people)).toBe('Papa');
    // Without the family to compare against, a father is still Dad.
    expect(personRef(papa)).toBe('Dad');
    expect(renderText('Another holiday without {{person}}.', heir, { person: late })).toBe('Another holiday without Dad.');
    expect(renderText('I complimented {{person}}. {{They}} beamed.', heir, { person: papa })).toBe('I complimented Papa. He beamed.');
    expect(renderText('{{father}} called. {{parents}} paid.', heir)).toBe('Papa called. Papa paid.');
    // Both alive: "Dad and Papa"; two mothers: "Mom and Mama".
    const both = { ...heir, people: { ...heir.people, [late.id]: { ...late, alive: true } } };
    expect(renderText('{{parents}} paid. {{father}} smiled.', both)).toBe('Dad and Papa paid. Dad smiled.');
    const moms = Object.fromEntries(Object.entries(both.people).map(([id, p]) => [id, p.kind === 'father' ? { ...p, kind: 'mother' as const, gender: 'female' as const } : p]));
    expect(renderText('{{parents}} paid.', { ...both, people: moms })).toBe('Mom and Mama paid.');
    // The death line names the right one.
    const gone = { ...papa, alive: false, deathAge: papa.age, deathCause: 'pneumonia' };
    const after = onNpcDeath({ ...heir, people: { ...heir.people, [papa.id]: gone } }, gone, new Rng(1));
    expect(after.log.map((l) => l.text)).toContain(`Papa died of pneumonia at ${papa.age}.`);
  });

  it('a company name ending in a period does not double the period at the end of a sentence', () => {
    const { s } = family();
    const job = { defId: 'it_support', title: 'IT Specialist', company: 'Nimbus Ltd.', salary: 1, level: 0, performance: 50, yearsHeld: 1, yearsAtLevel: 1, category: 'tech' as const, partTime: false, askedThisYear: false };
    const st = { ...s, career: { ...s.career, job: { ...s.career.job!, ...job } } };
    expect(renderText('I work at {{company}}.', st)).toBe('I work at Nimbus Ltd.');
    expect(renderText('{{company}} called.', st)).toBe('Nimbus Ltd. called.');
  });
});

