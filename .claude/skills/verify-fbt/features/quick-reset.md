# Quick reset

One tap on a muscle card's `Reset Timer` logs that group as trained now, restarts its countdown and adds a one-group workout to history.

## Sub-features

- `reset-tap` drops the group out of the overdue list immediately.
- `reset-persist` survives a reload.
- `reset-history` adds a history entry with the note `Quick single-group reset`.

## How to get to it (user POV)

- On the home screen, tap `Reset Timer` on any card.

## Driving it with Playwright

- **Tap.** `resetTimerButtons(page).first().click()`. Read the group name from the button title `Log <group> as trained today`.
- **Visible result.** `overdueCount(page)` drops by one, from 5 to 4 on seed data.
- **Stored result.** `localStorage.fbt_workouts` has one entry with `notes === 'Quick single-group reset'`.
- **Persistence.** `page.reload()`. The count stays reduced.
- **Proof.** Run `node scripts/journeys/quick-reset.mjs` and check the `before` and `after` shots.

## Gotchas

- The stored field is `notes`, not `note`.
- Cards sort by urgency, so after a reset the tapped card moves down. Don't re-query `.first()` expecting the same group.
- Only `overdue` and `never` count toward the banner. Resetting a group that is due today doesn't change it.
