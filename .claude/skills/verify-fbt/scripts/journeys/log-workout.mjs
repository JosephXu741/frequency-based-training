import { openApp, evidence, assert } from '../lib.mjs';

const PRESET = process.argv[2] ?? 'Legs';
const ev = evidence(`log-workout-${PRESET.toLowerCase()}`);
const { browser, page } = await openApp({ standalone: true });
try {
  await page.getByRole('button', { name: /^\+ Log Workout$/ }).click();
  const dialog = page.getByRole('dialog', { name: 'Log Workout' });
  await dialog.waitFor();
  await dialog.getByRole('button', { name: PRESET, exact: true }).click();
  const save = dialog.getByRole('button', { name: /^Log Workout \(\d+ muscles\)$/ });
  const n = Number((await save.textContent()).match(/\((\d+) muscles\)/)[1]);
  assert(n > 0, `"${PRESET}" preset selects ${n} muscle group(s)`);
  await dialog.getByPlaceholder(/^e\.g\. Bench/).fill('verify-fbt run');
  await ev.shot(page, 'preset-selected');
  await save.click();
  await dialog.waitFor({ state: 'detached' });

  await page.getByLabel('Workout History').click();
  const history = page.getByRole('dialog', { name: 'Workout History' });
  await history.getByText(`${n} muscles`).waitFor();
  await history.getByText('"verify-fbt run"').waitFor();
  assert(true, `history shows the ${n}-muscle session with its note`);
  await ev.shot(page, 'history');

  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('fbt_workouts') ?? '[]'));
  assert(stored[0]?.muscleGroupIds.length === n, `stored workout has ${n} muscleGroupIds`);
  ev.record({ feature: 'log-workout', preset: PRESET, muscles: n, result: 'pass' });
  console.log(`evidence ${ev.dir}`);
} catch (e) {
  await ev.shot(page, 'FAILURE').catch(() => {});
  ev.record({ feature: 'log-workout', preset: PRESET, result: 'fail', error: String(e) });
  console.error(String(e));
  process.exitCode = 1;
} finally {
  await browser.close();
}
