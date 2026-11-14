import { openApp, evidence, assert } from '../lib.mjs';

const NAME = 'Forearms';
const ev = evidence('manage-groups');
const { browser, page } = await openApp({ standalone: true });
const open = async () => {
  await page.getByLabel('Manage Muscle Groups').click();
  const d = page.getByRole('dialog', { name: 'Muscle Groups & Frequencies' });
  await d.waitFor();
  return d;
};
try {
  let dialog = await open();
  await dialog.getByPlaceholder('e.g. Forearms, Traps, Abs').fill(NAME);
  await dialog.getByTitle('Add Group').click();
  await dialog.getByRole('button', { name: 'Done', exact: true }).click();
  await page.getByTitle(`Log ${NAME} as trained today`).waitFor();
  assert(true, `added "${NAME}" shows as a card on the home screen`);
  await ev.shot(page, 'added');

  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('fbt_muscle_groups') ?? '[]'));
  assert(stored.some((g) => g.name === NAME), `"${NAME}" persisted in localStorage fbt_muscle_groups`);

  dialog = await open();
  const row = dialog.locator('div').filter({ hasText: NAME }).filter({ has: page.getByTitle('Delete group') }).last();
  await row.getByTitle('Delete group').click();
  await dialog.getByRole('button', { name: 'Done', exact: true }).click();
  await page.getByTitle(`Log ${NAME} as trained today`).waitFor({ state: 'detached' });
  assert(true, `deleted "${NAME}" no longer shows as a card`);
  await ev.shot(page, 'deleted');
  ev.record({ feature: 'manage-groups', name: NAME, result: 'pass' });
  console.log(`evidence ${ev.dir}`);
} catch (e) {
  await ev.shot(page, 'FAILURE').catch(() => {});
  ev.record({ feature: 'manage-groups', result: 'fail', error: String(e) });
  console.error(String(e));
  process.exitCode = 1;
} finally {
  await browser.close();
}
