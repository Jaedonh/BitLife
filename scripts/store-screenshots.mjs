/**
 * Store screenshots: captures real game screens from the static web export and frames them with a caption, at the
 * exact pixel sizes App Store Connect and Google Play Console accept. See store/screenshots/README.md.
 *
 *   node scripts/store-screenshots.mjs                    # every set, from the saves in store/screenshots/saves
 *   node scripts/store-screenshots.mjs --only ios-6.9     # one set (comma-separated ids)
 *   node scripts/store-screenshots.mjs --fresh-saves      # rebuild the saves first (npx tsx scripts/store-saves.ts)
 *   DIST=/path/to/dist PORT=8501 node scripts/store-screenshots.mjs
 *
 * The export comes from `npm run build:web` (dist/ by default). Chromium is the system one Playwright finds through
 * PLAYWRIGHT_BROWSERS_PATH or CHROME_PATH, as in e2e/smoke.mjs. Each screen is captured at the device's CSS width
 * and at exactly the pixel size of its slot in the frame, and the frame is rendered at deviceScaleFactor 1, so
 * nothing is resampled. PNGs are written as 24-bit RGB (no alpha channel: App Store Connect rejects alpha).
 */
import { Buffer } from 'node:buffer';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';
import zlib from 'node:zlib';

import { chromium } from 'playwright';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const args = process.argv.slice(2);
const arg = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const DIST = path.resolve(arg('--dist') ?? process.env.DIST ?? path.join(ROOT, 'dist'));
const SAVES = path.resolve(arg('--saves') ?? path.join(ROOT, 'store/screenshots/saves'));
const OUT = path.resolve(arg('--out') ?? path.join(ROOT, 'store/screenshots'));
const PORT = Number(arg('--port') ?? process.env.PORT ?? 8501);
const ONLY = (arg('--only') ?? '').split(',').filter(Boolean);
/** Also keep the unframed captures (store/screenshots/raw/<set>/), for review. */
const KEEP_RAW = args.includes('--raw');

/**
 * Captions, in upload order. Two short lines each; the second is drawn in the accent color. Keep them to 2-5 words:
 * the store shows these images small, often three at a time.
 */
export const SHOTS = [
  { id: 'life', save: 'teen', route: '/life', ready: 'age-up', caption: ['One tap.', 'One year.'] },
  { id: 'event', save: 'event', route: '/life', ready: 'event-modal', caption: ['Every year asks', 'a question.'] },
  // On a phone the obituary card sits below the fold of the same screen: it is captured too and lifted over the
  // achievements button (never over the tombstone, the heir or the New life row), so one frame shows the tombstone,
  // the heir and the obituary. On a tablet it is already in view and nothing is lifted.
  { id: 'death', save: 'death', route: '/death', ready: 'obituary', caption: ['Die well.', 'Start a dynasty.'], callout: { testid: 'obituary', at: ['death-achievements', 'death-new-life'], floor: 'death-new-life' } },
  { id: 'people', save: 'adult', route: '/relationships', ready: null, caption: ['Be kind.', 'They remember.'] },
  { id: 'work', save: 'adult', route: '/occupation', ready: null, caption: ['70+ careers.', 'Real ladders.'] },
  // Scrolled so the index fund and crypto sit above the home (with its mortgage) and the car.
  { id: 'assets', save: 'adult', route: '/assets', ready: null, caption: ['Build wealth.', 'Or debt.'], scrollTo: { text: 'Index fund', offset: 18 } },
  { id: 'start', save: 'fresh', route: '/new-life', ready: 'scenario-picker', caption: ['Eight ways', 'to be born.'] },
  { id: 'achievements', save: 'death', route: '/achievements', ready: 'achievements-list', caption: ['40 achievements.', 'Every life counts.'] },
  // A ninth image for the App Store (10 allowed). Google Play takes at most 8 per device type: there, use it in place
  // of one of the others or leave it out.
  { id: 'court', save: 'court', route: '/life', ready: 'event-modal', caption: ['Get caught?', 'Your day in court.'] },
];

/**
 * Output sets. W x H is the exact file size; cssW is the device width the app is laid out at (a phone, a 7" or 10"
 * Android tablet, an iPad); s scales the frame's type and spacing (1 = the 1320 px wide iPhone frame).
 */
