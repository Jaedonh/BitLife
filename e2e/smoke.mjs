/**
 * End-to-end smoke run against the static web export (dist/).
 *
 *   npm run build:web && node e2e/smoke.mjs
 *
 * Uses the system Chromium (PLAYWRIGHT_BROWSERS_PATH or CHROME_PATH) so no
 * browser download is needed. Screenshots land in e2e/screenshots/.
 */
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, stat, mkdir } from 'node:fs/promises';
import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';

const DIST = path.resolve('dist');
const OUT = path.resolve('e2e/screenshots');
const PORT = 8123;
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.ico': 'image/x-icon', '.json': 'application/json', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.svg': 'image/svg+xml' };

function findChrome() {
  if (process.env.CHROME_PATH && existsSync(process.env.CHROME_PATH)) return process.env.CHROME_PATH;
  const root = process.env.PLAYWRIGHT_BROWSERS_PATH;
  if (!root || !existsSync(root)) return undefined; // let Playwright use its own managed browser
  const dir = readdirSync(root).find((d) => /^chromium-\d+$/.test(d));
  if (!dir) return undefined;
  const candidates = [path.join(root, dir, 'chrome-linux', 'chrome'), path.join(root, dir, 'chrome-linux64', 'chrome')];
  return candidates.find((c) => existsSync(c));
}

async function serve() {
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url, `http://localhost:${PORT}`);
      let file = path.join(DIST, decodeURIComponent(url.pathname));
      if (!file.startsWith(DIST)) throw new Error('bad path');
      let s = await stat(file).catch(() => null);
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
  await new Promise((r) => server.listen(PORT, r));
  return server;
}

export async function run(steps) {
  await mkdir(OUT, { recursive: true });
  const server = await serve();
  const browser = await chromium.launch({ executablePath: findChrome(), args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
  let shots = 0;
  const shot = async (name) => { shots++; await page.screenshot({ path: path.join(OUT, `${String(shots).padStart(2, '0')}-${name}.png`) }); };
  try {
    await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' });
    await steps({ page, shot });
  } finally {
    await browser.close();
    server.close();
  }
  if (errors.length) {
    console.error('Errors during run:\n' + errors.join('\n'));
    process.exitCode = 1;
  }
  console.log(`done: ${shots} screenshots in ${OUT}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await run(async ({ page, shot }) => {
    await page.waitForTimeout(1500);
    await shot('home');
  });
}
