/**
 * Scripted playthrough of the web export: new life → age ups with events →
 * every section screen → death screen. Fails on any page/console error.
 *
 *   npm run build:web && node e2e/playthrough.mjs
 */
import { run } from './smoke.mjs';

const tid = (id) => `[data-testid="${id}"]`;

async function visible(page, id) {
  return (await page.locator(tid(id)).count()) > 0 && (await page.locator(tid(id)).first().isVisible());
}

async function tapIfVisible(page, id) {
  if (await visible(page, id)) {
    await page.locator(tid(id)).first().click();
    return true;
  }
  return false;
}

async function settleEvents(page) {
  // Resolve any pending event cards (always pick the first choice).
  for (let i = 0; i < 6; i++) {
    if (!(await visible(page, 'event-modal'))) break;
    await page.locator(tid('choice-0')).click();
    await page.waitForTimeout(80);
  }
}

async function ageOnce(page) {
  await settleEvents(page);
  await page.locator(tid('age-up')).click();
  await page.waitForTimeout(60);
  await settleEvents(page);
}

async function back(page) {
  if (!(await tapIfVisible(page, 'back'))) await page.goBack();
  await page.waitForTimeout(150);
}

await run(async ({ page, shot }) => {
  await page.waitForSelector(tid('new-random-life'), { timeout: 20000 });
  await shot('menu');

  await page.locator(tid('new-random-life')).click();
  await page.waitForSelector(tid('age-up'), { timeout: 10000 });
  await shot('life-newborn');

  for (let i = 0; i < 8; i++) await ageOnce(page);
  await shot('life-child');
  if (await visible(page, 'event-modal')) await shot('event');

  for (let i = 0; i < 10; i++) await ageOnce(page);
  const age = await page.locator(tid('char-age')).innerText();
  if (Number(age) < 15) throw new Error(`expected age >= 15 after 18 age-ups, got ${age}`);
  await shot('life-teen');

  // Section screens
  await page.locator(tid('tab-occupation')).click();
  await page.waitForTimeout(300);
  await shot('occupation');
  await tapIfVisible(page, 'study');
  await back(page);

  await page.locator(tid('tab-relationships')).click();
  await page.waitForTimeout(300);
  await shot('relationships');
  if (await tapIfVisible(page, 'person-mother')) {
    await page.waitForTimeout(300);
    await shot('person');
    await tapIfVisible(page, 'interact-spendTime');
    await page.waitForTimeout(200);
    await back(page);
  }
  await back(page);

  await page.locator(tid('tab-activities')).click();
  await page.waitForTimeout(300);
  await shot('activities');
  await tapIfVisible(page, 'activity-library');
  await back(page);

  await page.locator(tid('tab-assets')).click();
  await page.waitForTimeout(300);
  await shot('assets');
  await back(page);

  await page.locator(tid('open-settings')).click();
  await page.waitForTimeout(300);
  await shot('settings');
  await back(page);

  // Play to adulthood, grab a job if possible, then run to death.
  for (let i = 0; i < 6; i++) await ageOnce(page);
  await page.locator(tid('tab-occupation')).click();
  await page.waitForTimeout(300);
  const applyButtons = page.locator('[data-testid^="apply-"]');
  const n = await applyButtons.count();
  for (let i = 0; i < n; i++) {
    const b = applyButtons.nth(i);
    if (await b.isEnabled()) {
      await b.click();
      break;
    }
  }
  await page.waitForTimeout(200);
  await shot('occupation-adult');
  await back(page);

  let died = false;
  for (let i = 0; i < 130; i++) {
    if (await visible(page, 'tombstone')) {
      died = true;
      break;
    }
    if (!(await visible(page, 'age-up'))) {
      await page.waitForTimeout(200);
      continue;
    }
    await ageOnce(page);
  }
  await page.waitForTimeout(400);
  if (!(await visible(page, 'tombstone'))) throw new Error('life did not end on the death screen');
  await shot('death');
  await page.locator(tid('death-menu')).click();
  await page.waitForTimeout(300);
  await page.locator(tid('menu-graveyard')).click();
  await page.waitForTimeout(300);
  await shot('graveyard');
  console.log(died ? 'reached death screen' : 'death screen visible');
});