export const SETS = [
  // Apple, iPhone 6.9" (iPhone 17 Pro Max, 16 Pro Max, Air...). Accepted sizes: 1320x2868, 1290x2796, 1260x2736.
  { id: 'ios-6.9', W: 1320, H: 2868, cssW: 390, s: 1 },
  // Apple, iPhone 6.3" (iPhone 17 Pro, 17, 16 Pro...). App Store Connect lists this "medium display" size as the
  // required iPhone size as of October 2026; 1206x2622 or 1179x2556.
  { id: 'ios-6.3', W: 1206, H: 2622, cssW: 390, s: 1206 / 1320 },
  // Apple, iPad 13" (required while the app runs on iPad). 2064x2752 or 2048x2732.
  { id: 'ipad-13', W: 2064, H: 2752, cssW: 768, s: 1.42, pad: 232 },
  // Google Play phone: 9:16, 1080 px on the short side (the size Play recommends for promotion). Laid out at the
  // 412 px width of most Android phones, with a tighter caption: 9:16 is shorter than today's phones.
  { id: 'android-phone', W: 1080, H: 1920, cssW: 412, s: 0.84, capTop: 70, capH: 262, bottom: 64 },
  // Google Play 7" and 10" tablets: 9:16, each side 1,080-7,680 px.
  { id: 'android-tablet-7', W: 1440, H: 2560, cssW: 600, s: 1.06, capH: 410 },
  { id: 'android-tablet-10', W: 1800, H: 3200, cssW: 800, s: 1.3 },
];

/** Text that must never appear on a store screenshot. */
const FORBIDDEN = /placeholder|lorem|debug|test ads?\b|\(development\)|development build|undefined|\bNaN\b|\[object|TODO|FIXME|sample ad|Test Ad/i;

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.ico': 'image/x-icon', '.json': 'application/json', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.svg': 'image/svg+xml' };

function findChrome() {
  if (process.env.CHROME_PATH && existsSync(process.env.CHROME_PATH)) return process.env.CHROME_PATH;
  const root = process.env.PLAYWRIGHT_BROWSERS_PATH;
  if (!root || !existsSync(root)) return undefined;
  const dir = readdirSync(root).find((d) => /^chromium-\d+$/.test(d));
  if (!dir) return undefined;
  const candidates = [path.join(root, dir, 'chrome-linux', 'chrome'), path.join(root, dir, 'chrome-linux64', 'chrome')];
  return candidates.find((c) => existsSync(c));
}

/** Static server for the export (the e2e/smoke.mjs pattern: /life serves life.html, unknown paths index.html). */
async function serve() {
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url, `http://localhost:${PORT}`);
      let file = path.join(DIST, decodeURIComponent(url.pathname));
      if (!file.startsWith(DIST)) throw new Error('bad path');
      const s = await stat(file).catch(() => null);
      if (!s || s.isDirectory()) {
        const html = s ? path.join(file, 'index.html') : `${file}.html`;
        file = existsSync(html) ? html : path.join(DIST, 'index.html');
      }
      const data = await readFile(file);
      res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream' });
      res.end(data);
    } catch {
      res.writeHead(404);
      res.end('not found');
    }
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(PORT, resolve);
  });
  return server;
}

/** Frame geometry for a set: where the caption and the screenshot go, and the CSS viewport to capture. */
function layout(set) {
  const s = set.s;
  const pad = set.pad ?? Math.round(100 * s);
  const capTop = set.capTop ?? Math.round(150 * s);
  const capH = set.capH ?? Math.round(430 * s);
  const bottom = set.bottom ?? Math.round(110 * s);
  const slotW = set.W - 2 * pad;
  const slotTop = capTop + capH;
  const slotH = set.H - slotTop - bottom;
  const dsf = slotW / set.cssW;
  const cssH = Math.round(slotH / dsf);
  return { s, pad, capTop, capH, bottom, slotW, slotTop, slotH, dsf, cssH, radius: Math.round(56 * s), font: Math.round(124 * s) };
}

// ---------------------------------------------------------------------------------------------------------------
// PNG: drop the alpha channel (Chromium writes RGBA even for an opaque page).

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}

