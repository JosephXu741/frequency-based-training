import { openApp, evidence, assert, overdueCount, resetTimerButtons } from '../lib.mjs';

const ev = evidence('quick-reset');
const { browser, page } = await openApp({ standalone: true });
try {
  await ev.shot(page, 'before');
  const before = await overdueCount(page);
  const target = resetTimerButtons(page).first();
  const group = (await target.getAttribute('title')).replace(/^Log (.+) as trained today$/, '$1');
  await target.click();
  await page.waitForFunction((b) => {
    const h = [...document.querySelectorAll('h2')].find((e) => /overdue!$/.test(e.textContent));
    return (h ? Number(h.textContent.match(/\d+/)[0]) : 0) < b;
  }, before, { timeout: 5000 });
  assert((await overdueCount(page)) === before - 1, `Reset Timer on "${group}" drops overdue ${before} -> ${before - 1}`);
  await ev.shot(page, 'after');

  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('fbt_workouts') ?? '[]'));
  assert(stored.length === 1 && stored[0].notes === 'Quick single-group reset', 'localStorage fbt_workouts holds one quick-reset workout');

  await page.reload();
  await resetTimerButtons(page).first().waitFor();
  assert((await overdueCount(page)) === before - 1, 'reset survives a reload');
  ev.record({ feature: 'quick-reset', group, overdueBefore: before, result: 'pass' });
  console.log(`evidence ${ev.dir}`);
} catch (e) {
  await ev.shot(page, 'FAILURE').catch(() => {});
  ev.record({ feature: 'quick-reset', result: 'fail', error: String(e) });
  console.error(String(e));
  process.exitCode = 1;
} finally {
  await browser.close();
}
