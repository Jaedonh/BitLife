/**
 * Prepares the static web export in dist/ for GitHub Pages:
 * - .nojekyll so Pages serves the _expo/ folder (Jekyll skips folders starting with "_").
 * - 404.html as a copy of the app shell, so reloading a deep link (e.g. /life) still opens the game.
 *
 *   EXPO_BASE_URL=/BitLife npm run build:pages
 */
import { copyFileSync, existsSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const dist = path.resolve('dist');
const index = path.join(dist, 'index.html');
if (!existsSync(index)) {
  console.error('dist/index.html not found: run the web export first.');
  process.exit(1);
}
writeFileSync(path.join(dist, '.nojekyll'), '');
copyFileSync(index, path.join(dist, '404.html'));
console.log('dist/ prepared for GitHub Pages (.nojekyll, 404.html)');
