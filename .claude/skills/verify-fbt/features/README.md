# FBT verification map

This directory is the maintained list of what a user can do in FBT and how to prove each thing works. Read this index, then use the matching feature file as the recipe.

| Feature | File | Journey script | Mode |
|---|---|---|---|
| Quick reset of one muscle group | [quick-reset.md](quick-reset.md) | `journeys/quick-reset.mjs` | either |
| Log a multi-group workout | [log-workout.md](log-workout.md) | `journeys/log-workout.mjs [preset]` | either |
| Manage muscle groups | [manage-groups.md](manage-groups.md) | `journeys/manage-groups.mjs` | either |
| Sign in and offline sync | [offline-sync.md](offline-sync.md) | `journeys/offline-sync.mjs` | emulator |
| Installable PWA shell | [pwa-shell.md](pwa-shell.md) | `journeys/pwa-shell.mjs` | either |

Not yet mapped: urgency filter tabs (All, Overdue, Due Today, Upcoming), editing a group's frequency in place, "Reset to defaults" (uses `window.confirm`), workout history ordering.

## Baseline preconditions

- `scripts/launch.sh` succeeded and `scripts/doctor.sh` exits 0.
- Each journey opens a fresh browser context, so localStorage is empty and the 8 default groups are seeded, 5 of them overdue. The emulator keeps data across journeys within one launch, but each sign-in creates a new user, so users never share data.
- iPhone 14 Pro viewport, home-screen (`navigator.standalone`) mode unless a recipe says otherwise.

## Driving conventions

- Use accessible names and titles from the SKILL's handle list. Never use CSS classes, which are Tailwind and change often.
- Treat a signed-out emulator build as Local Mode. A user who isn't signed in reads and writes localStorage only.
- Every proof pairs a visible change with a stored side effect.

## Proof and skip reporting

- Report the journey's `pass` lines and its evidence folder.
- If a precondition is missing (for example, no group is overdue, so the banner is absent), report the failure and the missing precondition. Do not weaken the assertion.
- Name what the run could not prove: WebKit rendering, the real iOS install, and real Google OAuth.
