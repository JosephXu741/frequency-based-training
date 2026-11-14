---
name: verify-fbt
description: Launch and drive the Frequency-Based Training (FBT) gym tracker PWA in a scripted iPhone-sized browser against local Firebase emulators, and capture screenshot, ARIA and Firestore evidence. Use to prove any change to the app's UI, storage, sign-in, offline sync or PWA install behavior works for a real user before calling it done.
---

# Verify FBT

FBT is a React + Vite PWA. Users touch it on an iPhone home screen. This skill builds the real production bundle, serves it, points it at the Firebase Auth and Firestore emulators, and drives it with Playwright (Chromium, `iPhone 14 Pro` device profile). Nothing touches a real Firebase project.

All paths below are relative to the repo root. Scripts are executable.

## Launch

```bash
.claude/skills/verify-fbt/scripts/launch.sh           # emulator mode: Google sign-in + Firestore
.claude/skills/verify-fbt/scripts/launch.sh --local   # Local Mode: no Firebase, localStorage only
PORT=4300 .claude/skills/verify-fbt/scripts/launch.sh # different preview port
```

- Installs missing deps (app `node_modules`, and this skill's own Playwright and firebase-tools in `.claude/skills/verify-fbt/node_modules`).
- Builds `vite build` into `.verify/run/dist` with every `VITE_FIREBASE_*` var set from the shell, so a real `.env.local` never leaks into a verification build.
- Emulator mode starts Auth on `127.0.0.1:9099` and Firestore on `127.0.0.1:8080` (project `demo-fbt`, rules copied from `firestore.rules`). These ports are hard-coded in `src/lib/firebase.ts`.
- Serves the build with `vite preview` on `127.0.0.1:$PORT` (default 4173).
- Ready means it printed `ready: <mode> build at http://127.0.0.1:<port>/`: the manifest is served and both emulators report ready. Every launch starts from empty emulator data, and every journey opens a fresh browser context, so localStorage starts empty and the app seeds its 8 default muscle groups (5 overdue on first open).
- State (PIDs, URL, mode, build rev) goes to `.verify/run/state.env`. Logs go to `.verify/run/{build,emulators,preview}.log`.

Isolation: one instance per checkout. Emulator ports are fixed, so two emulator-mode runs cannot coexist on one machine. Launch refuses if `.verify/run/state.env` exists or a port is held by something it did not start. Never drive the user's own `npm run dev` server.

## Doctor

```bash
.claude/skills/verify-fbt/scripts/doctor.sh
```

Read-only. Exit 0 only when the preview PID is alive and owns the port, the manifest and `sw.js` are served, and (emulator mode) both emulators are ready and the bundle contains the emulator address. It prints `build=<short sha>[-dirty]`, which shows whether the build includes your uncommitted `src/` edits. A launch only builds once, so relaunch after editing code. Run doctor first whenever anything looks off.

## Drive

Each journey is a script. Run it with `node`, and it exits non-zero on failure:

```bash
node .claude/skills/verify-fbt/scripts/journeys/offline-sync.mjs    # needs emulator mode
node .claude/skills/verify-fbt/scripts/journeys/quick-reset.mjs
node .claude/skills/verify-fbt/scripts/journeys/log-workout.mjs [Push|Pull|Legs|Upper]
node .claude/skills/verify-fbt/scripts/journeys/manage-groups.mjs
node .claude/skills/verify-fbt/scripts/journeys/pwa-shell.mjs
```

Write a new journey by importing from `scripts/lib.mjs`:

- `openApp({ standalone })` returns `{ browser, ctx, page, url }`. The page is already controlled by the service worker and the cards are rendered. `standalone: true` (the default) sets `navigator.standalone`, which makes the app take its iOS home-screen paths, such as redirect sign-in. Headless Chromium ignores `display-mode` emulation, so that is the only way to reach them.
- `signInWithGoogle(page)` clicks `Sign in` and completes the emulator's fake Google page with an auto-generated account. It returns `'redirect'` or `'popup'`.
- `resetTimerButtons(page)` returns the per-card buttons, titled `Log <group> as trained today`.
- `overdueCount(page)` reads the `N groups are overdue!` banner heading. It returns 0 when there is no banner.
- `firestoreDocs(collectionId)` lists `[{ path, fields }]` across all users in the emulator, using admin access.
- `evidence(feature)` gives `{ dir, shot(page, name), record(obj) }`.
- `assert(cond, msg)` prints `pass  <msg>` or throws.
- `ctx.setOffline(true)` is airplane mode.

Stable handles: `getByLabel('Workout History')`, `getByLabel('Manage Muscle Groups')`, `getByRole('button', { name: '+ Log Workout' })`, dialogs by `getByRole('dialog', { name: 'Log Workout' | 'Workout History' | 'Muscle Groups & Frequencies' })`, `getByTitle('Sign out')`. The per-feature recipes are in [`features/README.md`](features/README.md).

## Evidence

Each journey writes to `.verify/evidence/<ISO time>-<feature>/`:
- `NN-<step>.png` is a screenshot.
- `NN-<step>.aria.txt` is an ARIA snapshot of the page.
- `result.jsonl` holds the measured values and pass or fail.
- A failure also saves a `FAILURE` shot.

The folder is gitignored and survives cleanup.

Proof standards:
- Drive the real user path, meaning taps on visible controls. Never call app functions or write localStorage or Firestore to set up a state.
- Capture before and after for each action, not just the final screen.
- Check side effects, not only pixels. Use `localStorage` keys `fbt_workouts` and `fbt_muscle_groups` for Local Mode and signed-out users, and `firestoreDocs()` for signed-in users.
- Offline proof needs `ctx.setOffline(true)` before the action, an offline reload, and a Firestore doc count after reconnecting.
- What this does not prove: Safari or WebKit rendering, the real Add to Home Screen sheet, real Google OAuth, and the Vercel `/__/auth` proxy. Say so when reporting, and ask the user to check on a real iPhone when a change touches those.

## Cleanup

```bash
.claude/skills/verify-fbt/scripts/cleanup.sh
```

Stops only the process groups recorded in `.verify/run/state.env`, including the emulator's Java child, and deletes `.verify/run/`. It never kills by name and never deletes `.verify/evidence/`. Run it after every run, including failed ones, before launching again.
