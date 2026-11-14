import { openApp, signInWithGoogle, evidence, assert, overdueCount, resetTimerButtons, firestoreDocs } from '../lib.mjs';

const ev = evidence('offline-sync');
const { browser, ctx, page } = await openApp({ standalone: true });
try {
  const flow = await signInWithGoogle(page);
  assert(flow === 'redirect', `standalone sign-in used redirect (got ${flow})`);
  await ev.shot(page, 'signed-in');

  const before = await overdueCount(page);
  const target = resetTimerButtons(page).first();
  const group = (await target.getAttribute('title')).replace(/^Log (.+) as trained today$/, '$1');
  const docsBefore = (await firestoreDocs('workouts')).length;

  await ctx.setOffline(true);
  await target.click();
  await page.waitForFunction((b) => {
    const h = [...document.querySelectorAll('h2')].find((e) => /overdue!$/.test(e.textContent));
    const n = h ? Number(h.textContent.match(/\d+/)[0]) : 0;
    return n < b;
  }, before, { timeout: 5000 });
  const after = await overdueCount(page);
  assert(after === before - 1, `offline Reset Timer on "${group}" updated the UI at once (overdue ${before} -> ${after})`);
  await ev.shot(page, 'offline-after-reset');

  await page.getByLabel('Workout History').click();
  const history = page.getByRole('dialog', { name: 'Workout History' });
  await history.getByText(group, { exact: true }).waitFor();
  assert(true, `offline history lists "${group}"`);
  await ev.shot(page, 'offline-history');

  await page.reload();
  await resetTimerButtons(page).first().waitFor({ timeout: 15000 });
  assert((await overdueCount(page)) === after, 'offline reload (served by service worker) keeps the logged workout');
  await ev.shot(page, 'offline-reload');

  await ctx.setOffline(false);
  let docsAfter = docsBefore;
  for (let i = 0; i < 20 && docsAfter === docsBefore; i++) {
    await page.waitForTimeout(500);
    docsAfter = (await firestoreDocs('workouts')).length;
  }
  assert(docsAfter === docsBefore + 1, `workout synced to Firestore after reconnect (${docsBefore} -> ${docsAfter} docs)`);
  ev.record({ feature: 'offline-sync', group, overdueBefore: before, overdueAfter: after, docsBefore, docsAfter, result: 'pass' });
  console.log(`evidence ${ev.dir}`);
} catch (e) {
  await ev.shot(page, 'FAILURE').catch(() => {});
  ev.record({ feature: 'offline-sync', result: 'fail', error: String(e) });
  console.error(String(e));
  process.exitCode = 1;
} finally {
  await browser.close();
}
