/**
 * Text audit: renders every event the way a player would see it, in real sampled
 * game states, so wording, point of view and age-appropriateness can be reviewed.
 *
 *   npx tsx scripts/text-audit.ts                       # writes audit/text/*.md
 *   npx tsx scripts/text-audit.ts --out <dir> --lives 300
 *
 * For each event file it writes one Markdown file listing each event twice (the
 * youngest age it was eligible at, and an older one), with the rendered title,
 * text, every choice label and hint, and every possible outcome line rendered
 * for that state and bound person. It also writes system-lines.md: every distinct
 * journal line the engine itself writes (not event cards), with the ages seen.
 * Lines with leftover {{placeholders}}, "undefined" or "NaN" are flagged.
 */
import { mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { applyAction } from '../src/engine/actions';
import { ageUp } from '../src/engine/ageUp';
import { applyEffects } from '../src/engine/events/effects';
import { EVENT_REGISTRY } from '../src/engine/events/registry';
import type { Effect, EventDef } from '../src/engine/events/schema';
import { candidatesFor } from '../src/engine/events/conditions';
import { isEligible, resolveChoice } from '../src/engine/events/select';
import { renderText } from '../src/engine/events/text';
import { Rng } from '../src/engine/rng';
import { balancedPolicy, recklessPolicy } from '../src/engine/simulate';
import { createLife, makePerson } from '../src/engine/systems/character';
import type { GameState, Person } from '../src/engine/types';

function arg(name: string, fallback: string): string {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1]! : fallback;
}

const OUT = path.resolve(arg('out', 'audit/text'));
const LIVES = Number(arg('lives', '240'));

/** Plays lives (balanced, reckless, with pets) and keeps a state per year; also collects engine-written journal lines. */
function sample(): { states: GameState[]; systemLines: Map<string, { ages: Set<number>; example: string }> } {
  const states: GameState[] = [];
  const systemLines = new Map<string, { ages: Set<number>; example: string }>();
  for (let seed = 1; seed <= LIVES; seed++) {
    const policy = seed % 5 === 0 ? recklessPolicy : balancedPolicy;
    let s = createLife({}, seed * 7919);
    const rng = new Rng(seed);
    const petRng = new Rng(seed * 31 + 7);
    const record = (from: number) => {
      const names = [s.character.firstName, s.character.lastName, ...Object.values(s.people).flatMap((p) => [p.firstName, p.lastName])].filter(Boolean);
      for (const l of s.log.slice(from)) {
        if (l.kind === 'event') continue;
        let key = l.text.replace(/[$€£₹¥₦]?\s?\d[\d,.]*\s?(k|K|M)?/g, '#');
        for (const n of names) key = key.split(n).join('NAME');
        const e = systemLines.get(key) ?? { ages: new Set<number>(), example: l.text };
        e.ages.add(s.character.age);
        systemLines.set(key, e);
      }
    };
    record(0);
    for (let y = 0; y < 110 && s.alive; y++) {
      const before = s.log.length;
      s = ageUp(s, EVENT_REGISTRY);
      let guard = 0;
      while (s.pendingEvent && guard++ < 20) s = resolveChoice(s, rng.pick(s.pendingEvent.choices).id, EVENT_REGISTRY);
      if (!s.alive) {
        record(before);
        break;
      }
      if (seed % 2 === 0 && (s.character.age === 8 || s.character.age === 30)) {
        s = applyEffects(s, petRng, [{ newPerson: { kind: 'pet', species: seed % 4 === 0 ? 'dog' : 'cat' } }]);
      }
      for (const a of policy(s, rng)) s = applyAction(s, a);
      record(before);
      states.push({ ...s, pendingEvent: null, eventQueue: [] });
    }
  }
  return { states, systemLines };
}

