import { openApp, evidence, assert, resetTimerButtons } from '../lib.mjs';

const ev = evidence('pwa-shell');
const { browser, ctx, page, url } = await openApp({ standalone: true });
try {
  const head = await page.evaluate(() => ({
    manifest: document.querySelector('link[rel=manifest]')?.getAttribute('href'),
    touchIcon: document.querySelector('link[rel=apple-touch-icon]')?.getAttribute('href'),
    capable: document.querySelector('meta[name=apple-mobile-web-app-capable]')?.content,
    controlled: !!navigator.serviceWorker.controller,
  }));
  assert(head.manifest && head.touchIcon && head.capable === 'yes', `iOS install tags present ${JSON.stringify(head)}`);
  assert(head.controlled, 'service worker controls the page');

  const manifest = await (await fetch(new URL(head.manifest, url))).json();
  assert(manifest.display === 'standalone' && manifest.start_url === '/', 'manifest display=standalone, start_url=/');
  for (const icon of [head.touchIcon, ...manifest.icons.map((i) => '/' + i.src)]) {
    const r = await fetch(new URL(icon, url));
    assert(r.ok && r.headers.get('content-type') === 'image/png', `icon ${icon} serves a PNG`);
  }

  await ctx.setOffline(true);
  await page.reload();
  await resetTimerButtons(page).first().waitFor({ timeout: 15000 });
  assert(true, 'app shell loads with the network off');
  await ev.shot(page, 'offline-cold-load');
  ev.record({ feature: 'pwa-shell', ...head, result: 'pass' });
  console.log(`evidence ${ev.dir}`);
} catch (e) {
  await ev.shot(page, 'FAILURE').catch(() => {});
  ev.record({ feature: 'pwa-shell', result: 'fail', error: String(e) });
  console.error(String(e));
  process.exitCode = 1;
} finally {
  await browser.close();
}
