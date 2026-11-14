# Log workout

The `+ Log Workout` sheet lets the user pick several groups, by preset or one at a time, add a note, and log them as one session.

## Sub-features

- `log-presets` selects groups by keyword with `Push`, `Pull`, `Legs` and `Upper`. `Select All Due / Overdue` selects the overdue ones, and `Clear` empties the selection.
- `log-toggle` adds or removes a single group by tapping its chip.
- `log-save` writes one workout with all selected groups and the note.

## How to get to it (user POV)

- Tap the orange `+ Log Workout` button at the bottom of the home screen.

## Driving it with Playwright

- **Open.** Run `getByRole('button', { name: '+ Log Workout' }).click()`, then wait for `getByRole('dialog', { name: 'Log Workout' })`.
- **Pick.** Run `dialog.getByRole('button', { name: 'Legs', exact: true }).click()`. The save button's name becomes `Log Workout (N muscles)` with N > 0. On seed data, Legs selects 3.
- **Note.** Fill `dialog.getByPlaceholder(/^e\.g\. Bench/)`.
- **Save.** Click the `Log Workout (N muscles)` button. The dialog detaches.
- **Proof.** Open `Workout History`. It shows `N muscles` and the quoted note. `localStorage.fbt_workouts[0].muscleGroupIds.length === N`. Run `node scripts/journeys/log-workout.mjs Legs`.

## Gotchas

- Presets match group names by keyword, such as `Calv`, `Glute` or `Delts`. Renaming a default group can make a preset select nothing. With nothing selected the save button stays disabled, so the journey times out. Report that as a failure.
- The page also has a `+ Log Workout` button behind the dialog. Scope every click to the dialog.
