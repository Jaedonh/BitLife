/**
 * Life screen checks against the static web export: the journal keeps the current year in
 * view (after Age+, after scrolling away, after visiting a tab), results show on the screen
 * where the player tapped, cash only shows on life screens, and no old toast replays on launch.
 *
 *   npm run build:web && node e2e/life-ui.mjs
 */
import { run } from './smoke.mjs';

const tid = (id) => `[data-testid="${id}"]`;
const onScreen = (page, id) => page.locator(tid(id)).filter({ visible: true });
const visible = async (page, id) => (await onScreen(page, id).count()) > 0;

function check(ok, message) {
  if (!ok) throw new Error(message);
  console.log(`ok - ${message}`);
}

async function settleEvents(page) {
  for (let i = 0; i < 8 && (await visible(page, 'event-modal')); i++) {
    await page.locator(tid('choice-0')).click();
    await page.waitForTimeout(80);
  }
}

async function ageOnce(page) {
  await settleEvents(page);
  await onScreen(page, 'age-up').click();
  await page.waitForTimeout(60);
  await settleEvents(page);
}

/** The first journal card on screen and whether it sits inside the viewport. */
async function topCard(page) {
  return page.evaluate(() => {
    const card = [...document.querySelectorAll('[data-testid^="year-card-"]')].find((c) => c.getBoundingClientRect().height > 0);
    const r = card?.getBoundingClientRect();
    return { id: card?.getAttribute('data-testid') ?? null, inView: !!r && r.top >= 0 && r.top < innerHeight };
  });
}

async function age(page) {
  return Number(await onScreen(page, 'char-age').innerText());
}

await run(async ({ page, shot }) => {
  await page.waitForSelector(tid('new-random-life'), { timeout: 20000 });
  await page.locator(tid('new-random-life')).click();
  await page.waitForSelector(tid('age-up'), { timeout: 10000 });
  await page.waitForTimeout(300);
  // A new life opens with a newborn card; answer it before dismissing the tip underneath.
  await settleEvents(page);
  if (await visible(page, 'tutorial-tip')) await onScreen(page, 'tutorial-tip').click();

  for (let i = 0; i < 12; i++) await ageOnce(page);
  await page.waitForTimeout(400);
  let top = await topCard(page);
  check(top.inView && top.id === `year-card-${await age(page)}`, `the current year is the first card in view after 12 age-ups (${top.id})`);
  await shot('life-journal-current-year');

  await onScreen(page, 'life-log').hover();
  await page.mouse.wheel(0, 3000);
  await page.waitForTimeout(300);
  await ageOnce(page);
  await page.waitForTimeout(700);
  top = await topCard(page);
  check(top.inView && top.id === `year-card-${await age(page)}`, 'after scrolling into the past, Age+ brings the new year back into view');

  await onScreen(page, 'tab-activities').click();
  await page.waitForTimeout(400);
  check(await visible(page, 'header-money'), 'Activities shows the life’s cash');
  const activities = await page.evaluate(() => [...document.querySelectorAll('[data-testid^="activity-"]')].filter((e) => e.getBoundingClientRect().height > 0).map((e) => e.getAttribute('data-testid')));
  if (activities.length) {
    await onScreen(page, activities[0]).click();
    await page.waitForTimeout(250);
    check(await visible(page, 'result-toast'), 'an activity’s result shows on the Activities screen');
    await shot('activities-result-toast');
  }
  await onScreen(page, 'back').click();
  await page.waitForTimeout(500);
  top = await topCard(page);
  check(top.inView && top.id === `year-card-${await age(page)}`, 'returning from a tab keeps the current year in view');

  await onScreen(page, 'open-settings').click();
  await page.waitForTimeout(400);
  check(!(await visible(page, 'header-money')), 'Settings does not show the life’s cash');
  await onScreen(page, 'back').click();
  await page.waitForTimeout(300);

  await onScreen(page, 'stats-header').click();
  await page.waitForTimeout(400);
  check(await visible(page, 'profile-sheet'), 'tapping the header opens the profile sheet');
  await shot('profile-sheet');
  await onScreen(page, 'profile-close').click();
  await page.waitForTimeout(300);

  // An old save that still carries a result must not replay it at launch.
  await page.waitForTimeout(400);
  await page.evaluate(() => {
    const save = JSON.parse(localStorage.getItem('lifeloop.save.v1'));
    save.lastResult = { text: "I've done that enough this year.", kind: 'info' };
    localStorage.setItem('lifeloop.save.v1', JSON.stringify(save));
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector(tid('age-up'), { timeout: 10000 });
  await page.waitForTimeout(500);
  check(!(await visible(page, 'result-toast')), 'no stale toast replays after a reload');

  // A reload on a section screen leaves no history: Back still returns to the life screen, not the menu.
  await onScreen(page, 'tab-activities').click();
  await page.waitForTimeout(400);
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector(tid('back'), { timeout: 10000 });
  await page.waitForTimeout(300);
  await onScreen(page, 'back').click();
  await page.waitForTimeout(600);
  check(new URL(page.url()).pathname.endsWith('/life') && (await visible(page, 'age-up')), `Back after a reload on Activities returns to the life screen (${new URL(page.url()).pathname})`);
});
