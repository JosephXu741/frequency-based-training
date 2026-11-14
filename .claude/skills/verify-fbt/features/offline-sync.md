# Sign in and offline sync

A user signs in with Google, logs workouts with no network, and their data reaches Firestore once they're back online. This is the core promise of the home-screen app.

## Sub-features

- `auth-redirect` uses redirect sign-in in home-screen mode and a popup in a browser tab.
- `offline-write` updates the UI at once while offline, with no hang waiting for the server.
- `offline-reload` lets the service worker serve the app offline, and the Firestore cache keeps the pending write.
- `sync-on-reconnect` writes the pending workout to Firestore when the network returns.

## How to get to it (user POV)

- Tap `Sign in` in the header and choose a Google account. Then turn on airplane mode and tap `Reset Timer` or use `+ Log Workout`.

## Driving it with Playwright

- **Precondition.** Emulator mode (`launch.sh` without `--local`).
- **Sign in.** `signInWithGoogle(page)` must return `'redirect'` when `standalone: true`.
- **Go offline.** Run `ctx.setOffline(true)`, then tap a reset. `overdueCount` drops within 5 seconds. A hang here means a Firestore write is awaited again.
- **History.** `Workout History` lists the group while offline.
- **Offline reload.** `page.reload()` while offline. The cards render and the count stays reduced.
- **Reconnect.** Run `ctx.setOffline(false)`. `firestoreDocs('workouts').length` grows by one within 10 seconds.
- **Proof.** Run `node scripts/journeys/offline-sync.mjs` and check the 4 shots and `result.jsonl`.

## Gotchas

- `firestoreDocs` counts across all users in this launch. Compare before and after counts rather than absolute numbers.
- Emulator sign-in never reaches Google. Real OAuth, the authorized domains and the Vercel `/__/auth` proxy stay unproven here.
- Chromium's offline mode isn't iOS airplane mode. WebKit storage eviction and background sync timing on iOS stay unproven.
