/**
 * Release gate: the privacy policy linked from Settings must be live before
 * submission (Apple 5.1.1(i); Google Play requires the policy to be reachable
 * from inside the app).
 *
 *   npm run check:privacy   # exits 1 until PRIVACY_URL answers HTTP 200 with the policy
 */
import { PRIVACY_URL } from '../src/config/legal';

async function main(): Promise<void> {
  const res = await fetch(PRIVACY_URL, { redirect: 'follow' }).catch((err: unknown) => {
    throw new Error(`Could not reach ${PRIVACY_URL}: ${err instanceof Error ? err.message : String(err)}`);
  });
  if (!res.ok) {
    throw new Error(`${PRIVACY_URL} answered HTTP ${res.status}. Publish docs/PRIVACY_POLICY.md there first (docs/RELEASE_CHECKLIST.md §1).`);
  }
  const body = await res.text();
  if (!/privacy policy/i.test(body)) {
    throw new Error(`${PRIVACY_URL} answered HTTP ${res.status} but the page does not contain a privacy policy.`);
  }
  console.log(`ok: ${PRIVACY_URL} → HTTP ${res.status}`);
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
