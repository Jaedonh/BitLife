#!/usr/bin/env node
/**
 * Builds the support site in store/site/.
 *
 *   node store/site/tools/build.mjs
 *       Writes store/site/privacy.html from docs/PRIVACY_POLICY.md (placeholders stay, highlighted).
 *
 *   node store/site/tools/build.mjs --out ../my-site-repo --name "Jane Doe" --email "help@example.com"
 *       Also writes a ready-to-publish copy of the site into --out with the placeholders
 *       [YOUR LEGAL NAME] and [CONTACT EMAIL] filled in. It refuses to finish while any
 *       placeholder is left. Files already in --out (such as .git) are left alone.
 *
 * No dependencies: a small Markdown subset (headings, paragraphs, "- " lists, **bold**,
 * _italic_, [links](url), a trailing "\" line break, HTML comments) is all the policy uses.
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Report problems as one plain line, not a stack trace.
process.on('uncaughtException', (err) => {
  console.error(`build.mjs: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});

const site = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repo = path.resolve(site, '../..');
const PUBLISH = ['index.html', 'support.html', 'privacy.html', 'icon-512.png', '.nojekyll'];
const NAME = '[YOUR LEGAL NAME]';
const EMAIL = '[CONTACT EMAIL]';

function arg(flag) {
  const i = process.argv.indexOf(flag);
  return i === -1 ? undefined : process.argv[i + 1];
}

const escapeHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const slug = (s) => s.toLowerCase().replace(/<[^>]+>/g, '').replace(/&[a-z]+;/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function inline(text) {
  let s = escapeHtml(text);
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, label, url) => `<a href="${url}">${label}</a>`);
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/(^|[\s(])_([^_]+)_(?=[\s).,;:!?]|$)/g, '$1<em>$2</em>');
  // Bare email addresses (once the placeholder is filled in) become mailto links.
  s = s.replace(/(^|[\s>(])([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})(?=[\s<).,;:]|$)/g, '$1<a href="mailto:$2">$2</a>');
  s = s.split(escapeHtml(EMAIL)).join(`<a href="mailto:${EMAIL}"><mark class="todo">${EMAIL}</mark></a>`);
  s = s.split(escapeHtml(NAME)).join(`<mark class="todo">${NAME}</mark>`);
  return s;
}

function markdownToHtml(md) {
  const lines = md.replace(/<!--[\s\S]*?-->/g, '').replace(/\r\n/g, '\n').split('\n');
  const out = [];
  let para = [];
  let list = null;
  const flushPara = () => {
    if (!para.length) return;
    const html = para
      .map((l) => (l.endsWith('\\') ? `${inline(l.slice(0, -1).trimEnd())}<br>` : inline(l.trim())))
      .join('\n');
    out.push(`<p>${html}</p>`);
    para = [];
  };
  const flushList = () => {
    if (!list) return;
    out.push(`<ul>\n${list.map((li) => `  <li>${inline(li)}</li>`).join('\n')}\n</ul>`);
    list = null;
  };
  for (const raw of lines) {
    const line = raw.trimEnd();
    const h = line.match(/^(#{1,3}) (.+)$/);
    if (h) {
      flushPara();
      flushList();
      const level = h[1].length;
      const content = inline(h[2]);
      out.push(level === 1 ? `<h1>${content}</h1>` : `<h${level} id="${slug(content)}">${content}</h${level}>`);
    } else if (/^- /.test(line)) {
      flushPara();
      (list ??= []).push(line.slice(2));
    } else if (/^\s+\S/.test(line) && list) {
      list[list.length - 1] += ` ${line.trim()}`;
    } else if (line.trim() === '') {
      flushPara();
      flushList();
    } else {
      flushList();
      para.push(line);
    }
  }
  flushPara();
  flushList();
  return out.join('\n');
}

/** The page shell: same <style> as index.html, so the three pages always match. */
function page({ title, description, body }) {
  const index = readFileSync(path.join(site, 'index.html'), 'utf8');
  const style = index.match(/<style>[\s\S]*?<\/style>/)?.[0];
  if (!style) throw new Error('store/site/index.html has no <style> block to share');
  const year = index.match(/©\s*(\d{4})/)?.[1] ?? String(new Date().getFullYear());
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}">
<meta name="theme-color" content="#0F0E1A">
<link rel="icon" type="image/png" href="icon-512.png">
<link rel="apple-touch-icon" href="icon-512.png">
<!-- Generated from docs/PRIVACY_POLICY.md by store/site/tools/build.mjs. Edit the Markdown, then rebuild. -->
${style}
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="top">
  <div class="in">
    <a class="brand" href="./"><img src="icon-512.png" alt="" width="32" height="32">${escapeHtml(appName)}</a>
    <nav aria-label="Site">
      <a href="support.html">Support</a>
      <a href="privacy.html" aria-current="page">Privacy</a>
    </nav>
  </div>
</header>
<main id="main">
${body}
</main>
<footer>
  <span>© ${year} <mark class="todo">${NAME}</mark></span>
  <a href="./">Home</a>
  <a href="support.html">Support</a>
</footer>
</body>
</html>
`;
}

// 1. privacy.html from the policy.
const md = readFileSync(path.join(repo, 'docs/PRIVACY_POLICY.md'), 'utf8');
const h1 = md.replace(/<!--[\s\S]*?-->/g, '').match(/^# (.+)$/m)?.[1]?.trim() ?? 'Privacy Policy';
const appName = h1.replace(/\s*Privacy Policy\s*$/i, '') || 'Yearborn';
const privacy = page({
  title: h1,
  description: `How ${appName} handles your information: what stays on your device, ads, purchases, your choices and how to contact us.`,
  body: markdownToHtml(md),
});
if (!/privacy policy/i.test(privacy)) throw new Error('privacy.html must contain the words "privacy policy" (npm run check:privacy looks for them)');
writeFileSync(path.join(site, 'privacy.html'), privacy);
console.log('wrote store/site/privacy.html');

// 2. Optional publish copy with the placeholders filled in.
const out = arg('--out');
if (out) {
  const name = arg('--name')?.trim();
  const email = arg('--email')?.trim();
  if (!name || !email) throw new Error('--out needs --name "Your Legal Name" and --email "support@example.com"');
  if (!/^[^\s@<>"]+@[^\s@<>"]+\.[A-Za-z]{2,}$/.test(email)) throw new Error(`"${email}" does not look like an email address`);
  const dest = path.resolve(out);
  mkdirSync(dest, { recursive: true });
  const fill = (html) =>
    html
      .replace(/<mark class="todo">([^<]*)<\/mark>/g, '$1')
      .replace(/^mark\.todo\{[^}]*\}\n/m, '')
      .split(NAME).join(escapeHtml(name))
      .split(EMAIL).join(escapeHtml(email));
  for (const file of PUBLISH) {
    const from = path.join(site, file);
    if (!existsSync(from)) throw new Error(`missing ${from}`);
    if (file.endsWith('.html')) {
      const html = fill(readFileSync(from, 'utf8'));
      const left = ['[YOUR LEGAL NAME]', '[CONTACT EMAIL]', 'class="todo"'].filter((p) => html.includes(p));
      if (left.length) throw new Error(`${file} still contains ${left.join(', ')}`);
      writeFileSync(path.join(dest, file), html);
    } else {
      copyFileSync(from, path.join(dest, file));
    }
  }
  console.log(`wrote ${PUBLISH.length} files to ${dest} with the placeholders filled in`);
}
