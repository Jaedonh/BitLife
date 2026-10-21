/**
 * Release gate: the privacy policy linked from Settings must be live before
 * submission (Apple 5.1.1(i); Google Play requires the policy to be reachable
 * from inside the app).
 *
 *   EXPO_PUBLIC_PRIVACY_URL=https://<user>.github.io/<repo>/privacy.html npm run check:privacy
 *
 * Exits 1 until EXPO_PUBLIC_PRIVACY_URL is set to a real address (not the placeholder
 * in src/config/legal.ts) that answers HTTP 200 with the published policy page
 * (store/site/privacy.html, built from docs/PRIVACY_POLICY.md) and its placeholders
 * filled in. Every EAS production build runs it (package.json, eas-build-post-install).
 */
import { PLACEHOLDER_PRIVACY_URL, PRIVACY_URL } from '../src/config/legal';

/** Left in the page when store/site/tools/build.mjs was not run with --name and --email. */
const UNFILLED = ['[YOUR LEGAL NAME]', '[CONTACT EMAIL]', 'class="todo"'];

async function main(): Promise<void> {
  if (PRIVACY_URL === PLACEHOLDER_PRIVACY_URL) {
    throw new Error(
      `EXPO_PUBLIC_PRIVACY_URL is unset or still the placeholder ${PLACEHOLDER_PRIVACY_URL}. ` +
        'Publish the site (store/site/README.md), then set it to https://<user>.github.io/<repo>/privacy.html.',
    );
  }
  // http only for a local test server (node store/site/tools/build.mjs --out /tmp/site …, then serve it).
  if (!/^https:\/\//.test(PRIVACY_URL) && !/^http:\/\/(localhost|127\.0\.0\.1)[:/]/.test(PRIVACY_URL)) {
    throw new Error(`${PRIVACY_URL} must be an https:// address.`);
  }
  const res = await fetch(PRIVACY_URL, { redirect: 'follow' }).catch((err: unknown) => {
    throw new Error(`Could not reach ${PRIVACY_URL}: ${err instanceof Error ? err.message : String(err)}`);
  });
  if (!res.ok) {
    throw new Error(`${PRIVACY_URL} answered HTTP ${res.status}. Publish the site there first (store/site/README.md, docs/RELEASE_CHECKLIST.md §1).`);
  }
  const body = await res.text();
  // The policy page's <title> and heading read "<App> Privacy Policy". The site's home page only links to it.
  const title = body.match(/<title>([^<]*)<\/title>/i)?.[1] ?? '';
  if (!/privacy policy/i.test(title)) {
    throw new Error(`${PRIVACY_URL} answered HTTP ${res.status}, but it is not the privacy policy page (title "${title}"). Point EXPO_PUBLIC_PRIVACY_URL at …/privacy.html, not the site's home page.`);
  }
  const left = UNFILLED.filter((p) => body.includes(p));
  if (left.length) {
    throw new Error(`${PRIVACY_URL} still shows ${left.join(', ')}. Rebuild it with node store/site/tools/build.mjs --out … --name … --email … and publish again.`);
  }
  console.log(`ok: ${PRIVACY_URL} → HTTP ${res.status}, "${title}"`);
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