/** Decodes an 8-bit RGB/RGBA PNG and re-encodes it as 8-bit RGB. Throws on any other kind, or on real transparency. */
export function toRgbPng(png) {
  const sig = png.subarray(0, 8);
  if (!sig.equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) throw new Error('not a PNG');
  let pos = 8;
  let ihdr = null;
  const idat = [];
  while (pos < png.length) {
    const len = png.readUInt32BE(pos);
    const type = png.toString('ascii', pos + 4, pos + 8);
    const data = png.subarray(pos + 8, pos + 8 + len);
    if (type === 'IHDR') ihdr = data;
    else if (type === 'IDAT') idat.push(data);
    pos += 12 + len;
  }
  const w = ihdr.readUInt32BE(0);
  const h = ihdr.readUInt32BE(4);
  const depth = ihdr[8];
  const colorType = ihdr[9];
  const interlace = ihdr[12];
  if (depth !== 8 || interlace !== 0 || (colorType !== 6 && colorType !== 2)) throw new Error(`unsupported PNG (depth ${depth}, color ${colorType}, interlace ${interlace})`);
  if (colorType === 2) return png;
  const bpp = 4;
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = w * bpp;
  const out = Buffer.alloc(h * (1 + w * 3));
  let prev = Buffer.alloc(stride);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)];
    const line = Buffer.from(raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1)));
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? line[x - bpp] : 0;
      const b = prev[x];
      const c = x >= bpp ? prev[x - bpp] : 0;
      let v = line[x];
      if (f === 1) v += a;
      else if (f === 2) v += b;
      else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      line[x] = v & 0xff;
    }
    const o = y * (1 + w * 3);
    out[o] = 0;
    for (let x = 0; x < w; x++) {
      if (line[x * 4 + 3] !== 255) throw new Error(`transparent pixel at ${x},${y}`);
      out[o + 1 + x * 3] = line[x * 4];
      out[o + 2 + x * 3] = line[x * 4 + 1];
      out[o + 3 + x * 3] = line[x * 4 + 2];
    }
    prev = line;
  }
  const header = Buffer.from(ihdr);
  header[9] = 2;
  return Buffer.concat([sig, chunk('IHDR', header), chunk('IDAT', zlib.deflateSync(out, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

// ---------------------------------------------------------------------------------------------------------------
// Capture

function loadSave(name) {
  const file = path.join(SAVES, `${name}.json`);
  if (!existsSync(file)) throw new Error(`missing save ${file}: run with --fresh-saves`);
  return JSON.parse(readFileSync(file, 'utf8')).localStorage;
}

/** One screen of the game at the slot's exact pixel size, plus the text on it (for the forbidden-text check). */
async function capture(browser, set, shot) {
  const L = layout(set);
  const origin = `http://localhost:${PORT}`;
  const items = loadSave(shot.save);
  const context = await browser.newContext({
    viewport: { width: set.cssW, height: L.cssH },
    deviceScaleFactor: L.dsf,
    isMobile: false,
    hasTouch: true,
    reducedMotion: 'reduce',
    storageState: { cookies: [], origins: [{ origin, localStorage: Object.entries(items).map(([name, value]) => ({ name, value })) }] },
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  try {
    await page.goto(`${origin}${shot.route}`, { waitUntil: 'networkidle' });
    if (shot.ready) await page.locator(`[data-testid="${shot.ready}"]`).filter({ visible: true }).first().waitFor({ timeout: 15000 });
    else await page.waitForTimeout(800);
    // Fonts, images and the event card's entrance settle; no toast is waiting on a freshly loaded save.
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1200);
    if (shot.scrollTo) {
      const moved = await page.evaluate(({ text, offset }) => {
        const el = [...document.querySelectorAll('div,span')].find((d) => d.childElementCount === 0 && d.textContent.trim() === text);
        if (!el) return false;
        let sc = el.parentElement;
        while (sc && !(sc.scrollHeight > sc.clientHeight && /(auto|scroll)/.test(getComputedStyle(sc).overflowY))) sc = sc.parentElement;
        if (!sc) return false;
        sc.scrollTop += el.getBoundingClientRect().top - sc.getBoundingClientRect().top - offset;
        return true;
      }, shot.scrollTo);
      if (!moved) throw new Error(`${set.id}/${shot.id}: cannot scroll to "${shot.scrollTo.text}"`);
      await page.waitForTimeout(400);
    }
    const text = await page.evaluate(() => document.body.innerText);
    const bad = text.match(FORBIDDEN);
    if (bad) throw new Error(`${set.id}/${shot.id}: forbidden text on screen: "${bad[0]}"`);
    if (errors.length) throw new Error(`${set.id}/${shot.id}: page errors: ${errors.join('; ')}`);
    let callout = null;
    const card = shot.callout ? page.locator(`[data-testid="${shot.callout.testid}"]`).first().locator('xpath=..') : null;
    let inView = true;
    if (card) {
      // Already on screen (a tablet): nothing to lift. Just past the bottom edge: scroll it into view, as long as
      // that keeps the top of the screen. Further down (a phone): lift it.
      const box = await card.boundingBox();
      const need = Math.ceil(box.y + box.height - (L.cssH - 16));
      if (need > 0 && box.y < L.cssH && need <= 60) {
        await card.evaluate((el, by) => {
          let sc = el.parentElement;
          while (sc && !(sc.scrollHeight > sc.clientHeight && /(auto|scroll)/.test(getComputedStyle(sc).overflowY))) sc = sc.parentElement;
          if (sc) sc.scrollTop += by;
        }, need);
        await page.waitForTimeout(400);
      } else inView = need <= 0;
    }
    const png = await page.screenshot({ type: 'png' });
    if (card && !inView) {
      const y = async (id) => (await page.locator(`[data-testid="${id}"]`).first().boundingBox()).y;
      const anchors = [];
      for (const id of shot.callout.at) anchors.push(await y(id));
      const floor = await y(shot.callout.floor);
      const realTop = (await card.boundingBox()).y;
      await card.scrollIntoViewIfNeeded();
      await page.waitForTimeout(400);
      const box = await card.boundingBox();
      callout = { png: await card.screenshot({ type: 'png' }), left: box.x, anchors, floor, realTop };
    }
    return { png, text, callout };
  } finally {
    await context.close();
  }
}

const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');

/** The marketing frame: caption on top, the screen below with rounded corners, on the app's dark theme. */
function frameHtml(set, shot, png, imgH, callout) {
  const L = layout(set);
  const top = L.slotTop + Math.round((L.slotH - imgH) / 2);
  let lifted = '';
  if (callout) {
    const { w, h } = pngSize(callout.png);
    // Exactly over the first anchor it fits on (the achievements button, else the New life row), else as low as
    // the frame allows. Never above the floor (the New life row: the tombstone and the heir stay in view), and it
    // always reaches past the bottom of the screen, so no sliver of what it covers (or of the real card) shows under it.
    const at = (y) => top + Math.round(y * L.dsf);
    const maxBottom = set.H - Math.round(30 * L.s);
    const ok = (t) => t + h <= maxBottom && t >= at(callout.floor) - Math.round(12 * L.dsf) && t + h >= top + imgH && (callout.realTop >= L.cssH || t <= at(callout.realTop));
    const ctop = [...callout.anchors.map(at), maxBottom - h].find(ok);
    if (ctop === undefined) throw new Error(`${set.id}/${shot.id}: the lifted card (${h}px) does not fit below the heir card`);
    const cleft = L.pad + Math.round(callout.left * L.dsf);
    lifted = `<div class="lift" style="left:${cleft}px;top:${ctop}px;width:${w}px;height:${h}px;border-radius:${Math.round(18 * L.dsf)}px"><img src="data:image/png;base64,${callout.png.toString('base64')}" style="width:${w}px;height:${h}px"></div>`;
  }
  const [line1, line2] = shot.caption;
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  html,body{margin:0;padding:0}
  body{width:${set.W}px;height:${set.H}px;overflow:hidden;position:relative;background:#0F0E1A;
    font-family:'Inter Display','Inter',-apple-system,'SF Pro Display','Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased}
  .glow{position:absolute;inset:0;background:
    radial-gradient(${Math.round(set.W * 0.9)}px ${Math.round(L.capH * 1.6)}px at 50% ${Math.round(L.capTop + L.capH * 0.35)}px, rgba(67,56,202,.55), rgba(67,56,202,0) 70%),
    radial-gradient(${Math.round(set.W * 0.8)}px ${Math.round(set.H * 0.35)}px at 50% ${set.H}px, rgba(124,58,237,.22), rgba(124,58,237,0) 70%)}
  .cap{position:absolute;left:${L.pad}px;right:${L.pad}px;top:${L.capTop}px;height:${L.capH}px;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center}
  h1{margin:0;font-weight:800;font-size:${L.font}px;line-height:1.06;letter-spacing:-0.025em;color:#F5F3FF}
  h1 .a{color:#A3E635}
  .shot{position:absolute;left:${L.pad}px;top:${top}px;width:${L.slotW}px;height:${imgH}px;border-radius:${L.radius}px;overflow:hidden;
    box-shadow:0 0 0 ${Math.max(2, Math.round(4 * L.s))}px #2F2B55, 0 ${Math.round(30 * L.s)}px ${Math.round(110 * L.s)}px rgba(67,56,202,.45)}
  .shot img{display:block;width:${L.slotW}px;height:${imgH}px}
  .lift{position:absolute;overflow:hidden;box-shadow:0 0 0 ${Math.max(3, Math.round(5 * L.s))}px #A3E635, 0 ${Math.round(24 * L.s)}px ${Math.round(90 * L.s)}px rgba(5,4,15,.85)}
  .lift img{display:block}
  </style></head><body><div class="glow"></div>
  <div class="cap"><h1>${esc(line1)}<br><span class="a">${esc(line2)}</span></h1></div>
  <div class="shot"><img src="data:image/png;base64,${png.toString('base64')}"></div>
  ${lifted}
  </body></html>`;
}

function pngSize(png) {
  return { w: png.readUInt32BE(16), h: png.readUInt32BE(20) };
}

async function render(browser, set, shot, png, callout) {
  const L = layout(set);
  const { w, h } = pngSize(png);
  if (w !== L.slotW) throw new Error(`${set.id}/${shot.id}: capture is ${w}px wide, slot is ${L.slotW}px`);
  const page = await browser.newPage({ viewport: { width: set.W, height: set.H }, deviceScaleFactor: 1 });
  try {
    await page.setContent(frameHtml(set, shot, png, h, callout), { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    // The caption must fit its box on two lines.
    const fits = await page.evaluate(() => {
      const cap = document.querySelector('.cap');
      const h1 = document.querySelector('h1');
      const lines = Math.round(h1.getBoundingClientRect().height / parseFloat(getComputedStyle(h1).lineHeight));
      return { lines, over: h1.scrollWidth > cap.clientWidth || h1.getBoundingClientRect().height > cap.clientHeight };
    });
    if (fits.over || fits.lines > 2) throw new Error(`${set.id}/${shot.id}: caption does not fit (${fits.lines} lines)`);
    return toRgbPng(await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: set.W, height: set.H } }));
  } finally {
    await page.close();
  }
}

async function main() {
  if (args.includes('--fresh-saves') || !existsSync(path.join(SAVES, 'teen.json'))) {
    console.log('building saves: npx tsx scripts/store-saves.ts');
    execFileSync('npx', ['tsx', 'scripts/store-saves.ts', '--out', SAVES], { cwd: ROOT, stdio: 'inherit' });
  }
  if (!existsSync(path.join(DIST, 'index.html'))) throw new Error(`no web export at ${DIST}: run npm run build:web (or pass --dist)`);
  const sets = SETS.filter((s) => !ONLY.length || ONLY.includes(s.id));
  const server = await serve();
  const browser = await chromium.launch({ executablePath: findChrome(), args: ['--no-sandbox', '--font-render-hinting=none'] });
  const report = [];
  try {
    for (const set of sets) {
      const dir = path.join(OUT, set.id);
      rmSync(dir, { recursive: true, force: true });
      mkdirSync(dir, { recursive: true });
      for (const [i, shot] of SHOTS.entries()) {
        const { png, callout } = await capture(browser, set, shot);
        if (KEEP_RAW) {
          mkdirSync(path.join(OUT, 'raw', set.id), { recursive: true });
          writeFileSync(path.join(OUT, 'raw', set.id, `${String(i + 1).padStart(2, '0')}-${shot.id}.png`), png);
        }
        const framed = await render(browser, set, shot, png, callout);
        const file = path.join(dir, `${String(i + 1).padStart(2, '0')}-${shot.id}.png`);
        writeFileSync(file, framed);
        const { w, h } = pngSize(framed);
        if (w !== set.W || h !== set.H) throw new Error(`${file}: ${w}x${h}, expected ${set.W}x${set.H}`);
        report.push(`${path.relative(ROOT, file)}  ${w}x${h}  ${Math.round(framed.length / 1024)} KB`);
        console.log(report.at(-1));
      }
    }
  } finally {
    await browser.close();
    server.close();
  }
  console.log(`done: ${report.length} screenshots`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await main();
}
