import { chromium, devices } from 'playwright';
import { readFileSync, mkdirSync, writeFileSync, appendFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..');
const RUN = join(REPO, '.verify/run');
export const EVIDENCE_ROOT = join(REPO, '.verify/evidence');

export function state() {
  let text;
  try {
    text = readFileSync(join(RUN, 'state.env'), 'utf8');
  } catch {
    throw new Error('No instance launched by this skill. Run scripts/launch.sh first.');
  }
  return Object.fromEntries(text.trim().split('\n').map((l) => l.split(/=(.*)/s).slice(0, 2)));
}

export function assert(cond, msg) {
  if (!cond) throw new Error(`ASSERTION FAILED: ${msg}`);
  console.log(`pass  ${msg}`);
}

export function evidence(feature) {
  const dir = join(EVIDENCE_ROOT, `${new Date().toISOString().replace(/[:.]/g, '-')}-${feature}`);
  mkdirSync(dir, { recursive: true });
  let n = 0;
  return {
    dir,
    async shot(page, name) {
      const base = join(dir, `${String(++n).padStart(2, '0')}-${name}`);
      await page.screenshot({ path: `${base}.png` });
      writeFileSync(`${base}.aria.txt`, await page.locator('body').ariaSnapshot());
      console.log(`shot  ${base}.png`);
    },
    record(obj) {
      appendFileSync(join(dir, 'result.jsonl'), JSON.stringify({ at: new Date().toISOString(), ...obj }) + '\n');
    },
  };
}

// standalone: true makes the app take its home-screen (iOS) code paths, e.g. redirect sign-in.
// Headless Chromium ignores display-mode emulation, so this sets navigator.standalone, which iOS sets.
export async function openApp({ standalone = true } = {}) {
  const { URL } = state();
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ ...devices['iPhone 14 Pro'], defaultBrowserType: undefined });
  if (standalone) {
    await ctx.addInitScript(() =>
      Object.defineProperty(Navigator.prototype, 'standalone', { get: () => true }),
    );
  }
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(URL);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await resetTimerButtons(page).first().waitFor();
  return { browser, ctx, page, errors, url: URL };
}

export const resetTimerButtons = (page) => page.getByTitle(/^Log .+ as trained today$/);

export async function overdueCount(page) {
  const text = (await page.getByRole('heading', { name: /overdue!$/ }).textContent().catch(() => '')) ?? '';
  const m = text.match(/(\d+) groups? (is|are) overdue/);
  return m ? Number(m[1]) : 0;
}

// Drives the Auth emulator's fake Google page. Works for both popup (browser tab) and redirect (standalone).
export async function signInWithGoogle(page) {
  const { MODE } = state();
  if (MODE !== 'emulator') throw new Error('Sign-in needs the emulator launch (launch.sh without --local).');
  const popupP = page.waitForEvent('popup', { timeout: 8000 }).catch(() => null);
  await page.getByRole('button', { name: /^Sign in$/ }).click();
  const popup = await popupP;
  const auth = popup ?? page;
  await auth.getByText(/add new account/i).waitFor({ timeout: 15000 });
  await auth.getByText(/add new account/i).click();
  await auth.getByText(/auto-generate user information/i).click();
  await auth.getByText(/sign in with google/i).click();
  if (!popup) await page.waitForURL((u) => !u.toString().includes('/emulator/'), { timeout: 20000 });
  await page.getByTitle('Sign out').waitFor({ timeout: 20000 });
  await resetTimerButtons(page).first().waitFor();
  return popup ? 'popup' : 'redirect';
}

// Reads Firestore emulator data as an admin (bypasses rules). Returns [{ path, fields }].
export async function firestoreDocs(collectionId) {
  const res = await fetch(
    'http://127.0.0.1:8080/v1/projects/demo-fbt/databases/(default)/documents:runQuery',
    {
      method: 'POST',
      headers: { Authorization: 'Bearer owner', 'Content-Type': 'application/json' },
      body: JSON.stringify({ structuredQuery: { from: [{ collectionId, allDescendants: true }] } }),
    },
  );
  const rows = await res.json();
  return rows
    .filter((r) => r.document)
    .map((r) => ({ path: r.document.name.split('/documents/')[1], fields: r.document.fields }));
}
