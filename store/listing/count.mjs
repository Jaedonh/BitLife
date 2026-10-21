#!/usr/bin/env node
/**
 * Counts every store field in docs/STORE_LISTING.md against its limit.
 *
 *   node store/listing/count.mjs           # print the table; exit 1 if a field is over its limit
 *   node store/listing/count.mjs --write   # also update the "Count:" lines and the summary table
 *                                          # in the doc, and write store/listing/<field>.txt
 *
 * A field in the doc looks like this (the text block is exactly what you paste):
 *
 *   <!-- field: app-name | limit: 30 | store: App Store + Google Play -->
 *   ```text
 *   LifeLoop: Life Simulator
 *   ```
 *   Count: 24 / 30
 *
 * Characters are Unicode characters (an emoji or "•" is one). A field marked
 * `unit: bytes` (Apple keywords, App Review notes) is counted in UTF-8 bytes.
 */
import { Buffer } from 'node:buffer';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const docPath = path.join(root, 'docs/STORE_LISTING.md');
const write = process.argv.includes('--write');

/** Never in any store field (trademarks of other games and their makers). */
const BANNED = ['bitlife', 'candywriter', 'another life', 'verdant', 'the sims', 'sims', 'life restart', 'mind vacation', 'instlife'];
/** Google Play bans these in the app name; Apple frowns on them too. */
const PLAY_TITLE_BANNED = ['free', 'best', '#1', 'top', 'new', 'sale', 'discount', 'download'];

let doc = readFileSync(docPath, 'utf8');
const nameMatch = doc.match(/^\*\*Name:\*\* (.+)$/m);
const appName = nameMatch ? nameMatch[1].trim() : null;

const FIELD = /<!-- field: ([a-z0-9-]+) \| limit: (\d+)(?: \| unit: (bytes|chars))? \| store: ([^>]+?) -->\n```text\n([\s\S]*?)\n```\n(?:Count: [^\n]*\n)?/g;

const rows = [];
const problems = [];
const fields = {};
doc = doc.replace(FIELD, (_all, id, limitStr, unit = 'chars', store, text) => {
  const limit = Number(limitStr);
  const count = unit === 'bytes' ? Buffer.byteLength(text, 'utf8') : [...text].length;
  const ok = count <= limit;
  rows.push({ id, store: store.trim(), count, limit, unit, ok });
  fields[id] = text;
  if (!ok) problems.push(`${id}: ${count} ${unit} is over the limit of ${limit}`);
  const lower = text.toLowerCase();
  for (const word of BANNED) {
    if (new RegExp(`(^|[^a-z])${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z]|$)`).test(lower)) {
      problems.push(`${id}: contains "${word}" (another game's name; never use it in store metadata)`);
    }
  }
  const unitLabel = unit === 'bytes' ? ' bytes' : '';
  return `<!-- field: ${id} | limit: ${limit}${unit === 'bytes' ? ' | unit: bytes' : ''} | store: ${store.trim()} -->\n\`\`\`text\n${text}\n\`\`\`\nCount: ${count} / ${limit}${unitLabel}${ok ? '' : ' **OVER THE LIMIT**'}\n`;
});

// Field-specific rules.
if (fields['app-name']) {
  const t = fields['app-name'].toLowerCase();
  for (const w of PLAY_TITLE_BANNED) {
    if (new RegExp(`(^|[^a-z#])${w.replace('#', '\\#')}([^a-z0-9]|$)`).test(t)) problems.push(`app-name: "${w}" is not allowed in a Google Play app name`);
  }
  if (/\p{Extended_Pictographic}/u.test(fields['app-name'])) problems.push('app-name: no emoji in the app name');
  if (appName && !fields['app-name'].includes(appName)) problems.push(`app-name: does not contain the Name line ("${appName}")`);
}
if (fields['apple-keywords']) {
  const kw = fields['apple-keywords'];
  if (/,\s|\s,/.test(kw)) problems.push('apple-keywords: no spaces around commas (they waste bytes)');
  const words = kw.split(',');
  for (const w of words) if (w.trim().length <= 2) problems.push(`apple-keywords: "${w}" is too short (each keyword must be longer than two characters)`);
  const seen = new Set();
  for (const w of words) {
    if (seen.has(w)) problems.push(`apple-keywords: "${w}" is listed twice`);
    seen.add(w);
  }
  const indexed = `${fields['app-name'] ?? ''} ${fields['apple-subtitle'] ?? ''}`.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  for (const w of words) if (indexed.includes(w)) problems.push(`apple-keywords: "${w}" is already in the name or subtitle (Apple indexes those; it wastes bytes)`);
}

const pad = (s, n) => String(s).padEnd(n);
const table = [
  '| Field | Store | Count | Limit | OK |',
  '| --- | --- | ---: | ---: | --- |',
  ...rows.map((r) => `| \`${r.id}\` | ${r.store} | ${r.count} | ${r.limit}${r.unit === 'bytes' ? ' bytes' : ''} | ${r.ok ? 'yes' : '**no**'} |`),
].join('\n');

console.log(`Name: ${appName ?? '(no **Name:** line found)'}\n`);
console.log(`${pad('field', 24)}${pad('count', 8)}${pad('limit', 12)}store`);
for (const r of rows) console.log(`${pad(r.id, 24)}${pad(r.count, 8)}${pad(`${r.limit}${r.unit === 'bytes' ? ' bytes' : ''}`, 12)}${r.store}${r.ok ? '' : '   <-- OVER'}`);

if (write) {
  doc = doc.replace(/<!-- counts:start -->[\s\S]*?<!-- counts:end -->/, `<!-- counts:start -->\n${table}\n<!-- counts:end -->`);
  writeFileSync(docPath, doc);
  mkdirSync(here, { recursive: true });
  for (const [id, text] of Object.entries(fields)) writeFileSync(path.join(here, `${id}.txt`), `${text}\n`);
  console.log(`\nUpdated the counts in docs/STORE_LISTING.md and wrote ${Object.keys(fields).length} files to store/listing/.`);
}

if (problems.length) {
  console.error(`\n${problems.length} problem(s):\n- ${problems.join('\n- ')}`);
  process.exit(1);
}
console.log(`\nAll ${rows.length} fields are within their limits.`);
