import { EVENTS } from '@/data/events';
import { FLAVOR } from '@/data/flavor';
import type { Effect, EventDef } from '../events/schema';
import { personRef, renderText } from '../events/text';
import { Rng } from '../rng';
import { createLife, makePerson } from '../systems/character';
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
});

