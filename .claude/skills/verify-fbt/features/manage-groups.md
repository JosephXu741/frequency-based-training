# Manage muscle groups

The gear icon opens `Muscle Groups & Frequencies`. There the user adds a group with a frequency in days, edits frequencies, deletes groups, or resets to the defaults.

## Sub-features

- `groups-add` adds a name and an `Every N days` value, and shows a new card.
- `groups-delete` removes a group and its card.
- `groups-edit` changes a frequency in place. It isn't scripted yet.
- `groups-reset` restores the defaults behind a `window.confirm`. It isn't scripted yet.

## How to get to it (user POV)

- Tap the gear (`Manage Muscle Groups`) in the header.

## Driving it with Playwright

- **Open.** Run `getByLabel('Manage Muscle Groups').click()`, then wait for `getByRole('dialog', { name: 'Muscle Groups & Frequencies' })`.
- **Add.** Fill `getByPlaceholder('e.g. Forearms, Traps, Abs')`, then click `getByTitle('Add Group')`.
- **Close.** Click `getByRole('button', { name: 'Done', exact: true })`. A card titled `Log Forearms as trained today` appears.
- **Stored.** `localStorage.fbt_muscle_groups` contains the name.
- **Delete.** Reopen the dialog and find the row: `dialog.locator('div').filter({ hasText: 'Forearms' }).filter({ has: getByTitle('Delete group') }).last()`. Click its `Delete group`, then `Done`. The card detaches.
- **Proof.** Run `node scripts/journeys/manage-groups.mjs` and check the `added` and `deleted` shots.

## Gotchas

- The header close button is an icon with no accessible name. Use `Done`.
- Delete asks for no confirmation, but `Reset to defaults` does. Use `page.once('dialog', d => d.accept())` before clicking it.