const SUSPECT = /\{\{|undefined|NaN|\bnull\b|\[object/;

function flag(text: string): string {
  return SUSPECT.test(text) ? `${text}  ⚠️` : text;
}

/** Every log line reachable from a choice's effects, with its branch label. */
function outcomeLines(effects: readonly Effect[], prefix = ''): { branch: string; text: string }[] {
  const out: { branch: string; text: string }[] = [];
  effects.forEach((e) => {
    if ('log' in e) out.push({ branch: prefix, text: e.log });
    if ('newPerson' in e && e.newPerson.log) out.push({ branch: `${prefix}new ${e.newPerson.kind}: `, text: e.newPerson.log });
    if ('chance' in e) {
      out.push(...outcomeLines(e.then, `${prefix}${Math.round(e.chance * 100)}%: `));
      if (e.else) out.push(...outcomeLines(e.else, `${prefix}else: `));
    }
    if ('random' in e) {
      const total = e.random.reduce((n, o) => n + o.weight, 0);
      for (const o of e.random) out.push(...outcomeLines(o.effects, `${prefix}${Math.round((o.weight / total) * 100)}%: `));
    }
  });
  return out;
}

function describeState(s: GameState, person: Person | undefined): string {
  const c = s.character;
  const bits = [`age ${c.age}`, c.gender, c.countryCode];
  if (s.career.job) bits.push(`job: ${s.career.job.title}${s.career.job.partTime ? ' (part-time)' : ''}`);
  if (s.education.enrolled) bits.push(`school: ${s.education.stage}`);
  if (s.crime.inPrison) bits.push('in prison');
  if (Object.values(s.people).some((p) => p.kind === 'spouse' && p.alive)) bits.push('married');
  if (person) bits.push(`person: ${person.firstName} (${person.kind}, ${person.gender}, ${person.age})`);
  return bits.join(' · ');
}

function renderEvent(def: EventDef, s: GameState): string {
  const candidates = def.person ? candidatesFor(s, def.person) : [];
  const person = candidates[0];
  const r = (t: string, p: Person | undefined = person) => flag(renderText(t, s, { person: p }));
  const lines = [`**${r(def.title)}** — ${describeState(s, person)}`, '', `> ${r(def.text)}`, ''];
  for (const c of def.choices) {
    lines.push(`- **${r(c.label)}**${c.hint ? ` (${r(c.hint)})` : ''}${c.conditions?.length ? ' _(conditional)_' : ''}`);
    for (const o of outcomeLines(c.effects)) {
      const kind = o.branch.match(/new (\w+): $/)?.[1];
      // A person created by this choice does not exist yet: render with a stand-in of that kind.
      const standIn = kind ? makePerson(new Rng(7), { kind: kind as Person['kind'], age: 30, countryCode: s.character.countryCode, playerAge: s.character.age }) : undefined;
      lines.push(`  - ${o.branch}${standIn ? r(o.text, standIn) : r(o.text)}`);
    }
  }
  return lines.join('\n');
}

async function loadFiles(): Promise<{ file: string; defs: EventDef[] }[]> {
  const dir = path.resolve('src/data/events');
  const out: { file: string; defs: EventDef[] }[] = [];
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.ts') && x !== 'index.ts').sort()) {
    const mod = (await import(pathToFileURL(path.join(dir, f)).href)) as Record<string, unknown>;
    const defs = Object.values(mod).filter(Array.isArray).flat() as EventDef[];
    out.push({ file: f.replace(/\.ts$/, ''), defs });
  }
  return out;
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const { states, systemLines } = sample();
  const files = await loadFiles();
  let flagged = 0;
  for (const { file, defs } of files) {
    const parts: string[] = [`# ${file} — rendered in sampled game states\n`];
    for (const def of defs) {
      const eligible = states.filter((s) => isEligible(s, def) && (!def.person || candidatesFor(s, def.person).length > 0));
      parts.push(`## ${def.id} (ages ${def.minAge}-${def.maxAge}${def.followUpOnly ? ', follow-up' : ''}${def.once ? ', once' : ''})\n`);
      if (!eligible.length) {
        parts.push(def.followUpOnly ? '_Follow-up: opened by another event; not sampled on its own._\n' : '_Never eligible in the sampled states._\n');
        continue;
      }
      const youngest = eligible.reduce((a, b) => (b.character.age < a.character.age ? b : a));
      const older = eligible.filter((s) => s.character.age >= youngest.character.age + 10);
      const picks = [youngest, older.length ? older[Math.floor(older.length / 2)]! : undefined].filter(Boolean) as GameState[];
      for (const s of picks) {
        const block = renderEvent(def, s);
        flagged += (block.match(/⚠️/g) ?? []).length;
        parts.push(block + '\n');
      }
    }
    writeFileSync(path.join(OUT, `${file}.md`), parts.join('\n'));
  }
  const sys = [...systemLines.entries()]
    .map(([k, v]) => ({ k, min: Math.min(...v.ages), max: Math.max(...v.ages), example: v.example }))
    .sort((a, b) => a.min - b.min || a.k.localeCompare(b.k));
  writeFileSync(
    path.join(OUT, 'system-lines.md'),
    ['# Journal lines written by the engine (not event cards)\n', 'Names replaced by NAME and numbers by #. Ages are the ages each line was seen at.\n', ...sys.map((x) => `- [${x.min}-${x.max}] ${flag(x.k)}`)].join('\n'),
  );
  console.log(`wrote ${files.length} event files + system-lines.md to ${OUT} (${states.length} sampled states, ${systemLines.size} distinct system lines, ${flagged} flagged lines)`);
}

void main();
